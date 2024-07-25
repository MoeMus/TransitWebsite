import axios from "axios";
import {useState} from "react";


export function Login(){

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const submit = async e =>{

        e.preventDefault()

        const userCredentials = {
            username: username,
            password: password
        }

        try{
             //Send credentials to retrieve access and login tokens at /token/
            const response = await axios.post('http://127.0.0.1:8000/token/', userCredentials, {
                headers: {
                    "Content-Type": "application/json",
                },
                withCredentials: true
            });

            //Clear local storage in the browser and update the access and refresh tokens there

            if(response.status !== 200){
                throw new Error("Incorrect username of password");
            }

            const {data} = response;
            localStorage.clear();
            localStorage.setItem('access_token', data.access);
            localStorage.setItem('refresh_token', data.refresh);

            //Require that all axios request also contain the access token in order to send authorized requests
            axios.defaults.headers.common['Authorization'] = `Bearer ${data.access}`

            window.location.href = '/account'
        } catch (err){
            console.log(err);
        }


    }

    return (

        <>
            <div className="Auth-form-container" style={{
                position: 'absolute', left: '50%', top: '50%',
                transform: 'translate(-50%, -50%)',
                boxShadow: '0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)',
                padding: '20px'
            }}>

                <form onSubmit={submit} className="Auth-form">

                    <div className="Auth-form-content">

                        <h3 className="Auth-form-title" style={{margin: '50px',
                            marginBottom: '200px',
                            fontWeight: 'bolder'}
                        }>
                            Enter your username and password to continue

                        </h3>

                        <div className="form-group mt-3">

                            <label>Username</label>

                            <input className="form-control mt-1"
                                   placeholder="Enter Username"
                                   name='username'
                                   type='text' value={username}
                                   required
                                   onChange={e => setUsername(e.target.value)}/>

                        </div>

                        <div className="form-group mt-3">

                            <label>Password</label>

                            <input name='password'
                                   type="password"
                                   className="form-control mt-1"
                                   placeholder="Enter password"
                                   value={password}
                                   required
                                   onChange={e => setPassword(e.target.value)}/>

                        </div>

                        <div className="d-grid gap-2 mt-3">

                            <button type="submit"

                                    className="btn btn-primary"> Continue

                            </button>
                        </div>

                    </div>


                </form>

            </div>

        </>


    )

}