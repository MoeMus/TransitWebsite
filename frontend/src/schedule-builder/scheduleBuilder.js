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
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [lectureSections, setLectureSections] = useState([]);
  const [selectedLectureSection, setSelectedLectureSection] = useState(null);
  const [nonLectureSections, setNonLectureSections] = useState([]);
  const [selectedNonLectureSection, setSelectedNonLectureSection] = useState(null);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [selectionStage, setSelectionStage] = useState("course"); // "course", "lecture", or "non-lecture"
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAvailableCourses();
  }, []);

  const fetchAvailableCourses = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/courses/');
      const data = await response.json();
      setAvailableCourses(data);
    } catch (err) {
      toast.error("Failed to load available courses");
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLectureSections = async (courseId) => {
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
        const response = await fetch(`http://localhost:8000/api/courses/${courseId}/lectures/`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`, // Add the Bearer token
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();
        if (data.length > 0) {
          setLectureSections(data);
          setSelectionStage("lecture");
        } else {
          toast.error("No lecture sections found for this course");
        }
      } catch (err) {
        toast.error("Failed to load lecture sections");
      }
    };

  const fetchNonLectureSections = async (lectureId) => {
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
        const response = await fetch(`http://localhost:8000/api/lectures/${lectureId}/non-lectures/`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`, // Add Bearer token for authentication
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();
        if (data.length > 0) {
          setNonLectureSections(data);
          setSelectionStage("non-lecture");
        } else {
          toast.error("No non-lecture sections found for this lecture");
        }
      } catch (err) {
        toast.error("Failed to load non-lecture sections");
      }
    };

  const handleAddCourse = async () => {
    if (selectedCourse && selectedLectureSection && selectedNonLectureSection) {
      const courseToAdd = {
        course: selectedCourse,
        lecture: selectedLectureSection,
        nonLecture: selectedNonLectureSection,
      };

      setSelectedCourses([...selectedCourses, courseToAdd]);
      toast.success(`${selectedCourse.title} added to schedule`);

      // Reset the selection process
      setSelectedCourse(null);
      setSelectedLectureSection(null);
      setSelectedNonLectureSection(null);
      setSelectionStage("course");
    } else {
      toast.error("Please complete all selections");
    }
  };

  const handleCourseSelection = (e) => {
    const courseId = e.target.value;
    const course = availableCourses.find((course) => course.id === parseInt(courseId));
    setSelectedCourse(course);
    fetchLectureSections(courseId);
  };

  const handleLectureSelection = (e) => {
    const lectureId = e.target.value;
    const lecture = lectureSections.find((lecture) => lecture.id === parseInt(lectureId));
    setSelectedLectureSection(lecture);
    fetchNonLectureSections(lectureId);
  };

  const handleNonLectureSelection = (e) => {
    const nonLectureId = e.target.value;
    const nonLecture = nonLectureSections.find((nonLecture) => nonLecture.id === parseInt(nonLectureId));
    setSelectedNonLectureSection(nonLecture);
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

        {/* Conditional Rendering: Course Selection */}
        {selectionStage === "course" && (
          <Form.Group controlId="courseSelect">
            <Form.Label>Select Course</Form.Label>
            <Form.Control as="select" onChange={handleCourseSelection}>
              <option>Select a course</option>
              {availableCourses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.department} {course.course_number}: {course.title}
                </option>
              ))}
            </Form.Control>
          </Form.Group>
        )}

        {/* Conditional Rendering: Lecture Section Selection */}
        {selectionStage === "lecture" && lectureSections.length > 0 && (
          <Form.Group controlId="lectureSectionSelect">
            <Form.Label>Select Lecture Section</Form.Label>
            <Form.Control as="select" onChange={handleLectureSelection}>
              <option>Select a lecture section</option>
              {lectureSections.map((lecture) => (
                <option key={lecture.id} value={lecture.id}>
                  {lecture.section_code} - {lecture.start_time} to {lecture.end_time}
                </option>
              ))}
            </Form.Control>
          </Form.Group>
        )}

        {/* Conditional Rendering: Non-Lecture Section Selection */}
        {selectionStage === "non-lecture" && nonLectureSections.length > 0 && (
          <Form.Group controlId="nonLectureSectionSelect">
            <Form.Label>Select Non-Lecture Section</Form.Label>
            <Form.Control as="select" onChange={handleNonLectureSelection}>
              <option>Select a non-lecture section</option>
              {nonLectureSections.map((nonLecture) => (
                <option key={nonLecture.id} value={nonLecture.id}>
                  {nonLecture.section_code} - {nonLecture.start_time} to {nonLecture.end_time}
                </option>
              ))}
            </Form.Control>
          </Form.Group>
        )}

        {/* Add Course Button */}
        {selectionStage === "non-lecture" && (
          <Button variant="primary" onClick={handleAddCourse}>
            Add Course
          </Button>
        )}

        <h3>Your Schedule</h3>
        <ListGroup>
          {selectedCourses.map((course, index) => (
            <ListGroup.Item key={index}>
              {course.course.title} (Lecture: {course.lecture.section_code}, Non-Lecture: {course.nonLecture.section_code})
              <Button variant="danger" size="sm" className="float-right">
                Remove
              </Button>
            </ListGroup.Item>
          ))}
        </ListGroup>
      </Container>
    </>
  );
}
