import { configureStore } from "@reduxjs/toolkit";
import authenticationSlice from "./storeConfig/auth_reducer";
import manualLocationSlice from "./storeConfig/manual_location_reducer";

// Used to globally store the access token in order to update when it will be refreshed before it expires
const accessStore = configureStore({
    reducer: {
        authentication: authenticationSlice,
        manual_location: manualLocationSlice
    },
});

export default accessStore;