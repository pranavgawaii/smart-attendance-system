# 🎓 Smart Attendance Portal For Students

<div align="center">

![MIT ADT University](https://img.shields.io/badge/MIT%20ADT-University-blue?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Production-success?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)

**A comprehensive digital solution for university placement cells to manage attendance, assessments, coordinator activities, and seat allocations efficiently.**

[Features](#-key-features) • [Tech Stack](#-tech-stack) • [Installation](#-installation) • [Documentation](#-documentation)

</div>

---

## 📋 Table of Contents

- [Project Structure](#-project-structure)
- [Installation](#-installation)
- [Deployment](#-deployment)
- [Security](#-security)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🏗️ Project Structure

The project has been reorganized into a modular, professional layout:

```text
smart-attendance-system/
├── api/                # Vercel serverless entry points
├── database/           # SQL migration and schema files
├── docs/               # Technical documentation
├── frontend/           # React + Vite frontend application
│   ├── public/         # Static assets (logos, media)
│   └── src/            # Frontend source code
├── logs/               # Application and server logs
├── modules/            # Self-contained feature modules
│   └── coordinator/    # Coordinator export bundle
├── scripts/            # Infrastructure and utility scripts
│   └── debug/          # Database and user testing utilities
├── server/             # Node.js + Express backend application
│   ├── controllers/    # API request handlers
│   ├── models/         # Database models/queries
│   └── routes/         # Express route definitions
├── tests/              # Test suites for backend and integration
├── vercel.json         # Vercel deployment configuration
└── package.json        # Main project configuration
```

---

## 🎯 Problem Statement

University placement processes often suffer from significant inefficiencies:

- **Manual Attendance**: Passing physical sheets is time-consuming and prone to loss
- **Proxy Attendance**: Students signing for absent peers compromises data integrity
- **Poor Visibility**: Administrators lack real-time data on student participation
- **Manual Shortlisting**: Filtering eligible students for drives is tedious and error-prone
- **Allocation Chaos**: Manually assigning labs and seats for assessments is logistically complex
- **Coordinator Management**: Tracking Placement student coordinators and generating attendance letters manually

---

## 💡 Solution Overview

This portal **digitizes the entire placement workflow** with a modern, scalable architecture. It enables administrators to:

- Create live sessions with **dynamic QR codes** for secure attendance
- Manage end-to-end assessment flows from eligibility to seat allocation
- Track and manage **Placement student coordinators** with automated letter generation
- Handle **high-concurrency scans** with real-time updates
- Provide **role-based dashboards** for clear visibility across all stakeholders

Designed for **scalability, security, and user experience**, this system transforms manual processes into seamless digital workflows.

---

## ✨ Key Features

### 👨‍💼 Admin Features

#### **Session Management**
- Create, start, pause, and stop attendance events
- Real-time monitoring with live attendance counts
- View student lists as they scan
- Export attendance reports in CSV/PDF formats

#### **Assessment Control**
- Create assessments with custom eligibility rules
- Upload candidate lists via CSV
- Automated seat allocation with one-click shuffling
- Prevent dishonesty with randomized lab assignments

#### **Placement student coordinator Module** 🆕
- **CRUD Operations**: Add, view, edit, and delete Placement student coordinators
- **Professional UI**: Clean, monochromatic design matching admin panel theme
- **Search & Filter**: Find coordinators by name, enrollment number, or department
- **Attendance Letters**: Generate professional PDF letters with:
  - University logo and official formatting
  - Event details and coordinator information
  - Professional table layout with Times font
  - Preview before download functionality

#### **Data Management**
- Download attendance and allocation reports
- CSV import/export for bulk operations
- Real-time data synchronization

### 👨‍🎓 Student Features

- **Secure Dashboard**: View profile status and upcoming drives
- **QR Scanner**: Integrated scanner with deep-linking support
- **History & Logs**: Access personal attendance history
- **Seat Allocation**: View assigned lab and seat number instantly
- **Manual Entry**: Fallback option for QR code scanning issues

### 📺 Projector View Features

- **Dynamic QR Code**: Rotating every 10 seconds to prevent proxy attendance
- **Live Counter**: Real-time present count to motivate punctuality
- **Status Indicators**: Visual cues for session state (Active/Paused/Stopped)
- **High Contrast**: Optimized for visibility from a distance

---

## 🛠️ Tech Stack

### Frontend
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

- **React 18**: Component-based UI with hooks
- **Vite**: Ultra-fast build times and HMR
- **TailwindCSS**: Utility-first styling
- **React Router**: Client-side routing
- **Axios**: HTTP client with interceptors

### Backend
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![PDFKit](https://img.shields.io/badge/PDFKit-FF6B6B?style=for-the-badge)

- **Node.js**: Non-blocking, event-driven runtime
- **Express.js**: Minimal and flexible web framework
- **PDFKit**: Professional PDF generation
- **JWT**: Secure authentication
- **Nodemailer**: Email notifications (optional)

### Database
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)

- **Supabase**: Backend-as-a-Service with PostgreSQL
- **Row Level Security (RLS)**: Database-level authorization
- **Real-time subscriptions**: Live data updates
- **Automatic token refresh**: Seamless session management

### Deployment
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

- **Vercel**: Frontend hosting with edge network
- **Supabase Cloud**: Managed PostgreSQL database
- **CI/CD**: Automatic deployments on push

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React + Vite)              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Admin      │  │   Student    │  │  Projector   │ │
│  │  Dashboard   │  │  Dashboard   │  │     View     │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
                          │
                          │ HTTPS/REST API
                          ▼
┌─────────────────────────────────────────────────────────┐
│              BACKEND (Node.js + Express)                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │     Auth     │  │  Attendance  │  │ Coordinators │ │
│  │  Middleware  │  │  Controller  │  │  Controller  │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
                          │
                          │ SQL Queries
                          ▼
┌─────────────────────────────────────────────────────────┐
│            DATABASE (Supabase PostgreSQL)               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │    Users     │  │  Attendance  │  │ Coordinators │ │
│  │   Profiles   │  │    Events    │  │  Assessments │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Key Design Principles

- **Separation of Concerns**: Clear boundaries between frontend, backend, and database
- **Stateless Authentication**: JWT tokens with automatic refresh
- **Real-time Updates**: Supabase subscriptions for live data
- **Scalability**: Horizontal scaling with serverless architecture
- **Security**: Row-level security, CORS policies, input validation

---

## 📦 Installation

### Prerequisites

- **Node.js** v18 or higher
- **npm** or **yarn**
- **Supabase Account** (free tier available)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/pranavgawaii/smart-attendance-system.git
   cd smart-attendance-system
   ```

2. **Install root dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Copy `.env.example` to `.env` and fill values:
   ```env
   NODE_ENV=development
   PORT=5001
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   JWT_SECRET=your_secure_secret_key
   QR_HMAC_SECRET=your_qr_hmac_secret
   CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
   ```

4. **Start the backend server**
   ```bash
   npm run dev
   ```
   *Server will run on `http://localhost:5001`*

5. **Setup frontend**
   
   In a new terminal:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   *Client will run on `http://localhost:5173`*

---

## 🚀 Deployment

### Frontend (Vercel)

1. **Connect GitHub repository** to Vercel
2. **Configure build settings**:
   - Framework: `Vite`
   - Root Directory: `.`
   - Build Command: `npm run build`
   - Output Directory: `frontend/dist`
3. **Add environment variables**:
   - `VITE_API_BASE_URL`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

### Backend (Vercel Serverless)

1. **Use the included `vercel.json`** configuration (maps `/api/*` to `api/index.js`)
2. **Add environment variables** in Vercel dashboard:
   - `JWT_SECRET`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`


### Database (Supabase)

- Already hosted on Supabase Cloud
- Automatic backups and scaling
- Connection pooling enabled
- Row Level Security (RLS) configured

---

## 🔐 Security

### Authentication & Authorization

- **JWT Tokens**: Stateless authentication with automatic refresh
- **Supabase Auth**: Built-in user management and session handling
- **Role-Based Access Control (RBAC)**: Strict separation between admin and student routes
- **Token Expiration**: Automatic refresh on 401/403 errors

### Data Protection

- **Row Level Security (RLS)**: Database-level authorization
- **Input Validation**: All inputs sanitized to prevent SQL injection
- **CORS Policy**: Restricted to allowed domains in production
- **HTTPS Only**: All traffic encrypted in transit

### Attendance Security

- **Dynamic QR Codes**: Rotating every 10 seconds to prevent screenshots
- **Duplicate Prevention**: Database constraints prevent multiple scans
- **Session Validation**: Server-side verification of all attendance marks
- **Device Fingerprinting**: Optional tracking to prevent proxy attendance

---

## 📚 Documentation

### API Endpoints

#### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/verify` - Verify token

#### Attendance
- `GET /api/events` - Get all events
- `POST /api/events` - Create new event
- `POST /api/attendance/mark` - Mark attendance
- `GET /api/attendance/history` - Get attendance history

#### Coordinators
- `GET /api/coordinators` - Get all coordinators
- `POST /api/coordinators` - Add new coordinator
- `DELETE /api/coordinators/:id` - Delete coordinator
- `POST /api/coordinators/attendance-pdf` - Generate attendance letter PDF

#### Assessments
- `GET /api/assessments` - Get all assessments
- `POST /api/assessments` - Create assessment
- `POST /api/assessments/allocate` - Allocate seats

### Workflows

#### Attendance Workflow
1. Admin creates an event
2. Admin launches projector view with dynamic QR code
3. Students scan QR code using built-in scanner
4. Backend validates token and prevents duplicates
5. Success message appears; admin counter updates in real-time

#### Coordinator Letter Generation
1. Admin navigates to Coordinators → Generate Letter
2. Fills in event details (title, date, time)
3. Selects coordinators from the list
4. Clicks "Preview Letter" to review PDF
5. Downloads professional attendance letter

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Pranav Gawai**

- GitHub: [@pranavgawaii](https://github.com/pranavgawaii)
- Email: pranavgawai1518@gmail.com

---

## 🙏 Acknowledgments

- MIT ADT University Training & Placement Cell
- All contributors and testers
- Open source community for amazing tools and libraries

---

<div align="center">

**Made with ❤️ for MIT ADT University**

⭐ Star this repo if you find it helpful!

</div>
