# Customer Onboarding & Processing Details Application

A modern, full-stack web application for Customer Onboarding & Processing Details with dynamic module configuration, dual role-based dashboards (CMS & Colorplast), administrative control panel, and Microsoft SQL Server persistence.

## Features

- **Dual Dedicated Dashboards**:
  - **CMS Operations Dashboard** (`/cms/dashboard`): Tailored for CMS partner order entries and tracking.
  - **Colorplast Operations Dashboard** (`/colorplast/dashboard`): Dedicated internal processing and module configuration portal.
- **Role-Based Authentication**: Secure role tokens for `cms`, `colorplast`, and `admin` with quick test login shortcuts.
- **New Entry & Edit Capabilities**: Modal dialogs allowing users to create new customer onboarding entries or edit existing records in real-time.
- **Automated Parameter Lookup**: Module Make selection automatically resolves Chip ATR and ATS hex values.
- **Excel & Data Synchronization**: Role-based and master Excel exports (`.xlsx`).
- **Comprehensive Documentation**: Complete architecture and workflow manual available in [`CMS_COLORPLAST_SYSTEM_GUIDE.md`](./CMS_COLORPLAST_SYSTEM_GUIDE.md).

## Quick Default Credentials for Testing

| Role | Username | Password | Dashboard |
| :--- | :--- | :--- | :--- |
| **CMS Portal** | `cms` | `cms@123` | `/cms/dashboard` |
| **Colorplast Portal** | `colorplast` | `color@123` | `/colorplast/dashboard` |
| **Super Admin** | `admin` | `admin@123` | `/admin` |

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
