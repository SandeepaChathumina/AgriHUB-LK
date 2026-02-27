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


### API Endpoint Documentation:

1. Authentication Module (/api/auth)
1.1 Register a New User
Registers a new Farmer, Distributor, Transporter, or Admin.

Method: POST

Endpoint: /auth/register

Authentication: None

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
1.2 User Login
Authenticates a user and returns a JWT token.

Method: POST

Endpoint: /auth/login

Authentication: None

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
1.3 Request Verification OTP
Sends a 6-digit OTP to the user's email to verify their account.

Method: POST

Endpoint: /auth/request-otp

Authentication: None

Request Body:

JSON
{
  "email": "kamal@example.com"
}
Success Response (200 OK):

JSON
{
  "message": "OTP sent successfully to your email!"
}
1.4 Verify Email with OTP
Validates the OTP and marks the user's account as verified.

Method: POST

Endpoint: /auth/verify-email

Authentication: None

Request Body:

JSON
{
  "email": "kamal@example.com",
  "otp": "123456"
}
Success Response (200 OK):

JSON
{
  "message": "Email verified successfully! You can now log in."
}
1.5 Forgot Password (Request OTP)
Sends a password reset OTP to the user's email.

Method: POST

Endpoint: /auth/forgot-password

Authentication: None

Request Body:

JSON
{
  "email": "kamal@example.com"
}
Success Response (200 OK):

JSON
{
  "message": "Password reset OTP sent to your email"
}
1.6 Reset Password
Updates the user's password using the provided OTP.

Method: POST

Endpoint: /auth/reset-password

Authentication: None

Request Body:

JSON
{
  "email": "kamal@example.com",
  "otp": "654321",
  "newPassword": "newSecurePassword123"
}
Success Response (200 OK):

JSON
{
  "message": "Password reset successfully! You can now log in with your new password."
}
 2. User Profile Management Module (/api/users)
2.1 Get Logged-In User Profile
Retrieves the profile details of the currently authenticated user (password excluded).

Method: GET

Endpoint: /users/profile

Authentication: Required (Any logged-in user)

Request Body: None

Success Response (200 OK):

JSON
{
  "success": true,
  "user": {
    "_id": "65df...",
    "fullName": "Kamal Perera",
    "email": "kamal@example.com",
    "role": "Farmer",
    "phone": "0771234567",
    "isVerified": true
  }
}
2.2 Update User Profile
Updates personal details. Note: Passwords cannot be updated here.

Method: PUT

Endpoint: /users/profile

Authentication: Required (Any logged-in user)

Request Body:

JSON
{
  "fullName": "Kamal Updated",
  "phone": "0719988776"
}
Success Response (200 OK):

JSON
{
  "message": "Profile updated successfully",
  "user": { "...updated user object..." }
}
2.3 Delete Own Account
Permanently deletes the currently logged-in user's account.

Method: DELETE

Endpoint: /users/profile

Authentication: Required (Any logged-in user)

Request Body: None

Success Response (200 OK):

JSON
{
  "message": "Your account has been deleted successfully."
}
2.4 Delete Specific User (Admin)
Permanently removes any user from the system by their ID.

Method: DELETE

Endpoint: /users/:id

Authentication: Required (Admin Only)

Request Body: None

Success Response (200 OK):

JSON
{
  "message": "User Kamal Perera has been removed by Admin."
}
 3. Notification Management Module (/api/notifications)
3.1 Get Filtered Users for Notification (Admin)
Fetches a list of users based on role and verification status to target for messages.

Method: GET

Endpoint: /notifications/admin/users?role=Farmer&status=Unverified

Authentication: Required (Admin Only)

Request Body: None

Success Response (200 OK):

JSON
{
  "success": true,
  "count": 1,
  "users": [
    {
      "_id": "65df...",
      "fullName": "Kamal Perera",
      "email": "kamal@example.com",
      "role": "Farmer",
      "isVerified": false
    }
  ]
}
3.2 Send a Notification (Admin)
Sends a notification to a specific user or in bulk.

Method: POST

Endpoint: /notifications/admin/send

Authentication: Required (Admin Only)

Request Body (Single User):

