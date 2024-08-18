import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import React, { useState, useEffect} from 'react';
import 'bootstrap/dist/css/bootstrap.css';
import {useNavigate} from "react-router-dom";
import apiClient from "../configurations/configAxios";
import {useDispatch} from "react-redux";
import updateAccessToken from "../storeConfig/updateAccessToken";

export function Navigation(){
    const navigate = useNavigate();
    const [isAuth, setIsAuth] = useState(false);
    const dispatch = useDispatch();
    useEffect(() => {
        let token = sessionStorage.getItem('access_token');
        if(token !== null){
            setIsAuth(true);
        } else {
            setIsAuth(false);
        }
    }, []);

    function logout(){

        const request = {access_token: sessionStorage.getItem('access_token'), refresh_token: sessionStorage.getItem('refresh_token')}

        apiClient.post("http://127.0.0.1:8000/api/logout/", request,{
            method: "POST",
            withCredentials: true
        }).then(()=>{
            sessionStorage.clear();
            dispatch(updateAccessToken());
            navigate('/');
            window.location.reload();
        })

    }

    return(

        <>

            <Navbar bg="light" variant={"light"}>

                <Navbar.Brand style={{marginLeft: '10px'}}> SFU Transit app </Navbar.Brand>

                <Nav className="me-auto">
                    {isAuth ?  <Nav.Link href="/">Home</Nav.Link> : null }
                </Nav>

                <Nav>
                    {isAuth ? <Nav.Link onClick={logout}> Logout</Nav.Link> : null}
                </Nav>

                <Nav>
                    {isAuth ? <Nav.Link href="/account"> Account </Nav.Link> : null}
                </Nav>

            </Navbar>

        </>


    );
}