import '../styles/dashboardStyles.css';
import React, {useEffect, useState} from "react";
import {toast, Toaster} from "react-hot-toast";
import {AdvancedMarker, APIProvider, Map, Pin,} from "@vis.gl/react-google-maps";
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";
//import Button from "react-bootstrap/Button";
import ServiceAlerts from "../translink-alerts/ServiceAlerts";
import {Box, Button, Flex, Spinner} from "@chakra-ui/react";
import {getUserInfoFromBackend, setLocation} from "./utils"
import CourseCalendar from "../calendar/CourseCalendar";
import {Directions} from "./directions";

export function Dashboard() {
    const [loading, setLoading] = useState(true);
    const [userInfo, setUserInfo] = useState({});
    const [error, setError] = useState("");
    const username = sessionStorage.getItem("user");
    const [userLocation, setUserLocation] = useState({ lat: 0, lng: 0 });
    const [trackingEnabled, setTrackingEnabled] = useState(false);
    const [map, setMap] = useState(null);
    const [manualLocationEnabled, setManualLocationEnabled] = useState(false);
    const [travelMode, setTravelMode] = useState("");
    const [travelTime, setTravelTime] = useState("");
    const [travelDistance, setTravelDistance] = useState("");
    // const [userCourses, setUserCourses] = useState([]);
    const [viewCalendar, setViewCalendar] = useState(false);

    let watchID = 0;

    const enableSchedule = ()=> {
      if(viewCalendar){
        setViewCalendar(false);
      } else {
        setViewCalendar(true);
      }
    }
    const onMapLoad = (mapInstance) => {
      setMap(mapInstance);
    };

    function locationError(error) {
        if (error.code === error.PERMISSION_DENIED) {
            setTrackingEnabled(false);
            toast("Location tracking disabled", {
                duration: 2000,
                id: "userLocation-denied",
            });

            //TODO: Change how map is shown on dashboard
        }
        toast.error("Could not retrieve your location", {
            duration: 2000,
            id: "userLocation-not-found",
        });
    }

    async function getUserInfo() {
        try {

            const userData = await getUserInfoFromBackend(username);
            setUserInfo(userData);

        } catch (err) {
            const errorMessage = err.response.data.error;
            toast.error(errorMessage, {
                duration: 2000,
            });
        } finally {
            setLoading(false);
        }
    }


    function checkLocationTracking() {
        if (!manualLocationEnabled && navigator.geolocation) {
            watchID = navigator.geolocation.watchPosition(
                (position) => {
                    setUserLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    });
                },
                locationError,
                {enableHighAccuracy: true}
            );
            setTrackingEnabled(true);

        } else if (manualLocationEnabled) {
            toast("Location set", {
                duration: 2000
            });
        } else {

            // display an error if not supported
            toast.error(
                "Location tracking on this website is not supported by your browser",
                {
                    duration: 2000,
                    id: "tracking-not-supported",
                }
            );

            setTrackingEnabled(false);

        }
    }

    //Retrieve user data when dashboard is loaded
    useEffect(() => {

        (async function(){
            await getUserInfo();
        })();
        checkLocationTracking();

        return () => navigator.geolocation.clearWatch(watchID);

    }, []);

    useEffect(() => {
        if (map) {
            map.setOptions({
                gestureHandling: "greedy",
                zoomControl: true,
                disableDefaultUI: false
            });
        }
    }, [map]);

    const manualLocationChange = (event)=>{

        try {

            const callback = (results, status)=> {

                if(status === window.google.maps.GeocoderStatus.OK){

                    const lat = results[0].geometry.location.lat();
                    const lng = results[0].geometry.location.lng();
                    setUserLocation({lat: lat, lng: lng});
                    setManualLocationEnabled(true);
                    navigator.geolocation.clearWatch(watchID);
                    setTrackingEnabled(false);

                } else {

                    toast.error("The provided location could not be processed", {
                        duration: 2000
                    });

                }

            }

            setLocation(event, callback);

        } catch (err) {

            toast.error(err.message, {
                duration: 2000
            });

        }

    }

    if (loading) {
        return  <Spinner size="sm" />;
    }

    if (error) {
        return (
            <>
                <Toaster position="top-left" reverseOrder={false} />
            </>
        );
    }

    return (
        <>
            <Box>
                <Toaster position="top-left" reverseOrder={false} />
                <Container fluid={"md"} >

                    <Container style={{height: "1000px", width: "1200px", display: "flex", flexDirection: "column"}}>

                        <div>

                            <div className="route-summary">

                                {travelDistance && travelTime ?

                                    <div>

                                        <h2 style={{textAlign: "center"}}> Estimated travel time to _____: </h2>

                                        <h2 style={{color: "green", textAlign: "center"}}> {travelTime} </h2>

                                        <h3 style={{textAlign: "center"}}> Leave by ____ to arrive _____ minutes before ____ </h3>

                                    </div>

                                : null}

                            </div>

                            <APIProvider apiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY} version="3.58"  libraries={['places']}>

                                <div className="mapContainer">
                                    <div className="mapBox">
                                        <Map className="map"
                                             mapId={process.env.REACT_APP_GOOGLE_MAP_ID}
                                             onLoad={onMapLoad}
                                             defaultZoom={15}
                                             defaultCenter={userLocation}>
                                            <AdvancedMarker position={userLocation}>
                                                <Pin background={"red"}></Pin>
                                            </AdvancedMarker>
                                        </Map>
                                    </div>
                                    <div className="directionsBox">
                                        <Directions userLocation={userLocation} setTravelTime={setTravelTime}
                                                    setTravelDistance={setTravelDistance}/>
                                    </div>
                                </div>

                            </APIProvider>

                        </div>

                        <div style={{display: "flex", flexDirection: "row", justifyContent: "center"}}>

                            <Form className="locationBox" style={{textAlign: 'center', marginBottom: "100px", width: "800px"}}>

                                <Form.Group className="mb-3">

                                    <Form.Label> Enter your location manually (Use if location tracking is not accurate)</Form.Label>
                                    <Form.Control className="location"></Form.Control>
                                    <Form.Text className="text-muted">
                                        Enter in the format <strong>"&lt;street number&gt; &lt;street name&gt; &lt;city&gt; &lt;state&gt; &lt;postal
                                        code&gt;"</strong> ex: 1600 Amphitheatre Parkway, Mountain View, CA 94043. Addresses can also be
                                        place names, ex: "Statue of Liberty, New York, NY".
                                    </Form.Text>
                                    <Form.Group>
                                        <Form.Text style={{color: "red"}}>This will disable location tracking</Form.Text>
                                    </Form.Group>
                                </Form.Group>

                                <Button variant="solid" type="submit" onClick={manualLocationChange}>
                                    Set Location
                                </Button>

                            </Form>

                        </div>

                    </Container>

                    <Container>

                        <Flex justifyContent="center">
                            <ServiceAlerts/>
                            <Button variant="outline" size="sm" marginLeft="20px" onClick={enableSchedule} width="230px"> View Weekly Schedule </Button>
                        </Flex>
                        {viewCalendar ? <CourseCalendar courses={userInfo.courses}/> : null}
                    </Container>

                </Container>

        </Box>


        </>
  );
}


