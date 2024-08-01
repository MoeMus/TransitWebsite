
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
        } else if (password === ''){
            setStatus("Password must be entered");
            setIsError(true);
        } else {
            setIsError(false);
            setStatus('');
        }
        disableButton();

    }, )

    function disableButton(){
        if(isError){
            document.querySelector('.button').setAttribute('disabled', '');
        } else {
            document.querySelector('.button').removeAttribute('disabled');
        }
    }
    function submitCredentials(evt){
        evt.preventDefault();
        const userCredentials = {username: username, email: email, password: password};
        axios.post('http://127.0.0.1:8000/api/user/register/', userCredentials, {
                method: 'post',
                headers: {
                    "Content-Type": "application/json",
                },
                withCredentials: true
        }).then(() => {
            setIsApproved(true)
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

                    {isApproved ? <Navigate to="/login" replace={true}/> : null }

                    <Form onSubmit={submitCredentials}>

                        <p> Please enter a username, email, and password to register </p>

                        <fieldset>
                            <legend>Username</legend>
                            <Form.Control type="text" value={username}
                                          onInput={(event) => setUsername(event.target.value)}/>
                        </fieldset>

                        <fieldset>
                            <legend>Email</legend>
                            <Form.Control type="email" value={email}
                                          onInput={(event) => setEmail(event.target.value)}/>
                        </fieldset>


                        <fieldset>
                            <legend>Password</legend>
                            <Form.Control type="password" value={password}
                                          onInput={(event) => setPassword(event.target.value)}/>
                        </fieldset>

                        {password !== '' ? (<fieldset>
                            <legend>Confirm Password</legend>
                            <Form.Control type="password" value={confirmPassword}
                                          onInput={(event) => setConfirmPassword(event.target.value)}/>
                        </fieldset>) : null}

                        <Button className='button' variant="success" style={{marginTop: '10px', marginBottom: '10px'}}>Register</Button>{' '}

                    </Form>

                    <p> {status} </p>

                </div>

            </Container>


        </>
    )
}
