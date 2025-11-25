import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import UserBar from '../components/UserBar.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { xanoStore } from '../api/client.js'

export default function AdminUsers() {
  const navigate = useNavigate()
  const { user, token } = useAuth()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [msgType, setMsgType] = useState('info')

  // Protección: solo admins
  if (!user || user.is_admin !== true) {
    return (
      <div className="container py-3">
        <UserBar />
        <div className="alert alert-danger">Solo los administradores pueden gestionar usuarios.</div>
      </div>
    );
  }

  useEffect(() => {
    loadUsers()
  }, [token])

  async function loadUsers() {
    try {
      setLoading(true)
      setMsg('')
      const users = await xanoStore.listUsers(token)
      setList(Array.isArray(users) ? users : [])
    } catch (err) {
      console.error('[AdminUsers] Error cargando usuarios:', err)
      setMsg('Error al cargar usuarios: ' + err.message)
      setMsgType('danger')
    } finally {
      setLoading(false)
    }
  }

  async function toggleAdminStatus(userId, currentIsAdmin) {
    try {
      setLoading(true)
      setMsg('')
      const newIsAdmin = !currentIsAdmin
      await xanoStore.updateUser(token, userId, { is_admin: newIsAdmin })
      setMsg(`Usuario ${newIsAdmin ? 'promovido a' : 'removido de'} administrador`)
      setMsgType('success')
      await loadUsers()
    } catch (err) {
      console.error('[AdminUsers] Error actualizando usuario:', err)
      setMsg('Error al actualizar usuario: ' + err.message)
      setMsgType('danger')
      setLoading(false)
    }
  }

  async function deleteUserHandler(userId, email) {
    if (!confirm(`¿Eliminar usuario ${email}?`)) return
    try {
      setLoading(true)
      setMsg('')
      await xanoStore.deleteUser(token, userId)
      setMsg('Usuario eliminado')
      setMsgType('success')
      await loadUsers()
    } catch (err) {
      console.error('[AdminUsers] Error eliminando usuario:', err)
      setMsg('Error al eliminar usuario: ' + err.message)
      setMsgType('danger')
      setLoading(false)
    }
  }

  return (
    <div className="container py-3">
      <UserBar />
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Gestionar usuarios</h1>
        <button 
          onClick={loadUsers} 
          disabled={loading} 
          className="btn btn-outline-secondary"
        >
          {loading ? 'Cargando...' : '⟳ Recargar'}
        </button>
      </div>

      {msg && <div className={`alert alert-${msgType}`}>{msg}</div>}

      {loading && list.length === 0 ? (
        <div className="text-center py-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      ) : list.length === 0 ? (
        <div className="alert alert-info">No hay usuarios en el sistema.</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover">
            <thead className="table-light">
              <tr>
                <th>Email</th>
                <th>Nombre</th>
                <th>Es Admin</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {list.map(u => (
                <tr key={u.id}>
                  <td><strong>{u.email}</strong></td>
                  <td>{u.name || '-'}</td>
                  <td>
                    <span className={`badge ${u.is_admin ? 'bg-success' : 'bg-secondary'}`}>
                      {u.is_admin ? '✓ Admin' : 'Usuario'}
                    </span>
                  </td>
                  <td>
                    <div className="d-flex gap-2">
                      <button 
                        className={`btn btn-sm ${u.is_admin ? 'btn-warning' : 'btn-primary'}`}
                        onClick={() => toggleAdminStatus(u.id, u.is_admin)}
                        disabled={loading}
                      >
                        {u.is_admin ? 'Remover admin' : 'Hacer admin'}
                      </button>
                      <button 
                        className="btn btn-sm btn-danger" 
                        onClick={() => deleteUserHandler(u.id, u.email)}
                        disabled={loading}
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
