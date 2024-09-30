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
            <Container className="page">

                {/*Change name once we have decided on it*/}
                <h1 className='welcome-title'> Welcome to TransitTail! </h1>
                <div className='summary'>

                    <p> A transit website for SFU students </p>
                    <p>
                        TransitTail integrates your course schedule with transit and driving information
                        that allows for instant access to the best travel
                        routes to get to your next course, as well as allowing you to
                        easily customize how and when you want to get there
                    </p>
                    <p>
                        To start, make an account and it will prompt you to enter the courses you are
                        taking this semester, then you will be able to choose how you want to get there on
                        the dashboard
                    </p>

                    <p style={{color: "olive"}}>
                        It is recommended to activate location tracking in order to determine the best routes to get to
                        your classes
                    </p>

                    <p><a href="https://github.com/MoeMus/TransitWebsite" target="_blank" rel="noopener noreferrer"> View this project on GitHub </a></p>

                </div>

                <div>
                    <Login/>
                </div>
                <p> Don't have an account? Sign up for free </p>
                <Button onClick={handleClick} variant="secondary"> Sign Up </Button>

            </Container>


        </>

    )
}