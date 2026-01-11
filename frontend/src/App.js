import './App.css';
import {Navigate, Route, Routes} from "react-router-dom";
import {Navigation} from "./components/navigation-bar";
import {Login} from "./login-registration-page/login-form";
import {Register} from "./login-registration-page/register";
import {RegistrationPage} from "./login-registration-page/registrationPage";
import {Dashboard} from "./dashboard/dashboard";
import PasswordResetPage from "./reset-password/password-reset-page";
import {ScheduleBuilder} from "./schedule-builder/scheduleBuilder";
import { Provider } from "./components/ui/provider"
import PasswordResetForm from "./reset-password/password-reset-form";
import {useSelector} from "react-redux";
import useCheckAccessToken from "./configurations/refreshAccessToken";
import WelcomePage from "./components/welcomePage";
function App() {

    const { is_authenticated } = useSelector((state) => state.authentication);
    useCheckAccessToken();

    return (
        <>
            <Provider>

                <Navigation />
                <Routes>
                <Route path="/" element={is_authenticated ? <Navigate to="/dashboard" replace={true} /> : <Navigate to="/registration" replace={true} />} />
                <Route path="/dashboard" element={is_authenticated ? <Dashboard /> : <Navigate to="/registration" replace={true} />} />
                <Route path="/signup" element={<Register />} />
                <Route path="/registration" element={ is_authenticated ?  <Dashboard /> : <RegistrationPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/schedule-builder" element={ is_authenticated ? <ScheduleBuilder /> : <Navigate to="/registration" replace={true} /> } />
                <Route path="/password/forgot" element={<PasswordResetPage />} />
                <Route path="/password/reset" element={<PasswordResetForm />} />
                <Route path="/welcome" element={ is_authenticated ? <WelcomePage /> : <Navigate to="/registration" replace={true} /> } />

                {/* Uncomment and add other routes as needed */}
                </Routes>

            </Provider>

        </>
    );
}

export default App;
