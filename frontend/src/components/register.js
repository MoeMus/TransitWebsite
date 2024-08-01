
import {useState} from "react";
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

    function submitCredentials(evt){
        evt.preventDefault();
        const userCredentials = {username: username, email: email, password: password};
        axios.post('/api/user/register', userCredentials, {
                headers: {
                    "Content-Type": "application/json",
                },
                withCredentials: true
        }).then(() => {

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

                    {isError ? null : <Navigate to="/login" replace={true}/>}

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
                            <Form.Control type="submit" value={confirmPassword}
                                          onInput={(event) => setConfirmPassword(event.target.value)}/>
                        </fieldset>) : null}

                        <Button variant="success" style={{marginTop: '10px', marginBottom: '10px'}}>Register</Button>{' '}

                    </Form>

                    <p> {status} </p>

                </div>

            </Container>


        </>
    )
}
