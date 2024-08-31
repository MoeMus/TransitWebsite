import {useState} from "react";
import apiClient from '../configurations/configAxios';
import {useNavigate} from "react-router-dom";
import {useDispatch} from "react-redux";
import updateAccessToken from "../storeConfig/updateAccessToken";
import toast, { Toaster } from 'react-hot-toast';
import Button from "react-bootstrap/Button";


export function Login() {

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

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
                throw new Error(" ");
            }

            //Clear local storage in the browser and update the access and refresh tokens there
            const {data} = response;
            sessionStorage.clear();
            sessionStorage.setItem('user', username);
            sessionStorage.setItem('access_token', data.access);
            sessionStorage.setItem('refresh_token', data.refresh);
            dispatch(updateAccessToken());
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${data.access}`;
            navigate("/dashboard", { state: { from: "/registration" } });
            window.location.reload();
        } catch (err) {
            toast.error("Incorrect Username or Password", {
                duration: 2000
            });
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

                        <p className="Auth-form-title">
                            Enter your username and password to continue
                        </p>

                        <div className="form-group mt-3">

                            <label>Username</label>

                            <input className="form-control mt-1"
                                   placeholder="Enter Username"
                                   name='username'
                                   type='text' value={username}
                                   required
                                   onChange={e => setUsername(e.target.value)}/>

                        </div>

                        <div className="form-group mt-3">

                            <label>Password</label>

                            <input name='password'
                                   type="password"
                                   className="form-control mt-1"
                                   placeholder="Enter password"
                                   value={password}
                                   required
                                   onChange={e => setPassword(e.target.value)}/>

                        </div>

                        <div className="d-grid gap-2 mt-3">

                            <Button type="submit" variant="danger" className="btn"> Continue
                            </Button>

                        </div>

                    </div>


                </form>

            </div>

        </>


    )

}