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
import {Toast} from "react-bootstrap";

export function Register(){
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('');
    const [isError, setIsError] = useState(false);
    const [isApproved, setIsApproved] = useState(false)

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

    }, )


    function changeButton(){
        if(isError){
            document.querySelector('.button').setAttribute('disabled', '');
        } else {
            document.querySelector('.button').removeAttribute('disabled');
        }
    }

    async function loginUser( userCredentials ){
        try{
            const response = await apiClient.post('http://127.0.0.1:8000/token/', userCredentials, {
                withCredentials: true
            });
            if(response.status !== 200){
                throw new Error("");
            }
            const {data} = response;
            sessionStorage.clear();
            sessionStorage.setItem('user', userCredentials.username);
            sessionStorage.setItem('access_token', data.access);
            sessionStorage.setItem('refresh_token', data.refresh);
            dispatch(updateAccessToken());
            setIsApproved(true);
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${data.access}`;

        } catch (err){
            toast.error("Could not create profile", {
                duration: 2000
            });
        }
    }

    function submitCredentials(evt){
        evt.preventDefault();
        const userCredentials = {username: username, email: email, password: password};
        apiClient.post('http://127.0.0.1:8000/api/user/register/', userCredentials, {
                method: 'POST',
                withCredentials: true
        }).then(() => {
            loginUser(userCredentials);
        }).catch((error)=>{
             if (error.response) {
                setStatus(`${error.response.status} - ${error.response.data.message}`);
             } else {
                setStatus(`${error.message}`);
             }
             setIsError(true);
             toast(status, {
                 duration: 2000
             })
        });
    }


    return(
        <>

            <Toast
                position="top-left"
                reverseOrder={false}
            />

            <Container fluid>

                <div className="form-container" style={{
                    position: 'absolute', left: '50%', top: '50%',
                    transform: 'translate(-50%, -50%)',
                    boxShadow: '0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)',
                    padding: '20px'
                }}>

                    {isApproved ? <Navigate to="/welcome" replace={true}/> : null }

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

                    <p style={{
                        color: "indianred"
                    }}> {status} </p>

                </div>

            </Container>


        </>
    )
}
