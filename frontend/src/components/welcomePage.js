import {Navigation} from "./navigation-bar";
import Container from "react-bootstrap/Container";
import Button from "react-bootstrap/Button";


function WelcomePage(){

    return (
        <>

            <body style={{
                width: '100%',
                height: '100%'
            }}>
                <div style={{
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "center",
                    alignItems: "center",
                    width: '100%',
                    height: '100%'
                }}>

                    <Container className="page">


                        <div>
                            <p className="summary">

                                Thank you for creating an account with SFU Transit App! Click the button to create your
                                schedule

                            </p>
                        </div>

                        <div>

                            <Button variant="danger"> Make My Schedule </Button>

                        </div>

                    </Container>

                </div>
            </body>


        </>
    )
        ;

}

export default WelcomePage;