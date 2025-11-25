// Importamos createContext y useState/useEffect para gestionar el estado global de autenticación
/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { xanoAuth } from '../api/client.js'

// Local storage keys - SOLO XANO
const KEY_SESSION = 'xano_session_user'
const KEY_TOKEN = 'xano_session_token'

const AuthContext = createContext(null)

// Limpiar localStorage de cualquier dato local antiguo
function clearLegacyLocalData() {
  try {
    // Remover todas las claves locales heredadas
    const keysToRemove = ['local_users_map', 'local_roles_map', 'local_profiles_map', 'local_session_user', 'local_session_token', 'auth_user'];
    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log('[Auth] ✅ Limpiados datos legados de localStorage');
  } catch (e) {
    console.warn('[Auth] No se pudo limpiar localStorage:', e);
  }
}

export function AuthProvider({ children }) {
  // Limpiar datos legales al iniciar
  useEffect(() => {
    clearLegacyLocalData();
  }, []);

  const [sessionUser, setSessionUser] = useState(() => localStorage.getItem(KEY_SESSION) || '')
  const [token, setToken] = useState(() => localStorage.getItem(KEY_TOKEN) || '')
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('xano_user_profile')
    if (!stored) return null
    try {
      return JSON.parse(stored)
    } catch {
      return null
    }
  })

  useEffect(() => {
    if (sessionUser) localStorage.setItem(KEY_SESSION, sessionUser)
    else localStorage.removeItem(KEY_SESSION)
  }, [sessionUser])

  useEffect(() => {
    if (token) localStorage.setItem(KEY_TOKEN, token)
    else localStorage.removeItem(KEY_TOKEN)
  }, [token])

  // Authentication API - Solo Xano (sin fallback local)
  const login = useCallback(async ({ email, password }) => {
    console.log('[Auth] Intentando login en Xano para:', email);
    
    try {
      const result = await xanoAuth.login({ email, password });
      console.log('[Auth] ✅ Login en Xano exitoso:', result);
      
      const xanoToken = result.authToken;
      const xanoUser = result.user || {};
      
      // Configurar sesión con token de Xano
      setSessionUser(email);
      setToken(xanoToken);
      
      // Obtener perfil desde Xano con el campo is_admin
      let profile = {
        id: xanoUser.id,
        email: xanoUser.email || email,
        name: xanoUser.name || email.split('@')[0],
        is_admin: xanoUser.is_admin === true || xanoUser.is_admin === 1, // Asegurar que sea boolean
      };
      
      // Guardar perfil completo en localStorage
      localStorage.setItem('xano_user_profile', JSON.stringify(profile));
      
      console.log('[Auth] ✅ Login exitoso:', { 
        email: profile.email, 
        name: profile.name, 
        is_admin: profile.is_admin 
      });
      setUser(profile);
      return { user: profile };
    } catch (err) {
      console.error('[Auth] ❌ Login en Xano falló:', err.message);
      throw new Error(`Credenciales inválidas en Xano: ${err.message}`);
    }
  }, []);

  const logout = useCallback(async () => {
    setSessionUser('')
    setUser(null)
    setToken('')
    localStorage.removeItem('xano_user_profile')
  }, [])

  const value = useMemo(() => ({
    user,
    sessionUser,
    token,
    login,
    logout,
    isAuthenticated: !!token && !!user,
    isAdmin: user?.is_admin === true,
  }), [user, sessionUser, token, login, logout])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}