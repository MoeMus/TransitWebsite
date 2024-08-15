const initialState = {
  value: sessionStorage.getItem('access_token') || '' // Default to an empty string if no token
};

function tokenReducer(state = initialState, action) {
  switch (action.type) {
    case 'accessToken/update':
      return {
        ...state,
        value: sessionStorage.getItem('access_token') || '' // Fetch the updated token from sessionStorage
      };
    default:
      return state; // Return the current state for any other action types
  }
}

export default tokenReducer;