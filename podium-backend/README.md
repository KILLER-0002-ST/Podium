

# Podiam Backend API

## Overview
Backend API for Podiam, built with Django and Django REST Framework, supporting user authentication, candidate management, and resume parsing functionality.

## Table of Contents
- [Installation](#installation)
- [Environment Setup](#environment-setup)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [AWS S3 Configuration](#aws-s3-configuration)
- [Authentication](#authentication)
- [Testing](#testing)

## Installation

### Prerequisites
- Python 3.10+
- PostgreSQL 12+
- Git

### Step 1: Clone the Repository
```bash
git clone <repository-url>
cd pulpit
```

### Step 2: Create Virtual Environment
```bash
python -m venv env
```

#### Activate Virtual Environment
- **Windows**:
  ```bash
  env\Scripts\activate
  ```
- **macOS/Linux**:
  ```bash
  source env/bin/activate
  ```

### Step 3: Install Dependencies
```bash
pip install -r requirements.txt
```

## Environment Setup

### Create .env File
Create a `.env` file in the project root with the following variables:

```
# Django Settings
SECRET_KEY=your_secret_key
DEBUG=True

# Database Settings
DB_NAME=your_db_name
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_HOST=localhost
DB_PORT=5432

# AWS S3 Settings
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_STORAGE_BUCKET_NAME=your_bucket_name

# Email Settings
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_HOST_USER=your_email@example.com
EMAIL_HOST_PASSWORD=your_email_password
```

## Database Setup

### PostgreSQL Setup
1. Create a PostgreSQL database:
   ```bash
   sudo -u postgres psql
   CREATE DATABASE your_db_name;
   CREATE USER your_db_user WITH PASSWORD 'your_db_password';
   GRANT ALL PRIVILEGES ON DATABASE your_db_name TO your_db_user;
   \q
   ```

2. Run migrations:
   ```bash
   python manage.py migrate
   ```

3. Create a superuser:
   ```bash
   python manage.py createsuperuser
   ```

## Running the Application

### Development Server
```bash
python manage.py runserver
```


## API Documentation

### Authentication Endpoints

#### Register User
- **URL**: `/api/auth/register/`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "secure_password",
    "first_name": "John",
    "last_name": "Doe"
  }
  ```
- **Response**: 
  ```json
  {
    "token": "auth_token",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe"
    }
  }
  ```

#### Login
- **URL**: `/api/auth/login/`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "secure_password"
  }
  ```
- **Response**:
  ```json
  {
    "token": "auth_token",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe"
    }
  }
  ```

#### Logout
- **URL**: `/api/auth/logout/`
- **Method**: `POST`
- **Headers**: `Authorization: Token auth_token`
- **Response**: `204 No Content`

#### Password Reset Request
- **URL**: `/api/auth/password_reset/`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "email": "user@example.com"
  }
  ```
- **Response**: `200 OK`

#### Password Reset Confirmation
- **URL**: `/api/auth/password_reset/confirm/`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "token": "reset_token",
    "password": "new_password"
  }
  ```
- **Response**: `200 OK`

#### Get User Profile
- **URL**: `/api/auth/profile/`
- **Method**: `GET`
- **Headers**: `Authorization: Token auth_token`
- **Response**:
  ```json
  {
    "id": 1,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "profile_picture": "url_to_picture"
  }
  ```

#### Update User Profile
- **URL**: `/api/auth/profile/`
- **Method**: `PUT`
- **Headers**: `Authorization: Token auth_token`
- **Request Body**:
  ```json
  {
    "first_name": "John",
    "last_name": "Smith",
    "profile_picture": "file_upload"
  }
  ```
- **Response**:
  ```json
  {
    "id": 1,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Smith",
    "profile_picture": "url_to_picture"
  }
  ```

### Candidate Management Endpoints

#### List Candidates
- **URL**: `/api/channels/candidates/`
- **Method**: `GET`
- **Headers**: `Authorization: Token auth_token`
- **Query Parameters**:
  - `page`: Page number
  - `search`: Search term
- **Response**:
  ```json
  {
    "count": 10,
    "next": "next_page_url",
    "previous": null,
    "results": [
      {
        "id": 1,
        "name": "Jane Smith",
        "email": "jane@example.com",
        "status": "PENDING",
        "created_at": "2023-05-20T10:00:00Z"
      },
      ...
    ]
  }
  ```

#### Create Candidate
- **URL**: `/api/channels/candidates/`
- **Method**: `POST`
- **Headers**: `Authorization: Token auth_token`
- **Request Body**:
  ```json
  {
    "name": "Jane Smith",
    "email": "jane@example.com",
    "resume": "file_upload"
  }
  ```
- **Response**:
  ```json
  {
    "id": 1,
    "name": "Jane Smith",
    "email": "jane@example.com",
    "status": "PENDING",
    "created_at": "2023-05-20T10:00:00Z",
    "resume_url": "url_to_resume"
  }
  ```

#### Get Candidate Detail
- **URL**: `/api/channels/candidates/{id}/`
- **Method**: `GET`
- **Headers**: `Authorization: Token auth_token`
- **Response**:
  ```json
  {
    "id": 1,
    "name": "Jane Smith",
    "email": "jane@example.com",
    "status": "PENDING",
    "created_at": "2023-05-20T10:00:00Z",
    "resume_url": "url_to_resume",
    "parsed_data": {
      "skills": ["Python", "Django", "React"],
      "education": ["Bachelor's in Computer Science"],
      "experience": ["Software Developer - 3 years"]
    }
  }
  ```

#### Update Candidate
- **URL**: `/api/channels/candidates/{id}/`
- **Method**: `PUT`
- **Headers**: `Authorization: Token auth_token`
- **Request Body**:
  ```json
  {
    "name": "Jane Smith",
    "email": "jane@example.com",
    "status": "INTERVIEWED"
  }
  ```
- **Response**:
  ```json
  {
    "id": 1,
    "name": "Jane Smith",
    "email": "jane@example.com",
    "status": "INTERVIEWED",
    "created_at": "2023-05-20T10:00:00Z",
    "resume_url": "url_to_resume"
  }
  ```

#### Delete Candidate
- **URL**: `/api/channels/candidates/{id}/`
- **Method**: `DELETE`
- **Headers**: `Authorization: Token auth_token`
- **Response**: `204 No Content`

## AWS S3 Configuration

### Configure AWS S3 Bucket
1. Create an AWS S3 bucket
2. Set up CORS configuration for your bucket:
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "POST", "PUT"],
       "AllowedOrigins": ["*"],
       "ExposeHeaders": [],
       "MaxAgeSeconds": 3000
     }
   ]
   ```
3. Configure IAM user with proper permissions
4. Update your `.env` file with AWS credentials

## Authentication

### Token Authentication
The API uses token-based authentication. Include the token in request headers:
```
Authorization: Token your_auth_token
```

### Social Authentication
For Google and Twitter authentication:
1. Configure OAuth in Django admin
2. Follow redirect flow for authentication

## Testing

### Running Tests
```bash
python manage.py test
```

### Creating Test Data
```bash
python manage.py loaddata test_data.json
```
