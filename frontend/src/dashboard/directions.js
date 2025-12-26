import {useMap} from "@vis.gl/react-google-maps";
import React, {useEffect, useRef, useState} from "react";
import {toast} from "react-hot-toast";
import {Dropdown} from "react-bootstrap";
import {Link, Text} from "@chakra-ui/react";

export function Directions({userLocation, destination, setTravelTime, setTravelDistance, arrivalTime, setDepartureTime, setError}) {
    const map = useMap();
    const [directionsService, setDirectionsService] = useState(null);
    const [directionsRenderer, setDirectionsRenderer] = useState(null);
    const [directionsResult, setDirectionsResult] = useState(null);
    const [summary, setSummary] = useState("");
    const [routes, setRoutes] = useState([]);
    const [routeIndex, setRouteIndex] = useState(0);
    const [travelMode, setTravelMode] = useState("");
    const responseCache = useRef({});

    // Initialize services
    useEffect(() => {
        if (!map || !window.google) return;
        try {
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

        } catch (err) {
            if (setError) setError("Failed to initialize Google Maps services");
            console.log(err);
        }


    }, [map, setError]);

    // Fetch directions (Debounced & Cached)
    useEffect(() => {
        if (!directionsService || (userLocation.lat === 0 && userLocation.lng === 0)) return;

        const fetchDirections = () => {
            // Round coordinates to 3 decimal places (~110m) to improve cache hits and reduce API calls while moving
            const roundCoord = (num) => Math.round(num * 1000) / 1000;
            const roundedOrigin = {
                lat: roundCoord(userLocation.lat),
                lng: roundCoord(userLocation.lng)
            };

            const uniqueCacheKeyForCurrentRequestParameters = JSON.stringify({
                origin: roundedOrigin,
                destination: destination,
                mode: travelMode,
                arrival: arrivalTime ? arrivalTime.getTime() : null
            });

            if (responseCache.current[uniqueCacheKeyForCurrentRequestParameters]) {
                setDirectionsResult(responseCache.current[uniqueCacheKeyForCurrentRequestParameters]);
                setRoutes(responseCache.current[uniqueCacheKeyForCurrentRequestParameters].routes);
                return;
            }

            try {
                // Call the Google Maps DirectionsService to request routes for the
                // given origin, destination and travel mode. Provide alternative routes
                // when available. On success cache the response and update local state
                // (directionsResult, routes). On OVER_QUERY_LIMIT show a toast and set
                // an error message. For other failures show a toast and set error.
                fetchRouteDirections(roundedOrigin, uniqueCacheKeyForCurrentRequestParameters);
            } catch (err) {
                const msg = (err.message && err.message.includes("OVER_QUERY_LIMIT")) ? "API Quota Exceeded" : "Error fetching directions";
                if (setError) setError(msg);
                console.log(err);
            }
        };

        // Debounce API calls by 500ms to prevent requests while scrolling buffer time or rapid GPS updates
        const timeoutId = setTimeout(fetchDirections, 500);

        return () => clearTimeout(timeoutId);
    }, [directionsService, userLocation, destination, travelMode, arrivalTime, setError]);

    // Update Map and State when results or route index changes
    useEffect(() => {
        if (!directionsRenderer || !directionsResult) return;

        directionsRenderer.setDirections(directionsResult);

        // Ensure routeIndex is valid for the new result set
        const validIndex = (routeIndex < directionsResult.routes.length) ? routeIndex : 0;
        if (validIndex !== routeIndex) setRouteIndex(validIndex);

        directionsRenderer.setRouteIndex(validIndex);

        const route = directionsResult.routes[validIndex];
        if (route && route.legs && route.legs.length > 0) {
            const summary = route.legs
                .map((leg) => `Distance: ${leg.distance.text}, Duration: ${leg.duration.text}`).join(' | ');
            setSummary(summary);
            setTravelTime(route.legs.map((leg) => `${leg.duration.text}`).join(' | '));
            setTravelDistance(route.legs.map((leg) => `${leg.distance.text}`).join(' | '));
            if (route.legs[0].departure_time) {
                setDepartureTime(route.legs[0].departure_time.text);
            } else if (route.legs[0].arrival_time && route.legs[0].duration) {
                // departure_time is missing, so calculate departure from arrival - duration
                calculateDepartureFromArrivalMinusDuration(route);
            } else {
                setDepartureTime("");
            }
        } else {
            setSummary("Error fetching directions or no routes available");
        }
    }, [directionsResult, routeIndex, directionsRenderer, setTravelTime, setTravelDistance, setDepartureTime]);

    function fetchRouteDirections(roundedOrigin, uniqueCacheKeyForCurrentRequestParameters) {
        directionsService.route({
            origin: roundedOrigin,
            destination: destination,
            travelMode: window.google.maps.TravelMode[travelMode.toUpperCase()],
            provideRouteAlternatives: true,
            transitOptions: arrivalTime ? {
                arrivalTime: arrivalTime
            } : undefined
        },
            (response, status) => {
                if (status === window.google.maps.DirectionsStatus.OK) {
                    responseCache.current[uniqueCacheKeyForCurrentRequestParameters] = response;
                    setDirectionsResult(response);
                    setRoutes(response.routes);
                    if (setError) setError("");
                } else if (status === window.google.maps.DirectionsStatus.OVER_QUERY_LIMIT) {
                    const msg = "Please wait before sending another request.";
                    toast.error(msg, {
                        duration: 4000,
                    });
                    if (setError) setError(msg);
                } else {
                    const msg = "Error fetching directions: " + status;
                    toast.error(msg, {
                        duration: 2000,
                    });
                    if (setError) setError(msg);
                }
            }
        );
    }

    function calculateDepartureFromArrivalMinusDuration(route) {
        const arrivalDate = route.legs[0].arrival_time.value;
        const durationSeconds = route.legs[0].duration.value;
        const departureDate = new Date(arrivalDate.getTime() - durationSeconds * 1000);
        setDepartureTime(departureDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }));
    }

    function setMode(eventKey, event) {
        event.preventDefault();
        setTravelMode(eventKey);
    }

    return (
        <>

            <div className="locationBox">

                <div>

                    <Dropdown onSelect={setMode}>
                        <Dropdown.Toggle variant="success" style={{width: "200px", marginBottom: "5px"}}> Select Travel
                            Mode </Dropdown.Toggle>

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
                                index === routeIndex ?

                                    <Text fontWeight="bold">

                                        {route.summary || `Route ${index + 1}`}

                                    </Text>

                                    :

                                    <Link variant="plain" onClick={() => {
                                        setRouteIndex(index);
                                    }}>

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
                       