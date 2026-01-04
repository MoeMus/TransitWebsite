import { createSlice } from '@reduxjs/toolkit'
import apiClient from "../configurations/configAxios";

const access_token = sessionStorage.getItem("access_token");
const refresh_token = sessionStorage.getItem("refresh_token");
const username = sessionStorage.getItem("username");

const initialState = {
    access_token: access_token || null, // Default to an empty string if no token
    refresh_token: refresh_token || null,
    username: username || null,
    is_authenticated: !!access_token
};

const authenticationSlice = createSlice({
    name: "authentication_slice",
    initialState,
    reducers: {

        // Sets all tokens during authentication
        set_token: (state, action)=>{

            sessionStorage.setItem("access_token", action.payload.access_token);
            sessionStorage.setItem("refresh_token", action.payload.refresh_token);
            sessionStorage.setItem("username", action.payload.username);
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${action.payload.access_token}`;

            state.access_token = action.payload.access_token;   // payload contains the token
            state.refresh_token = action.payload.refresh_token;
            state.username = action.payload.username;
            state.is_authenticated = true;

        },

        remove_token: (state)=>{

            sessionStorage.removeItem("access_token");
            sessionStorage.removeItem("refresh_token");
            sessionStorage.removeItem("username");
            apiClient.defaults.headers.common['Authorization'] = '';

            state.access_token = null;
            state.refresh_token = null;
            state.username = null;
            state.is_authenticated = false;
        }

    }

});

export const {set_token, remove_token} = authenticationSlice.actions
export default authenticationSlice.reducer;