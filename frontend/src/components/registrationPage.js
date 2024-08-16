import Container from 'react-bootstrap/Container';
import {Login} from "./login-form";
import {Navigate, useNavigate} from 'react-router-dom';
import {useState} from "react";
import Button from "react-bootstrap/Button";
import '../styles/loginStyles.css';
export function RegistrationPage (){


    let navigate = useNavigate();
    function handleClick() {
        navigate("/signup");
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
                <h1 className='welcome-title'> Welcome to SFU Transit App </h1>
                <p className='summary'> Always know when to get to your next course </p>

                <div>
                    <Login />
                </div>

                <Button onClick={handleClick}> Sign Up </Button>

            </Container>


        </>

    )
}