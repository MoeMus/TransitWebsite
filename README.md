# SFU Transit Web App

## Overview

The SFU Transit Web App integrates students' course schedules with transit and driving information.
## What we used

### Front-End

- **React**
- **Axios**
- **React Router**
- **React Redux**

### Back-End

- **Django**
- **Django REST Framework**
- **Celery**

### Database

- **MySQL**

### APIs

- **Translink API**
- **Google Maps API**
- **SFU Course Outline REST API**

### Python & JavaScript Libraries

- **npm**: A package manager for JavaScript.


## Installation

Follow these steps to set up the project and install the required packages for Racoon.

### Prerequisites

- Python 3.12+
- Node.js (for React front-end)
- MySQL
- Docker (Optional, but recommended)

**Clone the repository**

   ```bash
   git clone https://github.com/MoeMus/TransitWebsite.git
   cd TransitWebsite/backend
   ```

## Backend Setup
Ensure you are in the `/backend` directory

1. **Create the virtual environment**

   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Linux
   venv\Scripts\activate # On Windows

2. **Install the packages**

   ```bash
   pip install -r requirements.txt

3. **Set up Translink API**
   - Go to https://developer.translink.ca/ and register for an account.
   - Use your API key for the `TRANSLINK_API_KEY` variable in the next steps.

4. **Set up Cloudflare Turnstile Secret Key**
   - Log in to Cloudflare and go to the Cloudflare Dashboard
   - Navigate to Turnstile on the left-hand sidebar
   - Click **Add site**
   - Configure a site name (Transit Website)
   - Add the domain for which the widget will be used. For local development, use `localhost`.
   - Select the **Managed** widget
   - Click **Create** to obtain your **Site Key** and **Secret Key**.
   - Add the **Secret Key** to your backend `.env` file as `TURNSTILE_SECRET_KEY` (see the next step)
   - The **Site Key** will be used in the frontend `.env` file as `REACT_APP_TURNSTILE_SITE_KEY`. Frontend setup will be explained after the backend setup instructions in this README file.
   
5. **Make sure you're using the port you want to use in `backend/settings.py`** 

   **Create a `.env` file in the root directory with these environment variables to establish
   the database connection**
   ```bash
   TRANSIT_DB_PASSWORD=
   TRANSIT_DB_NAME=
   TRANSIT_DB_USER=
   TRANSIT_DB_HOST=
   TRANSIT_DB_PORT=
   TRANSIT_ALLOWED_HOSTS= # Address of backend server (e.g, localhost 127.0.0.1 [::1])
   DJANGO_SECRET_KEY=
   TRANSLINK_API_KEY=
   DEBUG=True
   TURNSTILE_SECRET_KEY= # From Cloudflare Turnstile
   TRANSIT_EMAIL_HOST=smtp.gmail.com # Uses the Gmail SMTP server
   TRANSIT_EMAIL_PORT=587
   TRANSIT_EMAIL_USE_TLS=true
   TRANSIT_EMAIL_USE_SSL=false
   TRANSIT_EMAIL_HOST_USER= # Your email address
   TRANSIT_EMAIL_HOST_PASSWORD= # Gmail app password registered on your gmail
   ```
   **Read [this](https://accounts.google.com/v3/signin/challenge/pwd?TL=AHE1sGV9XMilxGRveqbZdvCaL7SpB--e_wOOgCEFHnZmfWNnfU-8JnCid1b-EUtA&authuser=0&cid=4&continue=https%3A%2F%2Fmyaccount.google.com%2Fapppasswords&dsh=S1426459969%3A1767562290145522&flowName=GlifWebSignIn&followup=https%3A%2F%2Fmyaccount.google.com%2Fapppasswords&ifkv=Ac2yZaWk9sOhYvQGM5qKILVK1otpvYKcOF6els6DxLnC3H0kvKZmTXXAZdTckdQJCa5x_AiFeEMx&osid=1&rart=ANgoxcdBbGVO3rOtWAtfTDNglOeKdTwFKssCL4bd6b8A8QiKjlexo8z8CDqrGaz5W_MLeGBigGBlsRkUwKSmoZdJu81Qz3jLdRIqsc6p3Ig46UDS2GYtGGM&rpbg=1&service=accountsettings) to set up an app password**

6. **Set Environment Variables For MySQL and Django**  
   ![Linux](https://img.icons8.com/color/48/000000/linux.png) ![Mac](https://img.icons8.com/ios-filled/50/000000/mac-os.png) **Linux/MacOS:**

   1. Open the text editor:
      ```bash
      nano ~/.bashrc  
      ```

   2. Add the following, replacing the MySQL password and Django secret key with your key:
      ```bash
      export TRANSIT_DB_PASSWORD='your_mysql_password'
      export DJANGO_SECRET_KEY='your_django_secret_key'
      export TRANSLINK_API_KEY='your_translink_key'
      ```

   3. Save the file and reload it:
      ```bash
      source ~/.bashrc
      ```

   ![Windows](https://img.icons8.com/?size=50&id=TuXN3JNUBGOT&format=png&color=000000) **Windows:**
   1. Open `Win + X`, click `System` then `Advanced System Settings`
   2. Click on `Environment Variables`
   3. Click on `New` under User or System variables, depending on whether you want it to be system-wide or for the current user only
   4. Set `TRANSIT_DB_PASSWORD` as the variable name and your MySQL password as the value
   5. Set `DJANGO_SECRET_KEY` as the variable name and your Django secret key as the value
   6. Click `OK` on all of the New System Variable, Environment Variables, and System Properties windows


7. **Make migrations**
   ```bash
   python manage.py makemigrations
   python manage.py migrate

