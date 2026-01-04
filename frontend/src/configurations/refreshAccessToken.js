import { useEffect } from "react";
import apiClient from "./configAxios";
import { useDispatch, useSelector } from "react-redux";
import {set_token} from "../storeConfig/reducer";
//When the access token stored globally changes, this is run in order to determine when to update it as it expires
const useCheckAccessToken = () => {
    const dispatch = useDispatch();
    const { accessToken } = useSelector((state) => state.authentication);

    useEffect(() => {
        let refreshToken = sessionStorage.getItem("refresh_token");

        if (accessToken === '' || !refreshToken) return; //Will only run if there is an access token and refresh token (Only when user is logged in)

        // Will activate when user is logs in and deactivate when user is logged out
        const decodedToken = JSON.parse(atob(accessToken.split(".")[1])); // Decode the token payload to get expiration
        const currentTime = Math.floor(Date.now() / 1000);
        const timeLeft = decodedToken.exp - currentTime;
        const refreshInterval = Math.min(timeLeft - 120, 23 * 3600); // Set interval for token refresh

        const requestBody = { refresh: refreshToken };

        const interval = setInterval(async () => {
            try {
                const response = await apiClient.post("/token/refresh/", requestBody, {
                    method: "POST",
                });
                const { access, refresh } = response.data;

                if (access) {

                    const new_state = {
                        access_token: access
                    }

                    if (refresh) {

                        // Save new refresh token if provided
                        new_state.refresh_token = refresh;
                    }

                    dispatch(set_token(new_state));
                }
            } catch (error) {
                console.error("Error refreshing token", error); // Handle errors if token refresh fails
            }
        }, refreshInterval * 1000); // Run at calculated interval

        return () => clearInterval(interval); // Cleanup on component unmount

    }, [accessToken, dispatch]);
};

export default useCheckAccessToken;
