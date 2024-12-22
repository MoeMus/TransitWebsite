//import Container from 'react-bootstrap/Container';
import {Login} from "./login-form";
import {Navigate, useNavigate} from 'react-router-dom';
import React, {useState} from "react";
//import Button from "react-bootstrap/Button";
import '../styles/loginStyles.css';
import {Card , Container, Heading, Text, Flex, Link } from "@chakra-ui/react"
import { Button } from "../components/ui/button"
import { LuExternalLink } from "react-icons/lu"

export function RegistrationPage (){


    let navigate = useNavigate();
    function handleClick() {
        navigate("/signup");
    }

    const DescriptionCard = ()=>{


    }

    return(
        <>
            <Flex direction="column">

                <Container>

                    {/*Change name once we have decided on it*/}
                    <Heading textAlign="center" fontSize="60px" fontWeight="normal" my="30px"> Welcome to TransitTail! </Heading>

                </Container>


                {/*<img src="/websiteLogo.jpg" alt="" style={{marginBottom: "20px"}}/>*/}
                <Flex justifyContent="center">
                    <Card.Root width="320px" marginRight="50px" marginY="50px">
                        <Card.Body gap="2">
                            <Card.Title mt="2" fontSize="30px"> A Transit Website Designed for SFU Students </Card.Title>
                            <Card.Description>
                                TransitTail integrates your course schedule with transit and driving information
                                that allows for instant access to the best travel
                                routes to get to your next course, as well as allowing you to
                                easily customize how and when you want to get there
                            </Card.Description>

                        </Card.Body>

                    </Card.Root>

                    <Card.Root width="320px" marginY="50px">
                        <Card.Body gap="2">
                            <Card.Title mt="2" fontSize="30px"> Easy to Set Up </Card.Title>
                            <Card.Description>
                                To start, make an account and it will prompt you to enter the courses you are
                                taking this semester, then you will be able to choose how you want to get there on
                                the dashboard
                            </Card.Description>
                        </Card.Body>
                    </Card.Root>

                </Flex>




                <Flex justifyContent="center">
                    <Login/>
                </Flex>

                <Flex justifyContent="center" direction="column">
                    <Text textAlign="center"> Don't have an account? <Link onClick={handleClick}> Sign Up </Link> for free </Text>
                    <Flex justifyContent="center">
                    </Flex>
                    <Flex justifyContent="center" >
                        <Text >
                            <Link href="https://github.com/MoeMus/TransitWebsite" target="_blank"
                               rel="noopener noreferrer"> View this project on GitHub  <LuExternalLink />
                            </Link>
                        </Text>
                    </Flex>

                </Flex>

                <Container width="5/6" fontSize="20px" textAlign="center">
                    {/*<Text>*/}
                    {/*    TransitTail integrates your course schedule with transit and driving information*/}
                    {/*    that allows for instant access to the best travel*/}
                    {/*    routes to get to your next course, as well as allowing you to*/}
                    {/*    easily customize how and when you want to get there*/}
                    {/*</Text>*/}
                    {/*<Text>*/}
                    {/*    To start, make an account and it will prompt you to enter the courses you are*/}
                    {/*    taking this semester, then you will be able to choose how you want to get there on*/}
                    {/*    the dashboard*/}
                    {/*</Text>*/}
                    <Text style={{color: "red"}}>
                        It is recommended to activate location tracking in order to determine the best routes to get to
                        your classes
                    </Text>


                </Container>

            </Flex>


        </>

    )
}