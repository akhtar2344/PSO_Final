# Developer Guide - Material Management System
## Table of Contents
- [Understanding the Project Structure](#understanding-the-project-structure)
- [How to Modify Features](#how-to-modify-features)
- [Common Customizations](#common-customizations)
- [Database Changes](#database-changes)
- [Troubleshooting](#troubleshooting)

---

## Understanding the Project Structure

The project is divided into two main parts:

1. **Backend** (Server-side) - Located in `/backend` folder
   - Handles database operations
   - Manages API endpoints
   - Handles authentication and file uploads

2. **Frontend** (Client-side) - Located in `/frontend` folder
   - User interface and design
   - Page layouts and forms
   - API calls to backend

---

## How to Modify Features

### 1. Login Page Customization

**What to modify:** Login form, styling, validation

**Files to edit:**
- `/frontend/src/pages/Login.jsx` - Login page UI and logic
- `/backend/routes/auth.js` - Login authentication logic

**Example changes:**
- Change login form fields
- Add "Remember Me" checkbox
- Change password validation rules
- Modify error messages

**How to:**
```javascript
// In /frontend/src/pages/Login.jsx
// Find the <Form> component and modify the fields

<Form.Item name="email" rules={[...]}>
  <Input placeholder="Enter your email" />
</Form.Item>
```

---

### 2. Dashboard Statistics

**What to modify:** Cards shown on dashboard, statistics calculation

**Files to edit:**
- `/frontend/src/pages/Dashboard.jsx` - Dashboard UI and cards
- `/backend/routes/dashboard.js` - Statistics calculation logic

**Example changes:**
- Add new statistics card (e.g., "Total Inactive Materials")
- Change card colors
- Modify which materials are shown in "Recent Materials"
- Change number of materials displayed

**How to:**
```javascript
// In /backend/routes/dashboard.js
// Find the stats calculation and add new fields

const stats = {
  totalMaterials: await Material.countDocuments(),
  activeMaterials: await Material.countDocuments({ isActive: true }),
  // Add your new stat here
  inactiveMaterials: await Material.countDocuments({ isActive: false })
};
```

---

### 3. Material List and Table

**What to modify:** Table columns, search filters, pagination

**Files to edit:**
- `/frontend/src/pages/Materials.jsx` - Material list page
- `/backend/routes/materials.js` - Material data fetching

**Example changes:**
- Add new column to the table
- Change number of items per page
- Add new filter options
- Modify search behavior

**How to:**
```javascript
// In /frontend/src/pages/Materials.jsx
// Find the columns array and add new column

const columns = [
  { title: 'No', dataIndex: 'index', key: 'index' },
  { title: 'Material Name', dataIndex: 'materialName', key: 'materialName' },
  // Add new column here
  { 
    title: 'Created Date', 
    dataIndex: 'createdAt', 
    key: 'createdAt',
    render: (date) => new Date(date).toLocaleDateString()
  }
];
```

---

### 4. Material Form (Create/Edit)

**What to modify:** Form fields, validation rules, file upload settings

**Files to edit:**
- `/frontend/src/components/MaterialForm.jsx` - Material form UI
- `/backend/routes/materials.js` - Material creation/update logic
- `/backend/models/Material.js` - Material database schema

**Example changes:**
- Add new input field (e.g., "Price", "Quantity")
- Change image upload limit
- Add new validation rules
- Change required fields

**How to add new field:**

Step 1: Add to database schema
```javascript
// In /backend/models/Material.js
const materialSchema = new mongoose.Schema({
  materialName: String,
  materialNumber: String,
  // Add new field here
  price: {
    type: Number,
    default: 0
  }
});
```

Step 2: Add to form
```javascript
// In /frontend/src/components/MaterialForm.jsx
// Add new Form.Item

<Form.Item
  label="Price"
  name="price"
  rules={[{ required: false }]}
>
  <InputNumber placeholder="Enter price" style={{ width: '100%' }} />
</Form.Item>
```

---

### 5. Dropdown Settings (Division & Placement)

**What to modify:** Dropdown management, add new dropdown types

**Files to edit:**
- `/frontend/src/pages/Dropdowns.jsx` - Dropdown management UI
- `/backend/routes/dropdowns.js` - Dropdown CRUD operations
- `/backend/models/Dropdown.js` - Dropdown database schema

**Example changes:**
- Add new dropdown type (e.g., "Status", "Category")
- Change how dropdown values are generated
- Add validation for dropdown names

**How to add new dropdown type:**

Step 1: Add new tab in frontend
```javascript
// In /frontend/src/pages/Dropdowns.jsx
// Add new tab item

const items = [
  { key: 'division', label: 'Material Owner (Division)' },
  { key: 'placement', label: 'Material Placement' },
  // Add new type here
  { key: 'category', label: 'Material Category' }
];
```

Step 2: Backend will automatically handle it (no changes needed)

---

### 6. Image Upload Settings

**What to modify:** Maximum file size, allowed file types, number of images

**Files to edit:**
- `/backend/routes/materials.js` - Multer configuration
- `/frontend/src/components/MaterialForm.jsx` - Upload component settings

**Example changes:**
- Change maximum image size (default: 5MB)
- Allow more/fewer images per material (default: 5)
- Change allowed file types

**How to:**
```javascript
// In /backend/routes/materials.js
// Find the multer configuration

const upload = multer({
  storage: storage,
  limits: { 
    fileSize: 10 * 1024 * 1024 // Change to 10MB
  },
  fileFilter: (req, file, cb) => {
    // Modify allowed file types here
  }
});
```

---

### 7. Navigation Menu

**What to modify:** Menu items, logos, user display

**Files to edit:**
- `/frontend/src/components/Navbar.jsx` - Navigation bar component

**Example changes:**
- Add new menu item
- Change menu icons
- Modify logout button
- Change logo

**How to:**
```javascript
// In /frontend/src/components/Navbar.jsx
// Find the items array

const items = [
  { key: '/', icon: <HomeOutlined />, label: 'Dashboard' },
  { key: '/materials', icon: <AppstoreOutlined />, label: 'Materials' },
  // Add new menu item here
  { key: '/reports', icon: <FileOutlined />, label: 'Reports' }
];
```

---

### 8. Session and Authentication

**What to modify:** Session timeout, password requirements, login validation

**Files to edit:**
- `/backend/server.js` - Session configuration
- `/backend/routes/auth.js` - Authentication logic
- `/backend/models/User.js` - User model and password hashing

**Example changes:**
- Change session timeout (default: 24 hours)
- Modify password requirements
- Add "Remember Me" functionality

**How to:**
```javascript
// In /backend/server.js
// Find the session configuration

app.use(session({
  secret: process.env.SESSION_SECRET,
  cookie: {
    maxAge: 1000 * 60 * 60 * 48 // Change to 48 hours
  }
}));
```

---

## Common Customizations

### Change Application Name

**Files to edit:**
- `/frontend/public/index.html` - Page title
- `/frontend/public/manifest.json` - App name
- `/frontend/src/components/Navbar.jsx` - Header text

### Change Color Theme

**Files to edit:**
- `/frontend/src/pages/*.jsx` - Modify inline styles or add custom CSS

**Example:**
```javascript
// Change primary color in any component
<Button type="primary" style={{ backgroundColor: '#ff6b6b' }}>
  Click Me
</Button>
```

### Add New Page

**Steps:**
1. Create new file in `/frontend/src/pages/` (e.g., `Reports.jsx`)
2. Add route in `/frontend/src/App.js`
3. Add menu item in `/frontend/src/components/Navbar.jsx`
4. Create API endpoint in `/backend/routes/` if needed

**Example:**
```javascript
// In /frontend/src/App.js
<Route 
  path="/reports" 
  element={user ? <Reports user={user} /> : <Navigate to="/login" />} 
/>
```

### Change Date/Time Format

**Files to edit:**
- Any component that displays dates

**Example:**
```javascript
// Change date format
new Date(material.createdAt).toLocaleDateString('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric'
})
```

---

## Database Changes

### Add New Field to Material

**Step 1:** Update Material model
```javascript
// In /backend/models/Material.js
const materialSchema = new mongoose.Schema({
  // ... existing fields
  yourNewField: {
    type: String,
    required: false
  }
});
```

**Step 2:** Update Material form
```javascript
// In /frontend/src/components/MaterialForm.jsx
<Form.Item label="Your New Field" name="yourNewField">
  <Input />
</Form.Item>
```

**Step 3:** Update Material table (optional)
```javascript
// In /frontend/src/pages/Materials.jsx
// Add new column to display the field
```

### Create New Collection (Database Table)

**Step 1:** Create new model file
```javascript
// Create /backend/models/YourModel.js
const mongoose = require('mongoose');

const yourSchema = new mongoose.Schema({
  name: String
}, { timestamps: true });

module.exports = mongoose.model('YourModel', yourSchema);
```

**Step 2:** Create routes file
```javascript
// Create /backend/routes/yourRoutes.js
const express = require('express');
const router = express.Router();
const YourModel = require('../models/YourModel');

router.get('/', async (req, res) => {
  // Your logic here
});

module.exports = router;
```

**Step 3:** Register routes in server
```javascript
// In /backend/server.js
const yourRoutes = require('./routes/yourRoutes');
app.use('/api/your-endpoint', yourRoutes);
```

---

## Troubleshooting

### Changes Not Showing Up

**Frontend changes:**
1. Check browser console for errors (F12)
2. Clear browser cache (Ctrl/Cmd + Shift + R)
3. Restart frontend server (Ctrl + C, then `npm start`)

**Backend changes:**
1. Check terminal for errors
2. Restart backend server (Ctrl + C, then `node server.js`)
3. Check if MongoDB is connected

### Can't Find Where to Edit

**Strategy:**
1. Search for the text you see on the screen in the codebase
2. Look for similar functionality in existing files
3. Check console.log() to trace the code flow

### Breaking Changes

**Before making changes:**
1. Create a backup of the file you're editing
2. Test on a development branch first
3. Use Git to track changes: `git status`, `git diff`

**If something breaks:**
1. Check browser console and terminal for error messages
2. Use Git to see what changed: `git diff`
3. Revert changes if needed: `git checkout -- <filename>`

---

## Best Practices

1. **Always test after making changes**
   - Test the feature you modified
   - Check if other features still work

2. **Comment your code**
   ```javascript
   // This function calculates the total price
   const calculateTotal = (items) => {
     // Add your logic here
   };
   ```

3. **Use meaningful variable names**
   ```javascript
   // Bad
   const x = data.filter(d => d.a === true);
   
   // Good
   const activeMaterials = materials.filter(material => material.isActive === true);
   ```

4. **Keep functions small and focused**
   - One function should do one thing
   - If a function is too long, split it into smaller functions

5. **Handle errors properly**
   ```javascript
   try {
     // Your code
   } catch (error) {
     console.error('Error:', error);
     message.error('Something went wrong');
   }
   ```

---

## Need Help?

If you're stuck or need help with a specific customization:

1. Check the error message in browser console (F12) or terminal
2. Search for the error message online
3. Review similar code in other files
4. Create an issue on GitHub repository
5. Check the main README.md for common issues

