// src/pages/Settings.jsx - Pantalla de ajustes para Admin
// Desde aquí puede acceder a "Mi perfil" y cerrar sesión

import { useAuth } from '../context/AuthContext.jsx'
import { Link, useNavigate } from 'react-router-dom'
import UserBar from '../components/UserBar.jsx'

export default function Settings() {
  const { user } = useAuth()
  const navigate = useNavigate()

  // Solo admins pueden ver esta pantalla
  if (!user || user.is_admin !== true) {
    navigate('/home', { replace: true })
    return null
  }

  return (
    <div className="container py-4">
      <UserBar />
      <h1 className="mb-4">Ajustes</h1>
      
      <div className="list-group" style={{ maxWidth: 400 }}>
        <Link 
          to="/create-product" 
          className="list-group-item list-group-item-action"
        >
          ➕ Agregar producto
        </Link>
        <Link 
          to="/admin/ordenes" 
          className="list-group-item list-group-item-action"
        >
          📦 Ver órdenes
        </Link>
        <Link 
          to="/profile" 
          className="list-group-item list-group-item-action"
        >
          👤 Mi perfil
        </Link>
      </div>

      <Link to="/admin" className="btn btn-secondary mt-4">
        ← Volver a Admin
      </Link>
    </div>
  )
}
