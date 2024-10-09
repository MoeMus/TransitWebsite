import React, { useState, useEffect } from "react";
import { Container, Form, Button, ListGroup } from "react-bootstrap";
import apiClient from "../configurations/configAxios";
import { toast, Toaster } from "react-hot-toast";

const refreshAccessToken = async () => {
  const refreshToken = sessionStorage.getItem('refresh_token');

  if (!refreshToken) {
    toast.error("No refresh token found");
    return false;
  }

  try {
    const response = await fetch('http://localhost:8000/token/refresh/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refresh: refreshToken,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      sessionStorage.setItem('access_token', data.access);
      return true;
    } else {
      toast.error("Failed to refresh access token");
      return false;
    }
  } catch (error) {
    toast.error("Error refreshing access token");
    return false;
  }
};

export function ScheduleBuilder() {
  const [availableCourses, setAvailableCourses] = useState([]);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchUserCourses();
    fetchAvailableCourses();  // Fetch available courses when the component mounts
  }, []);

  const fetchUserCourses = async () => {
    const accessToken = sessionStorage.getItem('access_token');

    if (!accessToken) {
      toast.error("User is not authenticated");
      return;
    }

    const isTokenValid = await refreshAccessToken();
    if (!isTokenValid) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/api/user/courses/get/all?username=${sessionStorage.getItem('user')}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log("Fetched User Courses: ", data);
      if (Array.isArray(data)) {
        setSelectedCourses(data);
      } else {
        setSelectedCourses([]);
        toast.error("Unexpected response format");
      }
    } catch (err) {
      setError(err);
      toast.error("Failed to load user's courses");
    } finally {
      setLoading(false);
    }
  };

  // Fetch available courses from the backend
  const fetchAvailableCourses = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/courses/');
      const data = await response.json();
      if (Array.isArray(data)) {
        setAvailableCourses(data);
      } else {
        toast.error("Unexpected response format");
        setAvailableCourses([]);
      }
    } catch (err) {
      toast.error("Failed to load available courses");
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCourse = async (course) => {
    if (!selectedCourses.includes(course)) {
      setSelectedCourses([...selectedCourses, course]);

      try {
        const response = await apiClient.post('http://localhost:8000/api/user/courses/add/', {
          username: sessionStorage.getItem('user'),
          courseName: course.title,
          sectionName: course.section_name,
        });

        if (response.status === 200) {
          toast.success(`${course.department} ${course.course_number} added to schedule`, {
            duration: 2000,
          });
        } else {
          toast.error("Failed to add course to the schedule");
        }
      } catch (err) {
        toast.error("Failed to add course to the schedule");
      }
    } else {
      toast.error("Course is already in the schedule");
    }
  };

  const handleRemoveCourse = (course) => {
    const updatedCourses = selectedCourses.filter((c) => c.id !== course.id);
    setSelectedCourses(updatedCourses);
    toast.success(`${course.department} ${course.course_number} removed from schedule`);
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
                    toast.error("Course not found");
                  }
                } else {
                  toast.error("No available courses to select");
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
          {selectedCourses && Array.isArray(selectedCourses) && selectedCourses.length > 0 ? (
            selectedCourses.map((course) => (
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
            ))
          ) : (
            <p>No courses found for the user</p>
          )}
        </ListGroup>
      </Container>
    </>
  );
}
