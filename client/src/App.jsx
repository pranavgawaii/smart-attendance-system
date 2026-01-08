import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Login from './pages/Login';
import LandingPage from './pages/LandingPage';
import StudentDashboard from './pages/StudentDashboard';
import StudentPlacements from './pages/student/StudentPlacements';

import StudentJobDetails from './pages/student/StudentJobDetails';
import StudentAttendance from './pages/student/StudentAttendance';
// import AdminDashboard from './pages/AdminDashboard'; // Deprecated
import EventDetails from './pages/EventDetails';
import ProtectedRoute from './components/ProtectedRoute';
// import AdminLayout from './layouts/AdminLayout'; // Removed Legacy Layout
import StandaloneLayout from './layouts/StandaloneLayout';
import AdminHome from './pages/admin/AdminHome';
import AdminUsers from './pages/admin/AdminUsers';
import AdminEvents from './pages/admin/AdminEvents';
import AdminEventAttendance from './pages/admin/AdminEventAttendance';
import AdminAttendance from './pages/admin/AdminAttendance';
import AdminAssessments from './pages/admin/AdminAssessments';
import CreateAssessment from './pages/admin/CreateAssessment';
import AdminAssessmentDetails from './pages/admin/AdminAssessmentDetails';
import SeatAllocation from './pages/admin/SeatAllocation';
import AdminAllocations from './pages/admin/AdminAllocations';
import AdminLabs from './pages/admin/AdminLabs';
import AdminReports from './pages/admin/AdminReports';
import AdminProfile from './pages/admin/AdminProfile';
import AdminPlacements from './pages/admin/AdminPlacements';
import CreatePlacement from './pages/admin/CreatePlacement';
import AdminSettings from './pages/admin/AdminSettings';
import AdminManagement from './pages/admin/AdminManagement';
import StudentProfile from './pages/admin/StudentProfile';

import ProfileSetup from './pages/ProfileSetup';

import Profile from './pages/Profile';

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/profile-setup" element={<ProfileSetup />} />

            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />

            <Route path="/student" element={
              <ProtectedRoute role="student">
                <StudentDashboard />
              </ProtectedRoute>
            } />

            <Route path="/student/attendance" element={
              <ProtectedRoute role="student">
                <StudentAttendance />
              </ProtectedRoute>
            } />

            <Route path="/student/placements" element={
              <ProtectedRoute role="student">
                <StudentPlacements />
              </ProtectedRoute>
            } />

            <Route path="/student/placements/:id" element={
              <ProtectedRoute role="student">
                <StudentJobDetails />
              </ProtectedRoute>
            } />

            {/* Admin Routes */}
            <Route path="/admin" element={
              <ProtectedRoute role="admin">
                <Outlet />
              </ProtectedRoute>
            }>
              <Route index element={<AdminHome />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="events" element={<AdminEvents />} />
              <Route path="events/:id/attendance" element={<AdminEventAttendance />} />
              <Route path="attendance" element={<AdminAttendance />} />
              <Route path="assessments" element={<AdminAssessments />} />
              <Route path="placements" element={<AdminPlacements />} />
              <Route path="placements/create" element={<CreatePlacement />} />
              <Route path="placements/edit/:id" element={<CreatePlacement />} />
              <Route path="assessments/create" element={<CreateAssessment />} />
              <Route path="assessments/:id" element={<AdminAssessmentDetails />} />
              <Route path="allocations" element={<AdminAllocations />} />
              <Route path="allocations/:id" element={<SeatAllocation />} />
              <Route path="labs" element={<AdminLabs />} />
              <Route path="reports" element={<AdminReports />} />
              <Route path="profile" element={<AdminProfile />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="manage-admins" element={<AdminManagement />} />
              <Route path="students/:id" element={<StudentProfile />} />
            </Route>

            {/* Projector View (Standalone Layout) */}
            <Route element={
              <ProtectedRoute role="admin">
                <StandaloneLayout />
              </ProtectedRoute>
            }>
              <Route path="/admin/events/:id" element={<EventDetails />} />
            </Route>

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
