import EmailForm from "./email-form";
import {Flex} from "@chakra-ui/react";
import React from "react";

function PasswordResetPage(){

    return (<>

        <Flex direction="column">

            <Flex justifyContent="center">
                <EmailForm />
            </Flex>

        </Flex>



    </>)

}

export default PasswordResetPage;