import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import React, { useState, useEffect} from 'react';
import 'bootstrap/dist/css/bootstrap.css';
import {useNavigate} from "react-router-dom";
import apiClient from "../configAxios";

export function Navigation(isAuthenticated){
    let navigate = useNavigate();
    function logout(){

        const request = {access_token: sessionStorage.getItem('access_token'), refresh_token: sessionStorage.getItem('refresh_token')}

        apiClient.post("http://127.0.0.1:8000/api/logout/", request,{
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            withCredentials: true
        }).then(()=>{
            sessionStorage.removeItem('access_token');
            sessionStorage.removeItem('refresh_token');
            navigate('/');
            window.location.reload();
        })

    }

    return(

        <>

            <Navbar bg="dark" variant={"dark"}>

                <Navbar.Brand> SFU Transit app </Navbar.Brand>

                <Nav className="me-auto">
                    {isAuthenticated ? <Nav.Link href="/">Home</Nav.Link> : null}
                </Nav>

                <Nav>
                    {isAuthenticated ? <Nav.Link onClick={logout}> Logout</Nav.Link> : null}
                </Nav>

                <Nav>
                    {isAuthenticated ? <Nav.Link href="/account"> Account </Nav.Link> : null}
                </Nav>

            </Navbar>

        </>


    );
}