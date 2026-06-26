# GimmeFood

GimmeFood is a bilingual web application developed as a group project
for a university Software Engineering course. It connects restaurants
that have surplus food with customers looking for free or discounted meals.

## Project Purpose

The project aims to reduce food waste by allowing restaurant owners to
publish available surplus food and customers to request available portions.

## Features

### Customers
- Register and log in
- Browse available food
- Search and filter food items
- Request a portion
- View request history
- Receive approval or rejection notifications
- Switch between English and Turkish

### Restaurant Owners
- Register and log in
- Add surplus food items
- Manage available inventory
- View customer requests
- Approve or decline requests
- Receive request notifications
- Switch between English and Turkish

## Technology Stack

### Frontend
- HTML5
- CSS3
- Vanilla JavaScript
- Custom English/Turkish localization

### Backend
- Python
- Flask
- Flask-CORS
- Gunicorn

### Database and Deployment
- MySQL
- PyMySQL
- Railway

## Project Architecture

The frontend communicates with a Flask REST API. The backend stores user,
seller, food, request, and notification data in a MySQL database.

## Main API Endpoints

- POST `/api/signup-user`
- POST `/api/login`
- GET/POST `/api/food`
- POST `/api/request-food`
- GET `/api/owner-requests/<owner_id>`
- POST `/api/approve-request/<request_id>`
- POST `/api/decline-request/<request_id>`
- GET `/api/notifications/<user_id>`
- POST `/api/mark-notifications-read/<user_id>`
- GET `/api/customer-requests/<customer_id>`

## Local Setup

1. Clone the repository.

2. Install dependencies:

   pip install -r requirements.txt

3. Configure the MySQL environment variables:

   MYSQLHOST
   MYSQLPORT
   MYSQLUSER
   MYSQLPASSWORD
   MYSQLDATABASE

4. Update `config.js` for local development:

   window.API_BASE_URL = "http://127.0.0.1:5000";

5. Start the backend:

   python app.py

6. Open `index.html` using a local development server.

## Contributors

This project was completed by a team of four students as part of our
Software Engineering course.

Sofiia Valikaramova
Abdalla Mahmoud Bassiouny Elsayed Zahra
Safa Tasawur 
Sameel Ashfaq

## Project Status

This repository represents an academic prototype. Future improvements
may include token-based authentication, password hashing, automated
testing, image uploads, and more advanced inventory management.
