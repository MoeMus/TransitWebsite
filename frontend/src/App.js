import './App.css';
import {Navigate, Route, Routes} from "react-router-dom";
import {Navigation} from "./components/navigation-bar";
import {Login} from "./login-registration-page/login-form";
import React, {useEffect, useState} from "react";
import {Register} from "./login-registration-page/register";
import {RegistrationPage} from "./login-registration-page/registrationPage";
import {Dashboard} from "./dashboard/dashboard";
import refreshAccessToken from "./configurations/refreshAccessToken";
import WelcomePage from "./components/welcomePage";
import {ScheduleBuilder} from "./schedule-builder/scheduleBuilder";

function App() {

  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(true);

  refreshAccessToken(); //Refreshes access and refresh tokens before they expire

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
      <Navigation username={sessionStorage.getItem("user")}/>

      <Routes>
        <Route path="/" element={isAuth ? <Navigate to="/dashboard" replace={true} /> : <Navigate to="/registration" replace={true} />} />
        <Route path="/dashboard" element={isAuth ? <Dashboard /> : <Navigate to="/registration" replace={true} />} />
        <Route path="/signup" element={<Register />} />
        <Route path="/registration" element={ isAuth ?  <Dashboard /> : <RegistrationPage />} />
        <Route path="/login" element={<Login />} />
        {/* Uncomment and add other routes as needed */}
      </Routes>
    </>
  );
}

export default App;
