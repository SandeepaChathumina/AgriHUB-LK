# AgriHUB-LK — Backend API

AgriHUB-LK is a backend service that powers a web platform designed to streamline the agricultural supply chain in Sri Lanka. The service connects Farmers, Food Distributors, and Transporters to improve coordination, reduce food waste, and enable secure transactions.

This repository contains the Node.js/Express API and related services that support authentication, data persistence, payments, and AI-enhanced features.

## Table of Contents
- **About**
- **Features**
- **Tech Stack**
- **Repository Structure**
- **Getting Started**
    - Prerequisites
    - Installation
    - Environment
    - Run
- **Configuration**
- **Contributing**
- **Authors**
- **License**

## About
This backend implements a RESTful API using Express and MongoDB (Mongoose). It includes JWT-based authentication, payment integration with Stripe, email notifications, and optional AI features via Google Generative AI.

## Features
- Role-based authentication (Farmers, Distributors, Transporters)
- Secure password hashing and JWT authentication
- CRUD operations for core domain models (users, products, orders)
- Stripe payment processing
- Email notifications via Nodemailer
- Optional AI-powered utilities (Google Gemini)

## Tech Stack
- Node.js
- Express.js
- MongoDB with Mongoose
- JSON Web Tokens (`jsonwebtoken`) and `bcrypt`/`bcryptjs`
- Stripe (payments)
- Nodemailer (email)
- Google Generative AI (Gemini)

## Repository Structure

```
AGRIHUB-LK/
└── backend/
        ├── controllers/    # Route handlers and business logic
        ├── data/           # Seed data and static resources
        ├── middleware/     # Authentication, error handlers, etc.
        ├── models/         # Mongoose schemas
        ├── routes/         # API route definitions
        ├── utils/          # Helpers and integrations 
        ├── .env            # Environment variables (ignored by git)
        ├── index.js        # Application entry point
        └── package.json    # npm scripts and dependencies
```

## Getting Started

Follow these steps to run the backend locally for development.

### Prerequisites
- Node.js v16+ (LTS recommended)
- npm (or yarn)
- MongoDB (local or Atlas)
- Git

### Installation
Clone the repository and install dependencies:

```bash
git clone https://github.com/SandeepaChathumina/AgriHUB-LK.git
cd AgriHUB-LK/backend
npm install
```

### Environment
Create a `.env` file in the `backend` directory. Example variables:

```env
PORT=3000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
EMAIL_USER=you@example.com
EMAIL_PASS=your_email_app_password
GEMINI_API_KEY=your_gemini_api_key
EXCHANGE_RATE_API_KEY=your_exchange_api_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```


### Run (Development)
Start the server (uses `nodemon` if configured):

```bash
npm start
```

Check `index.js` for the default port and any additional startup options.

## Configuration
- Update environment variables to enable or disable optional integrations (AI, Stripe).
- Use a managed MongoDB service (Atlas) for production deployments.

## Authors
- IT23818620 — KARUNANAYAKE K.M.S.G
- IT23819092 — HANDARAGAMA M.U.
- IT23831254 — ABEYKOON A.M.H.M
- IT23800632 — GEETHANJANA K.M.G.T

🌾 AgriHUB-LK API Reference
Welcome to the core API documentation. This RESTful API serves as the backend for managing users, products, orders, and logistics across the platform.

📑 Table of Contents
Authentication Module

User Profile Management

Notification Management

AI Assistant Module

Order Management Module

Product Management Module

Vehicle Management Module

1. Authentication Module (/api/auth)
### 1.1 Register a New User
Registers a new Farmer, Distributor, Transporter, or Admin.

| | |
|---|---|
| **Method** | `POST` |
| **Endpoint** | `/auth/register` |
| **Auth Required** | No |

Request Body:

JSON
{
  "role": "Farmer",
  "fullName": "Kamal Perera",
  "email": "kamal@example.com",
  "password": "password123",
  "phone": "0771234567",
  "farmLocation": "Kandy" 
}
Success Response (201 Created):

JSON
{
  "message": "Farmer registered successfully! You can verify your account later.",
  "user": {
    "id": "65df...",
    "email": "kamal@example.com",
    "role": "Farmer",
    "isVerified": false
  }
}
### 1.2 User Login
Authenticates a user and returns a JWT token.

| | |
|---|---|
| **Method** | `POST` |
| **Endpoint** | `/auth/login` |
| **Auth Required** | No |

Request Body:

JSON
{
  "email": "kamal@example.com",
  "password": "password123"
}
Success Response (200 OK):

JSON
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR...",
  "user": {
    "id": "65df...",
    "fullName": "Kamal Perera",
    "role": "Farmer"
  }
}
### 1.3 Request Verification OTP
Sends a 6-digit OTP to the user's email to verify their account.

| | |
|---|---|
| **Method** | `POST` |
| **Endpoint** | `/auth/request-otp` |
| **Auth Required** | No |

Request Body:

JSON
{
  "email": "kamal@example.com"
}
### 1.4 Verify Email with OTP
Validates the OTP and marks the user's account as verified.

