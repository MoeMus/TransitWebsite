import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from "@fullcalendar/timegrid";
import {Box, Button, useDisclosure} from "@chakra-ui/react";
import React from "react";
export default function CourseCalendar({courses}){

    const days_of_week = new Map();

    // Map days of the week to numbers used by FullCalender
    days_of_week.set("Su", '0');
    days_of_week.set("Mo", '1');
    days_of_week.set("Tu", '2');
    days_of_week.set("We", '3');
    days_of_week.set("Th", '4');
    days_of_week.set("Fr", '5');
    days_of_week.set("Sa", '6');

    // Parses the sections (lecture, non-lecture) in the user's schedule into objects readable by FullCalender
    function parseCourses(courses) {

        let schedule = [];

        for (const section of courses) {

            const sectionCode = section.schedule?.[0]?.sectionCode ?? "";

            const title = section["department"] + " " + section["number"] + " "
                + sectionCode;

            // Creates a new object for each day the section is taught in the week
            for (const schedule_block of section["schedule"]){

                const days = schedule_block["days"].split(",").map(d => d.trim());
                let new_section = {};

                new_section.title = title;

                const start_date = new Date(schedule_block["startDate"]).toISOString().split("T")[0];
                const end_date = new Date(schedule_block["endDate"]).toISOString().split("T")[0];
                new_section.startRecur = start_date;
                new_section.endRecur = end_date;
                new_section.startTime = schedule_block["startTime"];
                new_section.endTime = schedule_block["endTime"];
                new_section.daysOfWeek = []

                // A time block may include multiple days ("Mo, We, Fr") if the section is taught at the same time on
                // each day
                for (const day of days){

                    const num = days_of_week.get(day);
                    if (num !== undefined) {
                        new_section.id = crypto.randomUUID();
                        new_section.daysOfWeek.push(num);
                    }

                }

                schedule.push(new_section);

            }
        }

        return schedule;

    }

    return (
        <>

            <div style={{marginBottom: "30px"}}>

                <FullCalendar
                    plugins={[timeGridPlugin]
                    }
                    initialView={"timeGridWeek"}
                    weekends={true}
                    timeZone={"Canada/Vancouver"}
                    aspectRatio={2}
                    events={parseCourses(courses)}
                >
                </FullCalendar>

            </div>



        </>

    )
}
