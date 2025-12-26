import {Navigation} from "./navigation-bar";
import Container from "react-bootstrap/Container";
import Button from "react-bootstrap/Button";
import {useNavigate} from "react-router-dom";
import {useEffect} from "react";
import {useSelector} from "react-redux";

function WelcomePage(){

    return (
        <>

            <body style={{
                width: '100%',
                height: '100%'
            }}>
                <div style={{
                    position: "absolute",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    width: '100%',
                    height: '70%'
                }}>

                    <Container className="page">


                        <div>
                            <p className="welcome-message">

                                Thank you for creating an account with TransitTail! Click the button to proceed to your
                                dashboard and add courses for the semester

                            </p>
                        </div>

                        <div>

                            <Button variant="danger"> Go to my dashboard </Button>

                        </div>

                    </Container>

                </div>
            </body>


        </>
    )
        ;

}

export default WelcomePage;