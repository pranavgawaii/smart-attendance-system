import { createElement, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import StandaloneLayout from './layouts/StandaloneLayout';

const Login = lazy(() => import('./pages/Login'));
const LandingPage = lazy(() => import('./pages/LandingPage'));
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'));
const StudentPlacements = lazy(() => import('./pages/student/StudentPlacements'));
const StudentJobDetails = lazy(() => import('./pages/student/StudentJobDetails'));
const StudentAttendance = lazy(() => import('./pages/student/StudentAttendance'));
const StudentScan = lazy(() => import('./pages/student/StudentScan'));
const ManualEntry = lazy(() => import('./pages/student/ManualEntry'));
const EventDetails = lazy(() => import('./pages/EventDetails'));
const AdminHome = lazy(() => import('./pages/admin/AdminHome'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminEvents = lazy(() => import('./pages/admin/AdminEvents'));
const AdminEventAttendance = lazy(() => import('./pages/admin/AdminEventAttendance'));
const AdminAttendance = lazy(() => import('./pages/admin/AdminAttendance'));
const AdminAssessments = lazy(() => import('./pages/admin/AdminAssessments'));
const CreateAssessment = lazy(() => import('./pages/admin/CreateAssessment'));
const AdminAssessmentDetails = lazy(() => import('./pages/admin/AdminAssessmentDetails'));
const SeatAllocation = lazy(() => import('./pages/admin/SeatAllocation'));
const AdminAllocations = lazy(() => import('./pages/admin/AdminAllocations'));
const AllocationsHome = lazy(() => import('./pages/admin/AllocationsHome'));
const CreateAllocation = lazy(() => import('./pages/admin/CreateAllocation'));
const PlacementApplications = lazy(() => import('./pages/admin/PlacementApplications'));
const PlacementEligibility = lazy(() => import('./pages/admin/PlacementEligibility'));
const PlacementStats = lazy(() => import('./pages/admin/PlacementStats'));
const AdminLabs = lazy(() => import('./pages/admin/AdminLabs'));
const Labs = lazy(() => import('./pages/admin/Labs'));
const AdminReports = lazy(() => import('./pages/admin/AdminReports'));
const AdminProfile = lazy(() => import('./pages/admin/AdminProfile'));
const AdminPlacements = lazy(() => import('./pages/admin/AdminPlacements'));
const CreatePlacement = lazy(() => import('./pages/admin/CreatePlacement'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));
const AdminManagement = lazy(() => import('./pages/admin/AdminManagement'));
const StudentProfile = lazy(() => import('./pages/admin/StudentProfile'));
const BulkStudentUpload = lazy(() => import('./pages/admin/BulkStudentUpload'));
const Coordinators = lazy(() => import('./pages/admin/Coordinators'));
const CoordinatorAttendance = lazy(() => import('./pages/admin/CoordinatorAttendance'));
const CoordinatorFormsHome = lazy(() => import('./pages/admin/forms/CoordinatorFormsHome'));
const FormBuilder = lazy(() => import('./pages/admin/forms/FormBuilder'));
const FormResponses = lazy(() => import('./pages/admin/forms/FormResponses'));
const PublicFormPage = lazy(() => import('./pages/public/PublicFormPage'));
const ProfileSetup = lazy(() => import('./pages/ProfileSetup'));
const Profile = lazy(() => import('./pages/Profile'));

const RouteFallback = () => (
  <div className="min-h-screen flex items-center justify-center text-zinc-500 text-sm">Loading...</div>
);

const renderLazy = (LazyComponent) => (
  <Suspense fallback={<RouteFallback />}>
    {createElement(LazyComponent)}
  </Suspense>
);

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={renderLazy(LandingPage)} />
            <Route path="/login" element={renderLazy(Login)} />
            <Route path="/profile-setup" element={renderLazy(ProfileSetup)} />

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  {renderLazy(Profile)}
                </ProtectedRoute>
              }
            />

            <Route
              path="/student"
              element={
                <ProtectedRoute role="student">
                  {renderLazy(StudentDashboard)}
                </ProtectedRoute>
              }
            />

            <Route
              path="/student/placements"
              element={
                <ProtectedRoute role="student">
                  {renderLazy(StudentPlacements)}
                </ProtectedRoute>
              }
            />

            <Route
              path="/student/placements/:id"
              element={
                <ProtectedRoute role="student">
                  {renderLazy(StudentJobDetails)}
                </ProtectedRoute>
              }
            />

            <Route
              path="/student/attendance"
              element={
                <ProtectedRoute role="student">
                  {renderLazy(StudentAttendance)}
                </ProtectedRoute>
              }
            />

            <Route
              path="/student/scan"
              element={
                <ProtectedRoute role="student">
                  {renderLazy(StudentScan)}
                </ProtectedRoute>
              }
            />

            <Route
              path="/student/manual-entry"
              element={
                <ProtectedRoute role="student">
                  {renderLazy(ManualEntry)}
                </ProtectedRoute>
              }
            />

            <Route
              path="/student/profile"
              element={
                <ProtectedRoute role="student">
                  {renderLazy(Profile)}
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin"
              element={
                <ProtectedRoute role="admin">
                  <Outlet />
                </ProtectedRoute>
              }
            >
              <Route index element={renderLazy(AdminHome)} />
              <Route path="users" element={renderLazy(AdminUsers)} />
              <Route path="events" element={renderLazy(AdminEvents)} />
              <Route path="events/create" element={renderLazy(AdminEvents)} />
              <Route path="events/:id/attendance" element={renderLazy(AdminEventAttendance)} />
              <Route path="attendance" element={renderLazy(AdminAttendance)} />
              <Route path="assessments" element={renderLazy(AdminAssessments)} />
              <Route path="users/bulk-upload" element={renderLazy(BulkStudentUpload)} />
              <Route path="placements" element={renderLazy(AdminPlacements)} />
              <Route path="placements/create" element={renderLazy(CreatePlacement)} />
              <Route path="placements/edit/:id" element={renderLazy(CreatePlacement)} />
              <Route path="placements/applications" element={renderLazy(PlacementApplications)} />
              <Route path="placements/eligibility" element={renderLazy(PlacementEligibility)} />
              <Route path="placements/stats" element={renderLazy(PlacementStats)} />
              <Route path="assessments/create" element={renderLazy(CreateAssessment)} />
              <Route path="assessments/:id" element={renderLazy(AdminAssessmentDetails)} />
              <Route path="allocations-old" element={renderLazy(AdminAllocations)} />
              <Route path="allocations" element={renderLazy(AllocationsHome)} />
              <Route path="allocations/create" element={renderLazy(CreateAllocation)} />
              <Route path="allocations/edit/:id" element={renderLazy(CreateAllocation)} />
              <Route path="allocations/:id" element={renderLazy(SeatAllocation)} />
              <Route path="labs-old" element={renderLazy(AdminLabs)} />
              <Route path="labs" element={renderLazy(Labs)} />
              <Route path="reports" element={renderLazy(AdminReports)} />
              <Route path="profile" element={renderLazy(AdminProfile)} />
              <Route path="settings" element={renderLazy(AdminSettings)} />
              <Route path="manage-admins" element={renderLazy(AdminManagement)} />
              <Route path="students/:id" element={renderLazy(StudentProfile)} />
              <Route path="coordinators" element={renderLazy(Coordinators)} />
              <Route path="coordinators/attendance" element={renderLazy(CoordinatorAttendance)} />
              <Route path="coordinators/forms" element={renderLazy(CoordinatorFormsHome)} />
              <Route path="coordinators/forms/new" element={renderLazy(FormBuilder)} />
              <Route path="coordinators/forms/:id/edit" element={renderLazy(FormBuilder)} />
              <Route path="coordinators/forms/:id/responses" element={renderLazy(FormResponses)} />
            </Route>

            <Route path="/forms/:slug" element={renderLazy(PublicFormPage)} />

            <Route
              element={
                <ProtectedRoute role="admin">
                  <StandaloneLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/admin/events/:id" element={renderLazy(EventDetails)} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