JSON
{
  "targetType": "Single",
  "userId": "65df1a2b...",
  "title": "Account Warning",
  "message": "Please update your vehicle details."
}
Request Body (Bulk):

JSON
{
  "targetType": "Bulk",
  "role": "Transporter",
  "verificationStatus": "Unverified",
  "title": "Verify Your Account",
  "message": "Check your email to verify!"
}
Success Response (201 Created):

JSON
{
  "message": "Bulk notification sent successfully to 10 users!"
}
3.3 Manage All Sent Notifications (Admin)
Views all notifications sent, with optional query filters.

Method: GET

Endpoint: /notifications/admin/manage?role=Transporter&status=Unverified&isRead=false

Authentication: Required (Admin Only)

Request Body: None

Success Response (200 OK):

JSON
{
  "success": true,
  "count": 1,
  "notifications": [
    {
      "_id": "69a16e...",
      "recipient": { "fullName": "Nimal", "role": "Transporter", "isVerified": false },
      "title": "Welcome!",
      "isRead": false
    }
  ]
}
3.4 Update an Unread Notification (Admin)
Modifies the title or message of a notification (fails if already read).

Method: PUT

Endpoint: /notifications/admin/manage/:id

Authentication: Required (Admin Only)

Request Body:

JSON
{
  "title": "UPDATED: Verify Your Account Now"
}
Success Response (200 OK): Returns the updated notification.

Error Response (400 Bad Request): "Cannot update this notification because the user has already read it."

3.5 Delete a Notification (Admin)
Deletes a specific notification entirely.

Method: DELETE

Endpoint: /notifications/admin/manage/:id

Authentication: Required (Admin Only)

Request Body: None

Success Response (200 OK):

JSON
{
  "message": "Notification deleted successfully"
}
3.6 Get My Notifications (User)
Retrieves the inbox of the currently logged-in user.

Method: GET

Endpoint: /notifications/my-notifications

Authentication: Required (Any logged-in user)

Request Body: None

Success Response (200 OK):

JSON
{
  "success": true,
  "notifications": [
    {
      "_id": "69a16e...",
      "title": "Welcome!",
      "message": "Thanks for joining.",
      "isRead": false,
      "sender": { "fullName": "System Admin" }
    }
  ]
}
3.7 Mark Notification as Read (User)
Changes the isRead status of a specific notification to true.

Method: PUT

Endpoint: /notifications/:id/read

Authentication: Required (Any logged-in user)

Request Body: None

Success Response (200 OK): Returns the updated notification object with "isRead": true.

 4. AI Assistant Module (/api/chat)
4.1 Ask the System Assistant
Queries the Gemini API strictly using the platform's knowledge base.

Method: POST

Endpoint: /chat/ask

Authentication: Required (Any logged-in user)

Request Body:

JSON
{
  "question": "How do I become verified to post products?"
}
Success Response (200 OK):

JSON
{
  "success": true,
  "answer": "To become verified, you must request an OTP to your registered email and submit the 6-digit code. Unverified users cannot post products."
}


📦 Order Management Module (/api/orders)

4.1 Place a New Order

Creates a new order with Stripe payment integration. Automatically checks stock availability, calculates prices in LKR and USD, and initiates a Stripe checkout session.

Method: POST

Endpoint: /api/orders

Authentication: Required (Distributor only)

Request Body:

json
{
    "productId": "69a1c3061f4525c159b08a58",
    "quantity": 2,
    "deliveryAddress": {
        "addressLine": "123 Galle Road",
        "city": "Colombo 03",
        "coordinates": {
            "lat": 6.9271,
            "lng": 79.8612
        }
    }
}

Success Response (201 Created):

json
{
    "success": true,
    "message": "Order initiated. Please complete payment.",
    "checkoutUrl": "https://checkout.stripe.com/c/pay/cs_test_...",
    "order": {
        "_id": "67a1c3061f4525c159b08a60",
        "distributor": "65df1a2b3c4d5e6f7g8h9i0j",
        "product": {
            "_id": "69a1c3061f4525c159b08a58",
            "name": "Organic Tomatoes",
            "price": 500
        },
        "quantity": 2,
        "totalPrice": 1000,
        "totalPriceUSD": 3.15,
        "deliveryAddress": {
            "addressLine": "123 Galle Road",
            "city": "Colombo 03",
            "coordinates": {
                "lat": 6.9271,
                "lng": 79.8612
            }
        },
        "paymentStatus": "unpaid",
        "deliveryStatus": "Pending",
        "status": "Pending",
        "stripeSessionId": "cs_test_a1b2c3d4e5f6g7h8i9j0",
        "createdAt": "2024-01-15T10:30:00.000Z"
    }
}

