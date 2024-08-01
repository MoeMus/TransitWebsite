import './App.css';
import {Navigate, Route, Routes} from "react-router-dom";
import {Navigation} from "./components/navigation-bar";
import {Login} from "./components/login-form";
import React, {useEffect, useState} from "react";
import {Register} from "./components/register";
import {RegistrationPage} from "./components/registrationPage";

function App() {

  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
     if (localStorage.getItem('access_token') !== null) {
        setIsAuth(true);
      }
    }, [isAuth]);


  return (

      <>

          <Navigation isAuthenticated={isAuth}/>







          {isAuth ? null: <Navigate to="/registration" replace={true} /> }

          {/*When components are created, make the routers here*/}
          <Routes>
              {/*<Route path="/" element={<Home/>}/>*/}
              <Route path="/signup" element={<Register />} />
              <Route path="/registration" element={<RegistrationPage /> }/>
              <Route path="/login" element={<Login/>}/>
              {/*<Route path="/logout" element={<Logout/>}/>*/}
          </Routes>
      </>


  );
}

export default App;
