import {Heading, Input} from "@chakra-ui/react";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import {useState} from "react";
import apiClient from "../configurations/configAxios";
import {useNavigate} from "react-router-dom";

function VerificationCodeForm({email}){

    const [error, setError] = useState("");
    const [verificationCode, setVerificationCode] = useState("");

    const navigate = useNavigate();

    async function submitVerificationCode(evt) {

        evt.preventDefault();

        const request = {

            email: email,
            otp: verificationCode

        };

        try {

            await apiClient.post("/api/password/otp/validate/", request);

            navigate("/password/reset", {replace: true, state: {email: email}});

        } catch (err){
            const message = err.response?.data?.otp || "Could not verify your verification code";

            setError(message);

        }

    }

    return (

        <>

            <div className="Auth-form-container">

                <form onSubmit={submitVerificationCode}>

                    <div className="Auth-form-content">

                        <Heading textAlign="center" fontSize="20px" fontWeight="normal" my="10px">
                            Enter your verification code
                        </Heading>

                        <div className="form-group mt-3">
                        {error ? <Alert variant="danger" title="Invalid Credentials" dismissible
                                        onClose={() => setError("")}> {error} </Alert> : null}
                            <label>Verification Code</label>

                            <Input variant="subtle"
                                   placeholder="Enter Verification Code"
                                   name='email'
                                   type='password' value={verificationCode}
                                   required
                                   onChange={e => setVerificationCode(e.target.value)}/>

                        </div>

                        <div className="d-grid gap-2 mt-3" style={{marginBottom: "40px"}}>

                            <Button type="submit" variant="secondary" className="btn"> Submit </Button>

                        </div>

                    </div>

                </form>

            </div>

        </>
    )
}

export default VerificationCodeForm;