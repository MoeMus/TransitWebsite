import {BsExclamationLg} from "react-icons/bs";
import {CloseButton} from "react-bootstrap";
import {toast} from "react-hot-toast";
import React from "react";

export default function Notification({title, message, toast_object}) {

    return (
        <>

            <div
                className={`toast-root ${
                    toast_object.visible ? 'animate-custom-enter' : 'animate-custom-leave'
                }`}
            >
                <div className="notificationBody">

                    <div className="notificationContent">
                        <div className="notificationIcon">
                            <BsExclamationLg className={"icon"}/>
                        </div>

                        <div className="notificationText">
                            <p className="notificationTitle"> {title} </p>
                            <p className="notificationMessage"> {message} </p>
                        </div>
                    </div>
                </div>

                <div className="notificationButton">
                    <CloseButton className={"closeButton"} onClick={() => toast.dismiss(toast_object.id)}/>
                </div>
            </div>

        </>
    )
}
