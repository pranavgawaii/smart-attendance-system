import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Login from './pages/Login';
import LandingPage from './pages/LandingPage';
import StudentDashboard from './pages/StudentDashboard';
import StudentPlacements from './pages/student/StudentPlacements';

import StudentJobDetails from './pages/student/StudentJobDetails';
import StudentAttendance from './pages/student/StudentAttendance';
import StudentScan from './pages/student/StudentScan';
import ManualEntry from './pages/student/ManualEntry';
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
// import AdminAssessments from './pages/admin/AdminAssessments'; // Removed
// import CreateAssessment from './pages/admin/CreateAssessment'; // Removed
// import AdminAssessmentDetails from './pages/admin/AdminAssessmentDetails'; // Removed
import SeatAllocation from './pages/admin/SeatAllocation';
import AdminAllocations from './pages/admin/AdminAllocations';
import AllocationsHome from './pages/admin/AllocationsHome';
import CreateAllocation from './pages/admin/CreateAllocation';
// import AdminStudentAnalytics from './pages/admin/AdminStudentAnalytics'; // REMOVED
import PlacementApplications from './pages/admin/PlacementApplications';
import PlacementEligibility from './pages/admin/PlacementEligibility';
import PlacementStats from './pages/admin/PlacementStats';
import AdminLabs from './pages/admin/AdminLabs';
import Labs from './pages/admin/Labs';
import AdminReports from './pages/admin/AdminReports';
import AdminProfile from './pages/admin/AdminProfile';
import AdminPlacements from './pages/admin/AdminPlacements';
import CreatePlacement from './pages/admin/CreatePlacement';
import AdminSettings from './pages/admin/AdminSettings';
import AdminManagement from './pages/admin/AdminManagement';
import StudentProfile from './pages/admin/StudentProfile';
import BulkStudentUpload from './pages/admin/BulkStudentUpload';
import Coordinators from './pages/admin/Coordinators';
import CoordinatorAttendance from './pages/admin/CoordinatorAttendance';
import CoordinatorFormsHome from './pages/admin/forms/CoordinatorFormsHome';
import FormBuilder from './pages/admin/forms/FormBuilder';
import FormResponses from './pages/admin/forms/FormResponses';
import PublicFormPage from './pages/public/PublicFormPage';

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

            {/* Student Routes */}
            {/* Student Routes */}
            <Route path="/student" element={
              <ProtectedRoute role="student">
                <StudentDashboard />
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

            <Route path="/student/attendance" element={
              <ProtectedRoute role="student">
                <StudentAttendance />
              </ProtectedRoute>
            } />

            <Route path="/student/scan" element={
              <ProtectedRoute role="student">
                <StudentScan />
              </ProtectedRoute>
            } />

            <Route path="/student/manual-entry" element={
              <ProtectedRoute role="student">
                <ManualEntry />
              </ProtectedRoute>
            } />

            <Route path="/student/profile" element={
              <ProtectedRoute role="student">
                <Profile />
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
              {/* <Route path="assessments" element={<AdminAssessments />} /> */}
              <Route path="users/bulk-upload" element={<BulkStudentUpload />} />
              {/* <Route path="users/analytics" element={<AdminStudentAnalytics />} /> */}
              {/* REMOVED: <Route path="users/analytics" element={<AdminStudentAnalytics />} /> */}
              <Route path="placements" element={<AdminPlacements />} />
              <Route path="placements/create" element={<CreatePlacement />} />
              <Route path="placements/edit/:id" element={<CreatePlacement />} />
              <Route path="placements/applications" element={<PlacementApplications />} />
              <Route path="placements/eligibility" element={<PlacementEligibility />} />
              <Route path="placements/stats" element={<PlacementStats />} />
              {/* <Route path="assessments/create" element={<CreateAssessment />} /> */}
              {/* <Route path="assessments/:id" element={<AdminAssessmentDetails />} /> */}
              <Route path="allocations-old" element={<AdminAllocations />} />
              <Route path="allocations" element={<AllocationsHome />} />
              <Route path="allocations/create" element={<CreateAllocation />} />
              <Route path="allocations/edit/:id" element={<CreateAllocation />} />
              <Route path="allocations/:id" element={<SeatAllocation />} />
              <Route path="labs-old" element={<AdminLabs />} />
              <Route path="labs" element={<Labs />} />
              <Route path="reports" element={<AdminReports />} />
              <Route path="profile" element={<AdminProfile />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="manage-admins" element={<AdminManagement />} />
              <Route path="students/:id" element={<StudentProfile />} />
              <Route path="coordinators" element={<Coordinators />} />
              <Route path="coordinators/attendance" element={<CoordinatorAttendance />} />
              <Route path="coordinator-forms" element={<CoordinatorFormsHome />} />
              <Route path="coordinator-forms/new" element={<FormBuilder />} />
              <Route path="coordinator-forms/:id/edit" element={<FormBuilder />} />
              <Route path="coordinator-forms/:id/responses" element={<FormResponses />} />
            </Route>

            {/* Public Form Page (No Auth Required) */}
            <Route path="/forms/:slug" element={<PublicFormPage />} />

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
