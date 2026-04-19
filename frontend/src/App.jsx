import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { useAuth } from './context/AuthContext';
import Spinner from './components/ui/Spinner';

const LoginPage                = lazy(() => import('./pages/LoginPage'));
const DashboardPage            = lazy(() => import('./pages/DashboardPage'));
const SurveysListPage          = lazy(() => import('./pages/SurveysListPage'));
const CreateSurveyPage         = lazy(() => import('./pages/CreateSurveyPage'));
const EditSurveyPage           = lazy(() => import('./pages/EditSurveyPage'));
const ResultsPage              = lazy(() => import('./pages/ResultsPage'));
const PublicSurveyPage         = lazy(() => import('./pages/PublicSurveyPage'));
const ConversationalSurveyPage = lazy(() => import('./pages/ConversationalSurveyPage'));
const AnalyticsPage            = lazy(() => import('./pages/AnalyticsPage'));
const SettingsPage             = lazy(() => import('./pages/SettingsPage'));
const SetupWizard              = lazy(() => import('./pages/SetupWizard'));
const ConversationsPage        = lazy(() => import('./pages/ConversationsPage'));
const TemplatesPage            = lazy(() => import('./pages/TemplatesPage'));
const ExportHubPage            = lazy(() => import('./pages/ExportHubPage'));
const NotFoundPage             = lazy(() => import('./pages/NotFoundPage'));
const SurveyDraftPreviewPage   = lazy(() => import('./pages/SurveyDraftPreviewPage'));

const FullPageSpinner = () => (
  <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A0F1E' }}>
    <Spinner size="lg" />
  </div>
);

function ProtectedRoute({ children }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <FullPageSpinner />;
  if (!isAuthenticated) {
    const loc = window.location;
    return <Navigate to={`/login?redirect=${encodeURIComponent(loc.pathname + loc.search)}`} replace />;
  }
  if (user?.requires_password_reset) return <Navigate to="/setup" replace />;
  return children;
}

function SetupRoute({ children }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <FullPageSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!user?.requires_password_reset) return <Navigate to="/dashboard" replace />;
  return children;
}

function RootRedirect() {
  const { user, isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <FullPageSpinner />;
  if (isAuthenticated) {
    return <Navigate to={user?.requires_password_reset ? '/setup' : '/dashboard'} replace />;
  }
  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Suspense fallback={<FullPageSpinner />}>
      <Routes>
        {/* Public */}
        <Route path="/login"       element={<LoginPage />} />
        <Route path="/s/:id"       element={<PublicSurveyPage />} />
        <Route path="/s/:id/form"  element={<PublicSurveyPage />} />
        <Route path="/s/:id/convo" element={<ConversationalSurveyPage />} />
        <Route path="/preview/draft" element={<SurveyDraftPreviewPage />} />

        {/* Protected */}
        <Route path="/dashboard"           element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/surveys"             element={<ProtectedRoute><SurveysListPage /></ProtectedRoute>} />
        <Route path="/surveys/new"         element={<ProtectedRoute><CreateSurveyPage /></ProtectedRoute>} />
        <Route path="/surveys/:id/edit"    element={<ProtectedRoute><EditSurveyPage /></ProtectedRoute>} />
        <Route path="/surveys/:id/results" element={<ProtectedRoute><ResultsPage /></ProtectedRoute>} />
        <Route path="/analytics"           element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
        <Route path="/conversations"       element={<ProtectedRoute><ConversationsPage /></ProtectedRoute>} />
        <Route path="/templates"           element={<ProtectedRoute><TemplatesPage /></ProtectedRoute>} />
        <Route path="/export"              element={<ProtectedRoute><ExportHubPage /></ProtectedRoute>} />
        <Route path="/settings"            element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

        {/* Setup Flow */}
        <Route path="/setup" element={<SetupRoute><SetupWizard /></SetupRoute>} />

        {/* Root → smart redirect */}
        <Route path="/" element={<RootRedirect />} />

        {/* Catch-all */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
