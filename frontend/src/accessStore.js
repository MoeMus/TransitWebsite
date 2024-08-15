import { configureStore} from "@reduxjs/toolkit";
import tokenReducer from "./reducer";

const accessStore = configureStore({ reducer: tokenReducer});

export default accessStore;