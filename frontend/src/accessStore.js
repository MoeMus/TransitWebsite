import { configureStore } from "@reduxjs/toolkit";
import tokenReducer from "./storeConfig/reducer";


//Used to globally store the access token in order to update when it will be refreshed before it expires
const accessStore = configureStore({ reducer: tokenReducer });

export default accessStore;