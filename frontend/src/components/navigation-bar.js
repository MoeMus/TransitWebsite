import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import React, {useEffect, useState} from 'react';
import 'bootstrap/dist/css/bootstrap.css';
import {useNavigate} from "react-router-dom";
import apiClient from "../configurations/configAxios";
import {useDispatch} from "react-redux";
import updateAccessToken from "../storeConfig/updateAccessToken";
import {NavDropdown} from "react-bootstrap";
import toast from "react-hot-toast";
//import Button from "react-bootstrap/Button";
import {deleteAccount} from "./utils";
import Dialog from "./dialog";
import {Button} from "@chakra-ui/react";


export function Navigation({username = ""}){
    const navigate = useNavigate();
    const [isAuth, setIsAuth] = useState(false);
    const dispatch = useDispatch();

    const logout_msg = "You are about to sign out, are you sure?";
    const account_deletion_msg = "You are about to delete your account, are you sure? This action cannot be undone";

    useEffect(() => {
        let token = sessionStorage.getItem('access_token');
        if(token !== null){
            setIsAuth(true);
        } else {
            setIsAuth(false);
        }
    }, []);

    const handleLogout = async (event) => {

        event.preventDefault();
        const request = {refresh_token: sessionStorage.getItem("refresh_token")};

        apiClient.post("/api/logout/", request, {
            method: "POST",
            withCredentials: true
        }).then(()=>{
            sessionStorage.clear()
            dispatch(updateAccessToken());
            navigate('/');
            window.location.reload();
        }).catch(err=>{
            toast.error("There as an error logging out", {
                duration: 3000,
                position: "top-left"
            });
        });

    }

    const handleDeleteAccount = async (event) => {

        event.preventDefault();

        try {
            await deleteAccount();
            sessionStorage.clear()
            dispatch(updateAccessToken());
            navigate('/');
            window.location.reload();
        } catch (err) {
            toast.error(err.message, {
                duration: 3000,
                position: "top-left"
            });
        }

    }

    return(

        <>
            <Navbar variant="light" bg="light" style={{marginTop: "0px", marginBottom: "0px"}}>

                <Navbar.Brand style={{marginLeft: '10px'}}> <img src="/websiteLogoSmall.jpg" alt=""/> </Navbar.Brand>
                <Navbar.Brand style={{marginLeft: '10px'}}> TransitTail </Navbar.Brand>
                <Nav className="me-auto">
                    {isAuth ?  <Nav.Link href="/">Home</Nav.Link> : null }
                    {isAuth ?  <Nav.Link href="/schedule-builder" className="ms-3">Schedule Builder</Nav.Link> : null }
                </Nav>



                <Nav>
                    {isAuth ? <NavDropdown title={username} menuVariant="light" align="end" style={{marginRight: "20px"}}>
                        <NavDropdown.Item> <Dialog dialog_func={handleDeleteAccount} confirmation_msg={account_deletion_msg} button_component={
                            <Button variant="outline" size="sm">
                                Delete Account
                            </Button>
                        } action="Delete Account"/> </NavDropdown.Item>
                        <NavDropdown.Item> <Dialog dialog_func={handleLogout} confirmation_msg={logout_msg} button_component={
                            <Button variant="outline" size="sm">
                                Sign out
                            </Button>
                        } action={"Sign out"}/> </NavDropdown.Item>

                        {/*<NavDropdown.Item className="delete-button" onClick={confirmDelete}> Delete account </NavDropdown.Item>*/}
                        {/*<NavDropdown.Item> <Nav.Link onClick={confirmLogout}> Logout </Nav.Link> </NavDropdown.Item>*/}

                    </NavDropdown>: null}
                </Nav>

            </Navbar>

        </>


    );
}

