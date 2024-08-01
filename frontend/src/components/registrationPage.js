import Container from 'react-bootstrap/Container';
import {Login} from "./login-form";
import {Navigate, useNavigate} from 'react-router-dom';
import {useState} from "react";
import Button from "react-bootstrap/Button";
export function RegistrationPage (){

    const [register, setRegister] = useState(false)
  function handleClick() {
    setRegister(true);
  }


    return(
        <>
            <Container fluid style={{
                    display: 'flex',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    alignItems: 'center',

                }}>

                {/*Change name once we have decided on it*/}
                <h1> Welcome to SFU Transit App </h1>

                <div>
                    <Login />
                </div>

                <Button onClick={handleClick}> Sign Up </Button>

                {register ? <Navigate to='/signup' replace={true} /> : null}
            </Container>


        </>


    )
}