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

- Python 3.10+
- Node.js (for React front-end)
- MySQL
- Docker (Optional, but recommended)

**Clone the repository**

   ```bash
   git clone https://github.com/MoeMus/TransitWebsite.git
   cd sfu-transit-app/backend
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

3. **Make sure you're using the port you want to use in `backend/settings.py`** 

   **Create a `.env` file in the root directory with these environment variables to establish
   the database connection**
   ```bash
   TRANSIT_DB_PASSWORD=
   TRANSIT_DB_NAME=
   TRANSIT_DB_USER=
   TRANSIT_DB_HOST=
   TRANSIT_DB_PORT=
   TRANSIT_ALLOWED_HOSTS= # Address of backend server (e.g, localhost 127.0.0.1 [::1])

4. **Set Environment Variables For MySQL and Django**  
   ![Linux](https://img.icons8.com/color/48/000000/linux.png) ![Mac](https://img.icons8.com/ios-filled/50/000000/mac-os.png) **Linux/MacOS:**

   1. Open the text editor:
      ```bash
      nano ~/.bashrc  
      ```

   2. Add the following, replacing the MySQL password and Django secret key with your key:
      ```bash
      export MYSQL_PASSWORD_TRANSIT='your_mysql_password'
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
   4. Set `MYSQL_PASSWORD_TRANSIT` as the variable name and your MySQL password as the value
   5. Set `DJANGO_SECRET_KEY` as the variable name and your Django secret key as the value
   6. Click `OK` on all of the New System Variable, Environment Variables, and System Properties windows


5. **Make migrations**
   ```bash
   python manage.py makemigrations
   python manage.py migrate

6. **Set up Celery Beat and Worker Node**
   ```bash
   # Requires Redis as a message queue
   redis-server
   
   # Start Celery Beat
   celery -A backend beat -l info
   
   # Start Celery Worker Node
   celery -A backend worker -l info
   ```

7. **Run the server**
   ```bash
   python manage.py runserver

   ### Alternatively, you can use Docker to run the backend (Recommended)
   
   # Update Containers with any new changes
   docker compose build
   
   # Run Backend
   docker compose up
   ```
8. **Running Cron Job Manually**

   **Every 4 months, the server will update all course data for the new semester by scraping the SFU Course Outlines API**
   **This is set up as a cron job that is managed by Celery. If you want to run this manually, do the following:**
   ```bash
   # Locally
   python manage.py run_cron_job
   
   # In Docker
   docker exec transit_server python manage.py run_cron_job
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
   - Go to https://developers.google.com/maps/documentation/routes/cloud-setup and follow the instructions to obtain the API key for the Google Maps API
   - Add the key to `.env` with the exact variable name `REACT_APP_GOOGLE_MAPS_API_KEY`
   
4. **Set up A Map ID**
   - In the Google Maps Platform select the project for this website and on the left side, click `Map Management`
   - Click `CREATE MAP ID`
   - Enter a name and set the map type as Javascript, vector, with both rotation and tilt, and click save
   - The map ID should be visible afterwards
   - Save it as an environment variable as `REACT_APP_GOOGLE_MAP_ID` in .env

5. **Start the React development server**
   ```bash
   npm start