Error Responses:

404 Not Found: { "message": "Product not found" }
400 Bad Request: { "message": "Insufficient stock" }
401 Unauthorized: { "message": "Please authenticate" }

4.2 Get My Orders (with Pagination)

Retrieves all orders placed by the currently logged-in distributor with pagination support.

Method: GET

Endpoint: /api/orders/my-orders?page=1&limit=10

Authentication: Required (Distributor only)

Query Parameters:

page (optional): Page number (default: 1)
limit (optional): Items per page (default: 10)

Request Body: None

Success Response (200 OK):

json
{
    "success": true,
    "count": 2,
    "total": 15,
    "page": 1,
    "pages": 8,
    "orders": [
        {
            "_id": "67a1c3061f4525c159b08a60",
            "product": {
                "_id": "69a1c3061f4525c159b08a58",
                "name": "Organic Tomatoes",
                "price": 500,
                "category": "Vegetables",
                "farmer": {
                    "_id": "65df1a2b3c4d5e6f7g8h9i0k",
                    "fullName": "Kamal Perera"
                }
            },
            "quantity": 2,
            "totalPrice": 1000,
            "totalPriceUSD": 3.15,
            "paymentStatus": "paid",
            "deliveryStatus": "Requested",
            "status": "Confirmed",
            "deliveryAddress": {
                "addressLine": "123 Galle Road",
                "city": "Colombo 03"
            },
            "createdAt": "2024-01-15T10:30:00.000Z"
        },
        {
            "_id": "67a2d4172f5626d270c19b71",
            "product": {
                "_id": "69b2e4172f5626d270c19b62",
                "name": "Fresh Carrots",
                "price": 300,
                "category": "Vegetables",
                "farmer": {
                    "_id": "65df1a2b3c4d5e6f7g8h9i0l",
                    "fullName": "Nimal Silva"
                }
            },
            "quantity": 5,
            "totalPrice": 1500,
            "totalPriceUSD": 4.73,
            "paymentStatus": "unpaid",
            "deliveryStatus": "Pending",
            "status": "Pending",
            "createdAt": "2024-01-14T15:45:00.000Z"
        }
    ]
}

4.3 Update Order

Updates order quantity or status with automatic stock synchronization. When quantity increases, it checks available stock; when quantity decreases, it returns excess stock to inventory.

Method: PUT

Endpoint: /api/orders/:id

Authentication: Required (Distributor only - must own the order)

Request Body:

json
{
    "quantity": 5
}

Note: You can also update status (e.g., "Pending", "Confirmed", "Cancelled")

Success Response (200 OK):

json
{
    "success": true,
    "message": "Order updated successfully",
    "order": {
        "_id": "67a1c3061f4525c159b08a60",
        "product": {
            "_id": "69a1c3061f4525c159b08a58",
            "name": "Organic Tomatoes",
            "price": 500
        },
        "quantity": 5,
        "totalPrice": 2500,
        "totalPriceUSD": 7.88,
        "paymentStatus": "unpaid",
        "status": "Pending",
        "updatedAt": "2024-01-15T11:20:00.000Z"
    }
}

Error Responses:

404 Not Found: { "message": "Order not found" }
403 Forbidden: { "message": "Not authorized to update this order" }
400 Bad Request: { "message": "Insufficient stock for increase" }

4.4 Cancel Order

Cancels an order and automatically restores the product quantity back to inventory.

Method: DELETE

Endpoint: /api/orders/:id

Authentication: Required (Distributor only - must own the order)

Request Body: {}

Success Response (200 OK):

json
{
    "success": true,
    "message": "Order cancelled and stock restored"
}

Error Responses:

404 Not Found: { "message": "Order not found" }
403 Forbidden: { "message": "Unauthorized" }

4.5 Verify Payment (Webhook/Redirect)

