import React, { useState, useEffect, useMemo } from "react";
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
  const username  = sessionStorage.getItem("user");

  useEffect(() => {
    fetchAvailableCourses();
    fetchUserCourses(); // Fetch user courses on mount
  }, []);

  // Fetch all available courses
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

    const fetchAvailableLectures = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/courses/lectures/`);
        const data = await response.json();
        if (data.length > 0) {
          setAvailableCourses(data);
          setSelectionStage("lecture");
        } else {
          toast.error("No lecture sections found");
        }
      } catch (err) {
        toast.error("Failed to load lectures");
      }
    };

  const uniqueLectureSections = useMemo(() => {
    // uses a map to deduplicate by section_code
    const uniqueMap = new Map();
    lectureSections.forEach((lecture) => {
      if (!uniqueMap.has(lecture.section_code)) {
        uniqueMap.set(lecture.section_code, lecture);
      }
    });
    return Array.from(uniqueMap.values());
  }, [lectureSections]);

  // Fetch the user's saved courses
  const fetchUserCourses = async () => {
    const accessToken = sessionStorage.getItem('access_token');
    if (!accessToken) {
      toast.error("User is not authenticated");
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/api/user/courses/?username=${username}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const userCourses = await response.json();
        setSelectedCourses(userCourses);
      } else {
        toast.error("Failed to load your courses.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load your courses.");
    }
  };

  // Handle adding a course with non-lecture sections
  const handleAddCourse = async () => {
      if (selectedCourse && selectedLectureSection && selectedNonLectureSection) {
        const courseToAdd = {
          course: selectedCourse,
          lecture: selectedLectureSection,
          nonLecture: selectedNonLectureSection,
        };

        // Build the payload to send to the backend.
        const post_payload = {
          username: username,
          courseName: selectedCourse.title,       // Must match backend expectations
          sectionName: selectedCourse.section_name, // Must match backend expectations
        };

        console.log("Posting add course:", post_payload);
        try {
          // Send the POST request to persist the course on the backend.
          await apiClient.post(
            `http://127.0.0.1:8000/api/user/courses/add/`,
            post_payload,
            { withCredentials: true }
          );

          // On success, update the local state
          setSelectedCourses([...selectedCourses, courseToAdd]);
          toast.success(`${selectedCourse.title} added to schedule`);

          // Reset the selection process
          setSelectedCourse(null);
          setSelectedLectureSection(null);
          setSelectedNonLectureSection(null);
          setSelectionStage("course");
        } catch (error) {
          if (error.response && error.response.status === 409) {
            toast.error("Time conflicts detected. Course not added.");
          } else {
            toast.error(error.response?.data?.error || "Error adding course to schedule");
          }
          console.error("Error in handleAddCourse:", error);

          // Reset selection state so the user is returned to the schedule builder
          setSelectedCourse(null);
          setSelectedLectureSection(null);
          setSelectedNonLectureSection(null);
          setSelectionStage("course");
        }
      } else {
        toast.error("Please complete all selections");
      }
    };



  // Handle adding a course without non-lecture sections
  const handleAddCourseWithoutNonLecture = async () => {
      if (selectedCourse && selectedLectureSection) {
        const courseToAdd = {
          course: selectedCourse,
          lecture: selectedLectureSection,
          nonLecture: null,
        };

        const post_payload = {
          username: username,
          courseName: selectedCourse.title,
          sectionName: selectedCourse.section_name,
        };

        console.log("Posting add course without non-lecture:", post_payload);
        try {
          await apiClient.post(
            `http://127.0.0.1:8000/api/user/courses/add/`,
            post_payload,
            { withCredentials: true }
          );

          setSelectedCourses([...selectedCourses, courseToAdd]);
          toast.success(`${selectedCourse.title} added to schedule`);

          // Reset the selection process so the user can add another course.
          setSelectedCourse(null);
          setSelectedLectureSection(null);
          setSelectedNonLectureSection(null);
          setSelectionStage("course");
        } catch (error) {
          if (error.response && error.response.status === 409) {
            toast.error("Time conflicts detected. Course not added.");
          } else {
            toast.error(error.response?.data?.error || "Error adding course to schedule");
          }
          console.error("Error in handleAddCourseWithoutNonLecture:", error);

          // Reset state so that user is returned to schedule builder (can try again)
          setSelectedCourse(null);
          setSelectedLectureSection(null);
          setSelectedNonLectureSection(null);
          setSelectionStage("course");
        }
      } else {
        //toast.error("Please complete all selections");
      }
    };



  // Handle removing a course
  const handleRemoveCourse = async (course, indexToRemove) => {
      // Remove the specific course entry using its index.
      const updatedCourses = selectedCourses.filter((_, idx) => idx !== indexToRemove);
      setSelectedCourses(updatedCourses);

      // Extract the actual course data from the entry (in case it is nested).
      const courseData = course.course || course;

      // Build the payload for the backend deletion.
      let post_request = {
        username: username,
        course_name: courseData.title,
        section_name: courseData.section_name,
      };

      console.log("Removing course with payload:", post_request);

      try {
        await apiClient.post(
          `http://127.0.0.1:8000/api/user/courses/delete/`,
          post_request,
          { withCredentials: true }
        );
        toast.success(`${courseData.department} ${courseData.course_number} removed from schedule`);
      } catch (err) {
        console.error("Error in remove API:", err);
        toast.error(err.response?.data?.error || "Error removing course");
      }

      try {
        const response = await fetch("http://localhost:8000/api/courses/");
        const data = await response.json();
        setAvailableCourses(data);
      } catch (err) {
        toast.error("Failed to load available courses");
        setError(err);
      }
    };



  // Fetch lecture sections for a given course
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

  // Fetch non-lecture sections for a given lecture section
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
        // No non-lecture sections; proceed to add the course directly
        handleAddCourseWithoutNonLecture();
      }
    } catch (err) {
      toast.error("Failed to load non-lecture sections");
    }
  };

  // Handle course selection from dropdown
  const handleCourseSelection = (e) => {
    const courseId = e.target.value;
    const course = availableCourses.find((course) => course.id === parseInt(courseId));
    setSelectedCourse(course);
    setSelectedLectureSection(null);
    setSelectedNonLectureSection(null);
    setLectureSections([]);
    setNonLectureSections([]);
    fetchLectureSections(courseId);
  };

  // Handle lecture section selection from dropdown
  const handleLectureSelection = (e) => {
    const lectureId = e.target.value;
    const lecture = lectureSections.find((lecture) => lecture.id === parseInt(lectureId));
    setSelectedLectureSection(lecture);
    setSelectedNonLectureSection(null);
    fetchNonLectureSections(lectureId);
  };

  // Handle non-lecture section selection from dropdown
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
        {selectionStage === "course" && (
          <Form.Group controlId="courseSelect">
            <Form.Label>Select Course</Form.Label>
            <Form.Control
              as="select"
              onChange={handleCourseSelection}
              value={selectedCourse ? selectedCourse.id : ""}
            >
              <option value="">Select a course</option>
              {availableCourses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.department} {course.course_number}: {course.title}
                </option>
              ))}
            </Form.Control>
          </Form.Group>
        )}

        {/* Look for uniqueLectureSections */}
        {selectionStage === "lecture" && uniqueLectureSections.length > 0 && (
          <Form.Group controlId="lectureSectionSelect">
            <Form.Label>Select Lecture Section</Form.Label>
            <Form.Control
              as="select"
              onChange={handleLectureSelection}
              value={selectedLectureSection ? selectedLectureSection.id : ""}
            >
              <option value="">Select a lecture section</option>
              {uniqueLectureSections.map((lecture) => (
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
            <Form.Control as="select" onChange={handleNonLectureSelection} value={selectedNonLectureSection ? selectedNonLectureSection.id : ""}>
              <option value="">Select a non-lecture section</option>
              {nonLectureSections.map((nonLecture) => (
                <option key={nonLecture.id} value={nonLecture.id}>
                  {nonLecture.section_code} - {nonLecture.start_time} to {nonLecture.end_time}
                </option>
              ))}
            </Form.Control>
          </Form.Group>
        )}

        {/* Add Course Button */}
        { (selectionStage === "non-lecture" && nonLectureSections.length > 0 && selectedNonLectureSection) ||
          (selectionStage === "lecture" && nonLectureSections.length === 0 && selectedLectureSection) ? (
            <Button variant="primary" onClick={selectionStage === "non-lecture" ? handleAddCourse : handleAddCourseWithoutNonLecture}>
              Add Course
            </Button>
          ) : null
        }

        <h3>Your Schedule</h3>
        <ListGroup>
          {selectedCourses.map((item, index) => {
              // If item.course exists, use it; otherwise, assume item is the course data directly.
              const courseData = item.course || item;
              const lectureData = item.lecture || {};
              const nonLectureData = item.nonLecture || null;

              return (
                <ListGroup.Item key={index}>
                  {courseData.title} (Lecture: {lectureData.section_code ? lectureData.section_code : "N/A"},
                  Non-Lecture: {nonLectureData ? nonLectureData.section_code : "No Non-Lecture Sections"})
                  <Button
                    variant="danger"
                    size="sm"
                    className="float-right"
                    style={{ marginLeft: '1rem' }}
                    onClick={() => handleRemoveCourse(item, index)}
                  >
                    Remove
                  </Button>
                </ListGroup.Item>
              );
            })}
        </ListGroup>
      </Container>
    </>
  );
}
