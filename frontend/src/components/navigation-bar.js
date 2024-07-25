import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import React, { useState, useEffect} from 'react';
import 'bootstrap/dist/css/bootstrap.css';


export function Navigation(isAuthenticated){

    return(

        <>

            <Navbar bg="dark" variant={"dark"}>

                <Navbar.Brand> SFU Transit app </Navbar.Brand>

                <Nav className="me-auto">
                    {isAuthenticated ? <Nav.Link href="/">Home</Nav.Link> : null}
                </Nav>

                <Nav>
                    {isAuthenticated ? <Nav.Link href="/logout">Logout</Nav.Link>: null}
                </Nav>

                <Nav>
                    {isAuthenticated ? <Nav.Link href="/account"> Account </Nav.Link>: null}
                </Nav>

            </Navbar>

        </>


    );
}