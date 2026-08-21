# Customer Onboarding & Processing Details Application

A modern, full-stack web application for Customer Onboarding & Processing Details with dynamic module configuration, processing steps tracking, interactive reports, and an administrative control panel.

## Features

- **Dynamic Interactive Dashboard**: Live search, filtering by Customer Code, Application, Module Make, ATR/ATS details, and status.
- **Admin Management Panel**: Secure JWT-based admin login, dynamic master record management (Customer Master, Process Flow, Module Parameters, etc.).
- **Excel & Data Synchronization**: Batch imports, exports, and schema configurations.
- **Modern UI/UX**: Dark-mode inspired premium theme, responsive design, fast search, modal dialogs, and real-time state updates.
- **Full-Stack Architecture**: React + Vite on the frontend, Node.js + Express + SQL Server on the backend.

## Project Structure

```text
├── backend/
│   ├── .env.example
│   ├── create_database.sql
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx
│       ├── main.jsx
│       ├── pages/
│       │   ├── Dashboard.jsx
│       │   ├── AdminLogin.jsx
│       │   └── AdminView.jsx
│       └── ...
├── run_backend.bat
├── run_frontend.bat
├── start_all.bat
├── package.json
└── README.md
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16+ recommended)
- [Microsoft SQL Server](https://www.microsoft.com/en-us/sql-server) or LocalDB

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables:
   Copy `.env.example` to `.env` and set your SQL Server credentials and JWT secret.
   ```bash
   copy .env.example .env
   ```
4. Initialize the SQL database:
   Run `create_database.sql` on your SQL Server instance.
5. Start the backend server:
   ```bash
   npm start
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```

### Quick Launch (Windows)

You can launch both frontend and backend concurrently using:
```bash
start_all.bat
```