8. **Set up Celery Beat and worker node**
   ```bash
   # Requires Redis as a message queue
   redis-server
   
   # Start Celery Beat
   celery -A backend beat -l info
   
   # Start Celery Worker Node
   celery -A backend worker -l info
   ```

9. **Run the server**
   ```bash
   python manage.py runserver

   ### Alternatively, you can use Docker to run the backend (Recommended)
   
   # Update containers with any new changes
   docker compose build
   
   # Run Backend
   docker compose up
   ```
10. **Running Cron Jobs Manually**

   **All cron jobs are handled by Celery, but can be run manually for development/testing purposes**

   **Every 4 months, the server will update all course data for the new semester by scraping the SFU Course Outlines API. If you want to run this manually, do the following:**
   ```bash
   # Locally
   python manage.py update_course_data
   
   # In Docker
   docker exec transit_server python manage.py update_course_data
   ```

   **At the end of each day, the server will clear all blacklisted or expired refresh tokens from the database. To do this manually, Django already**
   **provides a `flushexpiredtokens` management command that can be run as follows:**
   ```bash
   # Locally
   python manage.py flushexpiredtokens
   
   # In Docker
   docker exec transit_server python manage.py flushexpiredtokens 
   ```
   
   **At the end of each day, the server will clear all expired OTPs from password resets and account creations. To run this manually, do the following:**
   ```bash
   # Locally
   python manage.py remove_expired_otps
   
   # In Docker
   docker exec transit_server python manage.py remove_expired_otps
   ```
### Frontend Setup


Ensure you are in the `/frontend` directory

1. **Install the NodeJS packages**
   ```bash
   npm install

2. **Set up environment variables by creating a file called `.env` in the `/frontend` directory and add each environment variables on each line in the
   form**
   ```bash
   <Environment Variable> = '<value>'

3. **Set up Google Maps API**
   - Go to the [Google Cloud Console](https://console.cloud.google.com/).
   - Create a project and obtain an API key.
   - Ensure the following APIs are enabled for your key:
     - **Maps JavaScript API** (for the map display)
     - **Directions API** (for route calculations)
     - **Geocoding API** (for manual location input)
     - **Places API** (for search functionality)
   - Add the key to `.env` with the exact variable name `REACT_APP_GOOGLE_MAPS_API_KEY`
   
4. **Set up A Map ID**
   - In the Google Maps Platform select the project for this website and on the left side, click `Map Management`
   - Click `CREATE MAP ID`
   - Enter a name and set the map type as Javascript, vector, with both rotation and tilt, and click save
   - The map ID should be visible afterwards
   - Save it as an environment variable as `REACT_APP_GOOGLE_MAP_ID` in .env

5. **Set up Cloudflare Turnstile Site Key**
   - Add the **Site Key** you received from the backend setup instructions to your frontend `.env` file as `REACT_APP_TURNSTILE_SITE_KEY`.

6. **Start the React development server**
   ```bash
   npm start
