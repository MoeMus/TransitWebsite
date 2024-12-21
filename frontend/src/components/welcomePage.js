import {Navigation} from "./navigation-bar";
import Container from "react-bootstrap/Container";
import Button from "react-bootstrap/Button";
import {useNavigate} from "react-router-dom";

function WelcomePage(){

    let navigate = useNavigate();
    function handleClick(){

        navigate("/schedule-builder");
    }
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

                                Thank you for creating an account with TransitTail! Click the button to create your
                                schedule

                            </p>
                        </div>

                        <div>

                            <Button variant="danger" onClick={handleClick}> Make My Schedule </Button>

                        </div>

                    </Container>

                </div>
            </body>


        </>
    )
        ;

}

export default WelcomePage;