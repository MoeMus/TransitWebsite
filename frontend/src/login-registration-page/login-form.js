import {useState} from "react";
import apiClient from '../configurations/configAxios';
import {useNavigate} from "react-router-dom";
import {useDispatch} from "react-redux";
import updateAccessToken from "../storeConfig/updateAccessToken";
import toast, { Toaster } from 'react-hot-toast';
import Button from "react-bootstrap/Button";
import {Heading, Input, Text} from "@chakra-ui/react";
import { PasswordInput } from "../components/ui/password-input"
import { Alert } from "../components/ui/alert"

export function Login() {

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loginError, setLoginError] = useState(false);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const submit = async e => {

        e.preventDefault()

        const userCredentials = {
            username: username,
            password: password
        }

        try {
            //Send credentials to retrieve access and login tokens at /token/
            const response = await apiClient.post('http://127.0.0.1:8000/token/', userCredentials, {
                withCredentials: true
            });


            if (response.status !== 200) {
                throw new Error("");
            }

            //Clear local storage in the browser and update the access and refresh tokens there
            const {data} = response;
            sessionStorage.clear();
            sessionStorage.setItem('user', username);
            sessionStorage.setItem('access_token', data.access);
            sessionStorage.setItem('refresh_token', data.refresh);
            dispatch(updateAccessToken());
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${data.access}`;
            setLoginError(false);
            navigate("/dashboard", { state: { from: "/registration" } });
            window.location.reload();
        } catch (err) {
            setLoginError(true);
        }


    }

    return (

        <>

            <Toaster
                position="top-left"
                reverseOrder={false}
            />

            <div className="Auth-form-container">

                <form onSubmit={submit} className="Auth-form">

                    <div className="Auth-form-content">

                        <Heading textAlign="center" fontSize="20px" fontWeight="normal" my="10px">
                            Enter your username and password to continue
                        </Heading>

                        {loginError ?  <Alert status="error" title="Invalid Credentials"> Incorrect Username or Password </Alert> : null}
                        <div className="form-group mt-3">

                            <label>Username</label>

                            <Input variant="subtle"
                                   placeholder="Enter Username"
                                   name='username'
                                   type='text' value={username}
                                   required
                                   onChange={e => setUsername(e.target.value)}/>

                        </div>

                        <div className="form-group mt-3">

                            <label>Password</label>
                            <PasswordInput placeholder="Enter password" variant="subtle"
                                           value={password} required onChange={e => setPassword(e.target.value)}/>

                        </div>

                        <div className="d-grid gap-2 mt-3">

                            <Button type="submit" variant="secondary" className="btn"> Continue </Button>

                        </div>

                    </div>


                </form>

            </div>



        </>


    )

}