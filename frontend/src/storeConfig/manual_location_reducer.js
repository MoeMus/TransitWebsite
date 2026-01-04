import { createSlice } from '@reduxjs/toolkit'

const manual_location = sessionStorage.getItem("manual_location");

const initialState = {
    manual_location: manual_location || null,
    manual_location_enabled: !!manual_location
}

const manualLocationSlice = createSlice({
    name: "manual_location_slice",
    initialState,
    reducers: {
        enable_manual_location: (state, action)=> {
            sessionStorage.setItem("manual_location", action.payload.location);
            state.manual_location = action.payload.location;
            state.manual_location_enabled = true;
        },

        disable_manual_location: (state)=> {
            sessionStorage.removeItem("manual_location");
            state.manual_location = null;
            state.manual_location_enabled = false;
        }
    }
});

export const {enable_manual_location, disable_manual_location} = manualLocationSlice.actions;
export default manualLocationSlice.reducer;