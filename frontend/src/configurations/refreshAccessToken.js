import {useEffect} from "react";
import apiClient from "./configAxios";
import {useDispatch, useSelector} from "react-redux";
import updateAccessToken from "../storeConfig/updateAccessToken";

//When the access token stored globally changes, this is run in order to determine when to update it as it expires
const useCheckAccessToken = ()=>{

    const dispatch = useDispatch();
    const accessToken = useSelector((state) => state.value);

    useEffect(()=>{

        let refreshToken = sessionStorage.getItem('refresh_token');

        if (accessToken === '' || !refreshToken) return; //Will only run if there is an access token and refresh token (Only when user is logged in)

        //Will activate when user is logs in and deactivate when user is logged out
        const { expirationDate } = JSON.parse(atob(sessionStorage.getItem('access_token').split('.')[1]));
        const currentTime = Math.floor(Date.now()/1000);
        const refreshTime =  (23 * 3600 + 40) * 1000; // Convert 23 hours and 40 minutes to milliseconds,
        const requestBody = {refresh: refreshToken};

        //Every 23 hours and 40 minutes, update the access and refresh tokens before they expire
        const interval = setInterval(async ()=>{
            const response = await apiClient.post('http://127.0.0.1:8000/token/refresh/', requestBody, {
                method: "POST"
            });
            const {data} = response;
            if(data.access){
               sessionStorage.setItem('access_token', data.access);
               sessionStorage.setItem('refresh_token', data.refresh);
               dispatch(updateAccessToken());
            }
        }, refreshTime);

        return () => clearInterval(interval); // Cleanup on component unmount

    }, [accessToken, dispatch])

};

export default useCheckAccessToken;