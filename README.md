# AgriHUB-LK

**A full-stack agricultural supply chain platform for Sri Lanka**

AgriHUB-LK is a MERN-based full-stack application developed for the **SE3040 – Application Frameworks** assignment. The system connects **Farmers, Distributors, Transporters, and Administrators** through a secure digital platform that supports product listing, ordering, delivery coordination, notifications, reviews, messaging, and administrative monitoring.

## Reports

### Deployment Report
[View Deployment Report](./reports/SE-26-Deploy-Report.pdf)

### Testing Report
[View Testing Report](./reports/SE-26-Testing-Report.pdf)

## Urls

- live backend URL : https://agrihub-lk-production.up.railway.app
- live frontend URL : https://agri-hub-lk-frontend.vercel.app

This project is designed to satisfy the assignment requirement of delivering:
- a **secure RESTful API backend with at least four components**,
- a **React frontend application integrated with the backend**,
- **MongoDB data persistence**,
- **role-based access control**,
- **third-party API integration**,
- **testing**, and
- **deployment documentation**.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Assignment Alignment](#assignment-alignment)
3. [Core User Roles](#core-user-roles)
4. [Key Features](#key-features)
5. [System Modules](#system-modules)
6. [Technology Stack](#technology-stack)
7. [Project Structure](#project-structure)
8. [Local Setup Instructions](#local-setup-instructions)
9. [Environment Variables](#environment-variables)
10. [Running the Project](#running-the-project)
11. [Testing Guide](#testing-guide)
12. [API Documentation](#api-documentation)
13. [Deployment Documentation](#deployment-documentation)
14. [Security and Best Practices](#security-and-best-practices)
15. [Future Improvements](#future-improvements)
16. [Contributors](#contributors)

---

## Project Overview

AgriHUB-LK was developed to modernize agricultural supply chain interactions by enabling:
- **Farmers** to publish and manage crop listings,
- **Distributors** to browse products and place orders,
- **Transporters** to manage vehicles and handle delivery workflows,
- **Admins** to supervise users, notifications, moderation, and platform analytics.

The backend is implemented with **Node.js, Express.js, and MongoDB**, while the frontend is built with **React and Vite**. The application follows a modular structure and separates routing, controller logic, models, middleware, and utility services.

---

## Assignment Alignment

This repository has been organized to match the assignment specification for a full-stack application with both backend and frontend deliverables. The specification requires a RESTful Express backend, MongoDB integration, protected routes, validation and error handling, use of a third-party API, React frontend integration, session handling, deployment, and testing. fileciteturn0file0L1-L33

The README also includes the documentation areas explicitly required in the assignment, such as:
- setup instructions,
- API documentation,
- deployment details,
- testing instructions for unit, integration, and performance testing. fileciteturn0file0L34-L47

---

## Core User Roles

The platform supports role-based access for the following users:

### 1. Admin
- Manage platform users
- Send and manage notifications
- View platform statistics and moderation data
- Perform high-privilege administrative actions

### 2. Farmer
- Register and verify account
- Add, update, and manage products
- View orders and delivery-related interactions
- Receive reviews and ratings

### 3. Distributor
- Browse listed products
- Place and manage orders
- Request delivery support
- Interact with transport and review features

### 4. Transporter
- Register and manage vehicles
- View available delivery requests
- Create and manage trips
- Handle logistics-related tasks

---

## Key Features

### Backend Features
- RESTful API built with Express.js
- MongoDB integration with Mongoose models
- JWT-based authentication and authorization
- Role-based route protection
- Validation and structured error handling
- Email-based OTP verification and password reset
- Notification management
- Product, order, vehicle, trip, review, and messaging workflows
- Third-party integrations for AI assistance, payments, and currency conversion
- Cloud image handling support

### Frontend Features
- React functional component architecture
- Context-based session/auth state handling
- API integration with backend endpoints
- Protected routes and role-aware dashboards
- Responsive UI built with Tailwind CSS
- Maps and routing-related UI capabilities
- Real-time communication support with Socket.IO

---

## System Modules

The previous project documentation already identified core modules such as authentication, user profile management, notifications, AI assistant, orders, products, and vehicles. fileciteturn0file1L1-L20 Based on the full project structure, the application also includes administrative, trip, review, and messaging modules.

### Main backend modules
- **Authentication Module** – registration, login, OTP verification, password reset
- **User Module** – profile retrieval, profile updates, account deletion
- **Product Module** – create, read, update, delete, filters, availability handling
- **Order Module** – order placement, stock updates, payment-related processing
- **Vehicle Module** – vehicle registration and transporter fleet management
- **Trip Module** – trip creation and delivery coordination
- **Review Module** – feedback, moderation, helpful votes, rating views
- **Notification Module** – targeted admin notifications and user inbox actions
- **Message Module** – user-to-user communication and chat support
- **Admin Module** – statistics, moderation, and platform oversight
- **AI Assistant Module** – assistant responses powered by a third-party AI service

---

## Technology Stack

### Frontend
- React
- Vite
- React Router DOM
- Tailwind CSS
- Axios
- React Hot Toast
- Leaflet and React Leaflet
- Socket.IO Client
- Recharts

### Backend
- Node.js
- Express.js
- MongoDB + Mongoose
- JWT
- bcrypt / bcryptjs
- Nodemailer
- Socket.IO
- Stripe
- Google Generative AI API
- Cloudinary
- Express Validator

### Testing and Quality
- Jest
- Supertest
- MongoDB Memory Server
- Artillery (performance test configuration included)

---

## Project Structure

```text
AgriHUB-LK/
├── backend/
│   ├── config/                 # External service configuration
│   ├── controllers/            # Route handlers and business logic
│   ├── controllers/__tests__/  # Unit tests
│   ├── data/                   # Static data and knowledge base files
│   ├── middleware/             # Auth, upload, validation-related middleware
│   ├── models/                 # MongoDB schemas
│   ├── performance/            # Performance test assets
│   ├── routes/                 # API route definitions
│   ├── routes/__tests__/       # Integration tests
│   ├── utils/                  # Helper and third-party integration utilities
│   ├── app.js                  # Express app configuration
│   ├── index.js                # Server entry point
│   └── package.json
│
├── frontend/
│   ├── public/                 # Static assets
│   ├── src/
│   │   ├── api/                # API helper functions
│   │   ├── assets/             # Images and local assets
│   │   ├── components/         # Shared UI components
│   │   ├── config/             # Frontend configuration files
│   │   ├── context/            # Context API state management
│   │   ├── lib/                # Utility libraries
│   │   ├── pages/              # Application pages grouped by domain
│   │   ├── App.jsx             # Main app component
│   │   └── main.jsx            # Frontend entry point
│   └── package.json
│
├── README.md
└── package.json
```

---

## Local Setup Instructions

### Prerequisites
Make sure the following tools are installed:
- Node.js 18 or later
- npm
- MongoDB Atlas account or local MongoDB instance
- Git

### 1. Clone the repository
```bash
git clone <your-repository-url>
cd AgriHUB-LK
```

### 2. Install backend dependencies
```bash
cd backend
npm install
```

### 3. Install frontend dependencies
```bash
cd ../frontend
npm install
```

---

## Environment Variables

Do **not** commit real secrets to GitHub. Create separate `.env` files for backend and frontend.

### Backend `.env`
```env
PORT=3000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:5173
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3000
EMAIL_USER=your_email_address
EMAIL_PASS=your_email_app_password
MESSAGE_SECRET_KEY=your_message_secret
EXCHANGE_RATE_API_KEY=your_exchange_rate_api_key
GEMINI_API_KEY=your_gemini_api_key
STRIPE_SECRET_KEY=your_stripe_secret_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### Frontend `.env`
```env
VITE_API_BASE_URL=http://localhost:3000
VITE_OSRM_SERVICE_URL=https://router.project-osrm.org/route/v1
```

### Notes
- `CLIENT_URL` is used for CORS configuration.
- `FRONTEND_URL` and `BACKEND_URL` are used in redirect and integration flows.
- `VITE_API_BASE_URL` should point to the deployed backend when running in production.

---

## Running the Project

### Run the backend
```bash
cd backend
npm start
```

The backend starts on:
```text
http://localhost:3000
```

### Run the frontend
Open a second terminal:
```bash
cd frontend
npm run dev
```

The frontend starts on:
```text
http://localhost:5173
```

---

## Testing Guide

The assignment requires unit testing, integration testing, and performance testing documentation. fileciteturn0file0L23-L47 This project includes test folders for controllers and routes, along with performance test assets.

### Backend unit tests
```bash
cd backend
npm run test:unit
```

### Backend integration tests
```bash
cd backend
npm run test:int
```

### Full backend test suite with coverage
```bash
cd backend
npm run test:all
```

### Coverage only
```bash
cd backend
npm run coverage
```

### Performance testing
A performance configuration is available in:
```text
backend/performance/load-test.yml
```

Run Artillery if installed globally:
```bash
artillery run backend/performance/load-test.yml
```

Or using npx:
```bash
npx artillery run backend/performance/load-test.yml
```

### Testing environment notes
- Unit tests focus on controller behavior.
- Integration tests validate route behavior and API workflows.
- MongoDB Memory Server can be used for isolated database-backed testing.
- Performance testing can be used to evaluate API stability under concurrent requests.

---

## API Documentation

The assignment specifically requests complete API endpoint documentation, including HTTP methods, request/response formats, authentication requirements, and sample requests/responses. fileciteturn0file0L37-L40

### Suggested documentation access
- **Postman Collection:** Add your exported Postman collection link here
- **Swagger Documentation:** Add your Swagger/OpenAPI link here if available

### Base URL
```text
http://localhost:3000/api
```

### Main API groups
- `/auth` – authentication and OTP flows
- `/users` – profile management
- `/products` – product CRUD and search/filter flows
- `/orders` – order management and payment-related processing
- `/vehicles` – transporter fleet management
- `/trips` – delivery trip workflows
- `/reviews` – ratings, comments, moderation
- `/notifications` – admin and user notification operations
- `/messages` – communication features
- `/admin` – administrative functions and analytics
- `/chat` – AI assistant endpoint

> Replace this section with your final Swagger link or Postman documentation link before submission.

---

## Deployment Documentation

The specification requires both backend and frontend deployment details, environment variables used without exposing secrets, live URLs, and screenshots or proof of deployment. fileciteturn0file0L15-L22

### Backend deployment
- **Platform:** _Add platform name here_ (e.g., Railway / Render)
- **Build / Start Command:** `npm install && npm start`
- **Root Directory:** `backend`
- **Environment Variables Configured:**
  - `PORT`
  - `MONGO_URI`
  - `JWT_SECRET`
  - `CLIENT_URL`
  - `FRONTEND_URL`
  - `BACKEND_URL`
  - `EMAIL_USER`
  - `EMAIL_PASS`
  - `MESSAGE_SECRET_KEY`
  - `EXCHANGE_RATE_API_KEY`
  - `GEMINI_API_KEY`
  - `STRIPE_SECRET_KEY`
  - `CLOUDINARY_CLOUD_NAME`
  - `CLOUDINARY_API_KEY`
  - `CLOUDINARY_API_SECRET`
- **Live Backend URL:** _Add deployed backend URL here_

### Frontend deployment
- **Platform:** _Add platform name here_ (e.g., Vercel / Netlify)
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Root Directory:** `frontend`
- **Environment Variables Configured:**
  - `VITE_API_BASE_URL`
  - `VITE_OSRM_SERVICE_URL`
- **Live Frontend URL:** _Add deployed frontend URL here_

### Deployment evidence
Add screenshots under a folder such as:
```text
docs/deployment/
```

Recommended screenshots:
1. Backend deployment dashboard
2. Frontend deployment dashboard
3. Live frontend home page
4. API response from deployed backend

---

## Security and Best Practices

This project follows the main secure-backend expectations described in the assignment, including protected routes, role-based access control, error handling, and clean code structure. fileciteturn0file0L8-L14

Implemented or intended practices include:
- JWT authentication
- Role-based authorization middleware
- Input validation
- Error response handling
- Password hashing
- Environment-based secret management
- Separated routes, controllers, middleware, and utility layers
- External service integration through dedicated utility/config files

---

## Future Improvements

Possible enhancements for future iterations:
- Full Swagger UI generation for every endpoint
- CI/CD pipeline for automated testing and deployment
- Enhanced analytics dashboards
- More detailed delivery tracking and logistics optimization
- Image optimization and CDN support
- Expanded admin reporting and auditing features
- More comprehensive frontend test coverage

---

## Contributors

- **IT23818620** — KARUNANAYAKE K.M.S.G.S.C
- **IT23819092** — HANDARAGAMA M.U.
- **IT23831254** — ABEYKOON A.M.H.M
- **IT23800632** — GEETHANJANA K.M.G.T





