import '../styles/dashboardStyles.css';
import DOMPurify from 'dompurify';
import React, {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {toast, Toaster} from "react-hot-toast";
import {AdvancedMarker, APIProvider, Map, Pin,} from "@vis.gl/react-google-maps";
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";
import Card from "react-bootstrap/Card";
import Badge from "react-bootstrap/Badge";
import Modal from "react-bootstrap/Modal";
//import Button from "react-bootstrap/Button";
import Dropdown from "react-bootstrap/Dropdown";
import ServiceAlerts from "../translink-alerts/ServiceAlerts";
import {Box, Button, Flex, Spinner} from "@chakra-ui/react";
import {getUserInfoFromBackend, getNextClassFromBackend, setLocation, getNotification} from "./utils"
import CourseCalendar from "../calendar/CourseCalendar";
import {Directions} from "./directions";
import Notification from "../components/notification";
import {
    BsCalendar3,
    BsExclamationTriangleFill,
    BsGeoAlt,
    BsPinMap,
    BsArrowReturnRight,
    BsClock,
    BsMap,
    BsClipboard,
    BsCheck2,
    BsArrowLeft,
    BsArrowRight,
    BsArrowUp,
    BsShareFill,
    BsBusFront,
    BsTrainFront,
    BsPersonWalking,
    BsCalendarPlus,
    BsQrCode,
    BsShare, BsExclamationLg
} from "react-icons/bs";
import {CloseButton} from "react-bootstrap";
const CAMPUSES = [
    { key: "burnaby", name: "SFU Burnaby", address: "49.279950, -122.919906" },
    { key: "surrey", name: "SFU Surrey", address: "13450 102 Ave, Surrey, BC V3T 0A3" },
    { key: "vancouver", name: "SFU Vancouver", address: "515 W Hastings St, Vancouver, BC V6B 5K3" }
];
const GOOGLE_MAPS_LIBRARIES = ['places'];

export function Dashboard() {
    const [loading, setLoading] = useState(true);
    const [userInfo, setUserInfo] = useState({});
    const username = sessionStorage.getItem("user");
    const [userLocation, setUserLocation] = useState({ lat: 0, lng: 0 });
    const [trackingEnabled, setTrackingEnabled] = useState(false);
    const [map, setMap] = useState(null);
    const [manualLocationEnabled, setManualLocationEnabled] = useState(false);
    const [travelMode, setTravelMode] = useState("Transit");
    const [travelTime, setTravelTime] = useState("");
    const [departureTime, setDepartureTime] = useState("");
    const [travelDistance, setTravelDistance] = useState("");
    const [directionsError, setDirectionsError] = useState("");
    // const [userCourses, setUserCourses] = useState([]);
    const [viewCalendar, setViewCalendar] = useState(false);
    const [selectedCampus, setSelectedCampus] = useState(CAMPUSES[0]);
    const [bufferTime, setBufferTime] = useState(10); // Default 10 minutes buffer
    const [nextClass, setNextClass] = useState(null);
    const [routeSteps, setRouteSteps] = useState([]);
    const [copied, setCopied] = useState(false);
    const [showQrModal, setShowQrModal] = useState(false);

    const calculateArrivalTime = useMemo(() => {
        if (!nextClass) {
            return null;
        }
        const [hours, minutes] = nextClass.nextStartTime.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, minutes, 0, 0);
        // Subtract buffer time to get arrival time at the destination
        return new Date(date.getTime() - bufferTime * 60000);
    }, [nextClass, bufferTime]);

    const watchIdRef = useRef(null);

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
                id: "userLocation-denied",
            });

            //TODO: Change how map is shown on dashboard
        }
        toast.error("Could not retrieve your location");
    }

    const getUserInfo = useCallback( async () => {
        try {

            const userData = await getUserInfoFromBackend();
            setUserInfo(userData);

            const nextClassData = await getNextClassFromBackend();
            setNextClass(nextClassData);

        } catch (err) {
            toast.error(err.message || "Failed to load user info");
        } finally {
            setLoading(false);
        }
    }, [username]);


    async function getUserNotification() {

        try {
            const notification_message = await getNotification();

            if (notification_message !== null) {
                toast.custom((t) => (
                    <Notification title={"A New semester"} message={notification_message} toast_object={t}/>
                ), {
                    duration: 7000,
                    style: {
                        all: 'unset', // completely reset global styles
                    },
                });
            }

        } catch (err) {
            toast.error(err.message || "Something went wrong getting notifications");
        }

    }


    function checkLocationTracking() {
        if (!manualLocationEnabled && navigator.geolocation) {
            watchIdRef.current = navigator.geolocation.watchPosition(
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
            toast("Location set");
        } else {

            // display an error if not supported
            toast.error(
                "Location tracking on this website is not supported by your browser",
                {
                    id: "tracking-not-supported",
                }
            );

            setTrackingEnabled(false);

        }
    }

    //Retrieve user data when dashboard is loaded
    useEffect(() => {

        if (sessionStorage.getItem("access_token")) {

            (async function(){
                await getUserInfo();
                await getUserNotification();
            })();

            checkLocationTracking();
        }

        return () => { if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current); };

    }, []);

    // Run when page is loaded from back/forward arrows on browser
    useEffect(() => {
        getUserInfo();
    }, [getUserInfo]);

    useEffect(() => {
        if (map) {
            map.setOptions({
                gestureHandling: "greedy",
                zoomControl: true,
                disableDefaultUI: false
            });
        }
    }, [map]);

    useEffect(() => {
        if (map && (userLocation.lat !== 0 || userLocation.lng !== 0)) {
            map.panTo(userLocation);
        }
    }, [map, userLocation]);

    // Automatically set campus based on next class
    useEffect(() => {
        if (nextClass && nextClass.campus) {
            const campus = CAMPUSES.find(c => c.name.toLowerCase().includes(nextClass.campus.toLowerCase()));
            if (campus) setSelectedCampus(campus);
        }
    }, [nextClass]);

    const manualLocationChange = (event)=>{

        try {

            const callback = (results, status)=> {

                if(status === window.google.maps.GeocoderStatus.OK){

                    const lat = results[0].geometry.location.lat();
                    const lng = results[0].geometry.location.lng();
                    setUserLocation({lat: lat, lng: lng});
                    setManualLocationEnabled(true);
                    if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
                    setTrackingEnabled(false);

                } else {

                    toast.error("The provided location could not be processed");

                }

            }

            setLocation(event, callback);

        } catch (err) {

            toast.error(err.message);

        }

    }

    if (loading) {
        return  <Spinner size="sm" />;
    }

    const calculateLeaveTime = () => {
        if (!nextClass || !travelTime) return "--:--";

        let totalTravelMins = 0;
        const hourMatch = travelTime.match(/(\d+)\s*hour/);
        const minMatch = travelTime.match(/(\d+)\s*min/);
        
        if (hourMatch) totalTravelMins += parseInt(hourMatch[1]) * 60;
        if (minMatch) totalTravelMins += parseInt(minMatch[1]);

        const leaveByMinutes = nextClass.startTimeInMinutes - totalTravelMins - bufferTime;
        if (leaveByMinutes < 0) return "Past";

        const hours24 = Math.floor(leaveByMinutes / 60);
        const mins = leaveByMinutes % 60;
        const ampm = hours24 >= 12 ? 'PM' : 'AM';
        const hours12 = hours24 % 12 || 12;
        
        return `${hours12}:${mins.toString().padStart(2, '0')} ${ampm}`;
    };

    const handleCopyRoute = () => {
        if (!routeSteps.length) return;
        // Strip HTML tags for clipboard
        const text = routeSteps.map(step => {
            const cleanInstruction = step.instructions.replace(/<[^>]*>?/gm, '');
            return `${cleanInstruction} (${step.distance.text})`;
        }).join('\n');

        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Journey to ${selectedCampus.name}`,
                    text: `Trip time: ${travelTime}. Distance: ${travelDistance}.`,
                    url: window.location.href
                });
            } catch (err) {
                console.log('Error sharing:', err);
            }
        } else {
            handleCopyRoute();
        }
    };

    const getGoogleMapsUrl = () => {
        const origin = `${userLocation.lat},${userLocation.lng}`;
        const dest = encodeURIComponent(selectedCampus.address);
        const mode = travelMode.toLowerCase();
        return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}&travelmode=${mode}`;
    };

    const handleOpenMaps = () => {
         window.open(getGoogleMapsUrl(), '_blank');
    }

    const handleAddToCalendar = () => {
        if (!nextClass || !travelTime || !calculateArrivalTime) {
            toast.error("No upcoming class to schedule.");
            return;
        }

        const parseTravelTime = (timeStr) => {
            let totalMinutes = 0;
            const hourMatch = timeStr.match(/(\d+)\s*hour/);
            const minMatch = timeStr.match(/(\d+)\s*min/);
            if (hourMatch) totalMinutes += parseInt(hourMatch[1]) * 60;
            if (minMatch) totalMinutes += parseInt(minMatch[1]);
            return totalMinutes;
        };

        const durationMins = parseTravelTime(travelTime);
        const endTime = calculateArrivalTime; // This is a Date object (Class Start - Buffer)
        const startTime = new Date(endTime.getTime() - durationMins * 60000);

        const formatGoogleDate = (date) => {
            return date.toISOString().replace(/-|:|\.\d{3}/g, "");
        };

        const startStr = formatGoogleDate(startTime);
        const endStr = formatGoogleDate(endTime);
        const title = encodeURIComponent(`Commute to ${nextClass.title}`);
        const details = encodeURIComponent(`Travel time: ${travelTime}\nDistance: ${travelDistance}\n\nRoute: ${getGoogleMapsUrl()}`);
        const location = encodeURIComponent(selectedCampus.address);

        const url = `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startStr}/${endStr}&details=${details}&location=${location}`;
        window.open(url, '_blank');
    }

    const getActionIcon = (step) => {
        if (step.travel_mode === 'TRANSIT') {
             const vehicleType = step.transit?.line?.vehicle?.type;
             if (vehicleType === 'SUBWAY' || vehicleType === 'TRAIN' || vehicleType === 'HEAVY_RAIL') return <BsTrainFront size={20} />;
             return <BsBusFront size={20} />;
        }
        const text = step.instructions.toLowerCase();
        if (text.includes("walk to")) return <BsPersonWalking size={16} />;
        if (text.includes("left")) return <BsArrowLeft size={16} />;
        if (text.includes("right")) return <BsArrowRight size={16} />;
        if (text.includes("head") || text.includes("continue")) return <BsArrowUp size={16} />;
        return <BsArrowReturnRight size={16} />;
    };

    return (
        <>
            <Box>

                <Toaster position="top-center" duration={5000} toastOptions={{
                    style: {
                        fontSize: '16px',
                        padding: '16px 20px',
                        maxWidth: '420px',
                        borderRadius: '10px',
                    },
        }} reverseOrder={false} />
                <Container fluid="lg" className="py-4">

                    <div style={{display: "flex", flexDirection: "column"}}>

                        <div className="hero-map-wrapper">

                            <div className="route-summary">

                                {directionsError ?

                                    <div style={{textAlign: "center", color: "red", padding: "10px", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px"}}>
                                        <BsExclamationTriangleFill size={24} />
                                        <p style={{ margin: 0 }}> {directionsError} </p>
                                    </div>

                                    : (travelDistance && travelTime ?

                                    <div>

                                        <h5 className="text-muted text-uppercase" style={{textAlign: "center", display: "flex", justifyContent: "center", alignItems: "center", gap: "10px", letterSpacing: "1px", fontSize: "0.9rem"}}>
                                            Estimated travel time to
                                            <Dropdown onSelect={(k) => setSelectedCampus(CAMPUSES.find(c => c.key === k))}>
                                                <Dropdown.Toggle variant="success" id="dropdown-campus" className="text-nowrap flex-shrink-0 d-inline-flex align-items-center" style={{ width: 'max-content' }}>
                                                    {selectedCampus.name}
                                                </Dropdown.Toggle>
                                                <Dropdown.Menu>
                                                    {CAMPUSES.map(c => (
                                                        <Dropdown.Item key={c.key} eventKey={c.key}>{c.name}</Dropdown.Item>
                                                    ))}
                                                </Dropdown.Menu>
                                            </Dropdown>:
                                        </h5>

                                        <h1 style={{color: "#2e7d32", textAlign: "center", fontSize: "clamp(2.5rem, 4vw, 3.5rem)", fontWeight: "800", margin: "5px 0"}}> {travelTime} </h1>

                                        {nextClass ? (
                                            <div style={{ textAlign: "center", marginTop: "10px" }}>
                                                <h3 style={{fontSize: "1.5rem", fontWeight: "600", color: "#333"}}>
                                                    Next Class: <strong>{nextClass.title}</strong> at {nextClass.displayTime}
                                                </h3>
                                                <h4 className="mt-3 text-muted" style={{fontWeight: "400"}}>
                                                    Leave by <span style={{ color: "#d32f2f", fontWeight: "bold", fontSize: "1.4em" }}>{departureTime || calculateLeaveTime()}</span> to arrive 
                                                    <Form.Select 
                                                        size="sm" 
                                                        className="d-inline-block mx-2" 
                                                        style={{ width: "auto" }}
                                                        value={bufferTime}
                                                        onChange={(e) => setBufferTime(parseInt(e.target.value))}
                                                    >
                                                        <option value="5">5</option>
                                                        <option value="10">10</option>
                                                        <option value="15">15</option>
                                                        <option value="20">20</option>
                                                        <option value="30">30</option>
                                                    </Form.Select>
                                                    minutes before class.
                                                </h4>
                                            </div>
                                        ) : (
                                            <h3 style={{ textAlign: "center" }}>No more classes today!</h3>
                                        )}

                                    </div>
                                    :
                                    <div>

                                        <p> <Spinner size="sm" /> Retrieving Directions </p>

                                    </div>)
                                }

                            </div>

                            <APIProvider apiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY} version="3.58"  libraries={GOOGLE_MAPS_LIBRARIES}>

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
                                        <Directions 
                                            userLocation={userLocation} 
                                            destination={selectedCampus.address} 
                                            setTravelTime={setTravelTime}
                                            setTravelDistance={setTravelDistance}
                                            arrivalTime={calculateArrivalTime}
                                                    setDepartureTime={setDepartureTime}
                                            setError={setDirectionsError}
                                            setRouteSteps={setRouteSteps}
                                            travelMode={travelMode}
                                            setTravelMode={setTravelMode}
                                        />
                                    </div>
                                </div>

                            </APIProvider>

                        </div>

                        {/* Journey Details Section */}
                        {routeSteps.length > 0 && (
                            <div className="w-100 d-flex justify-content-center mb-5">
                                <style>
                                    {`
                                        @keyframes pulse-green {
                                            0% { box-shadow: 0 0 0 0 rgba(25, 135, 84, 0.4); }
                                            70% { box-shadow: 0 0 0 15px rgba(25, 135, 84, 0); }
                                            100% { box-shadow: 0 0 0 0 rgba(25, 135, 84, 0); }
                                        }
                                        .instruction-text b { font-weight: 700; color: #0d6efd; }
                                        .step-item:hover .step-card { transform: translateX(10px); }
                                        .step-card { transition: transform 0.2s ease; }
                                    `}
                                </style>
                                <Card className="shadow-lg border-0 w-100 overflow-hidden" style={{ maxWidth: "1000px", borderRadius: "24px" }}>
                                    <div className="p-4 bg-light border-bottom d-flex justify-content-between align-items-center">
                                        <h4 className="fw-bold mb-0 d-flex align-items-center gap-3 text-dark">
                                            <div className="bg-white p-2 rounded-circle shadow-sm text-primary d-flex">
                                                <BsPinMap size={24} />
                                            </div>
                                            <span className="d-none d-sm-inline">Journey Details</span>
                                        </h4>
                                        <div className="d-flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                colorScheme={copied ? "green" : "gray"}
                                                onClick={handleShare}
                                                leftIcon={copied ? <BsCheck2 /> : (navigator.share ? <BsShareFill /> : <BsClipboard />)}
                                            ><BsShare />
                                                {copied ? "Copied" : (navigator.share ? "Share" : "Copy")}
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={handleAddToCalendar}
                                                leftIcon={<BsCalendarPlus />}
                                                title="Add commute to Calendar"
                                            >
                                                <BsCalendar3 />
                                                Calendar
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => setShowQrModal(true)}
                                                leftIcon={<BsQrCode />}
                                                title="Send to Phone"
                                            >
                                                <BsQrCode />
                                                QR Code
                                            </Button>
                                            <Button
                                                size="sm"
                                                colorScheme="blue"
                                                variant="solid"
                                                onClick={handleOpenMaps}
                                                leftIcon={<BsMap />}
                                            ><BsGeoAlt />
                                                Open Maps
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Quick Stats Bar */}
                                    <div className="px-4 py-3 bg-white border-bottom d-flex gap-4 align-items-center text-muted small">
                                        <div className="d-flex align-items-center gap-2">
                                            <BsClock className="text-primary" /> <strong>{travelTime}</strong>
                                        </div>
                                        <div className="d-flex align-items-center gap-2">
                                            <BsMap className="text-primary" /> <strong>{travelDistance}</strong>
                                        </div>
                                    </div>

                                    <Card.Body className="p-4 p-md-5 bg-white">
                                        <div className="position-relative">
                                            {/* Gradient Vertical Line */}
                                            <div style={{
                                                position: 'absolute',
                                                left: '24px',
                                                top: '20px',
                                                bottom: '20px',
                                                width: '4px',
                                                borderRadius: '4px',
                                                background: 'linear-gradient(to bottom, #198754 0%, #0d6efd 50%, #dc3545 100%)',
                                                zIndex: 0,
                                                opacity: 0.3
                                            }}></div>

                                            {/* Start Node */}
                                            <div className="d-flex mb-5 position-relative align-items-center group" style={{ zIndex: 1 }}>
                                                <div className="bg-success rounded-circle d-flex align-items-center justify-content-center text-white flex-shrink-0 shadow-md"
                                                     style={{ width: '52px', height: '52px', border: '4px solid white', animation: 'pulse-green 2s infinite' }}>
                                                    <BsGeoAlt size={20} />
                                                </div>
                                                <div className="ms-4">
                                                    <h5 className="fw-bold mb-0 text-dark">Start Journey at {departureTime || calculateLeaveTime()}</h5>
                                                </div>
                                            </div>

                                            {/* Steps */}
                                            {routeSteps.map((step, index) => (
                                                <div
                                                    key={index}
                                                    className="d-flex mb-4 position-relative align-items-start step-item"
                                                    style={{ zIndex: 1 }}
                                                >
                                                    <div className="bg-white rounded-circle d-flex align-items-center justify-content-center text-primary flex-shrink-0 shadow-sm"
                                                         style={{ width: '52px', height: '52px', border: '4px solid #f8f9fa' }}>
                                                        {getActionIcon(step)}
                                                    </div>
                                                    <div className="ms-4 pt-1 w-100 p-3 rounded-3 bg-light border border-light shadow-sm hover-shadow-md transition-all step-card">
                                                        <div 
                                                            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(step.instructions) }} 
                                                            className="mb-2 text-dark fw-medium instruction-text"
                                                            style={{ fontSize: '1.05rem', lineHeight: '1.6' }}
                                                        />

                                                        {/* Transit Details Block */}
                                                        {step.transit && (
                                                            <div className="mt-3 mb-3 p-3 bg-white rounded-3 border border-light-subtle shadow-sm">
                                                                <div className="mb-3">
                                                                    <div className="d-flex align-items-center gap-2">
                                                                        <Badge 
                                                                            bg={step.transit.line.color ? null : "primary"} 
                                                                            className="px-2 py-1" 
                                                                            style={{
                                                                                fontSize: '0.9rem', 
                                                                                backgroundColor: step.transit.line.color || undefined, 
                                                                                color: step.transit.line.text_color || undefined
                                                                            }}
                                                                        >
                                                                            {step.transit.line.short_name || step.transit.line.name}
                                                                        </Badge>
                                                                        <div className="d-flex flex-column lh-1">
                                                                            <span className="fw-bold text-dark small">
                                                                                {step.transit.line.name}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    {step.transit.headsign && (
                                                                        <div className="text-muted small mt-1">
                                                                            Towards <strong className="text-dark">{step.transit.headsign}</strong>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                
                                                                <div className="d-flex flex-column gap-3 position-relative pt-1 ps-3 border-start border-2 border-secondary-subtle ms-3 my-2">
                                                                    {/* Departure */}
                                                                    <div className="position-relative">
                                                                        <div className="position-absolute start-0 translate-middle bg-secondary rounded-circle" 
                                                                             style={{width: '10px', height: '10px', top: '12px'}}></div>
                                                                        <div className="ps-4">
                                                                            <div className="fw-bold text-dark">{step.transit.departure_time.text}</div>
                                                                            <div className="text-muted small">{step.transit.departure_stop.name}</div>
                                                                        </div>
                                                                    </div>

                                                                    {/* Stops */}
                                                                    <div className="ps-4 text-muted small fst-italic">
                                                                        <span className="d-inline-block bg-light px-2 border rounded-pill">
                                                                            {step.transit.num_stops} stops
                                                                        </span>
                                                                    </div>

                                                                    {/* Arrival */}
                                                                    <div className="position-relative">
                                                                        <div className="position-absolute start-0 translate-middle bg-secondary rounded-circle" 
                                                                             style={{width: '10px', height: '10px', top: '12px'}}></div>
                                                                        <div className="ps-4">
                                                                            <div className="fw-bold text-dark">{step.transit.arrival_time.text}</div>
                                                                            <div className="text-muted small">{step.transit.arrival_stop.name}</div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}

                                                        <div className="d-flex gap-2 mt-2">
                                                            <Badge bg="white" text="dark" className="border shadow-sm fw-normal d-flex align-items-center gap-2 py-2 px-3 rounded-pill">
                                                                <span className="text-muted">Distance:</span> <strong>{step.distance.text}</strong>
                                                            </Badge>
                                                            <Badge bg="white" text="dark" className="border shadow-sm fw-normal d-flex align-items-center gap-2 py-2 px-3 rounded-pill">
                                                                <BsClock size={12} className="text-primary" /> <strong>{step.duration.text}</strong>
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}

                                            {/* End Node */}
                                            <div className="d-flex position-relative align-items-start" style={{ zIndex: 1 }}>
                                                <div className="bg-danger rounded-circle d-flex align-items-center justify-content-center text-white flex-shrink-0 shadow-md"
                                                     style={{ width: '52px', height: '52px', border: '4px solid white' }}>
                                                    <BsPinMap size={20} />
                                                </div>
                                                <div className="ms-4 pt-2">
                                                    <h5 className="fw-bold mb-1 text-dark">Arrive at Destination</h5>
                                                    <p className="text-muted mb-0 small text-uppercase fw-bold tracking-wide">{selectedCampus.name}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </div>
                        )}

                        <div style={{display: "flex", flexDirection: "row", justifyContent: "center"}}>

                            <Form className="locationBox" style={{textAlign: 'center', marginBottom: "100px", width: "100%", maxWidth: "800px"}}>

                                <Form.Group className="mb-3">

                                    <Form.Label> Enter your location manually (Use if location tracking is not accurate)</Form.Label>
                                    <Form.Control className="location"></Form.Control>
                                    <Form.Group style={{marginBottom: "4px"}}>
                                        <Form.Text className="text-muted">
                                            Provide any of the following: <strong>"&lt;street number&gt; &lt;street name&gt; &lt;city&gt; &lt;state&gt; &lt;postal
                                            code&gt;"</strong>
                                        </Form.Text>
                                    </Form.Group>
                                    <Form.Group>
                                        <Form.Text>
                                            Example: <strong> 1600 Amphitheatre Parkway, Mountain View, CA 94043. Addresses can also be
                                            place names, ex: "Statue of Liberty, New York, NY"</strong>
                                        </Form.Text>

                                    </Form.Group>


                                    <Form.Group>
                                        <Form.Text style={{color: "red"}}>This will disable location tracking</Form.Text>
                                    </Form.Group>
                                </Form.Group>

                                <Button variant="solid" type="submit" onClick={manualLocationChange}>
                                    Set Location
                                </Button>

                            </Form>

                        </div>

                    </div>


                    <div style={{marginTop: "40px"}}>

                        <Flex justifyContent="center">
                            <ServiceAlerts />
                            <Button variant="outline" size="sm" marginLeft="20px" onClick={enableSchedule} width="230px"> <BsCalendar3 /> View Weekly Schedule </Button>
                        </Flex>
                        {viewCalendar ? <CourseCalendar courses={userInfo.courses}/> : null}
                    </div>

                </Container>

        </Box>

        <Modal show={showQrModal} onHide={() => setShowQrModal(false)} centered>
            <Modal.Header closeButton>
                <Modal.Title>Scan to Open on Phone</Modal.Title>
            </Modal.Header>
            <Modal.Body className="text-center p-4">
                <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(getGoogleMapsUrl())}`} 
                    alt="QR Code" 
                    style={{maxWidth: '100%', borderRadius: '8px'}}
                />
                <p className="mt-3 text-muted mb-0">Scan this code to open the route in Google Maps on your mobile device.</p>
            </Modal.Body>
        </Modal>

        </>
  );
}
