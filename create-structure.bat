@echo off
title School ERP Project Structure Generator
color 0A

echo ============================================================
echo   School ERP Node.js - Complete Structure Generator
echo ============================================================
echo.
echo [!] Creating folders and files. Please wait...
echo.

:: Change directory to the script's location
cd /d "%~dp0"

:: 1. Backend Folders
mkdir backend\config
mkdir backend\controllers
mkdir backend\middleware
mkdir backend\models
mkdir backend\routes
mkdir backend\utils
mkdir backend\validators

:: 2. Frontend Folders
mkdir public\css
mkdir public\js

:: 3. Backend Files Creation (Empty placeholders)
echo Creating Backend files...
type nul > backend\config\database.js
type nul > backend\app.js
type nul > backend\.env

:: Controllers
for %%F in (auth user student teacher class fee salary expense exam result testResult archive dataManager setting audit dashboard financialReport feeReminder idCard databaseTool) do (
    type nul > backend\controllers\%%F.controller.js
)

:: Middleware
for %%F in (auth roleCheck errorHandler) do (
    type nul > backend\middleware\%%F.js
)

:: Models
for %%F in (User Student Teacher Class FeeHistory SalaryHistory Expense Exam ExamRegistration ResultCard TestResult Archive Setting AuditLog) do (
    type nul > backend\models\%%F.js
)

:: Routes
for %%F in (auth user student teacher class fee salary expense exam result testResult archive dataManager setting audit dashboard financialReport feeReminder idCard databaseTool) do (
    type nul > backend\routes\%%F.routes.js
)

:: Utils & Validators
for %%F in (logger examUtils security) do (
    type nul > backend\utils\%%F.js
)
for %%F in (auth user student) do (
    type nul > backend\validators\%%F.validator.js
)

:: 4. Frontend Files Creation
echo Creating Frontend files...
type nul > public\css\style.css
type nul > public\index.html

for %%F in (api auth dashboard users academic finance salary examination finalResults testResultsReport feeHistory archive dataManager settings audit financialReports feeReminders idCards databaseTools print) do (
    type nul > public\js\%%F.js
)

:: 5. Package.json (Basic template)
echo Creating package.json...
echo { > package.json
echo   "name": "school-erp-nodejs", >> package.json
echo   "version": "1.0.0", >> package.json
echo   "description": "Modular School ERP System", >> package.json
echo   "main": "backend/app.js", >> package.json
echo   "scripts": { >> package.json
echo     "dev": "nodemon backend/app.js", >> package.json
echo     "start": "node backend/app.js" >> package.json
echo   }, >> package.json
echo   "dependencies": { >> package.json
echo     "express": "^4.18.2", >> package.json
echo     "mongoose": "^8.0.0", >> package.json
echo     "dotenv": "^16.3.1", >> package.json
echo     "bcryptjs": "^2.4.3", >> package.json
echo     "jsonwebtoken": "^9.0.2", >> package.json
echo     "express-validator": "^7.0.1", >> package.json
echo     "cors": "^2.8.5", >> package.json
echo     "helmet": "^7.1.0", >> package.json
echo     "express-rate-limit": "^7.1.5" >> package.json
echo   }, >> package.json
echo   "devDependencies": { >> package.json
echo     "nodemon": "^3.0.1" >> package.json
echo   } >> package.json
echo } >> package.json

echo.
echo ============================================================
echo   [SUCCESS] Project structure created successfully!
echo   You can now start installing dependencies: npm install
echo ============================================================
pause