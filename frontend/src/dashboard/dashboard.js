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
import { useLocation } from "react-router-dom";

export function Dashboard() {
  const [userInfoLoaded, setUserInfoLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState({});
  const [error, setError] = useState("");
  const username = sessionStorage.getItem("user");
  const [userLocation, setUserLocation] = useState({ lat: 0, lng: 0 });
  const [trackingEnabled, setTrackingEnabled] = useState(false);
  const [map, setMap] = useState(null);

  const onMapLoad = (mapInstance) => {
    setMap(mapInstance);
  };
  //TODO: These variables and any code which uses them current do not work
  const currentRoute = useLocation();
  const fromPage = currentRoute.state?.from || "/";

  const loginSuccess = () => {
    toast.success(`Welcome back, ${username}`, {
      duration: 2000,
    });
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
    toast.error("Could not retrieve your userLocation", {
      duration: 2000,
      id: "userLocation-not-found",
    });
  }

  async function getUserInfo() {
    try {
      const userData = await apiClient.get(
        `http://127.0.0.1:8000/api/user/get/?username=${username}`,
        {
          method: "GET",
        }
      );

      setUserInfo(userData.data);
      setUserInfoLoaded(true);
    } catch (err) {
      toast.error(err.response.data.error, {
        duration: 2000,
      });
    } finally {
      setLoading(false);
    }
  }

  let watchID = 0;

  useEffect(() => {
    getUserInfo();
    if (navigator.geolocation) {
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
      //TODO: Change how map is shown on dashboard
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
  useEffect(() => {
    if (
      fromPage === "/registration" &&
      currentRoute.pathname === "/dashboard"
    ) {
      loginSuccess();
    }

  }, [currentRoute]);

  const MapView = () => {

    return (
      <Container fluid={"md"}>
        <APIProvider apiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}>
          <div style={{ height: "50vh", width: "70vh" }}>

            <Map
                mapId={process.env["REACT_APP_GOOGLE_MAP_ID"]}
                onLoad={onMapLoad}
                defaultZoom={15}
                defaultCenter={userLocation}
            >
              <AdvancedMarker position={userLocation}>
                <Pin background={"red"}></Pin>
              </AdvancedMarker>

            </Map>
            <MapSummary summary={ <Directions userLocation = {userLocation} /> } />
          </div>
        </APIProvider>
      </Container>
    );
  };

  if (loading) {
    return <div>Loading...</div>;
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
      <Toaster position="top-left" reverseOrder={false} />
      <Container fluid={"md"}>
        <p>
          User Info: {JSON.stringify(userInfo)} {userLocation.lat} {userLocation.lng}
        </p>
        {trackingEnabled ? MapView() : null}
      </Container>

    </>
  );
}

function Directions({ userLocation }) {
  const map = useMap(); //The map
  const [directionsService, setDirectionsService] = useState(null);
  const [directionsRenderer, setDirectionsRenderer] = useState(null);
  const [directionsResult, setDirectionsResult] = useState(null);
  const [summary, setSummary] = useState("");

  // Initialize services
  useEffect(() => {

    //Check if both are initialized
    if (!map || !window.google) return;

    //Grab the objects directly from Google Maps when the API is loaded globally
    const service = new window.google.maps.DirectionsService();
    const renderer = new window.google.maps.DirectionsRenderer({ map });

    setDirectionsService(service);
    setDirectionsRenderer(renderer);
  }, [map]);

  useEffect(() => {
    //Check if both are initialized
    if (!directionsService || !directionsRenderer) return;

    directionsService.route(
      {
        origin: userLocation,
        destination: "8888 University Dr W, Burnaby, BC V5A 1S6", //Temporary, changes based on travel mode and location of class
        travelMode: window.google.maps.TravelMode.TRANSIT, //TODO: Make this the default when the page is loaded, but change if user wants another travel mode
        provideRouteAlternatives: false,
      },
      (response, status) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
          directionsRenderer.setDirections(response);
          setDirectionsResult(response);
          // Extract summary
          const route = response.routes[0]; // Get the first route
          const legs = route.legs; // Get the legs of the route
          const summary = legs.map(leg => `Distance: ${leg.distance.text}, Duration: ${leg.duration.text}`).join(' | '); // Create summary
          setSummary(summary);
        } else {
          toast.error("Error fetching directions " + status, {
            duration: 2000
          })
        }
      }
    );
  }, [directionsService, directionsRenderer, userLocation]);

  return (
    summary
  );
}

const MapSummary = ({summary}) =>{
  return (
      <div style={{
      padding: '10px',
      backgroundColor: 'white',
      borderRadius: '5px',
      boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
      marginTop: '10px',
      position: 'relative'
      }}>
        {summary && (
              <div>
                <h5>Summary</h5>
                <p>{summary}</p>
                <p></p>
              </div>
        )}
      </div>
  )
}

