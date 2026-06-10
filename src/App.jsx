/**
 * 應用根組件 — Auth 守衛 + 儀表板 + 獨立管理員編輯器路由
 * ─────────────────────────────────────────────────────────────
 * /admin-editor → AdminQuizEditor（免登入，全螢幕題庫編輯）
 * 其餘路徑 → 登入守衛 + DashboardDemo
 */
import DashboardDemo from './DashboardDemo';
import LoginPanel from './LoginPanel';
import AdminQuizEditor from './AdminQuizEditor.jsx';
import ErrorBoundary from './ErrorBoundary';
import { AuthProvider, AuthGuard } from './auth/AuthContext';

function isAdminEditorRoute() {
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  return path === '/admin-editor';
}

function AuthenticatedApp() {
  return (
    <AuthGuard fallback={<LoginPanel />}>
      <DashboardDemo />
    </AuthGuard>
  );
}

export default function App() {
  if (isAdminEditorRoute()) {
    return <AdminQuizEditor />;
  }

  return (
    <ErrorBoundary>
      <AuthProvider>
        <AuthenticatedApp />
      </AuthProvider>
    </ErrorBoundary>
  );
}
