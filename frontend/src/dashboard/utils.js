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


const setLocation = (event, callback)=> {
    event.preventDefault();
    const geocoder = new window.google.maps.Geocoder();
    const address = document.querySelector(".location").value;

    if(address){

        geocoder.geocode({address: address}, callback);

    } else {

        throw Error("Please enter a location");

    }

}


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
    setLocation,
    getNotification
}