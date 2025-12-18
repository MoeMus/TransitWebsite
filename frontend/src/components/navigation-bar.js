import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import React, { useState, useEffect} from 'react';
import 'bootstrap/dist/css/bootstrap.css';
import {useNavigate} from "react-router-dom";
import apiClient from "../configurations/configAxios";
import {useDispatch} from "react-redux";
import updateAccessToken from "../storeConfig/updateAccessToken";
import {NavDropdown} from "react-bootstrap";
import toast, {Toaster} from "react-hot-toast";
//import Button from "react-bootstrap/Button";

import {Link, Button} from "@chakra-ui/react"
import {
    DialogActionTrigger,
    DialogBody,
    DialogCloseTrigger,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogRoot,
    DialogTitle,
    DialogTrigger,
} from "./ui/dialog"



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

    function confirmLogout(){
         toast(
             (t)=> (
                 <div style={{display: "flex", justifyContent: "center", flexDirection: "column"}}>
                     <div>
                         <p> You are about to sign out, are you sure? </p>
                     </div>

                     <div style={{display: "flex", justifyContent: "center", flexDirection: "row"}}>
                         <div>
                             <Button variant="solid" size="xs" onClick={logout}> Yes </Button>
                         </div>
                         <div>
                             <Button variant="subtle"  size="xs" onClick={() => toast.dismiss(t.id)}> No </Button>
                         </div>
                     </div>
                 </div>
             ), {
                 position: "top-center",
                 duration: 360000000
             })
    }

    function confirmDelete() {
        toast(
            (t) => (

                <div style={{display: "flex", justifyContent: "center", flexDirection: "column"}}>
                    <div>
                        <p style={{textAlign: "center"}}> You are about to delete your account, are you sure? This
                            action cannot be undone</p>
                     </div>
                     <div style={{display: "flex", justifyContent: "center", flexDirection: "row"}}>
                         <div>
                             <Button variant="solid" size="xs" onClick={deleteAccount}> Yes </Button>
                         </div>
                         <div>
                             <Button variant="subtle" size="xs" onClick={() => toast.dismiss(t.id)}> No </Button>
                         </div>
                     </div>

                 </div>
             ), {
                position: "top-center",
                duration: 360000000
            });

    }

    function logout() {

        const request = {access_token: sessionStorage.getItem('access_token'), refresh_token: sessionStorage.getItem('refresh_token')}

        apiClient.post("/api/logout/", request,{
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
        apiClient.post("/api/user/", request, {
            method: "DELETE",
            withCredentials: true
        }).then(()=>{
            sessionStorage.clear()
            dispatch(updateAccessToken());
            navigate('/');
            window.location.reload();
        }).catch(err=>{
            toast.error("There was an error deleting your account", {
                duration: 3000,
                position: "top-left"
            });
        });
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
                        <NavDropdown.Item> <Dialog dialog_func={deleteAccount} confirmation_msg={account_deletion_msg} action="Delete Account"/> </NavDropdown.Item>
                        <NavDropdown.Item> <Dialog dialog_func={logout} confirmation_msg={logout_msg} action="Sign Out"/> </NavDropdown.Item>

                        {/*<NavDropdown.Item className="delete-button" onClick={confirmDelete}> Delete account </NavDropdown.Item>*/}
                        {/*<NavDropdown.Item> <Nav.Link onClick={confirmLogout}> Logout </Nav.Link> </NavDropdown.Item>*/}

                    </NavDropdown>: null}
                </Nav>

            </Navbar>

        </>


    );
}

const Dialog = ({ dialog_func, confirmation_msg, action }) => {

        return (
    <DialogRoot role="alertdialog">
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          {action}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm {action}</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <p>
            {confirmation_msg}
          </p>
        </DialogBody>
        <DialogFooter>
          <DialogActionTrigger asChild>
            <Button variant="subtle">No</Button>
          </DialogActionTrigger>
          <Button variant="solid" onClick={dialog_func}>Yes</Button>
        </DialogFooter>
        <DialogCloseTrigger />
      </DialogContent>
    </DialogRoot>
  )

}