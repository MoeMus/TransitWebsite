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

export function Register(){
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('');
    const [isError, setIsError] = useState(false);
    const [successfulRegister, setSuccessfulRegister] = useState(false);
    const dispatch = useDispatch();

    useEffect(()=>{
        if(confirmPassword !== password){
            setStatus("Passwords must match");
            setIsError(true);
        } else if (username === ''){
            setIsError(true);
        } else if (email === ''){
            setIsError(true);
        }else if (password === ''){
            setStatus(' ');
            setIsError(true);
        } else {
            setIsError(false);
            setStatus('');
        }
        changeButton();

    }, );


    function changeButton(){
        if(document.querySelector('.button')){
            if(isError){

                document.querySelector('.button').setAttribute('disabled', '');

            } else {

                document.querySelector('.button').removeAttribute('disabled');

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
            console.log(errorMessage);
            setStatus(errorMessage);
            setIsError(true);
            toast.error(errorMessage, {
                duration: 2000
            });
        });
    }

    const registrationForm = () =>{
        return (<>
            <Container fluid>

                <div className="form-container">

                    <Form onSubmit={submitCredentials}>

                        <p className="Auth-form-title"> Please enter a username, email, and password to register </p>

                        <fieldset>
                            <legend className='input-text'>Username</legend>
                            <Form.Control type="text" value={username}
                                          onInput={(event) => setUsername(event.target.value)}/>
                        </fieldset>

                        <fieldset>
                            <legend className='input-text'>Email</legend>
                            <Form.Control type="email" value={email}
                                          onInput={(event) => setEmail(event.target.value)}/>
                        </fieldset>


                        <fieldset>
                            <legend className='input-text'>Password</legend>
                            <Form.Control type="password" value={password}
                                          onInput={(event) => setPassword(event.target.value)}/>
                        </fieldset>

                        {password !== '' ? (<fieldset>
                            <legend className='input-text'>Confirm Password</legend>
                            <Form.Control type="password" value={confirmPassword}
                                          onInput={(event) => setConfirmPassword(event.target.value)}/>
                        </fieldset>) : null}

                        <Button className='button' type="submit" variant="success" style={{marginTop: '10px', marginBottom: '10px'}}>Register</Button>{' '}

                    </Form>

                    <p style={{color: "rosybrown"}}>
                        It is recommended to activate location tracking in order to determine the best routes to get to your classes
                    </p>

                    <p style={{
                        color: "indianred"
                    }}> {status} </p>

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
