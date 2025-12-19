import apiClient from "../configurations/configAxios";
import updateAccessToken from "../storeConfig/updateAccessToken";

async function deleteAccount(){

    apiClient.delete("/api/user/", {
        method: "DELETE",
        withCredentials: true
    }).catch(err=>{
        throw Error("There was an error deleting your account");
    });
}

async function logout() {

    const request = {access_token: sessionStorage.getItem('access_token'), refresh_token: sessionStorage.getItem('refresh_token')}

    apiClient.post("/api/logout/", request,{
        method: "POST",
        withCredentials: true
    }).catch(err=>{
        throw Error("There was an error logging out");
    })
}

export {deleteAccount, logout}
