import {
    DialogActionTrigger,
    DialogBody,
    DialogCloseTrigger,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogRoot,
    DialogTitle,
    DialogTrigger
} from "./ui/dialog";
import {Button} from "@chakra-ui/react";
import React from "react";

export default function Dialog ({dialog_func, confirmation_msg, button_component, action}) {

    return (
        <DialogRoot role="alertdialog">
            <DialogTrigger asChild>
                {button_component}
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

                      <DialogActionTrigger asChild>
                        <Button variant="solid" onClick={dialog_func}>Yes</Button>
                      </DialogActionTrigger>
                    </DialogFooter>
                <DialogCloseTrigger/>
            </DialogContent>
        </DialogRoot>
    )

}