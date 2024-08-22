import {Navigation} from "./navigation-bar";
import Container from "react-bootstrap/Container";
import Button from "react-bootstrap/Button";


function WelcomePage(){

    return (
        <>

            <Container className="page">

                <p className="summary">

                    Thank you for creating an account with SFU Transit App! Click the button to create your schedule

                </p>

                <Button variant="primary"> Make My Schedule </Button>

            </Container>
        </>
        );

}

export default WelcomePage;