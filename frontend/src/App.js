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
     if (localStorage.getItem('access_token') !== null) {
        setIsAuth(true);
     } else {
         setIsAuth(false);
     }
     setLoading(false);
  }, []);

  if (loading) {
      return <div>Loading...</div>; // Or any loading spinner/component
  }

  return (

      <>

          <Navigation isAuthenticated={isAuth}/>

          {isAuth ? <Navigate to="/dashboard" replace={true} /> : <Navigate to="/registration" replace={true} /> }


          {/*When components are created, make the routers here*/}
          <Routes>
              <Route path="/dashboard" element={<Dashboard />}/>
              <Route path="/signup" element={<Register />} />
              <Route path="/registration" element={<RegistrationPage />}/>
              <Route path="/login" element={<Login />}/>
              {/*<Route path="/logout" element={<Logout/>}/>*/}
              {/*<Route path="/welcome" element={<WelcomePage />} />*/}
          </Routes>
      </>


  );
}

export default App;
