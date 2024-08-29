import React, {useState, useEffect} from "react";
import apiClient from "../configurations/configAxios";
import {toast, Toaster} from "react-hot-toast";
import {
    APIProvider,
    Map,
    Pin,
    AdvancedMarker
} from "@vis.gl/react-google-maps";
import Container from "react-bootstrap/Container";

export function Dashboard(){
    const [userInfoLoaded, setUserInfoLoaded] = useState(false);
    const [loading, setLoading] = useState(true);
    const [userInfo, setUserInfo] = useState({});
    const [error, setError] = useState('');
    const username = sessionStorage.getItem('user');
    const [location, setLocation] = useState({lat: 0, lng: 0});
    const [trackingEnabled, setTrackingEnabled] = useState(false);
    const loginSuccess = () =>{
        toast.success(`Welcome back, ${username}`, {
            duration: 2000
        });
    }



    function locationError(error){
        if(error.code === error.PERMISSION_DENIED){
            setTrackingEnabled(false);
            toast("Location tracking disabled", {
                duration: 2000,
                id: 'location-denied'

            });

            //TODO: Change how map is shown on dashboard

        }
        toast.error("Could not retrieve your location", {
            duration: 2000,
            id: 'location-not-found'
        })
    }

    async function getUserInfo() {
        try {
            const userData = await apiClient.get(`http://127.0.0.1:8000/api/user/get/?username=${username}`, {
                method: "GET"
            });

            setUserInfo(userData.data);
            setUserInfoLoaded(true);

        } catch (err) {
            toast.error(err.response.data.error, {
                duration: 2000
            });
        } finally {
            setLoading(false);
        }
    }

    let watchID = 0




    useEffect(() => {

        getUserInfo();
        if (navigator.geolocation) {

            watchID = navigator.geolocation.watchPosition((position) => {
            setLocation({lat: position.coords.latitude, lng: position.coords.longitude});
            }, locationError, {enableHighAccuracy: true});
            setTrackingEnabled(true);

        }
        else {

            // display an error if not supported
            toast.error("Location tracking on this website is not supported by your browser", {
                duration: 2000,
                id: 'tracking-not-supported'
            });
            setTrackingEnabled(false);
            //TODO: Change how map is shown on dashboard

        }
        return ()=> navigator.geolocation.clearWatch(watchID);

    }, []);

    useEffect(() => {
        if(userInfoLoaded){
            loginSuccess()
        }
    }, [userInfoLoaded]);

    const MapView = ()=>{
        return (
            <Container fluid={"md"}>

                <APIProvider apiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}>
                <div style={{height: "50vh", width: "70vh"}}>
                    <Map defaultZoom={15} center={location}
                         mapId={process.env["REACT_APP_GOOGLE_MAP_ID"]}
                         gestureHandling={'greedy'}
                         disableDefaultUI={true}>

                        <AdvancedMarker position={location}>
                            <Pin background={"red"}> </Pin>
                        </AdvancedMarker>

                    </Map>

                </div>

                </APIProvider>

            </Container>

            )

    }


    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return (
            <>
                <Toaster
                    position="top-left"
                    reverseOrder={false}
                />
            </>
        );
    }

    return (
        <>

            <Toaster
                position="top-left"
                reverseOrder={false}
            />
            <p>User Info: {JSON.stringify(userInfo)} {location.lat} {location.lng}</p>

            {trackingEnabled? MapView() : null}
        </>
    );


}