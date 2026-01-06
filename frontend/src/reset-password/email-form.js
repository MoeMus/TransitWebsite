import Button from 'react-bootstrap/Button';
import {Toaster} from "react-hot-toast";
import {Flex, Heading, Input} from "@chakra-ui/react";
import Alert from 'react-bootstrap/Alert';
import {useState} from "react";
import apiClient from "../configurations/configAxios";
import VerificationCodeForm from "./verification-code-form";
import SecretField from "../components/secret-field";

function EmailForm() {

    const [error, setError] = useState("");
    const [email, setEmail] = useState("");
    const [requestSuccessful, setRequestSuccessful] = useState(false);
    const [alertOpen, setAlertOpen] = useState(false);
    const [secretField, setSecretField] = useState("");

    async function submitEmail(evt) {

        evt.preventDefault();

        if (secretField) return;

        const request = {
            email: email
        }

        try {

            await apiClient.post("/api/password/reset/request/", request);

            setError("");
            setRequestSuccessful(true);
            setAlertOpen(true);

        } catch (err) {

            const message = err.response?.data?.error || "Something went wrong. Please try again.";
            setError(message);
            setRequestSuccessful(false);
            setAlertOpen(false);

        }

    }

    return (

        <>

            <Flex direction="column">

                <div className="Auth-form-container">

                    <form onSubmit={submitEmail}>

                        <div className="Auth-form-content">

                            <Heading textAlign="center" fontSize="20px" fontWeight="normal" my="10px">
                                Enter the email belonging to your account to receive a verification code
                            </Heading>

                            <div className="form-group mt-3">
                                {error ? <Alert variant="danger" title="Invalid Credentials" dismissible
                                                onClose={() => setError("")}> {error} </Alert> : null}
                                <label>Username</label>

                                <Input variant="subtle"
                                       placeholder="Enter Email"
                                       name='email'
                                       type='email' value={email}
                                       required
                                       onChange={e => setEmail(e.target.value)}/>

                            </div>

                            <SecretField value={secretField} setter={setSecretField} />

                            <div className="d-grid gap-2 mt-3" style={{marginBottom: "40px"}}>

                                <Button type="submit" variant="secondary" className="btn"> Submit </Button>

                            </div>


                            {alertOpen ? <Alert status={"primary"} style={{padding: "10px"}} dismissible
                                                onClose={() => setAlertOpen(false)}>
                                <Alert.Heading> Verification Code Sent </Alert.Heading>
                                <p> If you didn't receive the email, click <Alert.Link
                                    onClick={submitEmail}>here</Alert.Link> to resend it </p>
                            </Alert> : null}

                        </div>

                    </form>

                </div>

                {requestSuccessful ? <VerificationCodeForm email={email}/> : null}

            </Flex>




        </>
    )

}

export default EmailForm;