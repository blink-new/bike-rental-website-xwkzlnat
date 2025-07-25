import { Navigate } from 'react-router-dom'

interface AdminRouteProps {
  children: React.ReactNode
  isAdmin: boolean
}

export default function AdminRoute({ children, isAdmin }: AdminRouteProps) {
  if (!isAdmin) {
    return <Navigate to="/admin-setup" replace />
  }

  return <>{children}</>
}