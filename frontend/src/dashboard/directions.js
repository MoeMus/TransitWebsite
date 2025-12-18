import {useMap} from "@vis.gl/react-google-maps";
import React, {useEffect, useState} from "react";
import {toast} from "react-hot-toast";
import {Dropdown} from "react-bootstrap";
import {Link, Text} from "@chakra-ui/react";

export function Directions({userLocation, setTravelTime, setTravelDistance}) {
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
        } catch (err) {
            console.log(err);
        }
    }, [directionsService, directionsRenderer, userLocation, routeIndex, travelMode, setTravelDistance, setTravelTime]);

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