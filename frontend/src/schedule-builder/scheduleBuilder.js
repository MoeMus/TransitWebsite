import React, { useState, useEffect } from "react";

export function ScheduleBuilder() {
  const [availableCourses, setAvailableCourses] = useState([]);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAvailableCourses();
  }, []);
