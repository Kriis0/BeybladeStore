// Importamos React y hooks necesarios para formularios y navegación
import React, { useState } from 'react'
// Importamos el hook de autenticación para ejecutar login por Axios y Fetch
import { useAuth } from '../context/AuthContext.jsx'
// Importamos el componente que muestra el nombre del usuario
import UserBar from '../components/UserBar.jsx'
// Importamos useNavigate para redirigir tras iniciar sesión
import { useNavigate } from 'react-router-dom'

// Componente de la página de inicio de sesión
export default function Login() {
  // Obtenemos función de login desde el contexto
  const { login, signup } = useAuth()
  // Creamos estado local para email y password
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [name, setName] = useState('')
  // Estado para manejar errores y carga
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  // Hook de navegación para redirigir al usuario
  const navigate = useNavigate()

  // Handler para login
  async function handleLogin(e) {
    // Prevenimos el submit por defecto
    e?.preventDefault?.()
    // Limpiamos errores y marcamos carga
    setErr('')
    setLoading(true)
    try {
      // Ejecutamos login
      await login({ email, password })
      // Redirigimos al Home tras login exitoso
      navigate('/home')
    } catch (error) {
      // Mostramos mensaje de error
      setErr(error?.message || 'Error al iniciar sesión')
    } finally {
      // Finalizamos la carga
      setLoading(false)
    }
  }

  // Handler para registro
  async function handleSignup(e) {
    // Prevenimos el submit por defecto
    e?.preventDefault?.()
    
    // Validación: contraseña debe coincidir
    if (password !== passwordConfirm) {
      setErr('Las contraseñas no coinciden')
      return
    }
    
    // Validación: contraseña debe tener al menos 6 caracteres
    if (password.length < 6) {
      setErr('La contraseña debe tener al menos 6 caracteres')
      return
    }
    
    // Limpiamos errores y marcamos carga
    setErr('')
    setLoading(true)
    try {
      // Ejecutamos signup
      await signup({ email, password, name })
      // Auto-login tras registro exitoso
      await login({ email, password })
      // Redirigimos al Home tras login exitoso
      navigate('/home')
    } catch (error) {
      // Mostramos mensaje de error
      setErr(error?.message || 'Error al registrarse')
    } finally {
      // Finalizamos la carga
      setLoading(false)
    }
  }

  // Renderizamos la interfaz de login con diseño mejorado
  return (
    // Contenedor principal con padding
    <div className="container py-3">
      {/* Barra con el nombre del usuario */}
      <UserBar />
      
      {/* Contenedor de formulario estilizado */}
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="product-card">
            {/* Título de la página */}
            <h2 className="mb-4 text-center">{isRegistering ? '📝 Registro' : '🔐 Inicio de Sesión'}</h2>
            
            {/* Formulario de credenciales */}
            <form className="d-grid gap-3" onSubmit={isRegistering ? handleSignup : handleLogin}>
              {/* Campo de nombre - solo en registro */}
              {isRegistering && (
                <div>
                  <label className="form-label" htmlFor="name">👤 Nombre completo</label>
                  <input 
                    id="name" 
                    type="text" 
                    className="form-control" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Tu nombre"
                    required
                  />
                </div>
              )}
              
              {/* Campo de email o usuario */}
              <div>
                {/* Etiqueta */}
                <label className="form-label" htmlFor="email">📧 Email o usuario</label>
                {/* Input controlado */}
                <input 
                  id="email" 
                  type={isRegistering ? 'email' : 'text'} 
                  className="form-control" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={isRegistering ? 'tu@email.com' : 'email o usuario (ej. user)'}
                  required
                />
              </div>
              {/* Campo de contraseña */}
              <div>
                {/* Etiqueta */}
                <label className="form-label" htmlFor="password">🔑 Contraseña</label>
                {/* Input controlado con toggle para mostrar/ocultar */}
                <div className="input-group">
                  <input 
                    id="password" 
                    type={showPassword ? 'text' : 'password'} 
                    className="form-control" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                  <button 
                    className="btn btn-outline-secondary" 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>
              
              {/* Campo de confirmación de contraseña - solo en registro */}
              {isRegistering && (
                <div>
                  {/* Etiqueta */}
                  <label className="form-label" htmlFor="passwordConfirm">🔑 Confirmar Contraseña</label>
                  {/* Input controlado con toggle */}
                  <div className="input-group">
                    <input 
                      id="passwordConfirm" 
                      type={showPasswordConfirm ? 'text' : 'password'} 
                      className={`form-control ${passwordConfirm && password !== passwordConfirm ? 'is-invalid' : ''}`}
                      value={passwordConfirm} 
                      onChange={(e) => setPasswordConfirm(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                    <button 
                      className="btn btn-outline-secondary" 
                      type="button"
                      onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                    >
                      {showPasswordConfirm ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                  {passwordConfirm && password !== passwordConfirm && (
                    <small className="text-danger d-block mt-1">Las contraseñas no coinciden</small>
                  )}
                </div>
              )}
              {/* Botón de login/signup */}
              <div className="mt-2">
                <button 
                  className="btn btn-primary w-100" 
                  disabled={loading || (isRegistering && password !== passwordConfirm)} 
                  type="submit"
                >
                  {loading ? '⏳ Procesando...' : (isRegistering ? '✨ Crear Cuenta' : '✨ Iniciar Sesión')}
                </button>
              </div>
            </form>
            
            {/* Link para cambiar entre login/registro */}
            <div className="mt-3 text-center">
              <button 
                className="btn btn-link" 
                onClick={() => { setIsRegistering(!isRegistering); setErr(''); }}
                type="button"
              >
                {isRegistering ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
              </button>
            </div>
            
            {/* Mostrar error si existe */}
            {err && (
              // Alerta Bootstrap para errores
              <div className="alert alert-danger mt-3">⚠️ {err}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}