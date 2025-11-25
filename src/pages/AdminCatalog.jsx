// src/pages/AdminCatalog.jsx - Admin catalog/stock management screen
// Based on mobile AdminCatalogScreen
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { listProducts, updateProduct } from '../api/xano.js';
import UserBar from '../components/UserBar.jsx';
import { useNavigate } from 'react-router-dom';

const CLP = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });

export default function AdminCatalog() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [stockChanges, setStockChanges] = useState({});

  // Protección: solo admins
  if (!user || user.is_admin !== true) {
    return (
      <div className="container py-3">
        <UserBar />
        <div className="alert alert-danger">Solo los administradores pueden gestionar el catálogo.</div>
      </div>
    );
  }

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    try {
      setLoading(true);
      setError('');
      const data = await listProducts({ token, limit: 100 });
      setProducts(Array.isArray(data) ? data : []);
      setStockChanges({});
    } catch (err) {
      setError(err.message || 'Error al cargar productos');
    } finally {
      setLoading(false);
    }
  }

  function updateStock(productId, amount) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const currentStock = product.stock_quantity || product.stock || 0;
    const newStock = currentStock + amount;

    if (newStock < 0) return; // No permitir negativo

    setStockChanges(prev => ({
      ...prev,
      [productId]: newStock
    }));
  }

  async function handleSaveChanges() {
    const changedIds = Object.keys(stockChanges);
    if (changedIds.length === 0) {
      setError('No hay cambios para guardar');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    console.log('[AdminCatalog] Iniciando guardado de cambios', {
      token: !!token,
      changedCount: changedIds.length,
      changes: stockChanges
    });

    try {
      // Actualizar cada producto con el nuevo stock
      for (const productId of changedIds) {
        const newStock = stockChanges[productId];
        const product = products.find(p => p.id === productId);
        
        if (product) {
          const updatedData = {
            ...product,
            stock_quantity: newStock,
            stock: newStock,
          };
          
          console.log(`[AdminCatalog] Enviando update para producto ${productId}`, {
            newStock,
            updatedData
          });
          
          await updateProduct(token, productId, updatedData);
          
          console.log(`[AdminCatalog] ✅ Producto ${productId} actualizado en Xano`);
        }
      }

      // Actualizar estado local
      setProducts(prev =>
        prev.map(p => {
          if (stockChanges[p.id] !== undefined) {
            return { ...p, stock_quantity: stockChanges[p.id], stock: stockChanges[p.id] };
          }
          return p;
        })
      );

      setStockChanges({});
      setSuccess(`✅ Cambios guardados exitosamente en Xano (${changedIds.length} producto${changedIds.length === 1 ? '' : 's'})`);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('[AdminCatalog] ❌ Error al guardar', err);
      setError(err.message || 'Error al guardar cambios');
    } finally {
      setSaving(false);
    }
  }

  const hasChanges = Object.keys(stockChanges).length > 0;

  return (
    <div className="container py-3">
      <UserBar />
      
      <div className="d-flex align-items-center justify-content-between mb-4">
        <h1 className="m-0">Gestionar Catálogo / Stock</h1>
        <button 
          onClick={() => navigate('/admin')} 
          className="btn btn-outline-secondary"
        >
          ← Volver a Admin
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      ) : products.length === 0 ? (
        <div className="alert alert-info">No hay productos en el catálogo.</div>
      ) : (
        <>
          <div className="table-responsive">
            <table className="table table-hover">
              <thead className="table-light">
                <tr>
                  <th>Producto</th>
                  <th>Precio</th>
                  <th>Stock Actual</th>
                  <th>Ajustar Stock</th>
                  <th>Stock Nuevo</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => {
                  const currentStock = product.stock_quantity ?? product.stock ?? 0;
                  const newStock = stockChanges[product.id] !== undefined ? stockChanges[product.id] : currentStock;
                  const changed = stockChanges[product.id] !== undefined;

                  return (
                    <tr key={product.id} className={changed ? 'table-warning' : ''}>
                      <td>
                        <strong>{product.name}</strong>
                        {product.brand && <div className="text-muted small">{product.brand}</div>}
                      </td>
                      <td>{CLP.format(product.price || 0)}</td>
                      <td>{currentStock}</td>
                      <td>
                        <div className="d-flex gap-1">
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => updateStock(product.id, -1)}
                            disabled={saving}
                          >
                            −
                          </button>
                          <button
                            className="btn btn-sm btn-outline-success"
                            onClick={() => updateStock(product.id, 1)}
                            disabled={saving}
                          >
                            +
                          </button>
                          <input
                            type="number"
                            className="form-control form-control-sm"
                            style={{ maxWidth: 80 }}
                            value={newStock}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 0;
                              setStockChanges(prev => ({
                                ...prev,
                                [product.id]: Math.max(0, val)
                              }));
                            }}
                            min="0"
                            disabled={saving}
                          />
                        </div>
                      </td>
                      <td>
                        <span className={changed ? 'fw-bold text-warning' : 'text-muted'}>
                          {newStock}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4 d-flex gap-2">
            <button
              className="btn btn-primary"
              onClick={handleSaveChanges}
              disabled={!hasChanges || saving}
            >
              {saving ? '⏳ Guardando...' : '💾 Guardar Cambios'}
            </button>
            <button
              className="btn btn-outline-secondary"
              onClick={() => setStockChanges({})}
              disabled={!hasChanges || saving}
            >
              ⟲ Descartar
            </button>
          </div>

          {hasChanges && (
            <div className="alert alert-info mt-3">
              {Object.keys(stockChanges).length} producto{Object.keys(stockChanges).length === 1 ? '' : 's'} con cambios pendientes
            </div>
          )}
        </>
      )}
    </div>
  );
}
