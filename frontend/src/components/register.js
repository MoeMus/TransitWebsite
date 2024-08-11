import '../styles/loginStyles.css';
import {useEffect, useState} from "react";
import axios from "axios";
import { Navigate } from "react-router-dom";
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';

export function Register(){
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('');
    const [isError, setIsError] = useState(false);
    const [isApproved, setIsApproved] = useState(false)

    useEffect(()=>{
        if(confirmPassword !== password){
            setStatus("Passwords must match");
            setIsError(true);
        } else if (username === ''){
            setStatus("Username must be entered");
            setIsError(true);
        } else if (email === ''){
            setStatus("Email must be entered");
            setIsError(true);
        }else if (password === ''){
            setStatus("Password must be entered");
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
            const response = await axios.post('http://127.0.0.1:8000/token/', userCredentials, {
                headers: {
                    "Content-Type": "application/json",
                },
                withCredentials: true
            });
            if(response.status !== 200){
                throw new Error(response.data);
            }
            const {data} = response;
            localStorage.clear();
            localStorage.setItem('access_token', data.access);
            localStorage.setItem('refresh_token', data.refresh);
            setIsApproved(true);
        } catch (err){
            throw err;
        }
    }

    function submitCredentials(evt){
        evt.preventDefault();
        const userCredentials = {username: username, email: email, password: password};
        axios.post('http://127.0.0.1:8000/api/user/register/', userCredentials, {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                },
                withCredentials: true
        }).then(() => {
            loginUser(userCredentials);
        }).catch((error)=>{
             if (error.response) {
                setStatus(`Error: ${error.response.status} - ${error.response.data.message}`);
             } else {
                setStatus(`Error: ${error.message}`);
             }
             setIsError(true);
        });
    }


    return(
        <>

            <Container fluid>

                <div className="form-container" style={{
                    position: 'absolute', left: '50%', top: '50%',
                    transform: 'translate(-50%, -50%)',
                    boxShadow: '0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)',
                    padding: '20px'
                }}>

                    {isApproved ? <Navigate to="/welcome" replace={true}/> : null }

                    <Form onSubmit={submitCredentials}>

                        <p style={{
                            fontSize: '30px',
                            marginBottom: '40px'
                        }}> Please enter a username, email, and password to register </p>

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

                    <p> {status} </p>

                </div>

            </Container>


        </>
    )
}
