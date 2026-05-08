import apiClient from "../configurations/configAxios";

async function deleteAccount(){

    try {
        await apiClient.delete("/user/", {
            withCredentials: true
        });

    } catch(err) {

            throw Error("There was an error deleting your account");

    }
}


async function logout(request){

    try {

        await apiClient.post("/logout/", request, {
            withCredentials: true
        });

    } catch (err) {

        throw Error("There was an error logging out");

    }

}


export {deleteAccount, logout}
