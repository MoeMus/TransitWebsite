import './App.css';
import {BrowserRouter, Route, Routes} from "react-router-dom";
import {Navigation} from "./components/navigation-bar";
import {Login} from "./components/login-form";
import {useEffect, useState} from "react";
import {Register} from "./components/register";

function App() {

  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
     if (localStorage.getItem('access_token') !== null) {
        setIsAuth(true);
      }
    }, [isAuth]);


  return (

      <>

          {/*  When components are created, make the routers here */}

          <BrowserRouter>
              <Navigation></Navigation>
              <Routes>
                  {/*<Route path="/" element={<Home/>}/>*/}
                  <Route path="/signup" element={<Register />} />
                  <Route path="/registration" element={}/>
                  <Route path="/login" element={<Login/>}/>
                  {/*<Route path="/logout" element={<Logout/>}/>*/}
              </Routes>
          </BrowserRouter>;

          <Navigation isAuthenticated={isAuth}/>


        {isAuth ? null: <Login /> }
      </>


  );
}

export default App;
