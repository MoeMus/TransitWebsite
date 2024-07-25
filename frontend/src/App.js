import './App.css';
import {BrowserRouter, Route, Routes} from "react-router-dom";
import {Navigation} from "./components/navigation-bar";
import {Login} from "./components/login-form";
import {useEffect, useState} from "react";

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

        {isAuth ? null: <Login /> }
        <Login />
      </>


  );
}

export default App;
