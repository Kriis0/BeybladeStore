// src/pages/AdminEditUser.jsx - Edit user profile as admin
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useState } from 'react'
import UserBar from '../components/UserBar.jsx'

export default function AdminEditUser() {
  const { email } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  // Only admin can access
  if (!user || user.is_admin !== true) {
    return (
      <div className="container py-3">
        <UserBar />
        <div className="alert alert-danger">Solo los administradores pueden editar usuarios.</div>
      </div>
    )
  }

  return (
    <div className="container py-3">
      <UserBar />
      <div className="alert alert-info">
        <strong>Email:</strong> {email}
      </div>
      <button 
        className="btn btn-secondary" 
        onClick={() => navigate('/admin/users')}
      >
        ← Volver a usuarios
      </button>
    </div>
  )
}
