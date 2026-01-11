import {Heading, Input} from "@chakra-ui/react";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import {useState} from "react";
import apiClient from "../configurations/configAxios";
import {useNavigate} from "react-router-dom";
import {PasswordInput} from "../components/ui/password-input";

function VerificationCodeForm({onSubmitVerificationCode}){

    const [error, setError] = useState("");
    const [verificationCode, setVerificationCode] = useState("");

    async function submitCode(evt) {

        evt.preventDefault();

        try {

            await onSubmitVerificationCode(verificationCode);

        } catch (err){
            console.log(err)
            const message = err.response?.data?.error || err.response?.data?.error?.email || err.response?.data?.otp || "Could not verify your verification code";

            setError(message);

        }
    }

    return (

        <>

            <div className="Auth-form-container">

                <form onSubmit={submitCode}>

                    <div className="Auth-form-content">

                        <Heading textAlign="center" fontSize="20px" fontWeight="normal" my="10px">
                            Enter your verification code
                        </Heading>

                        <div className="form-group mt-3">
                        {error ? <Alert variant="danger" title="Invalid Credentials" dismissible
                                        onClose={() => setError("")}> {error} </Alert> : null}
                            <label>Verification Code</label>

                            <PasswordInput type="password" value={verificationCode} placeholder="Enter your verification code" required
                                           onChange={(event) => setVerificationCode(event.target.value)}/>

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