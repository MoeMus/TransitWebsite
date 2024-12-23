import '../styles/loginStyles.css';
import {useEffect, useState} from "react";
import { Navigate } from "react-router-dom";
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import apiClient from "../configurations/configAxios";
import {useDispatch} from "react-redux";
import updateAccessToken from "../storeConfig/updateAccessToken";
import {toast, Toaster} from "react-hot-toast";
import WelcomePage from "../components/welcomePage";
import {Heading} from "@chakra-ui/react";
import {PasswordInput} from "../components/ui/password-input";
import {Alert} from "../components/ui/alert";

export function Register(){
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('');
    const [allCredentials, setAllCredentials] = useState(false);
    const [successfulRegister, setSuccessfulRegister] = useState(false);
    const dispatch = useDispatch();
    const [passwordMatch, setPasswordMatch] = useState(true);
    const [passwordMatchMsg, setPasswordMatchMsg] = useState("");
    const [isServerError, setIsServerError] = useState(false);
    const [serverErrMsg, setServerErrMsg] = useState(false);
    
    useEffect(()=>{
        if(confirmPassword !== password){
            setPasswordMatchMsg("Passwords must match");
            setPasswordMatch(false);
        } else if(confirmPassword === password && password.length > 0 && confirmPassword.length > 0){
            setPasswordMatch(true);

        }

        if (username && email && password && confirmPassword) {
            setAllCredentials(true);
            setStatus('');
        } else {
            setAllCredentials(false);
            setStatus('');
        }
        const button = document.querySelector('.button');
        if (button) {
        if (confirmPassword === password && password.length > 0 && confirmPassword.length > 0 && allCredentials) {
            button.removeAttribute('disabled');
        } else {
            button.setAttribute('disabled', '');
        }
    }

    }, [password, confirmPassword, username, email]);


    function changeButton(){
        if(document.querySelector('.button')){
            console.log(passwordMatch);
            console.log(allCredentials);
            console.log(!isServerError);
            if(passwordMatch && allCredentials && !isServerError){

                document.querySelector('.button').removeAttribute('disabled');

            } else {

                document.querySelector('.button').setAttribute('disabled', '');

            }
        }
    }

    async function loginUser( userCredentials ){
        try{

            const response = await apiClient.post('http://127.0.0.1:8000/token/', userCredentials, {
                withCredentials: true
            });

            const {data} = response;
            sessionStorage.clear();
            sessionStorage.setItem('user', userCredentials.username);
            sessionStorage.setItem('access_token', data.access);
            sessionStorage.setItem('refresh_token', data.refresh);
            setSuccessfulRegister(true);
            dispatch(updateAccessToken());
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${data.access}`;

        } catch (err){
            throw err;
        }
    }

    function submitCredentials(evt){
        evt.preventDefault();
        const userCredentials = {username: username, email: email, password: password};
        apiClient.post('http://127.0.0.1:8000/api/user/register/', userCredentials, {
                method: 'POST',
                withCredentials: true
        }).then( async () => {
            loginUser(userCredentials);
        }).catch(error => {
            const errorMessage = error.response.data.error;
            setServerErrMsg(errorMessage);
            console.log(status);
            setIsServerError(true);
        });
    }

    const registrationForm = () =>{
        return (<>
            <Container fluid>

                <div className="form-container">

                    <Form onSubmit={submitCredentials}>

                        <Heading fontSize="25px" fontWeight="normal" marginBottom="55px"> Please enter a username, email, and password to register </Heading>

                        {isServerError ? <Alert status="error" title="Invalid Creditentials"> {serverErrMsg} </Alert> : null}
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
                            {/*<Form.Control type="password" value={password}*/}
                            {/*              onInput={(event) => setPassword(event.target.value)}/>*/}
                            <PasswordInput type="password" value={password} placeholder="Enter a password" required
                                          onChange={(event) => setPassword(event.target.value)}/>
                        </fieldset>

                        {password !== '' ? (<fieldset>
                            <legend className='input-text'>Confirm Password</legend>
                            {/*<Form.Control type="password" value={confirmPassword}*/}
                            {/*              onInput={(event) => setConfirmPassword(event.target.value)}/>*/}
                            <PasswordInput type="password" value={confirmPassword} placeholder="Reenter your password"
                                          required onChange={(event) => setConfirmPassword(event.target.value)}/>
                        </fieldset>) : null}

                        <Button className='button' type="submit" variant="success" style={{marginTop: '10px', marginBottom: '10px'}}>Register</Button>{' '}

                    </Form>
                    {!passwordMatch ? <p style={{color: "indianred"}}> {passwordMatchMsg} </p> : null}


                </div>

            </Container>
        </>);
    }

    return(
        <>

            <Toaster
                position="top-left"
                reverseOrder={false}
            />

            {successfulRegister? <WelcomePage /> : registrationForm()}


        </>
    )
}
