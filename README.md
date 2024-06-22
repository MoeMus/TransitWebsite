# TODO: 
- **Set up User and Courses models in models.py**✅  
- **Register models in admin.py**: ✅  
User, Courses  
- **Migrations**:  ✅  
python manage.py makemigrations  
python manage.py migrate  
- **Set up Django REST Framework by creating serializers (in core/serializerspy), views (in core/views.py), and defining URL routes (in core/urls.py) and include them in in backend/urls.py**  
- **Create REACT frontend project to communicate with Django backend using Axios**  

Backend must support login and authentication  
Ability to add, remove courses, and get rid of all courses when semester is over  
Have user table for each user on the website; for every single one of those clear their courses  
Be able to retreieve information about the course, possibly using the frontend with the SFU REST Course API, if the user chooses a course then add it to the backend  
Calculate travel time for user depending on course start time  
Ability for user to delete their account  
Backend must check for incompatible course times  
Check if a course section is not there anymore, if true then remove the course from the user's schedule  
Ability to create a user account  


# SFU Transit Web App

## Overview

The SFU Transit Web App integrates students' course schedules with transit and driving information.
## What we used

### Front-End

- **React**
- **Axios** Use this HTTP client?
- **React Router**

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

