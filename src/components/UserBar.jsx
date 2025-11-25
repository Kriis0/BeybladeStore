// Importamos React para crear el componente
import React, { useState } from 'react'
// Importamos el hook de autenticación para obtener el usuario
import { useAuth } from '../context/AuthContext.jsx'

// Componente que muestra el nombre del usuario autenticado
export default function UserBar() {
  // Obtenemos el usuario, token y expiración desde el contexto
  const { user, token, expiresAt } = useAuth()
  // Do not expose token or session details in the UI for security

  function fmtRemaining(ms) {
    if (ms == null) return '—'
    if (ms <= 0) return 'expirado'
    const totalSec = Math.floor(ms / 1000)
    const min = Math.floor(totalSec / 60)
    const sec = totalSec % 60
    return `${min}m ${sec}s`
  }

  const expText = expiresAt ? new Date(expiresAt).toLocaleString() : 'desconocido'
  const remainingText = fmtRemaining(expiresAt ? (expiresAt - Date.now()) : null)

  // Renderizamos una barra pequeña con el nombre del usuario y datos de sesión
  return (
    <div>
      {/* Texto indicando el estado de conexión */}
      {/* Banner de sesión: solo cuando el usuario ha iniciado sesión */}
      {/* Intentionally do not show session/token details in UI */}
    </div>
  )
}