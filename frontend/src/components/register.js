
import {useState} from "react";
import {axios} from "axios";
import {Navigate} from "react-router-dom";
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';

export function Register(){
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('');
    const [isError, setIsError] = useState(false);

    function submitCredentials(evt){
        evt.preventDefault();
        const userCredentials = {usename: username, email: email, password: password};
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

                <p> Please enter a username, email, and password to register </p>

                <div className="form-container" style={{
                    position: 'absolute', left: '50%', top: '50%',
                    transform: 'translate(-50%, -50%)',
                    boxShadow: '0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)',
                    padding: '20px'
                }}>

                    ${isError ? null : <Navigate to="/register/success" replace={true}/>}

                    <form onSubmit={submitCredentials}>

                        <fieldset>
                            <legend>Username</legend>
                            <input type="submit" value={username} onInput={(event) => setEmail(event.target.value)}/>
                        </fieldset>

                        <fieldset>
                            <legend>Email</legend>
                            <input type="submit" value={email} onInput={(event) => setEmail(event.target.value)}/>
                        </fieldset>


                        <fieldset>
                            <legend>Password</legend>
                            <input type="submit" value={password} onInput={(event) => setPassword(event.target.value)}/>
                        </fieldset>

                        ${password !== '' ? (<fieldset>
                        <legend>Confirm Password</legend>
                        <input type="submit" value={confirmPassword}
                               onInput={(event) => setConfirmPassword(event.target.value)}/>
                    </fieldset>) : null};

                        <Button variant="success">Register</Button>{' '}

                    </form>

                    <p> ${status} </p>

                </div>

            </Container>


        </>
    )
}
