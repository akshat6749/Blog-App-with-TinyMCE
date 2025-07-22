Here is a README file for your project.

# Blog App with TinyMCE

This is a full-stack blog application featuring a React frontend with Vite and a Django backend. It includes user authentication, post creation and management, and a rich text editor powered by TinyMCE.

## Features

  * **User Authentication**: Users can register, log in, and log out.
  * **Post Management**: Authenticated users can create, edit, and delete their own blog posts.
  * **Rich Text Editor**: The app uses TinyMCE to provide a powerful and intuitive editor for creating and editing blog content.
  * **File Uploads**: Users can upload featured images for their posts.
  * **RESTful API**: The Django backend provides a robust API for managing users, posts, and files.

## Technologies Used

### Frontend

  * **React**: A JavaScript library for building user interfaces.
  * **Vite**: A fast build tool for modern web development.
  * **Redux Toolkit**: For state management.
  * **React Router**: For client-side routing.
  * **Tailwind CSS**: A utility-first CSS framework for styling.
  * **Axios**: For making HTTP requests to the backend API.
  * **TinyMCE**: A rich text editor component for React.

### Backend

  * **Django**: A high-level Python web framework.
  * **Django REST Framework**: A powerful and flexible toolkit for building Web APIs.
  * **Django Simple JWT**: A JSON Web Token authentication plugin for Django REST Framework.
  * **MySQL**: The application is configured to use a MySQL database.
  * **Pillow**: A library for image processing in Python.

## Project Structure

```
/
├── frontend/
│ ├── public/
│ ├── src/
│ │ ├── appwrite/
│ │ ├── assets/
│ │ ├── components/
│ │ ├── conf/
│ │ ├── pages/
│ │ ├── store/
│ │ ├── App.jsx
│ │ ├── index.css
│ │ └── main.jsx
│ ├── .env
│ ├── .gitignore
│ ├── index.html
│ ├── package.json
│ └── ...
└── backend/
  ├── api/
  │ ├── migrations/
  │ ├── __pycache__/
  │ ├── admin.py
  │ ├── apps.py
  │ ├── models.py
  │ ├── serializers.py
  │ ├── tests.py
  │ ├── urls.py
  │ └── views.py
  ├── backend/
  │ ├── __pycache__/
  │ ├── asgi.py
  │ ├── settings.py
  │ ├── urls.py
  │ └── wsgi.py
  ├── media/
  ├── .env
  ├── manage.py
  └── requirements.txt
```

## Setup and Installation

### Prerequisites

  * Node.js and npm (or yarn)
  * Python and pip
  * MySQL

### Frontend

1.  Navigate to the `frontend` directory: `cd frontend`
2.  Install the dependencies: `npm install`
3.  Create a `.env` file and add your API URL: `VITE_API_URL=http://localhost:8000/api`
4.  Start the development server: `npm run dev`

### Backend

1.  Navigate to the `backend` directory: `cd backend`
2.  Create a virtual environment: `python -m venv venv`
3.  Activate the virtual environment: `source venv/bin/activate` (on macOS/Linux) or `.\venv\Scripts\activate` (on Windows)
4.  Install the required packages: `pip install -r requirements.txt`
5.  Create a `.env` file and configure your database settings and secret key.
6.  Apply the database migrations: `python manage.py migrate`
7.  Start the development server: `python manage.py runserver`
