import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Container, Form, Button, ListGroup, Card, Badge, Row, Col } from "react-bootstrap";
import apiClient from "../configurations/configAxios";
import { toast, Toaster } from "react-hot-toast";
import {Spinner} from "@chakra-ui/react";
import CourseCalendar from "../calendar/CourseCalendar";
import { BsListUl, BsCalendar3 } from "react-icons/bs";

const refreshAccessToken = async () => {
  const refreshToken = sessionStorage.getItem('refresh_token');

  // Refresh token is expired, send user to the login page
  if (!refreshToken) {
    sessionStorage.clear();
    window.location.href = "/";
    return false;
  }

  try {
    const response = await apiClient('/token/refresh/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': '', // don't send an expired Bearer token to refresh endpoint
      },
      data: {
        refresh: refreshToken,
      },
    });

    if (response.status === 200) {
      const data = await response.data;
      sessionStorage.setItem('access_token', data.access);
 
      if (data.refresh) {
        sessionStorage.setItem('refresh_token', data.refresh);
      }
      return true;
    } else {
      sessionStorage.clear();
      window.location.href = "/";
      return false;
    }
  } catch (error) {
    console.error("Refresh token expired or invalid:", error);
    sessionStorage.clear();
    window.location.href = "/";
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
  const [viewMode, setViewMode] = useState("list");
  const [error, setError] = useState("");
  const username  = sessionStorage.getItem("user");

  useEffect(() => {

    (async function(){
      await fetchAvailableCourses();
      await fetchUserCourses(); // Fetch user courses on mount
    })()

  }, []);

  // Displays a toast notification showing all courses that conflict with the selected course
  function displayCourseConflicts(course_conflicts) {
    let conflicts = [];
    course_conflicts.map((item, index) => {
      conflicts.push(`${item.department} ${item.number} ${item.section_code}`);
    })

    toast.error(`${selectedCourse.department} ${selectedCourse.course_number} conflicts with ${conflicts.join(" | ")}`);
  }

  // Fetch all available courses
  const fetchAvailableCourses = useCallback(async () => {
    const accessToken = sessionStorage.getItem('access_token');
    try {
      const response = await apiClient('/api/courses/get/all/', {
        method: "GET",
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        }
      });
      const data = await response.data;  // Convert the response to JSON
      setAvailableCourses(Array.isArray(data) ? data : []);  // Set the parsed data to state
    } catch (err) {
      toast.error("Failed to load courses", {
        duration: 2000,
      });
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

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
  const fetchUserCourses = useCallback(async () => {
    const accessToken = sessionStorage.getItem('access_token');
    if (!accessToken) {
      toast.error("User is not authenticated");
      return;
    }

    try {
      const response = await apiClient(`/api/user/${username}/courses/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 200) {
        const data = await response.data;
        // Flatten the lecture and non-lecture sections into a single array for the UI
        // const combined = [
        //   // ...(data.lecture_sections || []).map(lec => ({
        //   //   course: lec.course,
        //   //   lecture: lec,
        //   //   nonLecture: null
        //   // })),
        //   // ...(data.non_lecture_sections || []).map(nls => ({
        //   //   course: nls.lecture_section?.course,
        //   //   lecture: nls.lecture_section,
        //   //   nonLecture: nls
        //   // }))
        // ];

        // setSelectedCourses(combined);

        const combined = new Map();

        // Flatten the lecture and non-lecture sections into a single array for the UI

        // Add lecture sections to the array
        (data.lecture_sections || []).map(lec => {
          combined.set(lec.id, {
            course: lec.course,
            lecture: lec,
            nonLecture: null
          })
        });

        // Add non lecture sections to the array
        (data.non_lecture_sections || []).map(nls => {

          // If the corresponding lecture section already exists, just add to the existing entry
          if (combined.has(nls.lecture_section.id)){
            combined.get(nls.lecture_section.id).nonLecture = nls;
          } else {
            combined.set(nls.lecture_section.id, {
              course: nls.lecture_section?.course,
              lecture: nls.lecture_section,
              nonLecture: nls
          })
          }
        });


        setSelectedCourses([...combined.values()]);

      } else {
        toast.error("Failed to load your courses.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load your courses.");
    }
  }, [username]);

  useEffect(() => {
    fetchAvailableCourses();
    fetchUserCourses(); // Fetch user courses on mount
  }, [fetchAvailableCourses, fetchUserCourses]);

  // Handle adding a course with non-lecture sections
  const handleAddCourse = async () => {
      if (selectedCourse && selectedLectureSection && selectedNonLectureSection) {
        const courseToAdd = {
          course: selectedCourse,
          lecture: selectedLectureSection,
          nonLecture: selectedNonLectureSection,
        };

        // Build the payload to send to the backend.
        const lecture = {
          username: username,
          department: selectedCourse.department,
          course_number: selectedCourse.course_number,
          section_code: selectedLectureSection.section_code,
        };

        const non_lecture = {
          username: username,
          department: selectedCourse.department,
          course_number: selectedCourse.course_number,
          section_code: selectedNonLectureSection.section_code,
        };

        console.log("Posting add course:", lecture);
        try {
          // Send the POST request to persist the course on the backend.
          await apiClient.post(
            `/api/user/courses/add/`,
            lecture,
            {
              withCredentials: true,
              method: "POST"
            }
          );

          await apiClient.post(
            `/api/user/courses/add/`,
            non_lecture,
            {
              withCredentials: true,
              method: "POST"
            }
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
            displayCourseConflicts(error.response.data.conflicts);
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
          department: selectedCourse.department,
          course_number: selectedCourse.course_number,
          section_code: selectedLectureSection.section_code,
        };

        console.log("Posting add course without non-lecture:", post_payload);
        try {
          await apiClient.post(
            `/api/user/courses/add/`,
            post_payload,
            {
              withCredentials: true,
              method: "POST"
            }
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
            displayCourseConflicts(error.response.data.conflicts);

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
      setSelectedCourses([...updatedCourses]);

      // Extract data from normalized entry
      const courseData = course.course;
      const sectionData = course.lecture || course.nonLecture;

      // Build payload for backend deletion.
      let post_request = {
        username: username,
        department: courseData.department,
        course_number: courseData.course_number,
        section_code: sectionData.section_code,
      };

      console.log("Removing course with payload:", post_request);

      try {
        await apiClient.post(
          `/api/user/courses/remove/`,
          post_request,
          {
            withCredentials: true,
            method: "POST"
          }
        );
        toast.success(`${courseData.title} ${sectionData.section_code} removed from schedule`);
      } catch (err) {
        console.error("Error in remove API:", err);
        toast.error(err.response?.data?.error || "Error removing course");
      }

      try {
        const response = await apiClient("/api/courses/get/all/");
        const data = await response.data;
        setAvailableCourses(Array.isArray(data) ? data : []);
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
      const response = await apiClient(`/api/courses/${courseId}/lectures/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`, // Add Bearer token
          'Content-Type': 'application/json',
        },
      });

      const data = await response.data;
      if (Array.isArray(data) && data.length > 0) {
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
      const response = await apiClient(`/api/courses/lectures/${lectureId}/non-lectures/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.data;
      
      // Update the list regardless of whether it is empty or populated
      updateSectionList(data);
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

  const handleCancelSelection = () => {
    setSelectedCourse(null);
    setSelectedLectureSection(null);
    setSelectedNonLectureSection(null);
    setLectureSections([]);
    setNonLectureSections([]);
    setSelectionStage("course");
  };

  if (loading) {
    return <Spinner size="sm" />;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  function updateSectionList(data) {
    if (Array.isArray(data) && data.length > 0) {
      setNonLectureSections(data);
      setSelectionStage("non-lecture");
    } else {
      // Don't auto submit, just clear non-lectures and sets and sets stage to lecture to show Add button
      // This fixes the bug where it was adding previous lecture sections
      setNonLectureSections([]);
      setSelectionStage("lecture");
    }
  }

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      <Container className="py-5">
        <Row className="mb-4">
          <Col>
            <h2 className="fw-bold text-primary">Schedule Builder</h2>
            <p className="text-muted">Plan your semester by selecting courses and sections below.</p>
          </Col>
        </Row>

        <Card className="shadow-sm border-0 mb-5">
          <Card.Body className="p-4">
            <Row className="align-items-end">
              <Col md={selectionStage === "course" ? 12 : 4}>
                <Form.Group controlId="courseSelect">
                  <Form.Label className="small fw-bold text-uppercase text-muted">1. Select Course</Form.Label>
                  <Form.Control
                    as="select"
                    className="form-select-lg"
                    onChange={handleCourseSelection}
                    value={selectedCourse ? selectedCourse.id : ""}
                  >
                    <option value="">Choose a course...</option>
                    {Array.isArray(availableCourses) && availableCourses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.department} {course.course_number}: {course.title}
                      </option>
                    ))}
                  </Form.Control>
                </Form.Group>
              </Col>

              {selectionStage !== "course" && uniqueLectureSections.length > 0 && (
                <Col md={4}>
                  <Form.Group controlId="lectureSectionSelect">
                    <Form.Label className="small fw-bold text-uppercase text-muted">2. Lecture Section</Form.Label>
                    <Form.Control
                      as="select"
                      className="form-select-lg"
                      onChange={handleLectureSelection}
                      value={selectedLectureSection ? selectedLectureSection.id : ""}
                    >
                      <option value="">Choose a lecture...</option>
                      {Array.isArray(uniqueLectureSections) && uniqueLectureSections.map((lecture) => (
                        <option key={lecture.id} value={lecture.id}>
                          {lecture.section_code} ({lecture.schedule?.[0]?.startTime || "N/A"} - {lecture.schedule?.[0]?.endTime || "N/A"})
                        </option>
                      ))}
                    </Form.Control>
                  </Form.Group>
                </Col>
              )}

              {selectionStage === "non-lecture" && nonLectureSections.length > 0 && (
                <Col md={4}>
                  <Form.Group controlId="nonLectureSectionSelect">
                    <Form.Label className="small fw-bold text-uppercase text-muted">3. Lab/Tutorial</Form.Label>
                    <Form.Control 
                      as="select" 
                      className="form-select-lg"
                      onChange={handleNonLectureSelection} 
                      value={selectedNonLectureSection ? selectedNonLectureSection.id : ""}
                    >
                      <option value="">Choose a section...</option>
                      {Array.isArray(nonLectureSections) && nonLectureSections.map((nonLecture) => (
                        <option key={nonLecture.id} value={nonLecture.id}>
                          {nonLecture.section_code} ({nonLecture.schedule?.[0]?.startTime || "N/A"} - {nonLecture.schedule?.[0]?.endTime || "N/A"})
                        </option>
                      ))}
                    </Form.Control>
                  </Form.Group>
                </Col>
              )}
            </Row>

            <Row 
              className="mt-4" 
              style={{ 
                visibility: selectedCourse ? 'visible' : 'hidden' 
              }}
            >
              <Col className="d-flex gap-2">
                {((selectionStage === "non-lecture" && selectedNonLectureSection) ||
                  (selectionStage === "lecture" && nonLectureSections.length === 0 && selectedLectureSection)) && (
                  <Button 
                    variant="primary"
                    size="lg"
                    style={{ width: 'max-content' }}
                    className="px-4 py-1 shadow-sm text-nowrap"
                    onClick={selectionStage === "non-lecture" ? handleAddCourse : handleAddCourseWithoutNonLecture}
                  >
                    Add to Schedule
                  </Button>
                )}
                <Button 
                  variant="outline-secondary"
                  size="lg"
                  style={{ width: 'max-content' }}
                  className="px-4 py-1 shadow-sm text-nowrap"
                  onClick={handleCancelSelection}
                >
                  Cancel
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        <div className="d-flex align-items-center gap-3 mb-3">
          <h4 className="fw-bold mb-0">Your Current Schedule</h4>
          <div className="d-flex gap-2">
            <Button 
              variant={viewMode === "list" ? "primary" : "outline-primary"} 
              size="md"
              onClick={() => setViewMode("list")}
              style={{ width: 'max-content' }}
              className="d-flex align-items-center gap-2"
            >
              <BsListUl /> List View
            </Button>
            <Button 
              variant={viewMode === "calendar" ? "primary" : "outline-primary"} 
              size="md"
              style={{ width: 'max-content' }}
              onClick={() => setViewMode("calendar")}
              className="d-flex align-items-center gap-2"
            >
              <BsCalendar3 /> Calendar View
            </Button>
          </div>
        </div>

        <div style={{ minHeight: "600px" }}>
        {viewMode === "list" ? (
          <ListGroup className="shadow-sm rounded-3 overflow-hidden">
          {Array.isArray(selectedCourses) && selectedCourses.length > 0 ? (
            selectedCourses.map((item, index) => {
              // If item.course exists, use it; otherwise, assume item is the course data directly.
              const courseData = item.course || item;
              const lectureData = item.lecture || {};
              const nonLectureData = item.nonLecture || null;

              return (
                <ListGroup.Item key={index} className="p-4 border-start-0 border-end-0">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <div className="d-flex align-items-center mb-1">
                        <Badge bg="secondary" className="me-2">{courseData.department} {courseData.course_number}</Badge>
                        <h5 className="mb-0 fw-bold">{courseData.title}</h5>
                      </div>
                      <div className="text-muted small">
                        <span className="me-3">
                          <strong>Lecture:</strong> {lectureData.section_code || "N/A"} 
                          <span className="ms-1 text-primary">({lectureData.schedule?.[0]?.startTime || "N/A"} - {lectureData.schedule?.[0]?.endTime || "N/A"})</span>
                        </span>
                        {nonLectureData && (
                          <span>
                            <strong>Non-Lecture:</strong> {nonLectureData.section_code} 
                            <span className="ms-1 text-primary">({nonLectureData.schedule?.[0]?.startTime || "N/A"} - {nonLectureData.schedule?.[0]?.endTime || "N/A"})</span>
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      className="rounded-pill px-3"
                      onClick={() => handleRemoveCourse(item, index)}
                    >
                      Remove
                    </Button>
                  </div>
                </ListGroup.Item>
              );
            })
          ) : (
            <ListGroup.Item className="text-center p-5 text-muted bg-light">
              <p className="mb-0">No courses added yet. Use the builder above to start your schedule.</p>
            </ListGroup.Item>
          )}
        </ListGroup>
        ) : (
          <CourseCalendar courses={selectedCourses.flatMap(item => [item.lecture, item.nonLecture].filter(Boolean))} />
        )}
        </div>
      </Container>
    </>
  );
}
