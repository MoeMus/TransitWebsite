import '../styles/dashboardStyles.css';
import React, { useState, useEffect, useRef } from "react";
import apiClient from "../configurations/configAxios";
import { toast, Toaster } from "react-hot-toast";
import {
  APIProvider,
  Map,
  Pin,
  AdvancedMarker,
  useMap,
} from "@vis.gl/react-google-maps";
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";
//import Button from "react-bootstrap/Button";
import {Dropdown} from "react-bootstrap";
import ServiceAlerts from "../translink-alerts/ServiceAlerts";
import {Box, Flex, Spinner, Button, Link, Text} from "@chakra-ui/react";

import CourseCalendar from "../calendar/CourseCalendar";

export function Dashboard() {
  const [userInfoLoaded, setUserInfoLoaded] = useState(false);
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
  const [userCourses, setUserCourses] = useState([]);
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

  //TODO: These variables and any code which uses them currently do not work
  // const currentRoute = useLocation();
  // const fromPage = currentRoute.state?.from || "/";
  //
  // const loginSuccess = () => {
  //   toast.success(`Welcome back, ${username}`, {
  //     duration: 2000,
  //   });
  // };

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

  // async function getCourseInfo(courseIDs){
  //     //let request = {course_ids: courseIDs};
  //     //let request = {username: sessionStorage.getItem(username)}
  //     await apiClient.get(
  //         `http://127.0.0.1:8000/api/user/courses/get/all/?username=${username}`,
  //         {
  //           method: "GET",
  //           withCredentials: true
  //         }
  //     ).then((response)=>{
  //       //console.log(response.data.lecture_sections);
  //       //console.log(response.data.non_lecture_sections);
  //       setUserCourses(response.data.lecture_sections);
  //     }).catch(err=>{
  //       const errorMessage = err.response.data.error;
  //       toast.error(errorMessage, {
  //         duration: 2000
  //       });
  //     });
  // }

  async function getUserInfo() {
    try {
      const userData = await apiClient.get(
        `http://127.0.0.1:8000/api/user/get/?username=${username}`,
        {
          method: "GET",
        }
      );
      setUserInfo(userData.data);

      //console.log(JSON.stringify(userData.data, null, 2));
      setUserCourses(userData.data.Courses);
      //getCourseInfo(userData.data.Courses);
      setUserInfoLoaded(true);
    } catch (err) {
      const errorMessage = err.response.data.error;
      toast.error(errorMessage, {
        duration: 2000,
      });
    } finally {
      setLoading(false);
    }
  }



  //Retrieve user data when dashboard is loaded
  useEffect(() => {
    getUserInfo();
    if (!manualLocationEnabled && navigator.geolocation) {
      watchID = navigator.geolocation.watchPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        locationError,
        { enableHighAccuracy: true }

      );
      setTrackingEnabled(true);

    } else if (manualLocationEnabled){
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

  //TODO: This useEffect does not work, will fix later
  // useEffect(() => {
  //   if (
  //     fromPage === "/registration" &&
  //     currentRoute.pathname === "/dashboard"
  //   ) {
  //     loginSuccess();
  //   }
  //
  // }, [currentRoute, fromPage, loginSuccess]);

  const manualLocationChange = (event)=>{
    event.preventDefault();
    const geocoder = new window.google.maps.Geocoder();
    const address = document.querySelector(".location").value;

    if(address){

      geocoder.geocode({address: address}, (results, status)=>{

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

      } );

    } else {

      toast.error("Please enter a location", {
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

          {/*<p>*/}
          {/*  User Info: {JSON.stringify(userInfo)} {userLocation.lat} {userLocation.lng}*/}
          {/*</p>*/}

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
            {viewCalendar ? <CourseCalendar/> : null}
          </Container>
        </Container>

      </Box>


    </>
  );
}

function Directions({userLocation, setTravelTime, setTravelDistance}) {
  const map = useMap();
  const [directionsService, setDirectionsService] = useState(null);
  const [directionsRenderer, setDirectionsRenderer] = useState(null);
  const [directionsResult, setDirectionsResult] = useState(null);
  const [summary, setSummary] = useState("");
  const [routes, setRoutes] = useState([]);
  const [routeIndex, setRouteIndex] = useState(0);
  const [travelMode, setTravelMode] = useState("");

  // Initialize services
  useEffect(() => {
    if (!map || !window.google) return;
    try{
      setTravelMode("Transit"); //Default travel mode
      const service = new window.google.maps.DirectionsService();
      const renderer = new window.google.maps.DirectionsRenderer({map});

      setDirectionsService(service);
      setDirectionsRenderer(renderer);

      return () => {
        if (renderer) {
          renderer.setDirections(null); // Clears previous directions from the map
        }
      };

    } catch (err){
      console.log(err);
    }


  }, [map]);

  // Calculate directions once
  useEffect(() => {
    if (!directionsService || !directionsRenderer || (userLocation.lat === 0 && userLocation.lng === 0)) return;

    // Keep route index when recalculating

    try {
      directionsService.route({
            origin: userLocation,
            destination: "8888 University Dr W, Burnaby, BC V5A 1S6",
            travelMode: window.google.maps.TravelMode[travelMode.toUpperCase()],
            provideRouteAlternatives: true,
          },
          (response, status) => {
            if (status === window.google.maps.DirectionsStatus.OK) {
              directionsRenderer.setDirections(response);
              setDirectionsResult(response);
              setRoutes(response.routes);

              // Apply the stored route index after rerender
              directionsRenderer.setRouteIndex(routeIndex);

              // Extract and update the summary for the selected route
              const route = response.routes[routeIndex];
              if (route && route.legs && route.legs.length > 0) {
                const summary = route.legs
                    .map((leg) => `Distance: ${leg.distance.text}, Duration: ${leg.duration.text}`).join(' | ');
                setSummary(summary);
                setTravelTime(route.legs.map((leg) => `${leg.duration.text}`).join(' | '));
                setTravelDistance(route.legs.map((leg) => `${leg.distance.text}`).join(' | '));
              } else {
                setSummary("Error fetching directions or no routes available");
              }

            } else {
              toast.error("Error fetching directions " + status, {
                duration: 2000,
              });
            }
          }
      );
    } catch (err){
      console.log(err);
    }
}, [directionsService, directionsRenderer, userLocation, routeIndex, travelMode, setTravelDistance, setTravelTime]);

  function setMode(eventKey, event){
    event.preventDefault();
    setTravelMode(eventKey);
  }

  return (
    <>

      <div className="locationBox">
        <div>
          <Dropdown onSelect={setMode}>
            <Dropdown.Toggle variant="success" style={{width: "200px", marginBottom: "5px"}}> Select Travel Mode </Dropdown.Toggle>

            <Dropdown.Menu>
              <Dropdown.Item eventKey="Driving"> Driving </Dropdown.Item>
              <Dropdown.Item eventKey="Transit"> Transit </Dropdown.Item>
              <Dropdown.Item eventKey="Bicycling"> Bicycling </Dropdown.Item>
              <Dropdown.Item eventKey="Walking"> Walking </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>

        </div>
        {summary && (
              <div>
                <h4> Travel Mode: {travelMode}</h4>
              </div>
        )}
        <h6> Other routes: </h6>
        {routes.length > 1 ? <ul>
          {routes.map((route, index) => (
              <li key={index}>

                {
                  index === routeIndex?

                    <Text fontWeight="bold">

                      {route.summary || `Route ${index + 1}`}

                    </Text>

                    :

                    <Link variant="plain" onClick={() => {setRouteIndex(index);}}>

                      {route.summary || `Route ${index + 1}`}

                    </Link>
                }

              </li>

          ))}
        </ul> : null}

      </div>

    </>
  );
}


