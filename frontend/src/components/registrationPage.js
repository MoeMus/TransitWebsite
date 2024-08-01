import Container from 'react-bootstrap/Container';
import {Login} from "./login-form";
import {Navigate} from 'react-router-dom';
export function RegistrationPage (){


    return(
        <>
            <Container fluid>

                {/*Change name once we have decided on it*/}
                <h1> Welcome to SFU Transit App </h1>

                <Login />


            </Container>


        </>


    )
}