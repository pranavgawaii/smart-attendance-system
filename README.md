# Smart Attendance & Placement Portal

A comprehensive institutional system for managing attendance tracking and placement assessments with QR-based authentication and automated seat allocation.

## 🚀 Features

### Attendance Management
- **QR Code Scanning**: Dynamic QR codes with automatic rotation for secure attendance
- **Manual Entry**: Backup code entry system for reliability
- **Real-time Tracking**: Live attendance monitoring with session controls
- **Duplicate Prevention**: Database-level and application-level duplicate checks
- **Device Fingerprinting**: Anti-proxy measures for attendance integrity

### Assessment & Placement
- **Student Shortlisting**: Flexible candidate selection for assessments
- **Automated Seat Allocation**: Intelligent lab and seat assignment
- **Conflict Detection**: Prevents double-booking and capacity violations
- **Student Portal**: View allocated seats and assessment details

### Admin Dashboard
- **Session Management**: Create, control (pause/resume/stop), and monitor events
- **User Management**: Manage students and administrators
- **Lab Configuration**: Define labs with capacity constraints
- **Reports & Analytics**: Attendance reports and event statistics

## 🛠️ Tech Stack

### Frontend
- **React** with Vite
- **React Router** for navigation
- **Axios** for API communication
- **html5-qrcode** for QR scanning
- **Lucide React** for icons

### Backend
- **Node.js** with Express
- **PostgreSQL** for data persistence
- **JWT** for authentication
- **bcrypt** for password hashing

## 📦 Installation

### Prerequisites
- Node.js 16+
- PostgreSQL 14+
- npm or yarn

### Backend Setup

```bash
# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your database credentials and JWT secret

# Initialize database
psql -U postgres -d your_database -f database/init.sql

# Start server
npm run dev
```

### Frontend Setup

```bash
cd client

# Install dependencies
npm install

# Configure environment
# Create .env file with:
# VITE_API_BASE_URL=http://localhost:3000

# Start development server
npm run dev
```

## 🌐 Deployment

### Railway (Backend)

1. Connect your GitHub repository to Railway
2. Set environment variables:
   - `DATABASE_URL`: Railway PostgreSQL connection string
   - `JWT_SECRET`: Secure random string (32+ characters)
   - `PORT`: Auto-assigned by Railway

### Vercel (Frontend)

1. Import project from GitHub
2. Set build settings:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Root Directory**: `client`
3. Set environment variable:
   - `VITE_API_BASE_URL`: Your Railway backend URL

## 🔐 Environment Variables

### Backend (.env)
```env
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
PORT=3000
```

### Frontend (client/.env)
```env
VITE_API_BASE_URL=http://localhost:3000
```

## 📚 API Documentation

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login and receive JWT token

### Events (Protected)
- `GET /events` - List all events
- `POST /events` - Create new event
- `PUT /events/:id/state` - Update session state (ACTIVE/PAUSED/STOPPED)

### Attendance (Protected)
- `POST /attendance` - Log attendance (QR or manual)
- `GET /attendance/my-history` - Get user's attendance history

### Assessments (Protected)
- `GET /assessments` - List assessments
- `POST /assessments` - Create assessment
- `POST /assessments/:id/allocations/generate` - Generate seat allocations

## 🏗️ Database Schema

Key tables:
- `users` - Student and admin accounts
- `events` - Attendance sessions
- `attendance_logs` - Attendance records with UNIQUE constraint
- `assessments` - Placement assessments
- `assessment_allocations` - Seat assignments
- `labs` - Lab configuration

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control (Student/Admin)
- Protected API routes
- Database-level unique constraints
- Device fingerprinting for attendance
- Token expiry handling

## 📱 User Roles

### Student
- Scan QR codes or enter manual codes
- View attendance history
- Check assessment allocations
- View assigned seats

### Administrator
- Create and manage events
- Control session states
- Manage users and labs
- Create assessments
- Generate seat allocations
- View reports and analytics

## 🧪 Testing

```bash
# Backend tests
npm test

# Frontend tests
cd client && npm test
```

## 📄 License

This project is licensed under the MIT License.

## 👥 Contributors

Built for MIT Art, Design & Technology University - Training & Placement Cell

## 🐛 Known Issues

- QR scanner requires HTTPS in production (browser security requirement)
- Camera permissions must be granted for QR scanning

## 🔄 Version

Current Version: 1.0.0

## 📞 Support

For issues and questions, please open a GitHub issue.
