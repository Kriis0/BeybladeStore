# 🎯 Beyblade Store - E-commerce con React + Xano

[![React](https://img.shields.io/badge/React-19.1.1-61DAFB?logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-7.1.7-646CFF?logo=vite)](https://vite.dev)
[![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3.8-7952B3?logo=bootstrap)](https://getbootstrap.com)
[![Xano](https://img.shields.io/badge/Xano-API-FF6B35?logo=xano)](https://xano.com)

Una aplicación de comercio electrónico moderna y completamente funcional para la venta de Beyblades, construida con **React 19**, **Vite** y backend completamente integrado a **Xano**.

---

## 🚀 Características Principales

### 🛍️ E-commerce Completo
- ✅ **Catálogo de productos** con búsqueda y filtros
- ✅ **Carrito de compras** con contador en tiempo real y persistencia
- ✅ **Sistema de órdenes** completo con tabla separada de items (`order_item`)
- ✅ **Sincronización de estados** entre admin y usuario en tiempo real
- ✅ **Gestión de inventario** sincronizado con Xano
- ✅ **Subida de imágenes** de productos a Xano

### 🔐 Autenticación & Autorización
- ✅ **Login/Signup** seguro con Xano
- ✅ **JWT tokens** para autenticación
- ✅ **Roles de usuario** (Admin, Cliente)
- ✅ **Protección de rutas** privadas
- ✅ **Persistencia de sesión**

### 👨‍💼 Panel de Administración
- ✅ **CRUD de productos** (crear, leer, actualizar, eliminar)
- ✅ **Gestión completa de órdenes** con cambio de estados
- ✅ **Visualización de items por orden** desde tabla `order_item` separada
- ✅ **Sincronización automática** de `payment_status` al confirmar órdenes
- ✅ **Gestión de usuarios** con verificación de roles

### 📱 Responsive Design
- ✅ **Mobile-first** con Bootstrap 5
- ✅ **Interfaz adaptativa** para todos los dispositivos
- ✅ **Navegación optimizada** en celulares

---

## 📋 Tabla de Contenidos

- [Instalación Rápida](#instalación-rápida)
- [Configuración](#configuración)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Scripts Disponibles](#scripts-disponibles)
- [Sistema de Órdenes](#-sistema-de-órdenes)
- [API & Endpoints](#api--endpoints)
- [Autenticación](#autenticación)
- [Gestión del Estado](#gestión-del-estado)
- [Desarrollo](#desarrollo)
- [Despliegue](#despliegue)
- [Troubleshooting](#troubleshooting)

---

## ⚡ Instalación Rápida

### Requisitos Previos
```bash
node --version  # v18+ requerido
npm --version   # v9+ requerido
```

### 3 Pasos para Empezar

1. **Clonar y instalar**
```bash
git clone https://github.com/tu-usuario/BeybladeStoreReactXano.git
cd BeybladeStoreReactXano-main
npm install
```

2. **Configurar variables de entorno**
```bash
cat > .env.local << EOF
VITE_XANO_AUTH_BASE=https://x8ki-letl-twmt.n7.xano.io/api:cctv-gNX/auth
VITE_XANO_STORE_BASE=https://x8ki-letl-twmt.n7.xano.io/api:cctv-gNX
EOF
```

3. **Iniciar servidor**
```bash
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173) ✅

---

## ⚙️ Configuración

### Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```env
# Backend Xano
VITE_XANO_AUTH_BASE=https://x8ki-letl-twmt.n7.xano.io/api:cctv-gNX/auth
VITE_XANO_STORE_BASE=https://x8ki-letl-twmt.n7.xano.io/api:cctv-gNX

# (Opcional) TTL del token si Xano no devuelve claims JWT decodificables
VITE_XANO_TOKEN_TTL_SEC=86400
```

### Proxy de Desarrollo

En `vite.config.js`, el proxy automáticamente redirige peticiones `/api` a Xano:

```javascript
'/api': {
  target: 'https://x8ki-letl-twmt.n7.xano.io',
  changeOrigin: true,
  rewrite: (path) => '/api:cctv-gNX' + path.replace(/^\/api/, ''),
}
```

**Ventaja:** Evita CORS durante desarrollo y mantiene URLs relativas.

---

## 📁 Estructura del Proyecto

```
BeybladeStoreReactXano-main/
├── src/
│   ├── api/
│   │   ├── client.js           # 🆕 Cliente HTTP unificado
│   │   ├── xano.js             # Wrappers de la API
│   │   └── diagnose.js         # Herramienta de diagnóstico
│   │
│   ├── components/
│   │   ├── ProductCard.jsx     # Tarjeta individual de producto
│   │   ├── ProductGrid.jsx     # Grid de productos
│   │   ├── ProductImagesSlider.jsx # Slider de imágenes
│   │   ├── Cart.jsx            # Carrito de compras
│   │   ├── Header.jsx          # Navegación
│   │   └── ...
│   │
│   ├── context/
│   │   ├── AuthContext.jsx     # 🌍 Estado global de auth
│   │   └── CartContext.jsx     # 🌍 Estado global del carrito
│   │
│   ├── pages/
│   │   ├── Home.jsx            # Página principal
│   │   ├── Login.jsx           # Página de login
│   │   ├── ProductDetail.jsx   # Detalle de producto
│   │   ├── Checkout.jsx        # Proceso de compra
│   │   ├── Orders.jsx          # Historial de órdenes
│   │   ├── AdminPanel.jsx      # Panel de admin
│   │   ├── CreateProduct.jsx   # CRUD de productos
│   │   └── ...
│   │
│   ├── styles/
│   │   ├── main.css            # Estilos globales
│   │   ├── components.css      # Estilos de componentes
│   │   └── variables.css       # Variables CSS
│   │
│   ├── types/
│   │   └── api.ts              # Tipos TypeScript para la API
│   │
│   ├── utils/
│   │   ├── format.js           # Funciones de formato
│   │   ├── validate.js         # Validaciones
│   │   └── storage.js          # Utilidades de localStorage
│   │
│   ├── App.jsx                 # Componente raíz
│   └── main.jsx                # Punto de entrada
│
├── vite.config.js              # Configuración de Vite
├── tsconfig.json               # Configuración TypeScript
├── tsconfig.node.json          # ✅ TypeScript para Vite (ARREGLADO)
├── package.json                # Dependencias
├── .env.local                  # Variables de entorno (no subir)
└── README.md                   # Este archivo
```

---

## 🎯 Sistema de Órdenes

### Arquitectura de Órdenes

El sistema de órdenes en Xano utiliza **dos tablas separadas** para máxima flexibilidad:

| Tabla | Propósito | Campos Principales |
|-------|-----------|-------------------|
| `order` | Datos generales de la orden | id, order_number, user_email, total_amount, status, payment_status, created_at |
| `order_item` | Items individuales de cada orden | id, order_id, product_id, product_name, quantity, unit_price |

### Flujo Completo de una Orden

```
1. Usuario agrega productos al carrito (CartContext)
   ↓
2. Usuario confirma checkout
   ↓
3. CartContext crea registro en tabla `order`
   ↓
4. CartContext crea items individuales en tabla `order_item`
   ↓
5. Orden aparece inmediatamente en "Mis Órdenes" del usuario
   ↓
6. Admin ve orden en Panel Admin con todos los items
   ↓
7. Admin cambia estado de orden → payment_status se sincroniza automáticamente
   ↓
8. Usuario ve cambios reflejados en tiempo real
```

### Estados de Orden

| Estado | Descripción | payment_status | Stock |
|--------|-------------|-----------------|-------|
| `pending` | Orden recién creada | pending | Reducido |
| `confirmed` | Admin confirmó el pago | **paid** (automático) | Reducido |
| `processing` | Preparando envío | paid | Reducido |
| `shipped` | Enviado | paid | Reducido |
| `completed` | Entregado | paid | Reducido |
| `cancelled` | Cancelado | cancelled | **Restaurado** |

### Cómo Funciona la Carga de Items

En `src/api/xano.js`, la función `listOrders()`:

```javascript
// 1. Carga TODAS las órdenes de la tabla `order`
const orders = await xanoStore.listOrders({ token })

// 2. Carga TODOS los items de la tabla `order_item` (SIN FILTRO)
// Esto evita problemas de filtrado en Xano
const allOrderItems = await xanoStore.listOrderItems(token)

// 3. Agrupa items por order_id en MEMORIA (en JavaScript)
const itemsByOrderId = {}
allOrderItems.forEach(item => {
  if (!itemsByOrderId[item.order_id]) {
    itemsByOrderId[item.order_id] = []
  }
  itemsByOrderId[item.order_id].push(item)
})

// 4. Enriquece cada orden con sus items
orders = orders.map(order => ({
  ...order,
  items: itemsByOrderId[order.id] || []
}))
```

**Ventaja:** Es más rápido, confiable y no depende de filtros en la API de Xano.

### Sincronización Admin ↔ Usuario

Cuando el admin cambia el estado de una orden en el Panel Admin:

```javascript
// AdminOrders.jsx
const handleUpdateOrderStatus = async (order, newStatus) => {
  const updatePayload = { status: newStatus }
  
  // Si cambias a 'confirmed', automáticamente marca como pagada
  if (newStatus === 'confirmed') {
    updatePayload.payment_status = 'paid'
  }
  
  await xanoStore.updateOrder(token, order.id, updatePayload)
}
```

Luego el usuario ve automáticamente en "Mis Órdenes":
- Estado de orden actualizado
- "Estado pago" cambia a "paid" (verde)

### Ejemplo Completo: Orden con Items

```json
{
  "id": 35,
  "order_number": "#123456",
  "user_email": "usuario@example.com",
  "total_amount": 59.98,
  "status": "confirmed",
  "payment_status": "paid",
  "created_at": 1732046146,
  "items": [
    {
      "id": 101,
      "order_id": 35,
      "product_id": 1,
      "product_name": "Beyblade B1",
      "quantity": 1,
      "unit_price": 29.99
    },
    {
      "id": 102,
      "order_id": 35,
      "product_id": 2,
      "product_name": "Beyblade B2",
      "quantity": 1,
      "unit_price": 29.99
    }
  ]
}
```

---

## 📝 Scripts Disponibles

### Desarrollo

```bash
# 🚀 Iniciar servidor de desarrollo (hot reload automático)
npm run dev

# 🔍 Verificar código con ESLint
npm run lint

# 👁️ Previsualizar build de producción localmente
npm run preview
```

### Producción

```bash
# 📦 Compilar para producción (minificado y optimizado)
npm run build

# 📊 Ver tamaño del build
npm run build -- --reporter=verbose
```

**Output:** La carpeta `dist/` estará lista para desplegar.

---

## 🔌 API & Endpoints

### Autenticación

#### 📝 POST `/auth/login`
Inicia sesión y obtiene JWT token.

**Request:**
```json
{
  "email": "usuario@example.com",
  "password": "contraseña123"
}
```

**Response:**
```json
{
  "authToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 123,
    "email": "usuario@example.com",
    "name": "Juan Pérez",
    "is_admin": false
  }
}
```

#### 📝 POST `/auth/signup`
Registra un nuevo usuario.

**Request:**
```json
{
  "name": "Nuevo Usuario",
  "email": "nuevo@example.com",
  "password": "contraseña123"
}
```

#### 🔒 GET `/auth/me`
Obtiene el perfil del usuario autenticado.

**Headers:**
```
Authorization: Bearer {token}
```

### Productos

#### 📚 GET `/product`
Lista todos los productos con paginación.

**Query Parameters:**
```
?limit=12&offset=0&q=beyblade
```

| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `limit` | number | 12 | Productos por página |
| `offset` | number | 0 | Número de productos a saltar |
| `q` | string | "" | Término de búsqueda |

**Response:**
```json
[
  {
    "id": 1,
    "name": "Beyblade Burst",
    "description": "Descripción del producto",
    "price": 29.99,
    "stock_quantity": 50,
    "images": [
      { "path": "https://...", "name": "image.jpg" }
    ]
  }
]
```

#### ➕ POST `/product`
Crear un nuevo producto (requiere token de admin).

**Headers:**
```
Authorization: Bearer {token}
```

**Body:**
```json
{
  "name": "Nuevo Beyblade",
  "description": "Descripción",
  "price": 39.99,
  "stock_quantity": 100,
  "type": "Attack",
  "series": "Burst"
}
```

#### ✏️ PATCH `/product/{id}`
Actualizar un producto.

#### 🗑️ DELETE `/product/{id}`
Eliminar un producto.

### Órdenes

#### 📋 GET `/order`
Listar todas las órdenes del usuario.

#### ➕ POST `/order`
Crear una nueva orden.

**Body:**
```json
{
  "user_id": 123,
  "items": [
    {
      "product_id": 1,
      "quantity": 2,
      "unit_price": 29.99
    }
  ],
  "total": 59.98,
  "status": "pending"
}
```

#### ✏️ PATCH `/order/{id}`
Actualizar estado de la orden.

---

## 🔐 Autenticación

### Flujo de Login

```
Usuario entra credenciales
    ↓
AuthContext llama xanoAuth.login()
    ↓
Xano valida y devuelve JWT + datos de usuario
    ↓
Token se guarda en localStorage
    ↓
Estado global se actualiza
    ↓
Usuario puede acceder a rutas protegidas
```

### Protección de Rutas

Usa el hook `useAuth()` para verificar autenticación:

```jsx
import { useAuth } from './context/AuthContext'

function AdminPanel() {
  const { isAdmin, user } = useAuth()
  
  if (!isAdmin) {
    return <Navigate to="/login" />
  }
  
  return <div>Panel Admin - Bienvenido {user.name}</div>
}
```

### Logout

Automáticamente limpia token y datos:

```javascript
const { logout } = useAuth()

function handleLogout() {
  logout()
  navigate('/login')
}
```

---

## 💾 Gestión del Estado

### AuthContext
Estado global de autenticación.

```javascript
import { useAuth } from './context/AuthContext'

const {
  user,              // { id, email, name, is_admin }
  token,             // JWT token
  isAuthenticated,   // boolean
  isAdmin,           // boolean
  login,             // async (email, password)
  logout,            // () => void
  signup             // async (name, email, password)
} = useAuth()
```

**Almacenamiento:**
- `localStorage.auth_token` → JWT token
- `localStorage.auth_user` → Datos del usuario
- `localStorage.auth_exp` → Tiempo de expiración

### CartContext
Estado global del carrito.

```javascript
import { useCart } from './context/CartContext'

const {
  items,            // Array de productos en carrito
  total,            // Total en pesos
  itemCount,        // Cantidad total de items
  addToCart,        // (productId, quantity)
  removeFromCart,   // (productId)
  updateQuantity,   // (productId, quantity)
  clearCart         // () => void
} = useCart()
```

**Almacenamiento:**
- `localStorage.cart` → Datos del carrito

---

## 🚀 Desarrollo

### Hot Module Replacement (HMR)
Vite automáticamente recarga cambios en el navegador. ✅

```bash
npm run dev
# Edita un archivo y verás los cambios instantáneamente
```

### Debugging

#### Logs en Consola
Todos los logs de API tienen prefijos para fácil identificación:

```javascript
// En src/api/client.js
console.log('[XANO API] 🌐 GET /product', { fullUrl: '...', hasToken: true })
console.log('[XANO API] 📥 Response: 200 OK')
console.log('[XANO API] ✅ Success:', data)
```

#### DevTools

1. Abre la consola del navegador (F12)
2. Busca logs con prefix `[XANO API]`
3. Verifica pestaña Network para ver peticiones
4. Revisa pestaña Storage → localStorage para tokens

### Testing Manual

```bash
# 1. Crear producto
- Login como admin
- Navega a "Crear Producto"
- Llena el formulario
- Verifica que aparece en Xano Dashboard

# 2. Carrito
- Agrega productos al carrito
- Verifica que aparecen en localStorage
- Intenta checkout

# 3. Órdenes
- Crea una orden
- Verifica que aparece en historial
- Intenta cambiar estado
```

---

## 🚢 Despliegue

### Build Local

```bash
npm run build
ls dist/  # Carpeta lista para desplegar
```

### GitHub Pages

1. Actualiza `vite.config.js`:
```javascript
export default defineConfig({
  base: '/BeybladeStoreReactXano/',
  ...
})
```

2. Build y push:
```bash
npm run build
git add dist/
git commit -m "Deploy"
git push origin main
```

3. En GitHub: Settings → Pages → Deploy from branch `gh-pages`

### Vercel

```bash
npm install -g vercel
vercel
```

Vercel automáticamente detecta Vite y despliega.

### Netlify

1. Conecta repo a Netlify
2. Configura:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
3. Envs: `VITE_XANO_AUTH_BASE` y `VITE_XANO_STORE_BASE`
4. Deploy automático en cada push

---

## 🐛 Troubleshooting

### Error: "Unable to locate request" en login

**Causa:** El endpoint `/auth/login` no existe en Xano.

**Solución:**
```bash
# Verifica en Xano Dashboard → API que existe /auth/login
# Verifica que VITE_XANO_AUTH_BASE es correcto en .env.local
# Abre consola (F12) y busca logs [XANO API]
```

### Error: "404 Not Found" en productos

**Causa:** Proxy no redirige correctamente.

**Solución:**
```bash
# 1. Reinicia servidor: npm run dev
# 2. Abre DevTools → Network
# 3. Verifica que peticiones van a Xano, no a localhost
```

### CORS Error en producción

**Causa:** Xano no permite tu dominio.

**Solución:**
```bash
# Ve a Xano Dashboard → API Settings
# Añade tu dominio de producción a "Allowed Origins"
# Ejemplo: https://tudominio.com
```

### Carrito no persiste

**Causa:** localStorage puede estar deshabilitado.

**Solución:**
```javascript
// Abre consola y ejecuta:
localStorage.getItem('cart')
// Si devuelve null, localStorage está deshabilitado
// Habilita en Settings del navegador
```

### Token expirado

**Síntoma:** Usuario se desconecta sin motivo.

**Solución:**
- Xano renovará token automáticamente
- O aumenta `VITE_XANO_TOKEN_TTL_SEC` en `.env.local`

---

## 📚 Recursos

### Documentación Externa
- [React Docs](https://react.dev)
- [Vite Guide](https://vite.dev)
- [Bootstrap Components](https://getbootstrap.com/docs)
- [Xano Documentation](https://docs.xano.com)

### Archivos de Documentación del Proyecto
- `XANO_API_USAGE.md` - Guía de uso de API
- `INTEGRATION_SUMMARY.md` - Resumen técnico
- `src/types/api.ts` - Tipos TypeScript

---

## 💡 Tips y Mejores Prácticas

### ✅ DO's
- ✅ Usa `useAuth()` hook para acceder a estado de autenticación
- ✅ Guarda sensitive data en localStorage, no en estado global
- ✅ Usa `useCallback` para optimizar re-renders
- ✅ Verifica logs en consola antes de reportar bugs

### ❌ DON'Ts
- ❌ No guardes tokens en plain JavaScript variables
- ❌ No hagas requests sin verificar autenticación primero
- ❌ No expongas secrets de Xano en el código
- ❌ No olvides incluir `Authorization` header en peticiones privadas

---

## 🤝 Contribución

1. Fork el proyecto
2. Crea rama: `git checkout -b feature/nueva-funcionalidad`
3. Commit: `git commit -m 'Add nueva funcionalidad'`
4. Push: `git push origin feature/nueva-funcionalidad`
5. Abre Pull Request

---

## 📄 Licencia

MIT © 2025 - Libre para usar en proyectos personales y comerciales.

---

## 📞 Soporte

- **Issues GitHub:** [Abre un issue](https://github.com/tu-usuario/BeybladeStoreReactXano/issues)
- **Documentación Xano:** https://docs.xano.com
- **React DevTools:** https://react.dev/link/react-devtools

---

## 🎯 Roadmap

- [ ] Autenticación con Google/GitHub
- [ ] Pagos con Stripe
- [ ] Sistema de reseñas avanzado
- [ ] Notificaciones push
- [ ] App móvil nativa (React Native)
- [ ] Dark mode
- [ ] Multiidioma (i18n)
- [ ] Analytics y tracking

---

## 🙏 Agradecimientos

Construido con ❤️ usando:
- **React 19** - UI library
- **Vite** - Build tool
- **Bootstrap 5** - CSS framework
- **Xano** - Serverless backend

**¡Que gane el mejor Beyblade! 🎯**

---

**Última actualización:** 25 de Noviembre, 2025  
**Versión:** 1.0.0 - Sistema de Órdenes Completo y Sincronizado  
**Status:** ✅ **Production Ready**

### ✅ Lo que Funciona
- ✅ Autenticación segura con Xano
- ✅ Sistema de roles (admin/usuario) con `is_admin` boolean
- ✅ Carrito de compras con contador en tiempo real
- ✅ Sistema de órdenes completo con tabla separada de items
- ✅ Sincronización automática de estados entre admin y usuario
- ✅ Visualización de órdenes con detalles de items
- ✅ CRUD de productos (solo admin)
- ✅ Subida de imágenes a Xano
- ✅ Gestión de inventario sincronizado

### 📋 Cambios Recientes (25/11/2025)
- ✨ Implementado sistema de órdenes con tabla `order_item` separada
- ✨ Sincronización automática de `payment_status` cuando admin confirma orden
- ✨ Carga de items sin filtro (en memoria) para evitar problemas de Xano
- ✨ Contador de carrito en navbar con badge
- ✨ Validación de propietario de orden en vista del usuario

### 🚀 Próximos Pasos Sugeridos
- [ ] Implementar pagos con Stripe/PayPal
- [ ] Agregar notificaciones por email
- [ ] Crear dashboard de estadísticas
- [ ] Implementar búsqueda avanzada con filtros
- [ ] Agregar sistema de reseñas y calificaciones
- [ ] Autenticación con OAuth (Google/GitHub)
