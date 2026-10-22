import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import AuthPending from './AuthPending'

// Guards private routes. While the saved login is being confirmed it shows a neutral blank page
// (never private content, never a redirect); if the server cannot be reached it offers "Try again".
export default function RequireAuth() {
  const { user, initializing, authError, retry } = useAuth()
  if (user) return <Outlet />
  if (initializing || authError) return <AuthPending authError={initializing ? '' : authError} retry={retry} />
  return <Navigate to="/" replace />
}
