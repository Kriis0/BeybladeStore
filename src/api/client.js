// src/api/client.js
// Cliente unificado para las APIs de Xano (Auth y Store) usando fetch
// Tipos disponibles en src/types/api.ts para referencia

// En desarrollo (localhost), usamos URLs relativas que van a través del proxy de Vite
// En producción, usamos URLs absolutas directamente
const isDev = import.meta.env.DEV;
const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';

// Si estamos en localhost DEV, usar proxy; si no, usar URLs directas de Xano
const useProxy = isDev && isLocalhost;

const AUTH_BASE = useProxy 
  ? '/api/auth'
  : (import.meta.env.VITE_XANO_AUTH_BASE || 'https://x8ki-letl-twmt.n7.xano.io/api:cctv-gNX/auth');

const STORE_BASE = useProxy 
  ? '/api'
  : (import.meta.env.VITE_XANO_STORE_BASE || 'https://x8ki-letl-twmt.n7.xano.io/api:cctv-gNX');

console.log('[API Init] Using:', { useProxy, AUTH_BASE, STORE_BASE });

function jsonOrNull(res) {
  if (res.status === 204) return null;
  const len = res.headers.get('content-length');
  if (len === '0') return null;
  return res.json();
}

async function request(base, path, { method = 'GET', headers = {}, query, body, token, isFormData = false } = {}) {

  // Construir URL: si base es relativa, concatenar strings; si es absoluta, usar new URL
  let url;
  if (base.startsWith('http')) {
    // Base absoluta: usar new URL para parseado correcto
    url = new URL(path, base);
  } else {
    // Base relativa: concatenar strings - asegurar que termina sin /
    const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
    const cleanPath = path.startsWith('/') ? path : '/' + path;
    const fullPath = cleanBase + cleanPath;
    url = new URL(fullPath, window.location.origin);
  }
  
  if (query) {
    console.debug('[XANO API] Query params:', query);
    Object.entries(query).forEach(([k, v]) => v != null && url.searchParams.append(k, String(v)));
  }

  const h = new Headers(headers);
  if (token) h.set('Authorization', `Bearer ${token}`);
  if (!isFormData && body != null && !(body instanceof Blob)) h.set('Content-Type', 'application/json');

  console.log(`[XANO API] 🌐 ${method} ${path}`, {
    fullUrl: url.href,
    hasToken: !!token,
    tokenValue: token ? token.substring(0, 20) + '...' : 'none',
    queryParams: query || {}
  });

  let res;
  try {
    res = await fetch(url, {
      method,
      headers: h,
      body: body == null ? undefined : (isFormData ? body : JSON.stringify(body))
    });
  } catch (fetchErr) {
    console.error('[XANO API] ❌ Fetch error (network/CORS):', fetchErr.message);
    throw new Error(`Network error: ${fetchErr.message}`);
  }
  
  console.log(`[XANO API] 📥 Response: ${res.status} ${res.statusText}`);
  
  if (!res.ok) {
    // read body (may be JSON with details) but avoid exposing it directly to UI
    const text = await res.text().catch(() => '');
    console.error('[XANO ERROR] ❌ API error:', {
      url: url.href,
      status: res.status,
      statusText: res.statusText,
      responseBody: text.substring(0, 200)
    });
    const friendly = `Error ${res.status}`;
    const err = new Error(friendly);
    err.status = res.status;
    err.body = text;
    throw err;
  }
  const data = await jsonOrNull(res);
  console.log(`[XANO API] ✅ Success:`, data);
  return data;
}

export const xanoAuth = {
  login: ({ email, password }) => request(AUTH_BASE, '/login', { method: 'POST', body: { email, password } }),
  me: (token) => request(AUTH_BASE, '/me', { token }),
  signup: ({ name, email, password }) => request(AUTH_BASE, '/signup', { method: 'POST', body: { name, email, password } }),
};

