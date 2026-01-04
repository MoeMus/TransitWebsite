import { useEffect } from "react";
import apiClient from "./configAxios";
import { useDispatch, useSelector } from "react-redux";
import {set_token} from "../storeConfig/auth_reducer";

// When the access token stored globally changes, this is run in order to determine when to update it as it expires
const useCheckAccessToken = () => {
    const dispatch = useDispatch();
    const { access_token, refresh_token, username, is_authenticated } = useSelector((state) => state.authentication);

    useEffect(() => {

        // Will only run if there is an access token and refresh token (Only when user is logged in)
        if (!is_authenticated) return;

        // Will activate when user is logs in and deactivate when user is logged out

        // Decode the token payload to get expiration
        const decoded_token = JSON.parse(atob(access_token.split(".")[1]));
        const current_time = Math.floor(Date.now() / 1000);
        const time_left = decoded_token.exp - current_time;

        // Set interval for token refresh
        const refresh_interval = Math.max((time_left - 120) * 1000, 5000);

        const requestBody = { refresh: refresh_token };

        const interval = setInterval(async () => {
            try {
                const response = await apiClient.post("/token/refresh/", requestBody);
                const { access, refresh } = response.data;

                if (access) {

                    const new_state = {
                        access_token: access,
                        refresh_token: refresh,
                        username: username
                    }

                    dispatch(set_token(new_state));
                }
            } catch (error) {
                console.error("Error refreshing token", error); // Handle errors if token refresh fails
            }

        }, refresh_interval); // Run at calculated interval

        return () => clearInterval(interval); // Cleanup on component unmount

    }, [dispatch]);
};

export default useCheckAccessToken;
