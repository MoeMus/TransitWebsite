import apiClient from "../configurations/configAxios";
import updateAccessToken from "../storeConfig/updateAccessToken";

async function deleteAccount(){

    try {
        console.log("Deleting account")
        await apiClient.delete("/api/user/", {
            withCredentials: true
        });

    } catch(err) {

            throw Error("There was an error deleting your account");

    }
}

export {deleteAccount}
