# 🎓 AttendEase - Smart Attendance System

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/Node.js-v18%2B-green.svg)
![React](https://img.shields.io/badge/React-v18-blue.svg)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791.svg)

**AttendEase** is a modern, secure, and efficient web-based application designed to streamline the attendance tracking process for educational institutions and corporate events. By leveraging **Dynamic QR Codes** and **Geolocation**, it ensures authentic presence and eliminates proxy attendance.

---

## 🚀 Key Features

### 🛡️ For Administrators
- **Event Management**: Create and schedule events/lectures with ease.
- **Dynamic QR Generation**: Project a rotating QR code (updates every 10s) to prevent sharing.
- **Real-Time Monitoring**: Watch live attendance counts and logs as users scan.
- **Data Export**: Export attendance records to CSV for reporting.
- **Session Control**: Start, Pause, and Stop attendance phases instantly.

### 🎓 For Students/Attendees
- **Secure Login**: OTP-based authentication for verified access.
- **Instant Marking**: Simply scan the projected QR code to mark present.
- **History Tracking**: View personal attendance history and logs.
- **Mobile Friendly**: optimized UI for smartphones.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [React.js](https://react.dev/) (Vite)
- **Styling**: Vanilla CSS / CSS Modules for a custom, lightweight design.
- **Http Client**: Axios

### Backend
- **Runtime**: [Node.js](https://nodejs.org/) & Express.js
- **Database**: [PostgreSQL](https://www.postgresql.org/) (via `pg` driver)
- **Authentication**: JWT (JSON Web Tokens) & OTP (Nodemailer)
- **Security**: bcrypt for hashing, rotating tokens for QR.

### DevOps
- **Hosting**: Railway / Vercel
- **Version Control**: Git & GitHub

---

## 🏁 Getting Started

Follow these steps to set up the project locally.

### Prerequisites
- **Node.js** (v18 or higher)
- **PostgreSQL** (Local or Cloud instance like Neon/Railway)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/pranavgawaii/smart-attendance-system.git
   cd smart-attendance-system
   ```

2. **Install Backend Dependencies**
   ```bash
   npm install
   ```

3. **Install Frontend Dependencies**
   ```bash
   cd client
   npm install
   cd ..
   ```

### Configuration

1. Create a `.env` file in the root directory:
   ```env
   PORT=3000
   DATABASE_URL=postgres://user:password@host:port/database
   JWT_SECRET=your_super_secret_key
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   ADMIN_EMAIL=admin@example.com
   ```

2. Create a `.env` file in the `client` directory:
   ```env
   VITE_API_BASE_URL=http://localhost:3000
   ```

### Running the Application

1. **Initialize Database** (Optional if using scripts)
   ```bash
   node scripts/patch-events-schema.js
   ```

2. **Start Backend**
   ```bash
   npm run dev
   ```

3. **Start Frontend** (in a new terminal)
   ```bash
   cd client
   npm run dev
   ```

---

## 📸 Screenshots

| Admin Dashboard | Student Scanner |
|:---:|:---:|
| *(Add Screenshot)* | *(Add Screenshot)* |

---

## 🤝 Contributing

Contributions are welcome! Please fork the repository and create a pull request for any feature enhancements or bug fixes.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

> **Note**: This project is currently under active development.
