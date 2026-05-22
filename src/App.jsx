import { Toaster } from "@/components/ui/sonner"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import Dashboard from '@/pages/Dashboard';
import Courses from '@/pages/Courses';
import CourseDetail from '@/pages/CourseDetail';
import AssignmentDetail from '@/pages/AssignmentDetail';
import QuizBuilder from '@/pages/QuizBuilder';
import QuizPlay from '@/pages/QuizPlay';
import Assignments from '@/pages/Assignments';
import MyAssignments from '@/pages/MyAssignments';
import Grades from '@/pages/Grades';
import MyGrades from '@/pages/MyGrades';
import AdminUsers from '@/pages/AdminUsers';
import Settings from '@/pages/Settings';
import Arcade from '@/pages/Arcade';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin, user } = useAuth();
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-navy">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          <p className="text-white/40 text-xs font-editorial">Memuat...</p>
        </div>
      </div>
    );
  }
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }
  return (
    <Routes>
      <Route path="/choose-role" element={<Navigate to="/" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route element={<ProtectedRoute user={user} />}>
        <Route path="/quiz/:assignmentId/play" element={<QuizPlay />} />
        <Route element={<AppLayout user={user} />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/courses/:courseId" element={<CourseDetail />} />
          <Route path="/courses/:courseId/assignments/:assignmentId" element={<AssignmentDetail />} />
          <Route path="/courses/:courseId/quiz/new" element={<QuizBuilder />} />
          <Route path="/courses/:courseId/quiz/:assignmentId/edit" element={<QuizBuilder />} />
          <Route path="/courses/:courseId/quiz/:assignmentId" element={<QuizPlay />} />
          <Route path="/assignments" element={<Assignments />} />
          <Route path="/my-assignments" element={<MyAssignments />} />
          <Route path="/grades" element={<Grades />} />
          <Route path="/my-grades" element={<MyGrades />} />
          <Route path="/users" element={<AdminUsers />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/arcade" element={<Arcade />} />
        </Route>
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}
export default App
