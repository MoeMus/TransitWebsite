import { configureStore } from "@reduxjs/toolkit";
import authenticationSlice from "./storeConfig/reducer";


// Used to globally store the access token in order to update when it will be refreshed before it expires
const accessStore = configureStore({
    reducer: {
        authentication: authenticationSlice
    },
});

export default accessStore;