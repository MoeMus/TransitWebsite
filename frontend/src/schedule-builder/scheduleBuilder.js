import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Container, Form, Button, ListGroup, Card, Badge, Row, Col } from "react-bootstrap";
import apiClient from "../configurations/configAxios";
import { toast, Toaster } from "react-hot-toast";
import {Spinner} from "@chakra-ui/react";
import CourseCalendar from "../calendar/CourseCalendar";
import { BsListUl, BsCalendar3, BsTrash, BsPlusLg, BsXLg } from "react-icons/bs";
import Dialog from "../components/dialog";
import SearchSelectionBar from "../components/searchSelectionBar";

export function ScheduleBuilder() {
  const [availableDepartments, setAvailableDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courses, setCourses] = useState([]);
  const [lectureSections, setLectureSections] = useState([]);
  const [selectedLectureSection, setSelectedLectureSection] = useState(null);
  const [nonLectureSections, setNonLectureSections] = useState([]);
  const [selectedNonLectureSection, setSelectedNonLectureSection] = useState(null);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [selectionStage, setSelectionStage] = useState("department"); // "department", "course", "lecture", or "non-lecture"
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("list");
  const [error, setError] = useState("");
  const username  = sessionStorage.getItem("user");

  useEffect(() => {

    (async function(){
      await fetchAllDepartments();
      // await fetchAvailableCourses();
      await fetchUserCourses(); // Fetch user courses on mount
    })()

  }, []);

  // Displays a toast notification showing all courses that conflict with the selected course
  function displayCourseConflicts(course_conflicts) {
    let conflicts = [];
    course_conflicts.conflicts.map((item) => {
      conflicts.push(`${item.department} ${item.number} ${item.section_code}`);
    })

    const conflicting_section = course_conflicts.section;

    toast.error(`${conflicting_section.department} ${conflicting_section.number} ${conflicting_section.section_code} conflicts with ${conflicts.join(" | ")}`);
  }

  const fetchAllDepartments = useCallback(async () => {
    try {

      const response = await apiClient.get('/api/departments/get/all/');

      const departments = await response.data;
      setAvailableDepartments(departments);

    } catch (err) {
      toast.error("Failed to load departments", {
        duration: 2000,
      });
      setError(err);
    } finally {
      setLoading(false);
    }
  });

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

    try {

      const response = await apiClient.get(`/api/user/courses/`);

      const data = await response.data;

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

    } catch (err) {
      toast.error("Failed to load your courses.");
    }
  }, [username]);

  // useEffect(() => {
  //   fetchAllDepartments();
  //   fetchUserCourses(); // Fetch user courses on mount
  // }, [fetchAllDepartments, fetchUserCourses]);

  // Handle adding a course with non-lecture sections
  const handleAddCourse = async () => {
    if (selectedCourse && selectedLectureSection) {
      const courseToAdd = {
        course: selectedCourse,
        lecture: selectedLectureSection,
        nonLecture: selectedNonLectureSection || null,
      };

      // Build the payload to send to the backend.
      const request = {
        department: selectedCourse.department,
        course_number: selectedCourse.course_number,
        lecture_section_code: selectedLectureSection.section_code,
        non_lecture_section_code: selectedNonLectureSection?.section_code || null
      };

      try {
        // Send the POST request to persist the course on the backend.
        await apiClient.post(
          `/api/user/courses/add/`,
          request,
          {
            withCredentials: true,
          }
        );

        // On success, update the local state
        setSelectedCourses([...selectedCourses, courseToAdd]);
        toast.success(`${selectedCourse.title} added to schedule`);
        // Reset the selection process
        setSelectedLectureSection(null);
        setSelectedNonLectureSection(null);
        setSelectionStage("course");
      } catch (error) {
        if (error.response && error.response.status === 409) {
          displayCourseConflicts(error.response.data);
        } else {
          toast.error(error.response?.data?.error || "Error adding course to schedule");
        }

        // Reset selection state so the user is returned to the schedule builder
        setSelectedNonLectureSection(null);
        setSelectionStage("course");
      }
    } else {
      toast.error("Please complete all selections");
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

    try {
      await apiClient.post(
        `/api/user/courses/remove/`,
        post_request,
        {
          withCredentials: true,
        }
      );
      toast.success(`${courseData.title} ${sectionData.section_code} removed from schedule`);
    } catch (err) {
      console.error("Error in remove API:", err);
      toast.error(err.response?.data?.error || "Error removing course");
    }

    try {
      const response = await apiClient("/api/departments/get/all/");
      const data = await response.data;
      setAvailableDepartments(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error("Failed to load available departments");
      setError(err);
    }
  };

  // Handle removing all courses from the schedule
  const handleRemoveAllCourses = async () => {
    try {
      await apiClient.post(
        `/api/user/courses/remove/all/`,
        {},
        {
          withCredentials: true,
        }
      );
      setSelectedCourses([]);
      toast.success("All courses removed from schedule");
    } catch (err) {
      toast.error(err.response?.data?.error || "Error removing all courses");
    }

    try {
      const response = await apiClient("/api/departments/get/all/");
      const data = await response.data;
      setAvailableDepartments(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error("Failed to load available courses");
    }
  };

  const resetCourseStage = () => {
    setCourses([]);
    setSelectionStage('department');
  }

  // Fetch all available courses
  const fetchCourses = async (departmentId) => {
    try {
      if (!departmentId) {
        resetCourseStage();
        return;
      }

      const response = await apiClient.get(`/api/departments/${departmentId}/courses/`);
      const data = await response.data;

      if (Array.isArray(data) && data.length > 0) {
        setCourses(data);
      } else {
        resetCourseStage();
      }

      setLectureSections([]);
      setNonLectureSections([]);
      setSelectedCourse(null);
      setSelectedLectureSection(null);
      setSelectedNonLectureSection(null);

    } catch (err) {
      toast.error("Failed to retrieve courses for department", {
        duration: 2000,
      });
      setError(err);
    }

  };

  const resetLectureSectionStage = () => {
    setLectureSections([]);
    setSelectionStage('course');
  }

  // Fetch lecture sections for a given course
  const fetchLectureSections = async (courseId) => {
    try {
      if (!courseId) {
        resetLectureSectionStage();
        return;
      }

      const response = await apiClient.get(`/api/courses/${courseId}/lectures/`, {});
      const data = await response.data;
      if (Array.isArray(data) && data.length > 0) {
        setLectureSections(data);
      } else {
        resetLectureSectionStage();
        toast.error("No lecture sections found for this course");
      }
      setNonLectureSections([]);
      setSelectedLectureSection(null);
      setSelectedNonLectureSection(null);
    } catch (err) {
      toast.error("Failed to load lecture sections");
    }
  };

  const resetNonLectureSectionStage = () => {
    setNonLectureSections([]);
    setSelectionStage('lecture');
  }

  // Fetch non-lecture sections for a given lecture section
  const fetchNonLectureSections = async (lectureId) => {
    try {
      if (!lectureId) {
        resetNonLectureSectionStage();
        return;
      }
      const response = await apiClient.get(`/api/courses/lectures/${lectureId}/non-lectures/`);
      const data = await response.data;
      console.log(data)
      if (Array.isArray(data) && data.length > 0) {
        setNonLectureSections(data);
      } else {
        resetNonLectureSectionStage();
      }
    } catch (err) {
      toast.error("Failed to load non-lecture sections");
    }
  };

  const handleDepartmentSelection = async (selectedItem) => {
    const departmentId = selectedItem?.department?.id;
    const department = availableDepartments.find((course) => course.id === parseInt(departmentId));
    setSelectedDepartment(department);
    setSelectedCourse(null);
    setSelectedLectureSection(null);
    setSelectedNonLectureSection(null);
    setLectureSections([]);
    setNonLectureSections([]);
    setSelectionStage('course');
    await fetchCourses(departmentId);
  }

  // Handle course selection from dropdown
  const handleCourseSelection = async (selectedItem) => {
    const courseId = selectedItem?.course?.id;
    const course = courses.find(course => course.id === parseInt(courseId));
    setSelectedCourse(course);
    setSelectedLectureSection(null);
    setSelectedNonLectureSection(null);
    setLectureSections([]);
    setNonLectureSections([]);
    setSelectionStage('lecture');
    await fetchLectureSections(courseId);
  };

  // Handle lecture section selection from dropdown
  const handleLectureSelection = async (selectedItem) => {
    const lectureId = selectedItem?.lecture?.id;
    const lecture = lectureSections.find(lecture => lecture.id === parseInt(lectureId));
    setSelectedLectureSection(lecture);
    setSelectedNonLectureSection(null);
    setSelectionStage('non-lecture');
    await fetchNonLectureSections(lectureId);
  };

  // Handle non-lecture section selection from dropdown
  const handleNonLectureSelection = (selectedItem) => {
    const nonLectureId = selectedItem?.nonLecture?.id;
    const nonLecture = nonLectureSections.find(nonLecture => nonLecture.id === parseInt(nonLectureId));
    setSelectedNonLectureSection(nonLecture);
  };

  const handleCancelSelection = () => {
    setSelectedDepartment(null);
    setSelectedCourse(null);
    setSelectedLectureSection(null);
    setSelectedNonLectureSection(null);
    setCourses([]);
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

  // Flattens the schedule field of a lecture/non lecture section object into a single string (ex: 'We 13:30 - 14:20 | Fr 12:30 - 14:20')
  function flattenScheduleField(lecture) {
    return [...new Set(
        lecture.schedule?.flatMap(block =>
            block.days.split(", ").map(
                day => `${day || 'N/A'} ${block?.startTime || `N/A`} - ${block?.endTime || 'N/A'}`
            )
        )
    )
    ].join(" | ");
  }

  function prepareSelectionData(data, type) {
    switch (type) {
      case "department":

        return data.map(department => {
          return {
            value: `${department.code} - ${department.name}`,
            label: `${department.code} - ${department.name}`,
            department: department
          }
        });

      case "course":
        return data.map(course => {
          return {
            value: `${course.department} ${course.course_number} - ${course.title}`,
            label: `${course.department} ${course.course_number} - ${course.title}`,
            course: course
          }
        });

      case "lecture":

        return data.map(lecture => {
          return {
            value: `${lecture.section_code} - ${flattenScheduleField(lecture)}`,
            label: `${lecture.section_code} - ${flattenScheduleField(lecture)}`,
            lecture: lecture
          }
        });

      case "non-lecture":

        return data.map(nonLecture => {
          return {
            value: `${nonLecture.section_code} - ${flattenScheduleField(nonLecture)}`,
            label: `${nonLecture.section_code} - ${flattenScheduleField(nonLecture)}`,
            nonLecture: nonLecture
          }
        });
    }
  }

  return (
    <>
      <Toaster position="top-center" duration={5000} reverseOrder={false} />
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

              <Col md={selectionStage === "course" || selectionStage === "department" ? 12 : 4}>

                <Form.Group controlId="departmentSelection">
                  <Form.Label className="small fw-bold text-uppercase text-muted">1. Select Department</Form.Label>
                  <SearchSelectionBar data={prepareSelectionData(availableDepartments, 'department')} onSelect={handleDepartmentSelection}/>
                </Form.Group>

                {selectedDepartment && courses.length > 0 && (
                  <Form.Group controlId="courseSelection">
                    <Form.Label className="small fw-bold text-uppercase text-muted">2. Select Course</Form.Label>
                    <SearchSelectionBar data={prepareSelectionData(courses, 'course')} onSelect={handleCourseSelection}/>
                  </Form.Group>
                )}
              </Col>
              {selectedCourse && uniqueLectureSections.length > 0 && (
                <Col md={4}>
                  <Form.Group controlId="lectureSectionSelect">
                    <Form.Label className="small fw-bold text-uppercase text-muted">3. Select a Lecture</Form.Label>
                      <SearchSelectionBar data={prepareSelectionData(lectureSections, 'lecture')} onSelect={handleLectureSelection}/>
                  </Form.Group>
                </Col>
              )}
              {selectedLectureSection && nonLectureSections.length > 0 && (
                <Col md={4}>
                  <Form.Group controlId="nonLectureSectionSelect">
                    <Form.Label className="small fw-bold text-uppercase text-muted">4. Select a Lab/Tutorial</Form.Label>
                    <SearchSelectionBar data={prepareSelectionData(nonLectureSections, 'non-lecture')} onSelect={handleNonLectureSelection}/>
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
                    className="px-4 py-1 shadow-sm text-nowrap d-flex align-items-center gap-2"
                    onClick={handleAddCourse}
                  >
                    <BsPlusLg/>Add to Schedule
                  </Button>
                )}
                <Button
                  variant="outline-secondary"
                  size="lg"
                  style={{ width: 'max-content' }}
                  className="px-4 py-1 shadow-sm text-nowrap d-flex align-items-center gap-2"
                  onClick={handleCancelSelection}
                >
                  <BsXLg/>Cancel
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        <div className="d-flex align-items-center gap-3 mb-3">
          <h4 className="fw-bold mb-0 ms-2">Your Current Schedule</h4>
          <div className="d-flex gap-2 flex-grow-1">
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


            <Dialog dialog_func={handleRemoveAllCourses} confirmation_msg={"Are you sure you want to clear your entire schedule?"} button_component={
              <Button
              variant="outline-danger"
              size="md"
              style={{ width: 'max-content' }}
              className="d-flex align-items-center gap-2 ms-auto me-2"
              >
              <BsTrash /> Clear Schedule
              </Button>
            } action="Removing All Courses"/>

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
                          <span className="ms-1 text-primary">({flattenScheduleField(lectureData)})
                        </span>
                        </span>
                        {nonLectureData && (
                          <span>
                            <strong>Non-Lecture:</strong> {nonLectureData.section_code} 
                            <span className="ms-1 text-primary">({flattenScheduleField(nonLectureData)})</span>
                          </span>
                        )}
                      </div>
                    </div>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        className="rounded-pill px-3 d-flex align-items-center gap-1"
                        onClick={() => handleRemoveCourse(item, index)}
                      >
                        <BsTrash /> Remove
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
