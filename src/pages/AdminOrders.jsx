// src/pages/AdminOrders.jsx - Admin orders page (shows ALL orders for customer support)
// Based on mobile AdminOrdersScreen
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { listOrders, deleteOrder as apiDeleteOrder } from '../api/xano.js'
import { xanoStore } from '../api/client.js'
import { restoreStockForOrder } from '../utils/productStock.js'
import UserBar from '../components/UserBar.jsx';

const CLP = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });

export default function AdminOrders() {
  const { token, user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  // Redirect if not admin
  if (!user || user.is_admin !== true) {
    return (
      <div className="container py-3">
        <UserBar />
        <div className="alert alert-danger">Solo administradores pueden acceder a esta sección.</div>
      </div>
    );
  }

  const loadOrders = React.useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      // listOrders already handles loading and enriching orders with items from order_item table
      const data = await listOrders({ token });
      let all = Array.isArray(data) ? data : [];
      all.sort((a, b) => Number(b.created_at || 0) - Number(a.created_at || 0));
      setOrders(all);
    } catch (err) {
      console.error(err)
      setError('No fue posible cargar órdenes.')
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadOrders();
  }, [token, loadOrders]);

  const handleDeleteOrder = async (order) => {
    if (!confirm(`¿Eliminar orden #${order.order_number || order.id}? El stock será restaurado.`)) return;
    try {
      setLoading(true);
      if (order.items && Array.isArray(order.items) && order.items.length > 0) {
        try {
          restoreStockForOrder(order.items);
        } catch (e) {
          console.error('[AdminOrders] Error restoring stock', e);
        }
      }
      await apiDeleteOrder({ token, id: order.id })
      await loadOrders();
    } catch (err) {
      console.error('Error deleting order', err)
      setError(`Error al eliminar orden: ${err.message}`)
      await loadOrders();
    } finally { setLoading(false) }
  };

  const handleUpdateOrderStatus = async (order, newStatus) => {
    try {
      setLoading(true);
      // When confirming an order, also update payment_status to 'paid'
      const updatePayload = { status: newStatus };
      if (newStatus === 'confirmed') {
        updatePayload.payment_status = 'paid';
      }
      // Update in Xano backend ONLY
      await xanoStore.updateOrder(token, order.id, updatePayload);
      // Reload orders from Xano to ensure consistency
      await loadOrders();
    } catch (err) {
      console.error('Error updating order status:', err);
      setError(`Error al actualizar estado: ${err.message}`);
      setLoading(false);
    }
  };

  const handleClearAllOrders = async () => {
    if (!confirm('¿Eliminar TODAS las órdenes? Esta acción no se puede deshacer. El stock será restaurado para todos los productos.')) return;
    try {
      setLoading(true);
      // Delete each order and restore stock
      for (const order of orders) {
        try {
          if (order.items && Array.isArray(order.items) && order.items.length > 0) {
            try {
              restoreStockForOrder(order.items);
            } catch (e) {
              console.error('[AdminOrders] Error restoring stock for order', order.id, e);
            }
          }
          await apiDeleteOrder({ token, id: order.id })
        } catch (err) {
          console.error('Error deleting order', order.id, err)
        }
      }
      await loadOrders();
    } catch (err) {
      console.error('Error clearing all orders', err)
      setError(`Error al eliminar todas las órdenes: ${err.message}`)
    } finally { setLoading(false) }
  };

  return (
    <div className="container py-3">
      <UserBar />
      <div className="d-flex align-items-center justify-content-between mb-4">
        <h1 className="m-0">Órdenes</h1>
        <div className="btn-group" role="group">
          <button onClick={loadOrders} disabled={loading} className="btn btn-outline-secondary">
            {loading ? 'Cargando...' : '⟳ Recargar'}
          </button>
          {orders.length > 0 && (
            <button onClick={handleClearAllOrders} disabled={loading} className="btn btn-outline-danger">
              🗑️ Borrar todas
            </button>
          )}
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {orders.length === 0 && !loading && (
        <div className="alert alert-info">No hay órdenes.</div>
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
                      {new Date(Number(order.created_at) * 1000).toLocaleString('es-CL')} 
                      {' - '} 
                      {order.displayName || order.display_name || order.user_email?.split('@')[0] || order.email?.split('@')[0] || order.user || 'Cliente'}
                    </small>
                  </div>
                  <span className={`badge ${getStatusBadge(order.status)}`}>
                    {order.status || 'Pendiente'}
                  </span>
                </div>
                
                <div className="mt-3">
                  <div className="row">
                    <div className="col-md-6">
                      <strong>Total:</strong> {CLP.format(order.total_amount || 0)}
                    </div>
                    <div className="col-md-6">
                      <strong>Items:</strong> {order.items?.length || 0}
                    </div>
                  </div>
                  <div className="row mt-2 small text-muted">
                    <div className="col-md-6">
                      <strong>ID Orden:</strong> {order.id}
                    </div>
                    <div className="col-md-6">
                      <strong>Email:</strong> {order.user_email || order.email || order.user || '-'}
                    </div>
                  </div>
                </div>
                
                <div className="mt-2">
                  <strong>Estado:</strong> {' '}
                  <select 
                    className="form-select form-select-sm d-inline-block" 
                    style={{ width: 'auto' }}
                    value={order.status || 'pending'}
                    onChange={(e) => {
                      const newStatus = e.target.value
                      handleUpdateOrderStatus(order, newStatus)
                    }}
                  >
                    <option value="pending">Pendiente</option>
                    <option value="confirmed">Confirmada</option>
                    <option value="rejected">Rechazada</option>
                    <option value="completed">Completada</option>
                  </select>
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
                    <button className="btn btn-sm btn-outline-secondary" disabled title="Esta orden no tiene items registrados">
                      ⚠️ Sin detalles
                    </button>
                  )}
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => handleDeleteOrder(order)}
                    disabled={loading}
                  >
                    🗑️ Eliminar
                  </button>
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
