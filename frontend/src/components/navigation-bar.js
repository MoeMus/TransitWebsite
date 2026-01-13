import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import 'bootstrap/dist/css/bootstrap.css';
import {useNavigate, useLocation} from "react-router-dom";
import {useDispatch, useSelector} from "react-redux";
import {NavDropdown} from "react-bootstrap";
import toast from "react-hot-toast";
import {deleteAccount, logout} from "./utils";
import Dialog from "./dialog";
import {Button} from "@chakra-ui/react";
import {remove_token} from "../storeConfig/auth_reducer";
import {disable_manual_location} from "../storeConfig/manual_location_reducer";

export function Navigation(){

    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();

    const { is_authenticated, refresh_token, username } = useSelector((state)=>state.authentication);

    // If the user is not logged in, hide navbar on the registration page
    if (location.pathname === "/registration" && !is_authenticated) {
        return null;
    }

    const logout_msg = "You are about to sign out, are you sure?";
    const account_deletion_msg = "You are about to delete your account, are you sure? This action cannot be undone";

    const handleLogout = async (event) => {

        event.preventDefault();
        const request = { refresh_token: refresh_token };

        try {

            await logout(request);
            dispatch(remove_token());
            dispatch(disable_manual_location());

            navigate('/', {replace: true});

        } catch (err) {

            toast.error(err, {
                duration: 5000,
                position: "top-center"
            });

        }

    }

    const handleDeleteAccount = async (event) => {

        event.preventDefault();

        try {

            await deleteAccount();
            dispatch(remove_token());
            dispatch(disable_manual_location());
            navigate('/', {replace: true});

        } catch (err) {

            toast.error(err.message, {
                duration: 5000,
                position: "top-center"
            });

        }

    }

    return(

        <>
            <Navbar variant="light" bg="light" style={{marginTop: "0px", marginBottom: "0px"}}>

                <Navbar.Brand style={{marginLeft: '10px'}}> <img src="/websiteLogoSmall.jpg" alt=""/> </Navbar.Brand>
                <Navbar.Brand style={{marginLeft: '10px'}}> TransitTail </Navbar.Brand>

                <Nav className="me-auto">

                    {is_authenticated ?

                        <>
                            <Nav.Link href="/">Home</Nav.Link>
                            <Nav.Link href="/schedule-builder" className="ms-3"> Build My Schedule </Nav.Link>
                        </>

                        : null }

                </Nav>

                <Nav>
                    {is_authenticated ? <NavDropdown title={username} menuVariant="light" align="end" style={{marginRight: "20px"}}>
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

                    </NavDropdown>: null}
                </Nav>

            </Navbar>

        </>

    );
}
