import apiClient from "../configurations/configAxios";

async function deleteAccount(){

    try {
        await apiClient.delete("/api/user/", {
            withCredentials: true
        });

    } catch(err) {

            throw Error("There was an error deleting your account");

    }
}


async function logout(request){

    try {

        await apiClient.post("/api/logout/", request, {
            withCredentials: true
        });

    } catch (err) {

        throw Error("There was an error logging out");

    }

}


export {deleteAccount, logout}
