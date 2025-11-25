// src/api/xano.js - Módulo para interactuar con la API de Xano
// Este archivo contiene todas las funciones necesarias para comunicarse con el backend de Xano
// SOLO USA XANO - SIN ALMACENAMIENTO LOCAL

import { xanoStore, makeAuthHeader as makeAuthHeaderBase } from './client.js';

// Re-exportamos makeAuthHeader para compatibilidad con código existente
export const makeAuthHeader = makeAuthHeaderBase;

// 1) Función para crear un nuevo producto (sin imágenes inicialmente)
// Parámetros:
// - token: JWT para autenticación
// - payload: objeto con los datos del producto (nombre, precio, etc.)
export async function createProduct(token, payload) {
  // Normalizamos payload con defaults esperados por el endpoint
  const body = {
    name: payload.name,
    description: payload.description ?? '',
    price: Number(payload.price ?? 0),
    stock_quantity: Number(payload.stock_quantity ?? payload.stock ?? 0),
    brand: payload.brand ?? '',
    // El backend espera 'type'; usamos category si llegó
    type: payload.type ?? payload.category ?? '',
    series: payload.series ?? '',
    weight: payload.weight ?? null,
    release_year: payload.release_year ?? null,
    // Campos operativos comúnmente requeridos
    created_at: payload.created_at ?? Math.floor(Date.now() / 1000),
    is_active: payload.is_active ?? true,
  };
  return xanoStore.createProduct(token, body);
}

// 2) Función para subir múltiples imágenes al servidor
// Parámetros:
// - token: JWT para autenticación
// - files: array de archivos (objetos File del navegador)
export async function uploadImages(token, files) {
  const data = await xanoStore.uploadImages(token, files);
  // Si la respuesta es un objeto (imagen única), lo convertimos a array
  // Si es array, lo devolvemos tal cual
  const arr = Array.isArray(data) ? data : (data ? [data] : []);
  return arr;
}

// 3) Función para asociar imágenes a un producto existente
// Parámetros:
// - token: JWT para autenticación
// - productId: ID del producto al que asociar las imágenes
// - imagesFullArray: array completo con la información de las imágenes subidas
export async function attachImagesToProduct(token, productId, imagesFullArray) {
  // Ahora el esquema usa 'images' (array). Guardamos todas las subidas.
  // Aseguramos un array plano de objetos imagen.
  const images = Array.isArray(imagesFullArray) ? imagesFullArray : (imagesFullArray ? [imagesFullArray] : []);
  return xanoStore.updateProduct(token, productId, { images });
}

// 3b) Función para actualizar un producto (stock, precio, etc.)
// Parámetros:
// - token: JWT para autenticación
// - productId: ID del producto a actualizar
// - updates: objeto con los campos a actualizar
export async function updateProduct(token, productId, updates) {
  // Normalizamos los datos antes de enviar al servidor
  const body = {
    name: updates.name !== undefined ? String(updates.name).trim() : undefined,
    description: updates.description !== undefined ? String(updates.description).trim() : undefined,
    price: updates.price !== undefined ? Number(updates.price) : undefined,
    stock_quantity: updates.stock_quantity !== undefined ? Number(updates.stock_quantity) : undefined,
    stock: updates.stock !== undefined ? Number(updates.stock) : undefined,
    brand: updates.brand !== undefined ? String(updates.brand).trim() : undefined,
    type: updates.type !== undefined ? String(updates.type).trim() : undefined,
    series: updates.series !== undefined ? String(updates.series).trim() : undefined,
    category: updates.category !== undefined ? String(updates.category).trim() : undefined,
  };

  // Remover campos undefined
  Object.keys(body).forEach(key => body[key] === undefined && delete body[key]);
  
  console.log('[xano.updateProduct] Body normalizado:', body);
  return xanoStore.updateProduct(token, productId, body);
}

