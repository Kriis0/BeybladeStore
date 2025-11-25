// src/pages/Orders.jsx - Página de órdenes del usuario
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { listOrders, deleteOrder as apiDeleteOrder } from '../api/xano.js'
import { restoreStockForOrder } from '../utils/productStock.js'
import UserBar from '../components/UserBar.jsx';

// Formateador de moneda
const CLP = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });

export default function Orders() {
  const { token, user, sessionUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  const loadOrders = React.useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      console.debug('[Orders] ========== LOAD ORDERS START ==========');
      console.debug('[Orders] Current user:', { email: user?.email, name: user?.name, role: user?.role, sessionUser });
      
      // Load orders from Xano only (NO LOCAL FALLBACK)
      let all = [];
      try {
        const data = await listOrders({ token });
        all = Array.isArray(data) ? data : [];
      } catch (err) {
        console.error('[Orders] Error fetching orders from Xano:', err);
        setError('No fue posible cargar órdenes. Verifique su conexión a internet.');
        setOrders([]);
        return;
      }
      
      console.debug('[Orders] Orders from Xano:', all.length);
      
      // If current user is not admin, filter orders to only those owned by the user
      if (user && user.is_admin !== true) {
        console.debug('[Orders] Filtering for regular user');
        const filtered = all.filter(o => isOrderOwner(o, user, sessionUser));
        console.debug('[Orders] Filtered orders for user:', filtered.length, 'out of', all.length);
        setOrders(filtered);
      } else {
        console.debug('[Orders] Admin viewing all orders:', all.length);
        setOrders(all);
      }
      console.debug('[Orders] ========== LOAD ORDERS END ==========');
    } catch (err) {
      console.error('[Orders] ERROR:', err);
      setError('Error al cargar órdenes.');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [token, user]);

  useEffect(() => {
    loadOrders();
  }, [token, user, loadOrders]);

  if (!user) {
    return (
      <div className="container py-3">
        <UserBar />
        <h1 className="mb-3">Mis Órdenes</h1>
        <div className="alert alert-warning">Debes iniciar sesión para ver tus órdenes.</div>
      </div>
    );
  }

  return (
    <div className="container py-3">
      <UserBar />
      <div className="d-flex align-items-center justify-content-between mb-4">
        <h1 className="m-0">{user?.is_admin === true ? 'Órdenes' : 'Mis Órdenes'}</h1>
        <button onClick={loadOrders} disabled={loading} className="btn btn-outline-secondary">
          {loading ? 'Cargando...' : 'Recargar'}
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {orders.length === 0 && !loading && (
        <div className="alert alert-info">No tienes órdenes aún.</div>
      )}

      <div className="row g-3">
        {orders.map((order) => (
          <div className="col-12" key={order.id}>
            <div className="card">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <h5 className="card-title mb-1">Orden #{order.order_number || order.id}</h5>
                    <small className="text-muted">
                      {new Date(order.created_at * 1000).toLocaleDateString('es-CL')}
                    </small>
                  </div>
                  <span className={`badge ${getStatusBadge(order.status)}`}>
                    {order.status || 'Pendiente'}
                  </span>
                </div>
                <div className="mt-3">
                  <div className="row">
                    <div className="col-md-4">
                      <strong>Total:</strong> {CLP.format(order.total_amount || 0)}
                    </div>
                    <div className="col-md-4">
                      <strong>Pago:</strong> {order.payment_method || 'N/A'}
                    </div>
                    <div className="col-md-4">
                      <strong>Estado pago:</strong>{' '}
                      <span className={order.payment_status === 'paid' ? 'text-success' : 'text-warning'}>
                        {order.payment_status || 'Pendiente'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Expandable order details */}
                {expandedOrderId === order.id && order.items && Array.isArray(order.items) && order.items.length > 0 && (
                  <div className="mt-3 p-3 bg-light border rounded">
                    <h6 className="mb-2">Productos:</h6>
                    <table className="table table-sm mb-0">
                      <tbody>
                        {order.items.map((item, idx) => (
                          <tr key={idx}>
                            <td className="col">
                              {item.product_name || `Producto #${item.product_id}`}
                            </td>
                            <td className="col-auto text-end">
                              x{item.quantity}
                            </td>
                            <td className="col-auto text-end">
                              {CLP.format(item.unit_price || 0)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <div className="mt-3 d-flex gap-2 justify-content-end">
                  {order.items && Array.isArray(order.items) && order.items.length > 0 ? (
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                    >
                      {expandedOrderId === order.id ? '▲ Cerrar detalles' : '▼ Ver detalles'}
                    </button>
                  ) : (
                    <button className="btn btn-sm btn-outline-secondary" disabled>
                      📋 Sin detalles
                    </button>
                  )}
                  {/* Allow cancel/delete if owner or admin */}
                  {user && (user.is_admin === true || isOrderOwner(order, user)) && (
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={async () => {
                        if (!confirm('¿Confirmas eliminar/Cancelar esta orden? El stock de los productos será restaurado.')) return;
                        try {
                          setLoading(true);
                          // Restore stock for items in order (mirror mobile OrdersRepository.deleteOrder)
                          if (order.items && Array.isArray(order.items) && order.items.length > 0) {
                            try {
                              restoreStockForOrder(order.items);
                            } catch (e) {
                              console.error('[Orders] Error restoring stock', e);
                            }
                          }
                          await apiDeleteOrder({ token, id: order.id })
                          await loadOrders();
                        } catch (err) {
                          console.error('Error deleting order', err)
                          await loadOrders();
                        } finally { setLoading(false) }
                      }}
                    >Cancelar / Eliminar</button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function getStatusBadge(status) {
  const badges = {
    pending: 'bg-warning',
    processing: 'bg-info',
    shipped: 'bg-primary',
    delivered: 'bg-success',
    cancelled: 'bg-danger',
  };
  return badges[status] || 'bg-secondary';
}

// Determine if the given order belongs to the provided user.
// Works with different possible order shapes coming from backend or local payloads.
function isOrderOwner(order, user, sessionUser) {
  if (!order) return false;
  
  // If user not available, fall back to sessionUser
  const currentUserEmail = user?.email || sessionUser;
  if (!currentUserEmail || currentUserEmail === 'guest' || currentUserEmail === '') {
    return false;
  }
  
  // Normalize the current user email
  const normalizedUserEmail = String(currentUserEmail).toLowerCase().trim();
  
  // Get all possible email fields from the order
  const orderEmailFields = [
    order.user_email,
    order.email,
    order.customer_email,
    order.user,
    order.user?.email,
    order.customer?.email
  ].filter(Boolean); // Remove null/undefined
  
  // Check if any of the order's email fields match the current user
  for (const field of orderEmailFields) {
    const normalizedOrderEmail = String(field).toLowerCase().trim();
    if (normalizedOrderEmail && normalizedOrderEmail === normalizedUserEmail) {
      console.debug('[isOrderOwner] ✅ MATCHED order', order.id, '- user:', normalizedUserEmail);
      return true;
    }
  }
  
  // Last resort: check if order has no owner field at all (shouldn't happen, but be lenient)
  if (!orderEmailFields.length) {
    console.debug('[isOrderOwner] ⚠️ Order has no email fields, allowing:', order.id);
    return true;
  }
  
  console.debug('[isOrderOwner] ❌ NO MATCH for order', order.id, '- user:', normalizedUserEmail, 'order fields:', orderEmailFields);
  return false;
}