| | |
|---|---|
| **Method** | `POST` |
| **Endpoint** | `/auth/verify-email` |
| **Auth Required** | No |

Request Body:

JSON
{
  "email": "kamal@example.com",
  "otp": "123456"
}
### 1.5 Forgot Password (Request OTP)
Sends a password reset OTP to the user's email.

| | |
|---|---|
| **Method** | `POST` |
| **Endpoint** | `/auth/forgot-password` |
| **Auth Required** | No |

### 1.6 Reset Password
Updates the user's password using the provided OTP.

| | |
|---|---|
| **Method** | `POST` |
| **Endpoint** | `/auth/reset-password` |
| **Auth Required** | No |

Request Body:

JSON
{
  "email": "kamal@example.com",
  "otp": "654321",
  "newPassword": "newSecurePassword123"
}
2. User Profile Management Module (/api/users)
### 2.1 Get Logged-In User Profile
Retrieves the profile details of the currently authenticated user.

| | |
|---|---|
| **Method** | `GET` |
| **Endpoint** | `/users/profile` |
| **Auth Required** | ✅ Yes (Any Role) |

### 2.2 Update User Profile
Updates personal details. Passwords cannot be updated here.

| | |
|---|---|
| **Method** | `PUT` |
| **Endpoint** | `/users/profile` |
| **Auth Required** | ✅ Yes (Any Role) |

Request Body:

JSON
{
  "fullName": "Kamal Updated",
  "phone": "0719988776"
}
### 2.3 Delete Own Account
Permanently deletes the currently logged-in user's account.

| | |
|---|---|
| **Method** | `DELETE` |
| **Endpoint** | `/users/profile` |
| **Auth Required** | ✅ Yes (Any Role) |

### 2.4 Delete Specific User (Admin)
Permanently removes any user from the system by their ID.

| | |
|---|---|
| **Method** | `DELETE` |
| **Endpoint** | `/users/:id` |
| **Auth Required** | ✅ Yes (Admin Only) |

3. Notification Management Module (/api/notifications)
### 3.1 Get Filtered Users for Notification
Fetches a list of users based on role and verification status to target for messages.

| | |
|---|---|
| **Method** | `GET` |
| **Endpoint** | `/notifications/admin/users?role=Farmer&status=Unverified` |
| **Auth Required** | ✅ Yes (Admin Only) |

### 3.2 Send a Notification
Sends a notification to a specific user or in bulk.

| | |
|---|---|
| **Method** | `POST` |
| **Endpoint** | `/notifications/admin/send` |
| **Auth Required** | ✅ Yes (Admin Only) |

Request Body (Bulk Example):

JSON
{
  "targetType": "Bulk",
  "role": "Transporter",
  "verificationStatus": "Unverified",
  "title": "Verify Your Account",
  "message": "Check your email to verify!"
}
### 3.3 Manage All Sent Notifications
Views all notifications sent, with optional query filters.

| | |
|---|---|
| **Method** | `GET` |
| **Endpoint** | `/notifications/admin/manage` |
| **Auth Required** | ✅ Yes (Admin Only) |

### 3.4 Update an Unread Notification
Modifies the title or message of a notification (fails if already read).

| | |
|---|---|
| **Method** | `PUT` |
| **Endpoint** | `/notifications/admin/manage/:id` |
| **Auth Required** | ✅ Yes (Admin Only) |

### 3.5 Delete a Notification
Deletes a specific notification entirely.

| | |
|---|---|
| **Method** | `DELETE` |
| **Endpoint** | `/notifications/admin/manage/:id` |
| **Auth Required** | ✅ Yes (Admin Only) |

### 3.6 Get My Notifications
Retrieves the inbox of the currently logged-in user.

| | |
|---|---|
| **Method** | `GET` |
| **Endpoint** | `/notifications/my-notifications` |
| **Auth Required** | ✅ Yes (Any Role) |

### 3.7 Mark Notification as Read
Changes the isRead status of a specific notification to true.

| | |
|---|---|
| **Method** | `PUT` |
| **Endpoint** | `/notifications/:id/read` |
| **Auth Required** | ✅ Yes (Any Role) |

4. AI Assistant Module (/api/chat)
### 4.1 Ask the System Assistant
Queries the Gemini API strictly using the platform's knowledge base.

| | |
|---|---|
| **Method** | `POST` |
| **Endpoint** | `/chat/ask` |
| **Auth Required** | ✅ Yes (Any Role) |

Request Body:

JSON
{
  "question": "How do I become verified to post products?"
}
Success Response (200 OK):

JSON
{
  "success": true,
  "answer": "To become verified, you must request an OTP to your registered email..."
}
5. 📦 Order Management Module (/api/orders)
Integration Notes:

Stock logic: Stock is reduced immediately when an order is placed to prevent overselling. Cancellations restore stock automatically.

Payments: Utilizes Stripe Gateway. USD prices are fetched from a third-party API for Stripe compatibility.

### 5.1 Place a New Order
Creates a new order with Stripe payment integration. Automatically checks stock availability and initiates checkout.

| | |
|---|---|
| **Method** | `POST` |
| **Endpoint** | `/orders` |
| **Auth Required** | ✅ Yes (Distributor Only) |

