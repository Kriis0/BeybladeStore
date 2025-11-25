// src/components/AdminRoute.jsx
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * Componente wrapper que protege rutas solo para administradores
 * Si el usuario no es admin, redirige a home
 */
export default function AdminRoute({ children }) {
  const { isAdmin, isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!isAdmin) {
    return (
      <div className="alert alert-danger mt-4">
        <h4>Acceso Denegado</h4>
        <p>Solo los administradores pueden acceder a esta sección.</p>
        <Navigate to="/" replace />
      </div>
    )
  }

  return children
}
