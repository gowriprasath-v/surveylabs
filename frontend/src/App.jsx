import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { useAuth } from './context/AuthContext';
import Spinner from './components/ui/Spinner';

const LoginPage                = lazy(() => import('./pages/LoginPage'));
const DashboardPage            = lazy(() => import('./pages/DashboardPage'));
const CreateSurveyPage         = lazy(() => import('./pages/CreateSurveyPage'));
const EditSurveyPage           = lazy(() => import('./pages/EditSurveyPage'));
const ResultsPage              = lazy(() => import('./pages/ResultsPage'));
const PublicSurveyPage         = lazy(() => import('./pages/PublicSurveyPage'));
const ConversationalSurveyPage = lazy(() => import('./pages/ConversationalSurveyPage'));

const FullPageSpinner = () => (
  <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
    <Spinner size="lg" />
  </div>
);

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <FullPageSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function RootRedirect() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <FullPageSpinner />;
  return <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />;
}

export default function App() {
  return (
    <Suspense fallback={<FullPageSpinner />}>
      <Routes>
        {/* Public */}
        <Route path="/login"      element={<LoginPage />} />
        <Route path="/s/:id"      element={<PublicSurveyPage />} />
        <Route path="/s/:id/form" element={<PublicSurveyPage />} />
        <Route path="/s/:id/convo" element={<ConversationalSurveyPage />} />

        {/* Protected */}
        <Route path="/dashboard"            element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/surveys/new"          element={<ProtectedRoute><CreateSurveyPage /></ProtectedRoute>} />
        <Route path="/surveys/:id/edit"     element={<ProtectedRoute><EditSurveyPage /></ProtectedRoute>} />
        <Route path="/surveys/:id/results"  element={<ProtectedRoute><ResultsPage /></ProtectedRoute>} />

        {/* Root → smart redirect */}
        <Route path="/" element={<RootRedirect />} />

        {/* Catch-all */}
        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </Suspense>
  );
}
