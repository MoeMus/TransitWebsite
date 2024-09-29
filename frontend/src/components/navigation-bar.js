import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import React, { useState, useEffect} from 'react';
import 'bootstrap/dist/css/bootstrap.css';
import {useNavigate} from "react-router-dom";
import apiClient from "../configurations/configAxios";
import {useDispatch} from "react-redux";
import updateAccessToken from "../storeConfig/updateAccessToken";
import {NavDropdown} from "react-bootstrap";
import toast from "react-hot-toast";

export function Navigation({username = ""}){
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

    function deleteAccount(){

        const request = {username: sessionStorage.getItem('user')}
        console.log(request.username);
        apiClient.post("http://127.0.0.1:8000/api/user/delete/", request, {
            method: "POST",
            withCredentials: true
        }).then(()=>{
            sessionStorage.clear()
            dispatch(updateAccessToken());
            navigate('/');
            window.location.reload();
        }).catch(err=>{

            toast.error("There was an error deleting your account", {
                duration: 3000
            });
        });
    }

    return(

        <>

            <Navbar bg="light" variant={"light"}>

                <Navbar.Brand style={{marginLeft: '10px'}}> SFU Transit app </Navbar.Brand>

                <Nav className="me-auto">
                    {isAuth ?  <Nav.Link href="/">Home</Nav.Link> : null }
                </Nav>

                <Nav>
                    {isAuth ? <NavDropdown title={username} menuVariant="light" align="end">

                        <NavDropdown.Item className="delete-button" onClick={deleteAccount}> Delete account </NavDropdown.Item>
                        <NavDropdown.Item> <Nav.Link onClick={logout}> Logout </Nav.Link> </NavDropdown.Item>

                    </NavDropdown>: null}
                </Nav>

            </Navbar>

        </>


    );
}