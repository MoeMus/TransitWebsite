import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from '@fullcalendar/daygrid'

export default function CourseCalendar(){


    return (
        <FullCalendar
            plugins={[dayGridPlugin]}
            initialView={"dayGridMonth"}
            weekends={false}
            timeZone={"Canada/Vancouver"}
            events={[

                {
                    id: "CMPT307-D100-L1",
                    daysOfWeek: [ '2' ],
                    title: "CMPT307 Lecture",
                    start: "08:30:00",
                    end: "10:20:00"
                },
                {
                    id: "CMPT340-D100-L1",
                    daysOfWeek: [ '2' ],
                    title: "MATH340 Lecture",
                    start: "14:30:00",
                    end: "15:20:00"
                },
                {
                    id: "CMPT307-D100-L2",
                    daysOfWeek: [ '4' ],
                    title: "CMPT307 Lecture",
                    start: "08:30:00",
                    end: "09:20:00"
                },
                {
                    id: "CMPT340-D100-L2",
                    daysOfWeek: [ '4' ],
                    title: "MATH340 Lecture",
                    start: "14:30:00",
                    end: "16:20:00"
                }
            ]}
        >
        </FullCalendar>
    )
}
