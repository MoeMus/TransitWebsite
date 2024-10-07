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

  const fetchAvailableCourses = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/courses/');
        const data = await response.json();  // Convert the response to JSON
        setAvailableCourses(data);  // Set the parsed data to state
      } catch (err) {
        toast.error("Failed to load courses", {
          duration: 2000,
        });
        setError(err);
      } finally {
        setLoading(false);
      }
    };


  const handleAddCourse = (course) => {
    if (!selectedCourses.includes(course)) {
      setSelectedCourses([...selectedCourses, course]);
      toast.success(`${course.department} {course.course_number} added to schedule`, {
        duration: 2000,
      });
    } else {
      toast.error("Course is already in the schedule", {
        duration: 2000,
      });
    }
  };

  const handleRemoveCourse = (course) => {
    const updatedCourses = selectedCourses.filter((c) => c.id !== course.id);
    setSelectedCourses(updatedCourses);
    toast.success(`${course.department} {course.course_number} removed from schedule`, {
      duration: 2000,
    });
  };

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
        <Form>
          <Form.Group controlId="courseSelect">
            <Form.Label>Select Course</Form.Label>
            <Form.Control
              as="select"
              onChange={(e) => {
                const courseId = e.target.value;

                if (availableCourses && availableCourses.length > 0) {
                  const selectedCourse = availableCourses.find(
                    (course) => course.id === parseInt(courseId)
                  );

                  if (selectedCourse) {
                    handleAddCourse(selectedCourse);
                  } else {
                    toast.error("Course not found", {
                      duration: 2000,
                    });
                  }
                } else {
                  toast.error("No available courses to select", {
                    duration: 2000,
                  });
                }
              }}
            >
              <option>Select a course</option>
              {availableCourses && availableCourses.length > 0 ? (
                availableCourses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.department} {course.course_number}: {course.title}
                  </option>
                ))
              ) : (
                <option>No courses available</option>
              )}
            </Form.Control>
          </Form.Group>
        </Form>

        <h3>Your Schedule</h3>
        <ListGroup>
          {selectedCourses.map((course) => (
            <ListGroup.Item key={course.id}>
              {course.department} {course.course_number}
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleRemoveCourse(course)}
                className="float-right"
                style={{ marginLeft: '20px' }}
              >
                Remove
              </Button>
            </ListGroup.Item>
          ))}
        </ListGroup>
      </Container>
    </>
  );
}