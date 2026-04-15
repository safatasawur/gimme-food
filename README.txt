# FoodSaver Project

FoodSaver is a web-based application designed to bridge the gap between restaurants with surplus food and customers looking for meals at a discount or for free. The project features a dual-portal system for Restaurant Owners and Customers, integrated with a Python-based backend.

## Project Structure

### Frontend (HTML/CSS/JS)
- index.html: The landing page containing Login and Signup functionality.
- signup.js: Logic for user registration and role selection (Owner/Customer).
- customer.html / customer.js: The interface for customers to browse, filter, and request food items.
- owner.html / owner.js: The dashboard for restaurant owners to manage their inventory and add new food items.
- profile.html / profile.js: User profile management page.
- style.css: Global styles for the application.

### Backend (Python/Flask)
- bridge.py: A Flask-based API that connects the frontend to a SQLite database. It handles data persistence for users and food inventory.

## Features

1.  User Authentication: Secure signup and login with role-based access control.
2.  Inventory Management: Owners can add food items with details like category, ingredients, expiry date, and type (Free/Discount).
3.  Discovery: Customers can search and filter food items by type or category.
4.  Request System: Customers can request portions of available food, which updates inventory in real-time via the API.
5.  Persistent Storage: Uses SQLite to store user accounts and food data.

## Setup Instructions

### Backend Setup
1. Ensure Python 3.x is installed.
2. Install dependencies:
   pip install flask flask-cors
3. Run the backend server:
   python bridge.py
   The server will run on http://127.0.0.1:5000.

### Frontend Setup
1. Open index.html in any modern web browser.
2. Ensure the backend (bridge.py) is running to allow data synchronization.

## Technologies Used
- Frontend: HTML5, CSS3, JavaScript (ES6)
- Backend: Python, Flask
- Database: SQLite
- API: RESTful via Flask-CORS
