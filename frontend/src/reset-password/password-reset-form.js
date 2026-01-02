import {useState} from "react";
import {Navigate, useLocation, useNavigate} from "react-router-dom";
import apiClient from "../configurations/configAxios";
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";
import {Heading} from "@chakra-ui/react";
import Alert from "react-bootstrap/Alert";
import {PasswordInput} from "../components/ui/password-input";
import Button from "react-bootstrap/Button";

function PasswordResetForm() {

    const [error, setError] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const location = useLocation();
    const [confirmNewPassword, setConfirmNewPassword] = useState("");

    // Email must come from the forgot password page
    const email = location.state?.email;

    const navigate = useNavigate();

    async function submitNewPassword(evt) {

        evt.preventDefault();

        if (newPassword && confirmNewPassword) {

            if (newPassword !== confirmNewPassword) {
                setError("Passwords must match");
                return;
            }

        }

        const request = {

            email: email,
            new_password: newPassword

        };

        try {

            await apiClient.post("/api/password/reset/", request);

            navigate("/registration", { replace: true, state: {from: location.pathname} })

        } catch (err){

            const message = err.response?.data?.email || err.response?.data?.otp || "Could not set your new password";

            setError(message);

        }

    }

    // If the email is nonexistent, return to the previous page
    if (!email) {
        return <Navigate to="/password/forgot" replace />;
    }

    return (

        <>

            <Container fluid>

                <div className="form-container">

                    <Form onSubmit={submitNewPassword}>

                        <Heading fontSize="25px" fontWeight="normal" marginBottom="55px" textAlign="center"> Enter your new password </Heading>

                        {error ? <Alert variant="danger" title="Invalid Credentials" dismissible
                                        onClose={() => setError("")}> {error} </Alert> : null}

                        <fieldset style={{marginBottom: "15px"}}>
                            <legend className='input-text'>Password</legend>
                            <PasswordInput type="password" value={newPassword} placeholder="Enter a password" required
                                          onChange={(event) => setNewPassword(event.target.value)}/>
                        </fieldset>

                        <fieldset>
                            <legend className='input-text'>Confirm Password</legend>
                            <PasswordInput type="password" value={confirmNewPassword} placeholder="Reenter your new password"
                                          required onChange={(event) => setConfirmNewPassword(event.target.value)}/>
                        </fieldset>

                        <Button className='button' type="submit" variant="success" style={{marginTop: '10px', marginBottom: '10px'}}>Register</Button>{' '}

                    </Form>

                </div>

            </Container>

        </>

    );
}

export default PasswordResetForm;
