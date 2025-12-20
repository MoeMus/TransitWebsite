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

export {deleteAccount}
