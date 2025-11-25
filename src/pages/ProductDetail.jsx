// src/pages/ProductDetail.jsx - Product detail page with image slider and qty selector
// Based on mobile ProductDetailScreen
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { listProducts } from '../api/xano.js';
import UserBar from '../components/UserBar.jsx';

const CLP = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [feedback, setFeedback] = useState(''); // Feedback de agregar al carrito
  const addingToCart = useRef(false); // Prevent double-click

  useEffect(() => {
    async function loadProduct() {
      try {
        setLoading(true);
        setError('');
        console.log('[ProductDetail] Cargando productos con token:', !!token);
        const products = await listProducts({ token, limit: 100 });
        console.log('[ProductDetail] Productos cargados:', products.length);
        const found = products.find(p => String(p.id) === String(id));
        if (!found) {
          setError('Producto no encontrado');
          return;
        }
        setProduct(found);
        setQuantity(1);
        setCurrentImageIndex(0);
      } catch (err) {
        console.error('[ProductDetail] Error loading product', err);
        setError(err.message || 'Error al cargar el producto');
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [id, token]);

  if (!user) {
    return (
      <div className="container py-3">
        <UserBar />
        <div className="alert alert-warning">Debes iniciar sesión para ver detalles del producto.</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container py-3">
        <UserBar />
        <div className="text-center py-5">Cargando producto...</div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container py-3">
        <UserBar />
        <div className="alert alert-danger">{error}</div>
        <button onClick={() => navigate('/home')} className="btn btn-primary">Volver a inicio</button>
      </div>
    );
  }

  // Get images array - support multiple field names
  const images = product.images || product.imageUris || product.image_uris || [];
  const hasImages = Array.isArray(images) && images.length > 0;
  const currentImage = hasImages ? images[currentImageIndex] : null;

  // Determine if admin
  const isAdmin = user?.is_admin === true;

  return (
    <div className="container py-3">
      <UserBar />
      {feedback && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          {feedback}
          <button type="button" className="btn-close" onClick={() => setFeedback('')}></button>
        </div>
      )}
      <div className="row">
        {/* Image slider */}
        <div className="col-md-6 mb-4">
          {hasImages ? (
            <div>
              <div className="card">
                <div className="card-body p-0" style={{ backgroundColor: '#f8f9fa', minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {typeof currentImage === 'string' ? (
                    <img src={currentImage} alt={product.name} style={{ maxWidth: '100%', maxHeight: 400, objectFit: 'contain' }} />
                  ) : currentImage?.url ? (
                    <img src={currentImage.url} alt={product.name} style={{ maxWidth: '100%', maxHeight: 400, objectFit: 'contain' }} />
                  ) : (
                    <div className="text-muted">Sin imagen</div>
                  )}
                </div>
              </div>
              
              {/* Image thumbnails */}
              {images.length > 1 && (
                <div className="d-flex gap-2 mt-3 overflow-auto">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`btn btn-sm p-0 flex-shrink-0 ${currentImageIndex === idx ? 'border-primary' : 'border-light'}`}
                      style={{ 
                        width: 60, 
                        height: 60, 
                        border: '2px solid',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundImage: `url(${typeof img === 'string' ? img : img?.url || ''})`
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="card">
              <div className="card-body p-5 text-center text-muted">
                Sin imágenes disponibles
              </div>
            </div>
          )}
        </div>

        {/* Product info */}
        <div className="col-md-6">
          <h2 className="mb-2">{product.name}</h2>
          
          <div className="mb-3">
            <span className="badge bg-primary fs-6">{CLP.format(product.price || 0)}</span>
            {product.stock_quantity !== undefined && (
              <span className="ms-2 text-muted">
                {product.stock_quantity > 0 ? `${product.stock_quantity} en stock` : 'Agotado'}
              </span>
            )}
          </div>

          {product.description && (
            <div className="mb-4">
              <h5>Descripción</h5>
              <p className="text-muted">{product.description}</p>
            </div>
          )}

          {/* Quantity selector and add to cart - only for non-admin */}
          {!isAdmin && (
            <div className="mt-5 pt-3 border-top">
              <div className="mb-3">
                <label className="form-label">Cantidad:</label>
                <div className="input-group" style={{ maxWidth: 200 }}>
                  <button
                    className="btn btn-outline-secondary"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    −
                  </button>
                  <input
                    type="number"
                    className="form-control text-center"
                    value={quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      setQuantity(Math.max(1, val));
                    }}
                    min="1"
                  />
                  <button
                    className="btn btn-outline-secondary"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                className="btn btn-success w-100"
                onClick={() => {
                  if (addingToCart.current) return; // Prevent double-click
                  addingToCart.current = true;
                  addToCart(product, quantity);
                  setFeedback(`✓ ${quantity} ${product.name} agregado(s) al carrito`);
                  setTimeout(() => setFeedback(''), 2000);
                  setTimeout(() => {
                    addingToCart.current = false;
                    navigate('/carrito');
                  }, 1500);
                }}
                disabled={!product.stock_quantity || product.stock_quantity <= 0}
              >
                🛒 Agregar al carrito
              </button>
            </div>
          )}

          {/* Edit button - only for admin */}
          {isAdmin && (
            <div className="mt-5 pt-3 border-top">
              <button
                className="btn btn-outline-primary w-100"
                onClick={() => navigate(`/create-product?id=${product.id}`)}
              >
                ✏️ Editar producto
              </button>
            </div>
          )}

          {/* Back button */}
          <div className="mt-3">
            <button onClick={() => navigate(-1)} className="btn btn-outline-secondary w-100">
              ← Volver
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
