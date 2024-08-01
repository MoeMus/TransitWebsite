import Container from 'react-bootstrap/Container';
import {Login} from "./login-form";
import {Navigate, useNavigate} from 'react-router-dom';
import {useState} from "react";
import Button from "react-bootstrap/Button";
export function RegistrationPage (){

    const navigate = useNavigate();

  function handleClick() {
    navigate("/signup");
  }


    return(
        <>
            <Container fluid style={{
                width: '500px'
            }}>

                {/*Change name once we have decided on it*/}
                <h1> Welcome to SFU Transit App </h1>

                <Login />

                <Button onClick={handleClick}> Sign Up </Button>



            </Container>


        </>


    )
}