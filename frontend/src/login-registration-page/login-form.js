import {useEffect, useState} from "react";
import '../styles/loginStyles.css';
import apiClient from '../configurations/configAxios';
import {useLocation, useNavigate} from "react-router-dom";
import {useDispatch} from "react-redux";
import {set_token} from "../storeConfig/auth_reducer";
import toast, { Toaster } from 'react-hot-toast';
import Button from "react-bootstrap/Button";
import {Heading, Input} from "@chakra-ui/react";
import { PasswordInput } from "../components/ui/password-input"
import Alert from "react-bootstrap/Alert";
import Nav from 'react-bootstrap/Nav';
import Notification from "../components/notification";
import SecretField from "../components/secret-field";

export function Login() {

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loginError, setLoginError] = useState(false);
    const [secretField, setSecretField] = useState("");
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const location = useLocation();
    const from = location.state?.from;

    const [showPasswordNotification, setShowPasswordNotification] = useState(from === "/password/reset");

    const submit = async e => {

        e.preventDefault()

        // If the hidden honeypot field is filled, it's likely a bot. Return early.
        if (secretField) return;

        const userCredentials = {
            username: username,
            password: password
        }

        try {

            // Send credentials to retrieve access and refresh tokens
            const response = await apiClient.post('/token/', userCredentials, {
                withCredentials: true
            });

            const {data} = response;


            const new_state = {
                access_token: data.access,
                refresh_token: data.refresh,
                username: username
            }

            dispatch(set_token(new_state));
            setLoginError(false);
            navigate("/dashboard", { replace: true, state: { from: location.pathname } });
            window.location.reload();
        } catch (err) {
            setLoginError(true);
        }

    }

    useEffect(() => {
        if (showPasswordNotification) {
            toast.custom((t) => (
                <Notification title={"Password Reset"} message={"Your password has been changed"} toast_object={t}/>
            ), {
                duration: 15000,
            }
            );
            setShowPasswordNotification(false);
        }
    }, [showPasswordNotification]);

    return (

        <>

            <Toaster
                position="top-center"
                reverseOrder={false}
            />

            <div className="Auth-form-container">

                <form onSubmit={submit} className="Auth-form">

                    <div className="Auth-form-content">

                        <Heading textAlign="center" fontSize="20px" fontWeight="normal" my="10px">
                            Enter your username and password to continue
                        </Heading>

                        {loginError ?  <Alert variant="danger" title="Invalid Credentials" dismissible
                        onClose={()=>{setLoginError(false)}}> Incorrect Username or Password </Alert> : null}
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

                        <SecretField value={secretField} setter={setSecretField} />

                        <div className="d-grid gap-2 mt-3">

                            <Button type="submit" variant="secondary" className="btn"> Continue </Button>

                        </div>

                        <Nav.Link className="d-grid gap-2 mt-3">
                            <a onClick={()=> {navigate("/password/forgot")}}> Forgot your password? </a>
                        </Nav.Link>

                    </div>


                </form>

            </div>



        </>


    )

}