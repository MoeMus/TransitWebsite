import Button from 'react-bootstrap/Button';
import {Toaster} from "react-hot-toast";
import {Heading, Input} from "@chakra-ui/react";
import Alert from 'react-bootstrap/Alert';
import {useState} from "react";
import apiClient from "../configurations/configAxios";
function EmailForm() {

    const [error, setError] = useState("");
    const [email, setEmail] = useState("");
    const [requestSuccessful, setRequestSuccessful] = useState(false);

    async function submitEmail(evt) {

        evt.preventDefault();

        const request = {
            email: email
        }

        try {

            const response = await apiClient.post("/api/password-reset/request/", request);

            setError("");
            setRequestSuccessful(true);

        } catch (err) {
            console.log(err);

            const message = err.response?.data?.error || "Something went wrong. Please try again.";
            setError(message);

            setRequestSuccessful(false);

        }

    }

    return (

        <>

            <Toaster
                position="top-left"
                reverseOrder={false}
            />

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

                        <div className="d-grid gap-2 mt-3" style={{marginBottom: "10px"}}>

                            <Button type="submit" variant="secondary" className="btn"> Submit </Button>

                        </div>



                        {requestSuccessful ? <Alert status={"primary"} style={{padding: "10px"}} dismissible
                                  onClose={() => setRequestSuccessful(false)} >
                            <Alert.Heading> Verification Code Sent </Alert.Heading>
                            <p> If you didn't receive the email, click <Alert.Link onClick={submitEmail}>here</Alert.Link> to resend it </p>
                        </Alert> : null}

                    </div>

                </form>

            </div>


        </>
    )

}

export default EmailForm;