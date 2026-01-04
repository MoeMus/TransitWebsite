import '../styles/loginStyles.css';
import {useEffect, useState} from "react";
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import apiClient from "../configurations/configAxios";
import {useDispatch} from "react-redux";
import WelcomePage from "../components/welcomePage";
import {Heading} from "@chakra-ui/react";
import {PasswordInput} from "../components/ui/password-input";
import Alert from "react-bootstrap/Alert";
import {set_token} from "../storeConfig/reducer";

export function Register(){
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [email, setEmail] = useState('');
    const [allCredentials, setAllCredentials] = useState(false);
    const [successfulRegister, setSuccessfulRegister] = useState(false);
    const dispatch = useDispatch();
    const [passwordMatch, setPasswordMatch] = useState(true);
    const [passwordMatchMsg, setPasswordMatchMsg] = useState("");
    const [isServerError, setIsServerError] = useState(false);
    const [serverErrMsg, setServerErrMsg] = useState("");
    
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

            setSuccessfulRegister(true);
            dispatch(set_token(new_state));
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${data.access}`;

        } catch (err){
            throw err;
        }
    }

    async function submitCredentials(evt){

        evt.preventDefault();

        try {

            const userCredentials = {username: username, email: email, password: password};

            await apiClient.post('/api/user/', userCredentials);
            await loginUser(userCredentials);

        } catch (err){

            const errorMessage = err.response.data?.error || "There was an error registering your account";

            setServerErrMsg(errorMessage);
            setIsServerError(true);

        }

    }

    const registrationForm = () =>{
        return (<>
            <Container fluid>

                <div className="form-container">

                    <Form onSubmit={submitCredentials}>

                        <Heading fontSize="25px" fontWeight="normal" marginBottom="55px"> Please enter a username, email, and password to register </Heading>

                        {isServerError ? <Alert variant="danger" title="Invalid Credentials"
                                                dismissible onClose={()=>setIsServerError(false) }> {serverErrMsg} </Alert> : null}
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

            {successfulRegister? <WelcomePage /> : registrationForm()}

        </>
    )
}
