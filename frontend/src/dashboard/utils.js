import apiClient from "../configurations/configAxios";
import {toast} from "react-hot-toast";

async function getUserInfoFromBackend(username) {

    try {

        const response = await apiClient.get(
        `/api/user/`,
        {
            method: "GET",
        });

        //console.log(JSON.stringify(userData.data, null, 2));

        const lecture_sections = response.data.lecture_sections;
        const non_lecture_sections = response.data.non_lecture_sections;

        const user_courses = [...lecture_sections, ...non_lecture_sections];

        delete response.data.lecture_sections;
        delete response.data.non_lecture_sections;

        response.data.courses = user_courses;

        return response.data;

    } catch (err) {
        const errorMessage = err.response.data.error;
        throw Error(errorMessage);
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


export {
    getUserInfoFromBackend,
    setLocation
}