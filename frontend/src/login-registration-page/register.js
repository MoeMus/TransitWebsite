import '../styles/loginStyles.css';
import React, {useEffect, useState} from "react";
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import apiClient from "../configurations/configAxios";
import {useDispatch} from "react-redux";
import WelcomePage from "../components/welcomePage";
import {Flex, Heading} from "@chakra-ui/react";
import {PasswordInput} from "../components/ui/password-input";
import Alert from "react-bootstrap/Alert";
import {set_token} from "../storeConfig/auth_reducer";
import toast, { Toaster } from 'react-hot-toast';
import SecretField from "../components/secret-field";
import TurnstileWidget from "../components/TurnstileWidget";
import {useNavigate} from "react-router-dom";
import EmailForm from "../reset-password/email-form";
import VerificationCodeForm from "../reset-password/verification-code-form";

export function Register(){
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [email, setEmail] = useState('');
    const [allCredentials, setAllCredentials] = useState(false);
    const dispatch = useDispatch();
    const [passwordMatch, setPasswordMatch] = useState(true);
    const [passwordMatchMsg, setPasswordMatchMsg] = useState("");
    const [isServerError, setIsServerError] = useState(false);
    const [serverErrMsg, setServerErrMsg] = useState("");
    const [secretField, setSecretField] = useState("");
    const [turnstileToken, setTurnstileToken] = useState("");
    const [validCredentials, setValidCredentials] = useState(false);
    const [alertOpen, setAlertOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(()=>{
        if(confirmPassword !== password && password.length > 0){
            setPasswordMatchMsg("Passwords must match");
            setPasswordMatch(false);
        } else if(confirmPassword === password && password.length > 0 && confirmPassword.length > 0){
            setPasswordMatch(true);

        } else if (password.length === 0){
            setPasswordMatchMsg('');
        }

        if (username && email && password && confirmPassword) {
            setAllCredentials(true);
        } else {
            setAllCredentials(false);
        }

    }, [password, confirmPassword, username, email]);

    useEffect(() => {
        const button = document.querySelector('.button');
        if (button) {
            if (passwordMatch && allCredentials) {
                button.removeAttribute('disabled');
            } else {
                button.setAttribute('disabled', '');
            }
        }
    }, [passwordMatch, allCredentials]);

    async function loginUser( userCredentials ){
        try{

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
            navigate("/welcome", {replace: true});

        } catch (err){
            throw err;
        }
    }

    async function submitCredentials(evt){

        evt.preventDefault();

        if (secretField) return;

        if (process.env.REACT_APP_TURNSTILE_SITE_KEY && !turnstileToken) {
            toast.error("Please verify you are human");
            return;
        }

        try {

            const userCredentials = {
                username: username,
                email: email,
                password: password,
                turnstile_token: turnstileToken
            };

            await apiClient.post('/api/user/validate-credentials/', userCredentials);
            setValidCredentials(true);
            setAlertOpen(true);

        } catch (err){

            const errorMessage = err.response.data?.error || "There was an error registering your account";

            setServerErrMsg(errorMessage);
            setIsServerError(true);
            setValidCredentials(false);

        }

    }

    async function createAccount(verificationCode){

        const request = {
            email: email,
            otp: verificationCode
        }

        await apiClient.post("/api/user/validate-registration-code/", request);

        const userCredentials = {
            username: username,
            email: email,
            password: password,
            turnstile_token: turnstileToken
        };

        await apiClient.post("/api/user/", userCredentials);

        await loginUser(userCredentials);

    }

    return(
        <>
            <Toaster position="top-center" reverseOrder={false} />

                <Flex  direction="column">

                    <Flex justifyContent="center">
                        <Flex direction="column">

                            <div className="Auth-form-container">

                                <Form onSubmit={submitCredentials}>

                                    <Heading fontSize="25px" fontWeight="normal" marginBottom="55px"> Please enter a username,
                                        email, and password to register </Heading>

                                    {isServerError ? <Alert variant="danger" title="Invalid Credentials"
                                                            dismissible
                                                            onClose={() => setIsServerError(false)}> {serverErrMsg} </Alert> : null}
                                    <fieldset>
                                        <legend className='input-text'>Username</legend>
                                        <Form.Control type="text" value={username} placeholder="Enter a username"
                                                      onInput={(event) => setUsername(event.target.value)}/>
                                    </fieldset>

                                    <fieldset>
                                        <legend className='input-text'>Email</legend>
                                        <Form.Control type="email" value={email} placeholder="Enter your email address"
                                                      onInput={(event) => setEmail(event.target.value)}/>
                                    </fieldset>


                                    <fieldset>
                                        <legend className='input-text'>Password</legend>
                                        <PasswordInput type="password" value={password} placeholder="Enter a password" required
                                                       onChange={(event) => setPassword(event.target.value)}/>
                                    </fieldset>

                                    {password !== '' ? (<fieldset>
                                        <legend className='input-text'>Confirm Password</legend>
                                        <PasswordInput type="password" value={confirmPassword}
                                                       placeholder="Reenter your password"
                                                       required onChange={(event) => setConfirmPassword(event.target.value)}/>
                                    </fieldset>) : null}

                                    {!passwordMatch ? <p style={{color: "indianred"}}> {passwordMatchMsg} </p> : null}

                                    <SecretField value={secretField} setter={setSecretField}/>

                                    <TurnstileWidget setToken={setTurnstileToken}/>

                                    <Button className='button' type="submit" variant="success"
                                            style={{marginTop: '10px', marginBottom: '10px'}}>Register</Button>{' '}

                                    {alertOpen ?
                                        <Alert status={"primary"} style={{padding: "10px"}} dismissible
                                               onClose={() => setAlertOpen(false)}>
                                            <Alert.Heading> Verification Code Sent </Alert.Heading>
                                            <p> If you didn't receive the email, click <Alert.Link
                                                onClick={submitCredentials}>here</Alert.Link> to resend it </p>
                                        </Alert> : null }

                                </Form>


                            </div>

                            {validCredentials ? <VerificationCodeForm onSubmitVerificationCode={createAccount}/> : null}

                        </Flex>

                    </Flex>

                </Flex>

        </>
    )
}
