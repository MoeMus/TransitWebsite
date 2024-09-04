import React, { useState, useEffect } from "react";
import { Container, Form, Button, ListGroup } from "react-bootstrap";
import apiClient from "../configurations/configAxios";
import { toast, Toaster } from "react-hot-toast";


export function ScheduleBuilder() {
    const [availableCourses, setAvailableCourses] = useState([]);
    const [selectedCourses, setSelectedCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchAvailableCourses();
    }, []);

    const fetchAvailableCourses() = async () => {
        try {
            const response = await fetch('http://localhost:8000/courses/');
        } catch (err) {

        setError(err)
        }
        }

    }

    const setAllCourses = async() => {
        try {

        }


    if (loading) {
        return <div>Loading...</div>;
    }

      if (error) {
        return <div>Error: {error.message}</div>;
    }


    return (
    <>
      <Toaster position="top-left" reverseOrder={false} />
      <Container>
        <h2>Schedule Builder</h2>

      </Container>
    </>
  );
}

