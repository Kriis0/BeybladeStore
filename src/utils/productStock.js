/**
 * productStock.js - Manage product stock operations
 * Mirrors the mobile app behavior where:
 * - addOrder reduces product stock
 * - deleteOrder increases product stock (return items to inventory)
 */

export function getLocalProducts() {
  try {
    const raw = localStorage.getItem('local_products');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('[productStock] Error reading local_products', e);
    return [];
  }
}

export function setLocalProducts(products) {
  try {
    localStorage.setItem('local_products', JSON.stringify(products));
    console.log('[productStock] Updated local_products with', products.length, 'items');
    // Emit event for ProductGrid to refresh
    window.dispatchEvent(new CustomEvent('local_products:changed', { detail: { action: 'stock_update' } }));
  } catch (e) {
    console.error('[productStock] Error writing local_products', e);
  }
}

/**
 * Reduce stock for items in order (when order is created)
 * Mirrors mobile's OrdersRepository.addOrder behavior
 */
export function reduceStockForOrder(items) {
  try {
    const products = getLocalProducts();
    
    // Reduce stock for each item in order
    items.forEach(item => {
      const productId = item.product_id || item.productId;
      const quantity = item.quantity || 1;
      
      const idx = products.findIndex(p => String(p.id) === String(productId));
      if (idx >= 0) {
        const newStock = Math.max(0, (products[idx].stock_quantity || products[idx].stock || 0) - quantity);
        products[idx] = { ...products[idx], stock_quantity: newStock, stock: newStock };
        console.log('[productStock] Reduced stock for product', productId, 'qty', quantity, 'new stock:', newStock);
      }
    });
    
    setLocalProducts(products);
    return products;
  } catch (e) {
    console.error('[productStock] Error reducing stock', e);
    return [];
  }
}

/**
 * Increase stock when order is deleted/cancelled (return items to inventory)
 * Mirrors mobile's OrdersRepository.deleteOrder behavior
 */
export function restoreStockForOrder(items) {
  try {
    const products = getLocalProducts();
    
    // Restore stock for each item in order
    items.forEach(item => {
      const productId = item.product_id || item.productId;
      const quantity = item.quantity || 1;
      
      const idx = products.findIndex(p => String(p.id) === String(productId));
      if (idx >= 0) {
        const newStock = (products[idx].stock_quantity || products[idx].stock || 0) + quantity;
        products[idx] = { ...products[idx], stock_quantity: newStock, stock: newStock };
        console.log('[productStock] Restored stock for product', productId, 'qty', quantity, 'new stock:', newStock);
      }
    });
    
    setLocalProducts(products);
    return products;
  } catch (e) {
    console.error('[productStock] Error restoring stock', e);
    return [];
  }
}
