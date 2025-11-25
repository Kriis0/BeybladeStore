import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import UserBar from '../components/UserBar.jsx'
import { useNavigate } from 'react-router-dom'

export default function Profile() {
  const { user, saveProfile, setUser, logout } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState(user?.displayName || user?.name || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [address, setAddress] = useState(user?.address || '')
  const [newPassword, setNewPassword] = useState('')
  const [msg, setMsg] = useState('')

  async function save() {
    setMsg('')
    if (!name || String(name).trim() === '') return setMsg('El nombre es obligatorio')
    try {
      const next = { ...user, displayName: String(name).trim(), phone: String(phone || '').trim(), address: String(address || '').trim() }
      // persist via AuthContext helper which writes to profiles map
      await saveProfile(next)
      // also update in-memory user
      setUser(next)
      // Note: password change would require updatePassword method on AuthRepository (not yet implemented)
      if (newPassword.trim()) {
        console.log('[Profile] newPassword provided but not yet implemented in web API')
      }
      setMsg('Perfil actualizado')
      setNewPassword('')
    } catch (err) {
      console.error('saveProfile error', err)
      setMsg(err?.message || 'Error al guardar perfil')
    }
  }

  async function handleLogout() {
    try {
      await logout()
      navigate('/login')
    } catch (err) {
      setMsg(err?.message || 'Error al cerrar sesión')
    }
  }

  // Si es admin, muestra solo displayName, email, password
  // Si es usuario normal, muestra displayName, email, phone, address, password
  const isAdmin = user?.is_admin === true

  return (
    <div className="container py-3">
      <UserBar />
      <h1 className="mb-3">Mi Perfil</h1>
      <div style={{ maxWidth: 640 }}>
        <label className="form-label">Nombre para mostrar</label>
        <input className="form-control mb-2" value={name} onChange={(e) => setName(e.target.value)} />
        <label className="form-label">Email</label>
        <input className="form-control mb-2" value={user?.email || ''} disabled />
        
        {/* Solo mostrar teléfono y dirección si NO es admin (user normal) */}
        {!isAdmin && (
          <>
            <label className="form-label">Teléfono</label>
            <input className="form-control mb-2" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <label className="form-label">Dirección de envío</label>
            <input className="form-control mb-2" value={address} onChange={(e) => setAddress(e.target.value)} />
          </>
        )}
        
        <label className="form-label">Nueva contraseña (opcional)</label>
        <input type="password" className="form-control mb-2" placeholder="Dejar en blanco para no cambiar" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        <div className="d-flex gap-2">
          <button className="btn btn-primary" onClick={save}>Guardar cambios</button>
          <button className="btn btn-danger" onClick={handleLogout}>Salir</button>
        </div>
        {msg && <div className="alert alert-info mt-3">{msg}</div>}
      </div>
    </div>
  )
}
