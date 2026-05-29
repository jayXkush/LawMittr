import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore, getDashboardPath } from '@/store/authStore';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/LoginPage';
import { SignupPage } from '@/pages/SignupPage';
import { RoleSelectionPage } from '@/pages/RoleSelectionPage';
import { UserDashboard } from '@/pages/dashboards/UserDashboard';
import { LawyerDashboard } from '@/pages/dashboards/LawyerDashboard';
import { AdminDashboard } from '@/pages/dashboards/AdminDashboard';
import { AdminLoginPage } from '@/pages/AdminLoginPage';
import { LawyersPage } from '@/pages/LawyersPage';
import { LawyerDetailPage } from '@/pages/LawyerDetailPage';
import { PaymentPage } from '@/pages/PaymentPage';
import { PaymentSuccessPage } from '@/pages/PaymentSuccessPage';
import { PaymentFailurePage } from '@/pages/PaymentFailurePage';
import { MeetingJoinPage } from '@/pages/MeetingJoinPage';
import { MeetingRoomPage } from '@/pages/MeetingRoomPage';
import { DocumentsPage } from '@/pages/DocumentsPage';
import { DocumentAnalysisPage } from '@/pages/DocumentAnalysisPage';
import { ForumPage } from '@/pages/ForumPage';
import { ForumPostPage } from '@/pages/ForumPostPage';
import { ForumCreatePage } from '@/pages/ForumCreatePage';
import { StartupGate } from '@/components/startup/StartupGate';

function GuestOnly({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();
  if (isAuthenticated && user) {
    return <Navigate to={getDashboardPath(user.role)} replace />;
  }
  return <>{children}</>;
}

function AdminGuestOnly({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();
  if (isAuthenticated && user?.role === 'admin') {
    return <Navigate to="/dashboard/admin" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <StartupGate>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/lawyers" element={<LawyersPage />} />
          <Route path="/lawyers/:id" element={<LawyerDetailPage />} />

          <Route path="/forum" element={<ForumPage />} />
          <Route path="/forum/post/:id" element={<ForumPostPage />} />

          <Route
            path="/login"
            element={
              <GuestOnly>
                <LoginPage />
              </GuestOnly>
            }
          />
          <Route
            path="/signup/role"
            element={
              <GuestOnly>
                <RoleSelectionPage />
              </GuestOnly>
            }
          />
          <Route
            path="/signup"
            element={
              <GuestOnly>
                <SignupPage />
              </GuestOnly>
            }
          />

          <Route
            path="/admin/login"
            element={
              <AdminGuestOnly>
                <AdminLoginPage />
              </AdminGuestOnly>
            }
          />

          <Route element={<ProtectedRoute allowedRoles={['user']} />}>
            <Route path="/dashboard/user" element={<UserDashboard />} />
            <Route path="/appointments/:appointmentId/payment" element={<PaymentPage />} />
            <Route
              path="/appointments/:appointmentId/payment/success"
              element={<PaymentSuccessPage />}
            />
            <Route
              path="/appointments/:appointmentId/payment/failure"
              element={<PaymentFailurePage />}
            />
          </Route>

          {/* Meeting routes — accessible to both user and lawyer */}
          <Route element={<ProtectedRoute allowedRoles={['user', 'lawyer']} />}>
            <Route path="/meeting/join" element={<MeetingJoinPage />} />
            <Route path="/meeting/room/:meetingId" element={<MeetingRoomPage />} />
          </Route>

          {/* AI Document Analyzer — accessible to both user and lawyer */}
          <Route element={<ProtectedRoute allowedRoles={['user', 'lawyer']} />}>
            <Route path="/documents" element={<DocumentsPage />} />
            <Route path="/documents/:documentId" element={<DocumentAnalysisPage />} />
          </Route>

          {/* Community forum — create requires auth */}
          <Route element={<ProtectedRoute allowedRoles={['user', 'lawyer', 'admin']} />}>
            <Route path="/forum/create" element={<ForumCreatePage />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['lawyer']} />}>
            <Route path="/dashboard/lawyer" element={<LawyerDashboard />} />
          </Route>

          <Route
            element={<ProtectedRoute allowedRoles={['admin']} loginPath="/admin/login" />}
          >
            <Route path="/dashboard/admin" element={<AdminDashboard />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </StartupGate>
  );
}