This endpoint handles the Stripe payment verification after a user completes payment. It's typically accessed via the redirect URL from Stripe checkout.

Method: GET

Endpoint: /api/orders/verify-payment?session_id=cs_test_...

Authentication: None (Public redirect URL)

Query Parameters:

session_id: The Stripe checkout session ID

Success Response (200 OK): HTML page showing:

html
<div style="font-family: sans-serif; text-align: center; padding: 50px;">
    <h1 style="color: #28a745;">Payment Successful!</h1>
    <p>Order ID: 67a1c3061f4525c159b08a60</p>
    <a href="http://localhost:3000/api/orders/my-orders">View My Orders</a>
</div>

Order Status Updates After Successful Payment:

paymentStatus: "unpaid" → "paid"
status: "Pending" → "Confirmed"
deliveryStatus: "Pending" → "Requested"

📊 Order Status Flow

Place Order → Pending (unpaid)
                  ↓
           Complete Payment
                  ↓
         Confirmed (paid) → Requested (delivery)
                  ↓
         Processing/Shipment
                  ↓
           Delivered/Completed

🔄 Integration Notes

Dependencies

Stripe Payment Gateway: Handles secure payment processing
Currency Converter: Converts LKR to USD for Stripe compatibility
Product Model: For stock validation and updates

Important Business Rules

Stock is reduced immediately when order is placed (prevents overselling)
If payment fails, stock remains reduced (pending payment completion)
Order cancellation restores stock automatically
Quantity updates trigger automatic stock rebalancing
USD price is fetched from a third-party API for Stripe compatibility

Testing with Postman

Place order → Get checkoutUrl
Open URL in browser → Complete test payment
Use Stripe test card: 4242 4242 4242 4242
After payment, check /my-orders to see updated status


1.Description: Allows verified farmers to create a new product with pickup location coordinates.

Method: POST

Endpoint: /api/products

Authentication: Required (Farmer only)

Authorization: Farmer role required

