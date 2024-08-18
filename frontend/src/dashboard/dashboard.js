import React, {useState, useEffect} from "react";
import apiClient from "../configurations/configAxios";
export function Dashboard(){

    const [userInfoLoaded, setUserInfoLoaded] = useState(false);
    const [loading, setLoading] = useState(true);
    const [userInfo, setUserInfo] = useState({});
    const [error, setError] = useState('');
    const username = sessionStorage.getItem('user');

    async function getUserInfo() {
        console.log(`http://127.0.0.1:8000/user/get/?username=${username}`);
        try {
            const userData = await apiClient.get(`http://127.0.0.1:8000/api/user/get/?username=${username}`, {
                method: "GET"
            });

            if (userData.status === 404) {
                setError(`User ${username} not found`);
            } else {
                setUserInfo(userData.data);
                setUserInfoLoaded(true);
            }
        } catch (err) {
            console.log('Failed to fetch user information');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        getUserInfo();
    }, []);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <p>Error: {error}</p>;
    }

    return (
        <>
            <p>Welcome Back, {username}</p>
            <p>User Info: {JSON.stringify(userInfo)}</p>
        </>
    );


}