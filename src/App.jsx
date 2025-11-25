// src/App.jsx - Contenedor de rutas de la aplicación
// Este archivo define las rutas: /home, /login, /logout y /crear-productos

// Importamos componentes de React Router para definir el enrutado
import { Routes, Route, Navigate, Link } from 'react-router-dom'
// Importamos el hook de autenticación para conocer usuario y token
import { useAuth } from './context/AuthContext.jsx'
// Importamos el hook del carrito para contar items
import { useCart } from './context/CartContext.jsx'
// Importamos el componente que protege rutas de admin
import AdminRoute from './components/AdminRoute.jsx'
// Importamos las páginas que vamos a mostrar
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Logout from './pages/Logout.jsx'
import CreateProduct from './pages/CreateProduct.jsx'
import Orders from './pages/Orders.jsx'
import Categories from './pages/Categories.jsx'
import Cart from './pages/Cart.jsx'
import Profile from './pages/Profile.jsx'
import AdminHub from './pages/AdminHub.jsx'
import AdminCatalog from './pages/AdminCatalog.jsx'
import AdminUsers from './pages/AdminUsers.jsx'
import AdminEditUser from './pages/AdminEditUser.jsx'
import AdminOrders from './pages/AdminOrders.jsx'
import ProductDetail from './pages/ProductDetail.jsx'
import Settings from './pages/Settings.jsx'

// Componente principal que renderiza la barra superior y las rutas
export default function App() {
  // Obtenemos el contexto para saber si hay usuario
  const { user, isAdmin } = useAuth() // Leemos usuario actual e isAdmin
  const { items } = useCart() // Obtenemos los items del carrito

  // Renderizamos la estructura de navegación y las rutas
  return (
    <div className="container py-4">
        {/* Barra de navegación mejorada */}
        <nav className="d-flex align-items-center gap-3 mb-4">
        {/* Logo/Título */}
        <Link to="/home" style={{ textDecoration: 'none' }}>
          <h4 className="m-0" style={{ 
            background: 'linear-gradient(135deg, #007bff, #ff6b35)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 'bold'
          }}>
            BeybladeStore
          </h4>
        </Link>
        {/* Enlaces de navegación */}
        {/* Only show admin links to admin users */}
        {isAdmin && <Link to="/create-product">Crear/Editar Producto</Link>}
        {isAdmin && <Link to="/admin">Panel Admin</Link>}
        {!isAdmin && user && (
          <Link to="/carrito" style={{ position: 'relative' }}>
            🛒 Carrito
            {items.length > 0 && (
              <span style={{
                position: 'absolute',
                top: '-8px',
                right: '-12px',
                background: '#ff6b35',
                color: 'white',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                {items.length}
              </span>
            )}
          </Link>
        )}
        {!isAdmin && user && <Link to="/ordenes">📋 Mis Órdenes</Link>}
        {/* Usuario y Login/Logout */}
        <span className="ms-auto text-muted">
          {user ? `👋 ${user.name || user.email}${isAdmin ? ' (Admin)' : ''}` : 'No conectado'}
        </span>
        {user ? (
          <>
            {!isAdmin && <Link to="/profile">Perfil</Link>}
            {isAdmin && <Link to="/settings">Ajustes</Link>}
            <Link to="/logout" className="btn btn-outline-danger btn-sm">Salir</Link>
          </>
        ) : (
          <Link to="/login" className="btn btn-primary btn-sm">Iniciar Sesión</Link>
        )}
      </nav>

      {/* Definición de rutas */}
      <Routes>
        {/* Redirección raíz a /home */}
        <Route path="/" element={<Navigate to="/home" replace />} />
        {/* Página de Home: muestra productos */}
        <Route path="/home" element={<Home />} />
        {/* Página de Login: formulario de inicio de sesión */}
        <Route path="/login" element={<Login />} />
        {/* Página de Logout: cierra la sesión */}
        <Route path="/logout" element={<Logout />} />
        {/* Página de creación/edición de productos: sólo admins */}
        <Route path="/create-product" element={<AdminRoute><CreateProduct /></AdminRoute>} />
        {/* Página de carrito */}
        <Route path="/carrito" element={<Cart />} />
        {/* Página de órdenes: muestra las órdenes del usuario */}
        <Route path="/ordenes" element={<Orders />} />
        <Route path="/profile" element={!isAdmin && user ? <Profile /> : <Navigate to="/home" replace />} />
        <Route path="/settings" element={<AdminRoute><Settings /></AdminRoute>} />
        <Route path="/admin" element={<AdminRoute><AdminHub /></AdminRoute>} />
        <Route path="/admin/catalog" element={<AdminRoute><AdminCatalog /></AdminRoute>} />
        <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
        <Route path="/admin/users/edit/:email" element={<AdminRoute><AdminEditUser /></AdminRoute>} />
        <Route path="/admin/ordenes" element={<AdminRoute><AdminOrders /></AdminRoute>} />
        <Route path="/producto/:id" element={<ProductDetail />} />
        {/* Página de categorías: gestión de categorías */}
        <Route path="/categorias" element={<Categories />} />
        {/* Ruta comodín: si no existe, redirige a home */}
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </div>
  )
}