{
  "productName": "Fresh Organic Tomatoes",
  "category": "Vegetables",
  "variety": "Cherry Tomatoes",
  "quantity": 100,
  "unit": "kg",
  "price": 150,
  "currency": "LKR",
  "description": "Fresh organic cherry tomatoes harvested today",
  "quality": "Premium",
  "harvestDate": "2024-01-15T00:00:00.000Z",
  "expiryDate": "2024-01-22T00:00:00.000Z",
  "images": ["image1.jpg", "image2.jpg"],
  "isAvailable": true,
  "status": "Available",
  "pickupLocation": {
    "address": "123 Farm Road, Colombo 5",
    "city": "Colombo",
    "district": "Colombo",
    "coordinates": {
      "lat": 6.9271,
      "lng": 79.8612
    },
    "instructions": "Call 0771234567 when you arrive"
  }
}
Success Response (201 Created):
{
  "success": true,
  "message": "Product created successfully",
  "product": {
    "_id": "507f1f77bcf86cd799439011",
    "productName": "Fresh Organic Tomatoes",
    "category": "Vegetables",
    "variety": "Cherry Tomatoes",
    "quantity": 100,
    "unit": "kg",
    "price": 150,
    "currency": "LKR",
    "description": "Fresh organic cherry tomatoes harvested today",
    "quality": "Premium",
    "harvestDate": "2024-01-15T00:00:00.000Z",
    "expiryDate": "2024-01-22T00:00:00.000Z",
    "images": ["image1.jpg", "image2.jpg"],
    "isAvailable": true,
    "status": "Available",
    "pickupLocation": {
      "type": "Farmer Location",
      "address": "123 Farm Road, Colombo 5",
      "city": "Colombo",
      "district": "Colombo",
      "coordinates": {
        "lat": 6.9271,
        "lng": 79.8612
      },
      "instructions": "Call 0771234567 when you arrive"
    },
    "farmer": {
      "_id": "507f1f77bcf86cd799439012",
      "fullName": "Kamal Perera",
      "phone": "0771234567",
      "location": {
        "address": "123 Farm Road",
        "city": "Colombo",
        "district": "Colombo"
      }
    },
    "totalSold": 0,
    "viewCount": 0,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
2.Description: Retrieves all available products with optional filtering, pagination, and search.

Method: GET

Endpoint: /api/products

Authentication: None (Public)

Success Response (200 OK)

{
  "success": true,
  "count": 2,
  "total": 25,
  "page": 1,
  "pages": 13,
  "products": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "productName": "Fresh Organic Tomatoes",
      "category": "Vegetables",
      "quantity": 100,
      "unit": "kg",
      "price": 150,
      "currency": "LKR",
      "description": "Fresh organic cherry tomatoes",
      "quality": "Premium",
      "images": ["image1.jpg"],
      "isAvailable": true,
      "status": "Available",
      "pickupLocation": {
        "address": "123 Farm Road, Colombo 5",
        "city": "Colombo",
        "district": "Colombo",
        "coordinates": {
          "lat": 6.9271,
          "lng": 79.8612
        }
      },
      "farmer": {
        "_id": "507f1f77bcf86cd799439012",
        "fullName": "Kamal Perera",
        "phone": "0771234567"
      },
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
    // More products...
  ]
}
3. Get Single Product
Description: Retrieves detailed information about a specific product by ID. Increments view count.

Method: GET

Endpoint: /api/products/:id

Authentication: None (Public)

Success Response (200 OK)

{
  "success": true,
  "product": {
    "_id": "507f1f77bcf86cd799439011",
    "productName": "Fresh Organic Tomatoes",
    "category": "Vegetables",
    "variety": "Cherry Tomatoes",
    "quantity": 100,
    "unit": "kg",
    "price": 150,
    "currency": "LKR",
    "description": "Fresh organic cherry tomatoes harvested today",
    "quality": "Premium",
    "harvestDate": "2024-01-15T00:00:00.000Z",
    "expiryDate": "2024-01-22T00:00:00.000Z",
    "images": ["image1.jpg", "image2.jpg"],
    "isAvailable": true,
    "status": "Available",
    "pickupLocation": {
      "type": "Farmer Location",
      "address": "123 Farm Road, Colombo 5",
      "city": "Colombo",
      "district": "Colombo",
      "coordinates": {
        "lat": 6.9271,
        "lng": 79.8612
      },
      "instructions": "Call 0771234567 when you arrive"
    },
    "farmer": {
      "_id": "507f1f77bcf86cd799439012",
      "fullName": "Kamal Perera",
      "phone": "0771234567",
      "location": {
        "address": "123 Farm Road",
        "city": "Colombo",
        "district": "Colombo"
      },
      "farmSize": "5 acres",
      "mainCrops": ["Tomatoes", "Cabbage"]
    },
    "totalSold": 25,
    "viewCount": 342,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-20T14:25:00.000Z"
  }
}
4. Update Product
Description: Updates an existing product. Farmers can only update their own products.

Method: PUT

Endpoint: /api/products/:id

Authentication: Required (Farmer only - owner)

Authorization: Farmer role required

Request Body (Partial updates allowed):
json
{
  "productName": "Premium Organic Tomatoes",
  "price": 165,
  "quantity": 80,
  "isAvailable": true,
  "pickupLocation": {
    "address": "456 New Farm Road, Colombo 7",
    "city": "Colombo",
    "district": "Colombo",
    "coordinates": {
      "lat": 6.9100,
      "lng": 79.8800
    },
    "instructions": "Call 0777654321 when you arrive - new location"
  }
}Success Response (200 OK)

{
  "success": true,
  "message": "Product updated successfully",
  "product": {
    "_id": "507f1f77bcf86cd799439011",
    "productName": "Premium Organic Tomatoes",
    "price": 165,
    "quantity": 80,
    // ... other fields
    "updatedAt": "2024-01-21T09:15:00.000Z"
  }
}6. Delete Product
Description: Permanently removes a product from the system.

Method: DELETE

Endpoint: /api/products/:id

Authentication: Required (Owner or Admin)

Authorization: Farmer (owner) or Admin/SuperAdmin

Success Response (200 OK):
json
{
  "success": true,
  "message": "Product deleted successfully"
}7. Get Products by District
Description: Retrieves all available products in a specific district.

Method: GET

Endpoint: /api/products/location/:district

Authentication: None (Public)
Success Response (200 OK):
json
{
  "success": true,
  "count": 8,
  "total": 15,
  "page": 1,
  "pages": 2,
  "products": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "productName": "Fresh Organic Tomatoes",
      "category": "Vegetables",
      "price": 150,
      "farmer": {
        "fullName": "Kamal Perera",
        "phone": "0771234567"
      },
      "pickupLocation": {
        "address": "123 Farm Road, Colombo 5",
        "city": "Colombo",
        "district": "Colombo"
      }
    }
    // More products in Colombo district...
  ]
}
7. Get Product Statistics (Admin)
Description: Provides overview statistics about all products in the system.

