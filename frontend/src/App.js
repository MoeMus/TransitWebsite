import './App.css';
import {Navigate, Route, Routes} from "react-router-dom";
import {Navigation} from "./components/navigation-bar";
import {Login} from "./components/login-form";
import React, {useEffect, useState} from "react";
import {Register} from "./components/register";
import {RegistrationPage} from "./components/registrationPage";
import {Dashboard} from "./components/dashboard";

function App() {

  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
     if (sessionStorage.getItem('access_token') !== null) {
        setIsAuth(true);
     } else {
         setIsAuth(false);
     }
     setLoading(false);
  }, []);

  if (loading) {
      return <div>Loading...</div>;
  }

  return (
    <>
      <Navigation isAuthenticated={isAuth} />

      <Routes>
        <Route path="/" element={isAuth ? <Navigate to="/dashboard" replace={true} /> : <Navigate to="/registration" replace={true} />} />
        <Route path="/dashboard" element={isAuth ? <Dashboard /> : <Navigate to="/registration" replace={true} />} />
        <Route path="/signup" element={<Register />} />
        <Route path="/registration" element={<RegistrationPage />} />
        <Route path="/login" element={<Login />} />
        {/* Uncomment and add other routes as needed */}
        {/* <Route path="/welcome" element={<WelcomePage />} /> */}
      </Routes>
    </>
  );
}

export default App;
