import React, {useState, useEffect} from "react";
import apiClient from "../configurations/configAxios";
import {toast, Toaster} from "react-hot-toast";

export function Dashboard(){

    const [userInfoLoaded, setUserInfoLoaded] = useState(false);
    const [loading, setLoading] = useState(true);
    const [userInfo, setUserInfo] = useState({});
    const [error, setError] = useState('');
    const username = sessionStorage.getItem('user');

    const loginSuccess = () =>{
        toast.success("Log in Successful", {
            duration: 2000
        });
    }

    async function getUserInfo() {
        try {
            const userData = await apiClient.get(`http://127.0.0.1:8000/api/user/get/?username=${username}`, {
                method: "GET"
            });

            if (userData.status !== 200) {
                setError(`User ${username} not found`);
            } else {
                setUserInfo(userData.data);
                setUserInfoLoaded(true);
            }
        } catch (err) {
            toast.error(error, {
                duration: 2000
            });
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        getUserInfo();
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

            <p>Welcome Back, {username}</p>
            <p>User Info: {JSON.stringify(userInfo)}</p>
        </>
    );


}