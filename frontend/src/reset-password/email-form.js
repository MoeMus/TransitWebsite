import Button from 'react-bootstrap/Button';
import toast, {Toaster} from "react-hot-toast";
import {Flex, Heading, Input} from "@chakra-ui/react";
import Alert from 'react-bootstrap/Alert';
import {useEffect, useState} from "react";
import apiClient from "../configurations/configAxios";
import VerificationCodeForm from "./verification-code-form";
import SecretField from "../components/secret-field";
import TurnstileWidget from "../components/TurnstileWidget";
import {useNavigate} from "react-router-dom";

function EmailForm() {

    const [error, setError] = useState("");
    const [email, setEmail] = useState("");
    const [requestSuccessful, setRequestSuccessful] = useState(false);
    const [alertOpen, setAlertOpen] = useState(false);
    const [timeoutEnabled, setTimeoutEnabled] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);
    const [secretField, setSecretField] = useState("");
    const [turnstileToken, setTurnstileToken] = useState("");
    const navigate = useNavigate();

    useEffect(() => {

        const storedTime = localStorage.getItem('emailNextSendTime');
        if (storedTime) {
            const remaining = Math.ceil((parseInt(storedTime) - Date.now()) / 1000);
            if (remaining > 0) {
                setTimeLeft(remaining);
                setTimeoutEnabled(true);
            }
        }
    }, []);

    useEffect(() => {

        if (!timeoutEnabled) return;

        const interval = setInterval(()=>setTimeLeft(prev_second => {
            if (prev_second <= 1) {
                clearInterval(interval);
                setTimeoutEnabled(false);
                localStorage.removeItem('emailNextSendTime');
                return 0;
            }
            return prev_second - 1;
        }), 1000);
        return ()=> clearInterval(interval)

    }, [timeoutEnabled]);



    async function submitEmail(evt) {

        evt.preventDefault();

        if (secretField) return;

        if (process.env.REACT_APP_TURNSTILE_SITE_KEY && !turnstileToken) {
            toast.error("Please verify you are human");
            return;
        }

        const request = {
            email: email,
            turnstile_token: turnstileToken
        }

        try {

            await apiClient.post("/api/password/reset/request/", request);

            setError("");
            setRequestSuccessful(true);
            setAlertOpen(true);
            setTimeLeft(30);
            setTimeoutEnabled(true);
            localStorage.setItem('emailNextSendTime', (Date.now() + 30000).toString());

        } catch (err) {
            const message = err.response?.data?.error?.email || "Something went wrong. Please try again.";
            setError(message);
            setRequestSuccessful(false);
            setAlertOpen(false);

        }


    }

    async function submitVerificationCode(verificationCode) {

        const request = {

            email: email,
            otp: verificationCode

        };

        await apiClient.post("/api/password/otp/validate/", request);

        navigate("/password/reset", {replace: true, state: {email: email}});

    }


    return (

        <>

            <Toaster position="top-center" reverseOrder={false} />

            <Flex direction="column">

                <div className="Auth-form-container">

                    <form onSubmit={submitEmail}>

                        <div className="Auth-form-content">

                            { timeoutEnabled ? <Alert variant={"secondary"}> {`You can resend your verification code in ${timeLeft} seconds`} </Alert> : null}

                            <Heading textAlign="center" fontSize="20px" fontWeight="normal" my="10px">
                                Enter the email belonging to your account to receive a verification code
                            </Heading>

                            <div className="form-group mt-3">
                                {error ? <Alert variant="danger" title="Invalid Credentials" dismissible
                                                onClose={() => setError("")}> {error} </Alert> : null}
                                <label>Email Address</label>

                                <Input variant="subtle"
                                       placeholder="Enter Email Address"
                                       name='email'
                                       type='email' value={email}
                                       required
                                       onChange={e => setEmail(e.target.value)}/>

                            </div>

                            <SecretField value={secretField} setter={setSecretField} />

                            <TurnstileWidget setToken={setTurnstileToken} />

                            <div className="d-grid gap-2 mt-3" style={{marginBottom: "40px"}}>

                                <Button type="submit" variant="secondary" className="btn" disabled={timeoutEnabled}> Submit </Button>

                            </div>


                            {alertOpen ? <Alert variant={"primary"} style={{padding: "10px"}} dismissible
                                                onClose={() => setAlertOpen(false)}>
                                <Alert.Heading> Verification Code Sent </Alert.Heading>
                                <p> If you didn't receive the email, click submit again to resend it </p>
                            </Alert> : null}

                        </div>

                    </form>

                </div>

                {requestSuccessful ? <VerificationCodeForm onSubmitVerificationCode={submitVerificationCode}/> : null}

            </Flex>




        </>
    )

}

export default EmailForm;