// List orders from Xano (SOLO BACKEND, SIN CACHE LOCAL)
// Returns an array of orders from Xano API
export async function listOrders({ token } = {}) {
  try {
    let arr = await xanoStore.listOrders({ token })
    arr = Array.isArray(arr) ? arr : (arr?.items ?? [])
    
    console.debug('[xano.listOrders] Orders from backend:', arr.length, arr.map(o => ({ id: o.id, order_number: o.order_number, status: o.status })))
    
    // Try to load ALL order items from backend (sin filtro - cargar todo y filtrar en JS)
    let itemsByOrderId = {}
    try {
      // NO ENVIAR FILTRO - Xano no lo está aplicando correctamente
      // Cargar TODOS los items y filtrar en memoria
      const allOrderItems = await xanoStore.listOrderItems(token)
      console.debug('[xano.listOrders] ALL Order items from backend:', allOrderItems?.length || 0)
      
      if (Array.isArray(allOrderItems)) {
        console.debug('[xano.listOrders] Processing items:', allOrderItems.slice(0, 3))
        allOrderItems.forEach(item => {
          const orderId = item.order_id
          console.debug('[xano.listOrders] Processing item:', { item_id: item.id, order_id: orderId, product_name: item.product_name })
          
          if (orderId) {
            if (!itemsByOrderId[orderId]) itemsByOrderId[orderId] = []
            itemsByOrderId[orderId].push({
              product_id: item.product_id,
              product_name: item.product_name || `Producto #${item.product_id}`,
              quantity: item.quantity,
              unit_price: item.unit_price,
            })
          }
        })
        console.debug('[xano.listOrders] Items grouped by order_id:', Object.keys(itemsByOrderId).map(oid => ({ order_id: oid, items: itemsByOrderId[oid].length })))
      }
    } catch (e) {
      console.warn('[xano.listOrders] Could not load order items from backend:', e)
    }
    
    // Enrich each order with its items
    arr = arr.map(order => {
      if (order.items && Array.isArray(order.items) && order.items.length > 0) {
        console.debug('[xano.listOrders] Order', order.id, 'already has items:', order.items.length)
        return order
      }
      
      const fromOrderItems = itemsByOrderId[order.id]
      if (fromOrderItems && fromOrderItems.length > 0) {
        console.debug('[xano.listOrders] Order', order.id, 'enriched with', fromOrderItems.length, 'items from order_item table')
        return { ...order, items: fromOrderItems }
      }
      
      console.debug('[xano.listOrders] Order', order.id, 'has NO items')
      return { ...order, items: [] }
    })
    
    console.debug('[xano.listOrders] returning orders', arr.map(o => ({ id: o.id, order_number: o.order_number, items: o.items?.length || 0 })))
    return arr
  } catch (err) {
    console.error('[xano.listOrders] Error fetching from Xano:', err)
    throw err
  }
}

// deleteOrder wrapper: delete remote when possible and ensure local cache is cleaned
export async function deleteOrder({ token, id }) {
  // Delete only from Xano (NO LOCAL CACHE)
  try {
    if (token) await xanoStore.deleteOrder(token, id)
    return true
  } catch (e) {
    console.error('[xano.deleteOrder] Error deleting from Xano:', e)
    throw e
  }
}

