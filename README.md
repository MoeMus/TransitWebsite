# TODO: 
- **Set up User and Courses models in models.py**✅  
- **Register models in admin.py**: ✅  
User, Courses  
- **Migrations**:  ✅  
python manage.py makemigrations  
python manage.py migrate  
- **Set up Django REST Framework by creating serializers (in core/serializerspy)✅,**  
- **views (in core/views.py)** **July 19 2024: Views is in progress**,  
- and **defining URL routes (in core/urls.py) and include them in in backend/urls.py** ✅**July 19, 2024**  
- **Create REACT frontend project to communicate with Django backend using Axios**  

Backend must support login and authentication  
Ability to add, remove courses, and get rid of all courses when semester is over  
Have user table for each user on the website; for every single one of those clear their courses  
Be able to retrieve information about the course, possibly using the frontend with the SFU REST Course API, if the user chooses a course then add it to the backend  
Calculate travel time for user depending on course start time  
Ability for user to delete their account  
Backend must check for incompatible course times  
Check if a course section is not there anymore, if true then remove the course from the user's schedule  
Ability to create a user account  

**July 6, 2024**  
Calculate course start and end times  
Calculate travel time for user depending on course start time  
Ability for user to delete their account  
Backend must check for incompatible course times   
View and change courses schedule in settings  
Change password  
Look into Geolocation API, Google Maps API, Translink API  
Setting car, transit options  
Search bar for courses with auto recommendations  

**August 27, 2024**  



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

- Python 3.10
- Node.js (for React front-end)
- MySQL

### Backend Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/MoeMus/TransitWebsite.git
   cd sfu-transit-app/backend

2. **Create the virtual environment**

   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Linux
   venv\Scripts\activate # On Windows

3. **Install the packages**

   ```bash
   pip install -r requirements.txt

4. **Make sure you're using the port you want to use in `backend/settings.py`**  
   **Environment variables for MySQL and Django will be set in the next step**

   ```python
   DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.mysql",
        "NAME": 'python_database',
        'USER': 'root',
        'PASSWORD': pw,
        'HOST': 'localhost',
        'PORT': '3306',
    }
   }  


5. **Set Environment Variables**  
   ![Linux](https://img.icons8.com/color/48/000000/linux.png) ![Mac](https://img.icons8.com/ios-filled/50/000000/mac-os.png) **Linux/MacOS:**

   1. Open the text editor:
      ```bash
      nano ~/.bashrc  
      ```

   2. Add the following, replacing the MySQL password and Django secret key with your key:
      ```bash
      export MYSQL_PASSWORD_TRANSIT='your_mysql_password'
      export DJANGO_SECRET_KEY='your_django_secret_key'
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

7. **Run the server**
   ```bash
   python manage.py runserver

### Frontend Setup
1. Navigate to the directory for frontend
   ```bash
   cd ../frontend

2. Install the NodeJS packages
   ```bash
   npm install

3. Start the React development server
   ```bash
   npm start