Method: GET

Endpoint: /api/products/stats/overview

Authentication: Required (Admin only)

Authorization: Admin or SuperAdmin role required

Success Response (200 OK):
json
{
  "success": true,
  "stats": {
    "totalProducts": 1250,
    "totalValue": 1875000,
    "averagePrice": 150,
    "availableProducts": 980,
    "soldOutProducts": 270
  },
  "categoryStats": [
    {
      "_id": "Vegetables",
      "count": 450,
      "totalValue": 675000
    },
    {
      "_id": "Fruits",
      "count": 320,
      "totalValue": 480000
    },
    {
      "_id": "Grains",
      "count": 280,
      "totalValue": 420000
    },
    {
      "_id": "Dairy",
      "count": 120,
      "totalValue": 180000
    },
    {
      "_id": "Poultry",
      "count": 60,
      "totalValue": 90000
    },
    {
      "_id": "Other",
      "count": 20,
      "totalValue": 30000
    }
  ]
}

# 🚛 Vehicle Management Module (/api/vehicles)

## 4.1 Create Vehicle
Registers a new vehicle for a transporter.

**Method:** POST  
**Endpoint:** `/vehicles`  
**Authentication:** Required (Transporter Only)

**Request Body:**
```json
{
  "transporterId": "699dd743f589d965db6c0884",
  "category": "Truck",
  "vehicleType": "Open body",
  "loadCapacity": {
    "weight": {
      "value": 3500
    }
  },
  "registrationNumber": "CP-1357",
  "brand": "Tata",
  "model": "ACE",
  "fuelType": "Diesel",
  "manufacturingYear": 2023,
  "status": "Available"
}
```

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Vehicle created successfully",
  "data": {
    "vehicle": {
      "_id": "69a1d759affa159c4ae8d515",
      "transporter": "699dd743f589d965db6c0884",
      "category": "Truck",
      "vehicleType": "Open body",
      "registrationNumber": "CP-1357",
      "brand": "Tata",
      "model": "ACE",
      "fuelType": "Diesel",
      "manufacturingYear": 2023,
      "status": "Available"
    },
    "fleetSize": 1
  }
}
```

---

## 4.2 Get Vehicle by ID
Retrieves details of a specific vehicle.

**Method:** GET  
**Endpoint:** `/vehicles/:id`  
**Authentication:** Required (Any logged-in user)

**Success Response (200 OK):**
```json
{
  "success": true,
  "vehicle": {
    "_id": "69a1d759affa159c4ae8d515",
    "transporter": {
      "_id": "699dd743f589d965db6c0884",
      "businessName": "Silva Transport",
      "phone": "0771234567"
    },
    "category": "Truck",
    "vehicleType": "Open body",
    "registrationNumber": "CP-1357",
    "brand": "Tata",
    "model": "ACE",
    "fuelType": "Diesel",
    "manufacturingYear": 2023,
    "status": "Available"
  }
}
```

---

## 4.3 Update Vehicle
Updates vehicle details (transporter owner only).

**Method:** PUT  
**Endpoint:** `/vehicles/:id`  
**Authentication:** Required (Transporter Owner)

**Request Body:**
```json
{
  "transporterId": "699dd743f589d965db6c0884",
  "status": "On Delivery"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Vehicle updated successfully",
  "vehicle": {
    "_id": "69a1d759affa159c4ae8d515",
    "status": "On Delivery"
  }
}
```

---

## 4.4 Delete Vehicle
Permanently removes a vehicle (transporter owner only).

**Method:** DELETE  
**Endpoint:** `/vehicles/:id`  
**Authentication:** Required (Transporter Owner)

**Request Body:**
```json
{
  "transporterId": "699dd743f589d965db6c0884"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Vehicle deleted successfully"
}
```
