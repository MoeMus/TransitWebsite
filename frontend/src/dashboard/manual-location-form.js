import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button"
import React from "react";
import {
    DrawerBackdrop, DrawerBody, DrawerCloseTrigger,
    DrawerContent,
    DrawerRoot,
} from "../components/ui/drawer";

function ManualLocationForm({manualLocationChange, isOpen, onClose}) {

    return (<>

        <DrawerRoot
            placement="top"
            size="md"
            open={isOpen}
            onOpenChange={(details) => {if (!details.open) onClose();}}>
            <DrawerBackdrop/>
            <DrawerContent bg="transparent" boxShadow="none">

                <DrawerBody>
                    <div style={{display: "flex", flexDirection: "row", justifyContent: "center"}}>

                        <Form className="locationBox"
                              style={{
                                  textAlign: 'center',
                                  marginBottom: "100px",
                                  width: "100%",
                                  maxWidth: "800px"
                        }}>

                            <Form.Group className="mb-3">

                                <Form.Label> Enter your location manually (Use if location tracking is not
                                    accurate)</Form.Label>
                                <Form.Control className="location"></Form.Control>
                                <Form.Group style={{marginBottom: "4px"}}>
                                    <Form.Text className="text-muted">
                                        Provide any of the following: <strong>"&lt;street number&gt; &lt;street
                                        name&gt; &lt;city&gt; &lt;state&gt; &lt;postal
                                        code&gt;"</strong>
                                    </Form.Text>
                                </Form.Group>
                                <Form.Group>
                                    <Form.Text>
                                        Example: <strong> 1600 Amphitheatre Parkway, Mountain View, CA 94043.
                                        Addresses can also be
                                        place names, ex: "Statue of Liberty, New York, NY"</strong>
                                    </Form.Text>

                                </Form.Group>


                                <Form.Group>
                                    <Form.Text style={{color: "red"}}>This will disable location
                                        tracking</Form.Text>
                                </Form.Group>
                            </Form.Group>

                            <Button variant="light" type="submit" onClick={manualLocationChange} style={{marginRight: "10px"}}>
                                Set Location
                            </Button>
                            <Button variant="light" onClick={onClose}>Exit</Button>


                        </Form>

                    </div>
                </DrawerBody>
                <DrawerCloseTrigger/>
            </DrawerContent>
        </DrawerRoot>

    </>);

}

export default ManualLocationForm