// 4) Función para listar productos con soporte para paginación y búsqueda (SOLO XANO, SIN CACHE LOCAL)
// Parámetros (objeto con propiedades opcionales):
// - token: JWT para autenticación (opcional)
// - limit: número máximo de productos a devolver (por defecto 12)
// - offset: número de productos a saltar (para paginación, por defecto 0)
// - q: término de búsqueda (por defecto vacío)
export async function listProducts({ token, limit = 12, offset = 0, q = "" } = {}) {
  try {
    console.log('[xano.listProducts] 📤 Intentando cargar productos:', { token: !!token, limit, offset, q });
    const rawData = await xanoStore.listProducts({ token, limit, offset, q });
    console.log('[xano.listProducts] 📥 Raw data from Xano:', rawData);
    
    // Parsear respuesta: puede ser array directo, objeto con items, o con data
    let arr;
    if (Array.isArray(rawData)) {
      arr = rawData;
    } else if (rawData?.items && Array.isArray(rawData.items)) {
      arr = rawData.items;
    } else if (rawData?.data && Array.isArray(rawData.data)) {
      arr = rawData.data;
    } else if (rawData) {
      // Si es un objeto, intentamos extraer array
      console.warn('[xano.listProducts] ⚠️ Estructura inesperada, convirtiendo a array:', rawData);
      arr = [rawData];
    } else {
      arr = [];
    }
    
    console.log('[xano.listProducts] ✅ Productos cargados desde Xano:', arr.length, 'productos');
    return arr;
  } catch (err) {
    console.error('[xano.listProducts] ❌ Error fetching from Xano:', {
      message: err.message,
      status: err.status,
      body: err.body
    });
    
    // Si hay error de autenticación (401/403) y NO tenemos token, intentamos sin autenticación
    if ((err.status === 401 || err.status === 403) && !token) {
      console.warn('[xano.listProducts] 🔄 Autenticación fallida, reintentando SIN token...');
      try {
        const rawData = await xanoStore.listProducts({ limit, offset, q });
        console.log('[xano.listProducts] 📥 Raw data from Xano (sin token):', rawData);
        
        let arr;
        if (Array.isArray(rawData)) {
          arr = rawData;
        } else if (rawData?.items && Array.isArray(rawData.items)) {
          arr = rawData.items;
        } else if (rawData?.data && Array.isArray(rawData.data)) {
          arr = rawData.data;
        } else if (rawData) {
          arr = [rawData];
        } else {
          arr = [];
        }
        
        console.log('[xano.listProducts] ✅ Productos cargados SIN token:', arr.length, 'productos');
        return arr;
      } catch (err2) {
        console.error('[xano.listProducts] ❌ Tampoco funcionó sin token:', {
          message: err2.message,
          status: err2.status
        });
        throw err; // Lanzar el error original
      }
    }
    
    throw err;
  }
}

// 5) Función para obtener un producto por ID
// Parámetros:
// - productId: ID del producto a obtener
// - options: objeto con opciones (token, etc.)
export async function getProduct(productId, { token } = {}) {
  try {
    console.log('[xano.getProduct] Obteniendo producto desde Xano:', productId)
    const product = await xanoStore.getProduct(productId, { token })
    console.log('[xano.getProduct] Producto obtenido:', product)
    return product
  } catch (err) {
    console.error('[xano.getProduct] Error obteniendo producto:', err)
    throw err
  }
}

// 6) Función para eliminar un producto
// Parámetros:
// - token: JWT para autenticación
// - productId: ID del producto a eliminar
export async function deleteProduct(token, productId) {
  try {
    console.log('[xano.deleteProduct] Eliminando producto de Xano:', productId)
    const result = await xanoStore.deleteProduct(token, productId)
    console.log('[xano.deleteProduct] Producto eliminado:', result)
    return result
  } catch (err) {
    console.error('[xano.deleteProduct] Error eliminando producto:', err)
    throw err
  }
}

// ============================================================================
// EJEMPLOS DE USO ADICIONALES (usando el cliente unificado directamente)
// ============================================================================
// 
// Obtener un producto por ID:
//   import { xanoStore } from './client.js';
//   const product = await xanoStore.getProduct(123, { token });
// 
// Eliminar un producto:
//   await xanoStore.deleteProduct(token, productId);
// 
// Autenticación (desde AuthContext o cualquier componente):
//   import { xanoAuth } from './client.js';
//   const { authToken } = await xanoAuth.login({ email: 'user@example.com', password: '***' });
//   const userProfile = await xanoAuth.me(authToken);
// 
// Ver client.js para más métodos disponibles (orders, inventory, etc.)
// ============================================================================