export const xanoStore = {
  // ============ Productos ============
  listProducts: ({ token, limit, offset, q } = {}) => request(STORE_BASE, '/product', { token, query: { limit, offset, q } }),
  getProduct: (id, { token } = {}) => request(STORE_BASE, `/product/${id}`, { token }),
  createProduct: (token, payload) => request(STORE_BASE, '/product', { method: 'POST', token, body: payload }),
  updateProduct: (token, id, payload) => request(STORE_BASE, `/product/${id}`, { method: 'PATCH', token, body: payload }),
  deleteProduct: (token, id) => request(STORE_BASE, `/product/${id}`, { method: 'DELETE', token }),
  
  // ============ Imágenes ============
  uploadImages: async (token, files) => {
    // Algunos endpoints de Xano para upload de imágenes aceptan 1 archivo por request.
    // Para evitar errores al enviar múltiples, subimos secuencialmente uno por uno.
    const results = [];
    for (const f of files) {
      const fd = new FormData();
      fd.append('content', f);
      // Cada llamada puede devolver un objeto con metadata de la imagen subida
      // o un array si el backend así lo configuró. Normalizamos a objeto único por iteración.
      const res = await request(STORE_BASE, '/upload/image', { method: 'POST', token, body: fd, isFormData: true });
      if (Array.isArray(res)) {
        results.push(...res);
      } else if (res) {
        results.push(res);
      }
    }
    // Si se subió una sola imagen, por compatibilidad algunos consumidores esperan un objeto o un array.
    // Aquí devolvemos un array consistente con todas las imágenes subidas.
    return results.length === 1 ? results[0] : results;
  },
  
  // ============ Categorías ============
  listCategories: ({ token } = {}) => request(STORE_BASE, '/product_category', { token }),
  getCategory: (id, { token } = {}) => request(STORE_BASE, `/product_category/${id}`, { token }),
  createCategory: (token, payload) => request(STORE_BASE, '/product_category', { method: 'POST', token, body: payload }),
  updateCategory: (token, id, payload) => request(STORE_BASE, `/product_category/${id}`, { method: 'PATCH', token, body: payload }),
  deleteCategory: (token, id) => request(STORE_BASE, `/product_category/${id}`, { method: 'DELETE', token }),
  
  // ============ Relaciones Producto-Categoría ============
  listProductCategoryRelations: ({ token } = {}) => request(STORE_BASE, '/product_category_relation', { token }),
  getProductCategoryRelation: (id, { token } = {}) => request(STORE_BASE, `/product_category_relation/${id}`, { token }),
  createProductCategoryRelation: (token, payload) => request(STORE_BASE, '/product_category_relation', { method: 'POST', token, body: payload }),
  updateProductCategoryRelation: (token, id, payload) => request(STORE_BASE, `/product_category_relation/${id}`, { method: 'PATCH', token, body: payload }),
  deleteProductCategoryRelation: (token, id) => request(STORE_BASE, `/product_category_relation/${id}`, { method: 'DELETE', token }),
  
  // ============ Órdenes ============
  listOrders: ({ token } = {}) => request(STORE_BASE, '/order', { token }),
  getOrder: (id, { token } = {}) => request(STORE_BASE, `/order/${id}`, { token }),
  createOrder: (token, payload) => request(STORE_BASE, '/order', { method: 'POST', token, body: payload }),
  updateOrder: (token, id, payload) => request(STORE_BASE, `/order/${id}`, { method: 'PATCH', token, body: payload }),
  deleteOrder: (token, id) => request(STORE_BASE, `/order/${id}`, { method: 'DELETE', token }),
  
  // ============ Items de Orden ============
  listOrderItems: (token, query = {}) => request(STORE_BASE, '/order_item', { token, query }),
  getOrderItem: (id, { token } = {}) => request(STORE_BASE, `/order_item/${id}`, { token }),
  createOrderItem: (token, payload) => request(STORE_BASE, '/order_item', { method: 'POST', token, body: payload }),
  updateOrderItem: (token, id, payload) => request(STORE_BASE, `/order_item/${id}`, { method: 'PATCH', token, body: payload }),
  deleteOrderItem: (token, id) => request(STORE_BASE, `/order_item/${id}`, { method: 'DELETE', token }),
  
  // ============ Inventario ============
  listInventory: ({ token } = {}) => request(STORE_BASE, '/inventory', { token }),
  getInventory: (id, { token } = {}) => request(STORE_BASE, `/inventory/${id}`, { token }),
  createInventory: (token, payload) => request(STORE_BASE, '/inventory', { method: 'POST', token, body: payload }),
  updateInventory: (token, id, payload) => request(STORE_BASE, `/inventory/${id}`, { method: 'PATCH', token, body: payload }),
  deleteInventory: (token, id) => request(STORE_BASE, `/inventory/${id}`, { method: 'DELETE', token }),
  
  // ============ Direcciones ============
  listAddresses: ({ token } = {}) => request(STORE_BASE, '/address', { token }),
  getAddress: (id, { token } = {}) => request(STORE_BASE, `/address/${id}`, { token }),
  createAddress: (token, payload) => request(STORE_BASE, '/address', { method: 'POST', token, body: payload }),
  updateAddress: (token, id, payload) => request(STORE_BASE, `/address/${id}`, { method: 'PATCH', token, body: payload }),
  deleteAddress: (token, id) => request(STORE_BASE, `/address/${id}`, { method: 'DELETE', token }),
  
  // ============ Reseñas ============
  listReviews: ({ token } = {}) => request(STORE_BASE, '/review', { token }),
  getReview: (id, { token } = {}) => request(STORE_BASE, `/review/${id}`, { token }),
  createReview: (token, payload) => request(STORE_BASE, '/review', { method: 'POST', token, body: payload }),
  updateReview: (token, id, payload) => request(STORE_BASE, `/review/${id}`, { method: 'PATCH', token, body: payload }),
  deleteReview: (token, id) => request(STORE_BASE, `/review/${id}`, { method: 'DELETE', token }),
};

export function makeAuthHeader(token) {
  return { Authorization: `Bearer ${token}` };
}
