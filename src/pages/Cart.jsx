import React from 'react'
import { useCart } from '../context/CartContext.jsx'
import UserBar from '../components/UserBar.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useNavigate } from 'react-router-dom'

const CLP = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })

export default function Cart() {
  const { items, updateQuantity, removeItem, checkout, clearCart } = useCart()
  const { token, user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = React.useState(false)
  const [msg, setMsg] = React.useState('')

  // Non-logged-in users cannot access cart
  if (!user) {
    return (
      <div className="container py-3">
        <UserBar />
        <div className="alert alert-warning">Debes iniciar sesión para ver el carrito.</div>
        <button onClick={() => navigate('/login')} className="btn btn-primary">Iniciar Sesión</button>
      </div>
    )
  }

  const total = items.reduce((acc, it) => acc + (it.product.price || 0) * it.quantity, 0)

  async function handleCheckout() {
    if (!token) { setMsg('Debes iniciar sesión para pagar'); return }
    setLoading(true)
    setMsg('')
    try {
      const res = await checkout({ user: user?.email || user?.name || 'guest' })
      setMsg('Compra realizada correctamente')
      // after successful checkout, navigate to orders so user can see it
      try { navigate('/ordenes') } catch {}
    } catch (err) {
      setMsg(err?.message || 'Error en el pago')
    } finally { setLoading(false) }
  }

  return (
    <div className="container py-3">
      <UserBar />
      <h1 className="mb-3">Carrito</h1>
      {items.length === 0 && <div className="alert alert-info">Tu carrito está vacío</div>}
      <div className="list-group mb-3">
        {items.map(it => (
          <div key={it.product.id} className="list-group-item d-flex justify-content-between align-items-center">
            <div>
              <strong>{it.product.name}</strong>
              <div className="text-muted">{CLP.format(it.product.price || 0)}</div>
            </div>
            <div className="d-flex align-items-center gap-2">
              <button className="btn btn-sm btn-outline-secondary" onClick={() => updateQuantity(it.product.id, it.quantity - 1)}>-</button>
              <div>{it.quantity}</div>
              <button className="btn btn-sm btn-outline-secondary" onClick={() => updateQuantity(it.product.id, it.quantity + 1)}>+</button>
              <button className="btn btn-sm btn-danger ms-2" onClick={() => removeItem(it.product.id)}>Eliminar</button>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-3">
        <div className="mb-2"><strong>Total:</strong> {CLP.format(total)}</div>
        <div className="d-flex gap-2 flex-wrap">
          <button className="btn btn-outline-secondary" onClick={() => navigate('/home')}>← Seguir comprando</button>
          <button className="btn btn-outline-danger" onClick={() => { if (confirm('¿Vaciar carrito?')) clearCart() }} disabled={items.length === 0}>Vaciar</button>
          <button className="btn btn-primary" onClick={handleCheckout} disabled={loading || items.length === 0}>{loading ? 'Procesando...' : 'Pagar'}</button>
        </div>
      </div>

      {msg && <div className="alert alert-info">{msg}</div>}
    </div>
  )
}
