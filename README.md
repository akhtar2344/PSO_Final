ALL OF THIS OWNED BY M. ABYANSYAH P.D
# Material Management System

A simple and clean Material Management System built with MERN stack (MongoDB, Express.js, React, Node.js).

## System Requirements

- Node.js version 14 or higher
- MongoDB Atlas account (or local MongoDB installation)
- npm (comes with Node.js)

## Installation Guide

### Step 1: Clone Repository

```bash
git clone https://github.com/abyansyah052/PSO_Final.git
cd PSO_Final
```

### Step 2: Backend Installation

Navigate to backend folder and install dependencies:

```bash
cd backend
npm install
```

Create a `.env` file in the backend folder with the following content:

```
MONGODB_URI=mongodb+srv://your_username:your_password@cluster.mongodb.net/material-management
SESSION_SECRET=your_random_secret_key_here
PORT=5001
```

Note: Replace the MongoDB URI with your own MongoDB Atlas connection string.

### Step 3: Frontend Installation

Open a new terminal window, navigate to frontend folder and install dependencies:

```bash
cd frontend
npm install
```

## Running the Application

You need to run both backend and frontend servers simultaneously.

### Terminal 1 - Start Backend Server

```bash
cd backend
node server.js
```

You should see:
- Server running on http://localhost:5001
- MongoDB connected successfully

### Terminal 2 - Start Frontend Server

```bash
cd frontend
npm start
```

The application will automatically open in your browser at http://localhost:3000

If it doesn't open automatically, manually open your browser and go to:
```
http://localhost:3000
```

## Login Credentials

Use these credentials to login:

```
Email: admin@demo.com
Password: admin123
```

## Application Features

### 1. Material Management
- Create new materials with details (name, number, division, placement, function)
- Upload up to 5 images per material
- Edit existing materials
- Delete materials
- Toggle material status between Active and Inactive
- Search materials by name or number
- Filter materials by division or placement

### 2. Dropdown Settings
- Manage Material Owner (Division) options
- Manage Material Placement options
- Add, edit, or delete dropdown options

### 3. Dashboard
- View total number of materials
- View active materials count
- View total divisions
- See materials grouped by division
- View recent materials list

## Project Structure

```
material-management/
├── backend/
│   ├── models/              # Database schemas
│   │   ├── User.js         # User model
│   │   ├── Material.js     # Material model
│   │   └── Dropdown.js     # Dropdown model
│   ├── routes/              # API endpoints
│   │   ├── auth.js         # Authentication routes
│   │   ├── materials.js    # Material routes
│   │   ├── dropdowns.js    # Dropdown routes
│   │   └── dashboard.js    # Dashboard routes
│   ├── uploads/             # Uploaded images storage
│   ├── server.js           # Main backend server
│   └── .env                # Environment variables
│
├── frontend/
│   ├── public/             # Static files
│   └── src/
│       ├── components/     # Reusable components
│       │   ├── Navbar.jsx
│       │   └── MaterialForm.jsx
│       ├── pages/          # Page components
│       │   ├── Login.jsx
│       │   ├── Dashboard.jsx
│       │   ├── Materials.jsx
│       │   └── Dropdowns.jsx
│       ├── utils/          # Helper functions
│       │   └── api.js      # API calls
│       └── App.js          # Main application
│
└── README.md
```

## API Endpoints Reference

### Authentication
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/check` - Check if user is logged in

### Materials
- `GET /api/materials` - Get all materials with pagination and filters
- `GET /api/materials/:id` - Get single material details
- `POST /api/materials` - Create new material
- `PUT /api/materials/:id` - Update material
- `DELETE /api/materials/:id` - Delete material
- `PATCH /api/materials/:id/toggle-status` - Toggle active/inactive status
- `POST /api/materials/:id/images` - Upload images for material
- `DELETE /api/materials/:id/images/:imageId` - Delete specific image

### Dropdowns
- `GET /api/dropdowns/:type` - Get dropdown options (type: division or placement)
- `POST /api/dropdowns` - Create new dropdown option
- `PUT /api/dropdowns/:id` - Update dropdown option
- `DELETE /api/dropdowns/:id` - Delete dropdown option

### Dashboard
- `GET /api/dashboard/stats` - Get statistics for dashboard

## Technology Stack

### Backend Technologies
- Node.js - JavaScript runtime
- Express.js - Web framework
- MongoDB - NoSQL database
- Mongoose - MongoDB object modeling
- express-session - Session management
- connect-mongo - MongoDB session store
- bcrypt - Password hashing
- multer - File upload handling
- cors - Cross-origin resource sharing

### Frontend Technologies
- React 18 - UI library
- React Router v6 - Client-side routing
- Ant Design v5 - UI components
- Axios - HTTP client

## Common Issues and Solutions

### Issue: Cannot connect to MongoDB
Solution: Check your MongoDB URI in the .env file. Make sure your IP address is whitelisted in MongoDB Atlas.

### Issue: Port already in use
Solution: Kill the process using the port or change the port number in .env file.

```bash
# For Mac/Linux
lsof -ti:5001 | xargs kill -9
lsof -ti:3000 | xargs kill -9

# For Windows
netstat -ano | findstr :5001
taskkill /PID <PID_NUMBER> /F
```

### Issue: Session expires immediately
Solution: Make sure both backend and frontend are running and CORS is properly configured.

### Issue: Images not uploading
Solution: Check if the uploads folder exists in the backend directory. The system should create it automatically, but you can create it manually if needed:

```bash
cd backend
mkdir -p uploads/materials
```

## Development Notes

- Backend runs on port 5001
- Frontend runs on port 3000
- Session timeout is set to 24 hours
- Maximum image upload size is 5MB per image
- Maximum 5 images per material
- Supported image formats: JPG, JPEG, PNG

## Author

berkasaby@gmail.com

## Repository

https://github.com/abyansyah052/PSO_Final

