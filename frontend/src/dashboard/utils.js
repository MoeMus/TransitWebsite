import apiClient from "../configurations/configAxios";
import {toast} from "react-hot-toast";

async function getUserInfoFromBackend() {

    try {

        const user_data = await apiClient.get(
        `/api/user/`,
        {
            method: "GET",
        });

        //console.log(JSON.stringify(userData.data, null, 2));

        const lecture_sections = user_data.data.lecture_sections;
        const non_lecture_sections = user_data.data.non_lecture_sections;

        const user_courses = [...lecture_sections, ...non_lecture_sections];

        delete user_data.data.lecture_sections;
        delete user_data.data.non_lecture_sections;

        user_data.data.courses = user_courses;

        return user_data.data;

    } catch (err) {
        const errorMessage = err.response?.data?.error || err.message || "An error occurred";
        throw Error(errorMessage);
    }

}

async function getNextClassFromBackend() {
    try {
        const response = await apiClient.get('/api/user/next-class/');
        if (response.status === 204) return null;
        return response.data;
    } catch (err) {
        console.error("Failed to fetch next class", err);
        return null;
    }
}

const geocodingCache = {};

const geocodeAddress = (address) => {
    return new Promise((resolve, reject) => {
        if (!window.google || !window.google.maps) {
            reject(new Error("Google Maps library not loaded. Please refresh the page."));
            return;
        }

         const normalizedAddress = address.trim().toLowerCase();

        // Check geocodingCache first
        if (geocodingCache[normalizedAddress]) {
            resolve(geocodingCache[normalizedAddress]);
            return;
        }

        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ address: address }, (results, status) => {
            if (status === "OK") {
                geocodingCache[normalizedAddress] = results[0].geometry.location; // Add good result to cache
                resolve(results[0].geometry.location);
            } else {
                let errorMessage = "The provided location could not be processed";
                
                if (status === "ZERO_RESULTS") {
                    errorMessage = "Location not found. Please try a more specific address.";
                } else if (status === "REQUEST_DENIED") {
                    errorMessage = "API Access Denied. Ensure the 'Geocoding API' is enabled in Google Cloud Console.";
                } else if (status === "OVER_QUERY_LIMIT") {
                    errorMessage = "API Quota exceeded. Please try again later.";
                }
                
                reject(new Error(errorMessage));
            }
        });
    });
};


// Get notification for new semester
async function getNotification() {

    const response = await apiClient.get('api/user/notification/');

    const notification = response.data;

    if (notification) {

        return notification['message'];

    }

    // If there is no notification
    return null;

}


export {
    getUserInfoFromBackend,
    getNextClassFromBackend,
    geocodeAddress,
    getNotification
}