Request Body:

JSON
{
  "productId": "69a1c3061f45...",
  "quantity": 2,
  "deliveryAddress": {
    "addressLine": "123 Galle Road",
    "city": "Colombo 03",
    "coordinates": { "lat": 6.9271, "lng": 79.8612 }
  }
}
### 5.2 Get My Orders (with Pagination)
Retrieves all orders placed by the currently logged-in distributor.

| | |
|---|---|
| **Method** | `GET` |
| **Endpoint** | `/orders/my-orders?page=1&limit=10` |
| **Auth Required** | ✅ Yes (Distributor Only) |

### 5.3 Update Order
Updates order quantity or status with automatic stock synchronization.

| | |
|---|---|
| **Method** | `PUT` |
| **Endpoint** | `/orders/:id` |
| **Auth Required** | ✅ Yes (Distributor - Must own order) |

### 5.4 Cancel Order
Cancels an order and automatically restores the product quantity back to inventory.

| | |
|---|---|
| **Method** | `DELETE` |
| **Endpoint** | `/orders/:id` |
| **Auth Required** | ✅ Yes (Distributor - Must own order) |

### 5.5 Verify Payment (Webhook/Redirect)
Handles the Stripe payment verification after a user completes payment.

| | |
|---|---|
| **Method** | `GET` |
| **Endpoint** | `/orders/verify-payment?session_id=cs_test_...` |
| **Auth Required** | No (Public redirect) |

📊 Order Status Flow
Plaintext
[Place Order] → Pending (unpaid)
       ↓
[Complete Payment]
       ↓
Confirmed (paid) → Requested (delivery)
       ↓
Processing / Shipment
       ↓
Delivered / Completed
6. 🍅 Product Management Module (/api/products)
### 6.1 Create Product
Allows verified farmers to create a new product with pickup location coordinates.

| | |
|---|---|
| **Method** | `POST` |
| **Endpoint** | `/products` |
| **Auth Required** | ✅ Yes (Farmer Only) |

Request Body (Snippet):

JSON
{
  "productName": "Fresh Organic Tomatoes",
  "category": "Vegetables",
  "quantity": 100,
  "unit": "kg",
  "price": 150,
  "currency": "LKR",
  "pickupLocation": {
    "address": "123 Farm Road",
    "coordinates": { "lat": 6.9271, "lng": 79.8612 }
  }
}
### 6.2 Get All Products
Retrieves all available products with optional filtering, pagination, and search.

| | |
|---|---|
| **Method** | `GET` |
| **Endpoint** | `/products` |
| **Auth Required** | No |

### 6.3 Get Single Product
Retrieves detailed information about a specific product by ID and increments the view count.

| | |
|---|---|
| **Method** | `GET` |
| **Endpoint** | `/products/:id` |
| **Auth Required** | No |

### 6.4 Update Product
Updates an existing product. Farmers can only update their own items.

| | |
|---|---|
| **Method** | `PUT` |
| **Endpoint** | `/products/:id` |
| **Auth Required** | ✅ Yes (Farmer - Owner Only) |

### 6.5 Delete Product
Permanently removes a product from the system.

| | |
|---|---|
| **Method** | `DELETE` |
| **Endpoint** | `/products/:id` |
| **Auth Required** | ✅ Yes (Owner or Admin) |

### 6.6 Get Products by District
Retrieves all available products in a specific district.

| | |
|---|---|
| **Method** | `GET` |
| **Endpoint** | `/products/location/:district` |
| **Auth Required** | No |

### 6.7 Get Product Statistics (Admin)
Provides overview statistics about all products in the system.

| | |
|---|---|
| **Method** | `GET` |
| **Endpoint** | `/products/stats/overview` |
| **Auth Required** | ✅ Yes (Admin Only) |

7. 🚛 Vehicle Management Module (/api/vehicles)
### 7.1 Create Vehicle
Registers a new vehicle for a transporter.

| | |
|---|---|
| **Method** | `POST` |
| **Endpoint** | `/vehicles` |
| **Auth Required** | ✅ Yes (Transporter Only) |

Request Body:

JSON
{
  "transporterId": "699dd743...",
  "category": "Truck",
  "vehicleType": "Open body",
  "registrationNumber": "CP-1357",
  "brand": "Tata",
  "fuelType": "Diesel",
  "status": "Available"
}
### 7.2 Get Vehicle by ID
Retrieves details of a specific vehicle.

| | |
|---|---|
| **Method** | `GET` |
| **Endpoint** | `/vehicles/:id` |
| **Auth Required** | ✅ Yes (Any Role) |

### 7.3 Update Vehicle
Updates vehicle details.

| | |
|---|---|
| **Method** | `PUT` |
| **Endpoint** | `/vehicles/:id` |
| **Auth Required** | ✅ Yes (Transporter - Owner Only) |

### 7.4 Delete Vehicle
Permanently removes a vehicle from the fleet.

| | |
|---|---|
| **Method** | `DELETE` |
| **Endpoint** | `/vehicles/:id` |
| **Auth Required** | ✅ Yes (Transporter - Owner Only) |
