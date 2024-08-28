import React, {useState, useEffect} from "react";
import apiClient from "../configurations/configAxios";
import {toast, Toaster} from "react-hot-toast";

export function Dashboard(){

    const [userInfoLoaded, setUserInfoLoaded] = useState(false);
    const [loading, setLoading] = useState(true);
    const [userInfo, setUserInfo] = useState({});
    const [error, setError] = useState('');
    const username = sessionStorage.getItem('user');
    const [location, setLocation] = useState({latitude: "", longitude: ""})
    const loginSuccess = () =>{
        toast.success(`Welcome back, ${username}`, {
            duration: 2000
        });
    }



    function locationError(){
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

    const watchID = navigator.geolocation.watchPosition((position) => {
        setLocation({latitude: `${position.coords.latitude}`, longitude: `${position.coords.longitude}`});
    }, locationError);

    useEffect(() => {
        getUserInfo();
        return ()=> navigator.geolocation.clearWatch(watchID);
    }, []);

    useEffect(() => {
        if(userInfoLoaded){
            loginSuccess()
        }
    }, [userInfoLoaded]);
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

            <p>User Info: {JSON.stringify(userInfo)}</p>
        </>
    );


}