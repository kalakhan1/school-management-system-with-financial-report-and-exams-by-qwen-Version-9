# 🎓 School ERP System

A complete, modular, and secure School Management System built with Node.js, Express, MongoDB, and Vanilla JavaScript.

## ✨ Features

### 🔐 Authentication & Authorization
- JWT-based authentication
- Role-Based Access Control (Admin, Accountant, Clerk)
- Secure password hashing with bcrypt

### 👥 User Management
- Complete CRUD operations
- Role assignment
- Status management (Active/Inactive)

### 🎓 Academic Core
- **Students Management**: Add, edit, delete, search students
- **Teachers Management**: Track teacher details, subjects, packages
- **Classes Management**: Create and manage classes

### 💰 Finance Core
- **Fee Collection**: Collect monthly fees with payment methods
- **Expense Management**: Track school expenses by category
- **Salary Management**: Pay teacher salaries monthly

### 📝 Examination Core
- **Exam Management**: Create and manage exams
- **Smart Registration**: Search-based student registration with dynamic subjects
- **Result Cards**: Auto-calculate grades and percentages
- **Test Results**: Track weekly/monthly tests
- **Professional Print**: Beautiful result card printing

### 📊 Reports & Utilities
- **Financial Reports**: Monthly income/expense breakdown
- **Fee Reminders**: WhatsApp integration for pending fees
- **ID Cards**: Printable student ID cards
- **Data Manager**: Universal CRUD for all data
- **Archive/Trash**: Soft delete with restore functionality
- **Audit Logs**: Track all system activities
- **Database Tools**: Monitor database statistics
- **Settings**: Customize school information

### 📈 Dashboard
- Real-time statistics
- Visual charts
- Quick actions
- Recent activities

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT, bcrypt
- **Security**: Helmet, CORS, Rate Limiting, express-validator
- **Frontend**: Vanilla JavaScript, Bootstrap 5, Bootstrap Icons
- **Development**: Nodemon

## 📦 Installation

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Steps

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd school-erp-nodejs