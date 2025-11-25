// src/pages/Categories.jsx - Gestión de categorías
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { xanoStore } from '../api/client.js';
import UserBar from '../components/UserBar.jsx';

export default function Categories() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ name: '', description: '', category_type: '' });
  const [creating, setCreating] = useState(false);

  const loadCategories = React.useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await xanoStore.listCategories({ token });
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Error al cargar categorías');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!token) {
      setError('Debes iniciar sesión para crear categorías.');
      return;
    }
    try {
      setCreating(true);
      setError('');
      await xanoStore.createCategory(token, formData);
      setFormData({ name: '', description: '', category_type: '' });
      await loadCategories();
    } catch (err) {
      console.error(err)
      setError('No fue posible crear la categoría. Intenta nuevamente.');
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('¿Eliminar esta categoría?')) return;
    try {
      await xanoStore.deleteCategory(token, id);
      await loadCategories();
    } catch (err) {
      console.error(err)
      setError('No fue posible eliminar la categoría. Intenta nuevamente.')
    }
  }

  return (
    <div className="container py-3">
      <UserBar />
      <div className="d-flex align-items-center justify-content-between mb-4">
        <h1 className="m-0">Categorías</h1>
        <button onClick={loadCategories} disabled={loading} className="btn btn-outline-secondary">
          {loading ? 'Cargando...' : 'Recargar'}
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Formulario de creación */}
      <div className="card mb-4">
        <div className="card-body">
          <h5 className="card-title">Nueva Categoría</h5>
          <form onSubmit={handleSubmit} className="row g-3">
            <div className="col-md-4">
              <input
                type="text"
                className="form-control"
                placeholder="Nombre"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="col-md-4">
              <input
                type="text"
                className="form-control"
                placeholder="Tipo (ej: Attack, Defense)"
                value={formData.category_type}
                onChange={(e) => setFormData({ ...formData, category_type: e.target.value })}
              />
            </div>
            <div className="col-md-12">
              <textarea
                className="form-control"
                placeholder="Descripción"
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="col-12">
              <button type="submit" disabled={creating || !token} className="btn btn-dark">
                {creating ? 'Creando...' : 'Crear Categoría'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Lista de categorías */}
      <div className="row g-3">
        {categories.map((cat) => (
          <div className="col-md-6 col-lg-4" key={cat.id}>
            <div className="card h-100">
              <div className="card-body">
                <h5 className="card-title">{cat.name}</h5>
                {cat.category_type && (
                  <span className="badge bg-secondary mb-2">{cat.category_type}</span>
                )}
                <p className="card-text small text-muted">{cat.description || 'Sin descripción'}</p>
                {token && (
                  <button
                    onClick={() => handleDelete(cat.id)}
                    className="btn btn-sm btn-outline-danger"
                  >
                    Eliminar
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {categories.length === 0 && !loading && (
        <div className="alert alert-info mt-3">No hay categorías creadas aún.</div>
      )}
    </div>
  );
}
