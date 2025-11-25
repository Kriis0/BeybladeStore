import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { xanoStore } from '../api/client.js'
import { addLocalOrder } from '../utils/localOrders.js'
import { reduceStockForOrder } from '../utils/productStock.js'
import { useAuth } from './AuthContext.jsx'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const { token, user, sessionUser } = useAuth()
  const [items, setItems] = useState(() => {
    try {
      const raw = localStorage.getItem('cart_items')
      return raw ? JSON.parse(raw) : []
    } catch { return [] }
  })

  useEffect(() => {
    try { localStorage.setItem('cart_items', JSON.stringify(items)) } catch {}
  }, [items])

  function addToCart(product, qty = 1) {
    setItems((old) => {
      const found = old.find(i => i.product.id === product.id)
      if (found) return old.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + qty } : i)
      return [...old, { product, quantity: qty }]
    })
  }

  function updateQuantity(productId, quantity) {
    setItems((old) => old.map(i => i.product.id === productId ? { ...i, quantity: Math.max(0, quantity) } : i).filter(i => i.quantity > 0))
  }

  function removeItem(productId) {
    setItems((old) => old.filter(i => i.product.id !== productId))
  }

  function clearCart() { setItems([]) }

  const checkout = useCallback(async function checkout(extra = {}) {
    // Get order owner email (critical for filtering user's orders later)
    const orderOwnerEmail = user?.email || sessionUser || 'guest';
    const userName = user?.displayName || user?.name || 'Usuario';
    
    // Preparar items para enviar
    const orderItems = items.map(i => ({ 
      product_id: i.product.id, 
      quantity: i.quantity, 
      unit_price: i.product.price, 
      product_name: i.product.name 
    }));
    
    const totalAmount = items.reduce((acc, i) => acc + (i.product.price || 0) * i.quantity, 0);
    
    // Payload simplificado - solo campos que probablemente Xano tiene
    const payload = {
      user_email: orderOwnerEmail,
      display_name: userName,
      total_amount: totalAmount,
      items: orderItems,
      status: 'pending',
      payment_status: 'pending',
      ...extra
    }
    
    try {
      console.debug('[Cart] ========== CHECKOUT START ==========');
      console.debug('[Cart] Current user object:', { email: user?.email, name: user?.name, displayName: user?.displayName, sessionUser });
      console.debug('[Cart] attempting checkout with payload:', payload);
      
      // CREATE LOCAL ORDER IMMEDIATELY (before sending to backend, so it's saved even if network fails)
      const localOrderId = `pending-${Date.now()}`;
      const pendingLocalOrder = {
        id: localOrderId,
        created_at: Math.floor(Date.now() / 1000),
        order_number: `#${Math.floor(Math.random() * 900000) + 100000}`,
        total_amount: totalAmount,
        status: 'pending',
        payment_method: extra.payment_method || 'pending',
        payment_status: 'pending',
        user: orderOwnerEmail,
        user_email: orderOwnerEmail,
        customer_email: orderOwnerEmail,
        email: orderOwnerEmail,
        displayName: userName,
        display_name: userName,
        items: orderItems || [],
        _pending: true,
      }
      try {
        console.debug('[Cart] SAVING PENDING ORDER TO LOCAL STORAGE:', JSON.stringify(pendingLocalOrder, null, 2));
        addLocalOrder(pendingLocalOrder);
        try { window.dispatchEvent(new CustomEvent('local_orders:changed')) } catch (e) { console.error('Error dispatching local_orders:changed', e) }
      } catch (e) {
        console.error('[Cart] Error saving pending local order:', e);
      }
      
      // NOW try to send to backend
      const res = await xanoStore.createOrder(token, payload)
      console.debug('[Cart] checkout response from server:', res);
      
      // IMPORTANT: Save items to order_item table if order creation succeeded
      if (res && res.id) {
        try {
          console.debug('[Cart] Saving order items to order_item table for order:', res.id);
          for (const item of orderItems) {
            try {
              await xanoStore.createOrderItem(token, {
                order_id: res.id,
                product_id: item.product_id,
                quantity: item.quantity,
                unit_price: item.unit_price,
                product_name: item.product_name
              });
            } catch (itemErr) {
              console.error('[Cart] Error saving item:', itemErr);
            }
          }
          console.debug('[Cart] ✅ All order items saved');
        } catch (itemsErr) {
          console.error('[Cart] Error saving order items:', itemsErr);
        }
      }
      
      // Normalize server response into a local order shape and persist via helper
      try {
        // CRITICAL: Use user.email as the PRIMARY identifier for the order owner
        const orderOwnerEmail = user?.email || sessionUser || 'guest';
        const localRes = {
          id: res.id ?? `remote-${Date.now()}`,
          order_number: res.order_number ?? res.id ?? `#${Math.floor(Math.random() * 900000) + 100000}`,
          created_at: res.created_at ?? Math.floor(Date.now() / 1000),
          total_amount: res.total_amount ?? totalAmount,
          status: res.status ?? 'pending',
          payment_method: res.payment_method ?? (extra.payment_method || 'remote'),
          payment_status: res.payment_status ?? 'pending',
          // All email fields point to the same value for consistency
          user: orderOwnerEmail,
          user_email: orderOwnerEmail,
          customer_email: orderOwnerEmail,
          email: orderOwnerEmail,
          displayName: userName,
          display_name: userName,
          items: Array.isArray(res.items) && res.items.length > 0 ? res.items : (Array.isArray(orderItems) ? orderItems : []),
          _remote: true,
        }
        console.debug('[Cart] SAVED ORDER - owner email:', orderOwnerEmail);
        console.debug('[Cart] SAVED ORDER TO LOCALSTORAGE:', JSON.stringify(localRes, null, 2));
        try { console.debug('[Cart] caching server order locally', { id: localRes.id, order_number: localRes.order_number, user: localRes.user_email }); addLocalOrder(localRes) } catch (e) { console.error('[Cart] addLocalOrder error', e) }
      } catch (e) { console.error('Error caching server order locally', e) }
      // Reduce product stock (mirror mobile OrdersRepository.addOrder)
      try {
        reduceStockForOrder(orderItems);
      } catch (e) {
        console.error('[Cart] Error reducing stock after checkout', e);
      }
      // Dispatch event before clearing cart so Orders page reloads if already mounted
      try { window.dispatchEvent(new CustomEvent('local_orders:changed')) } catch (e) { console.error('Error dispatching local_orders:changed', e) }
      // clear cart and return server response
      clearCart()
      return res
    } catch (err) {
      console.error('[Cart] checkout error, falling back to local order:', err);
      // Backend failed or offline — persist order locally so Orders page can show it
      try {
        console.debug('[Cart] ========== FALLBACK LOCAL ORDER ==========');
        console.debug('[Cart] Current user object (fallback):', { email: user?.email, name: user?.name, displayName: user?.displayName, sessionUser });
        // CRITICAL: Use user.email as the PRIMARY identifier for the order owner
        const orderOwnerEmail = user?.email || sessionUser || 'guest';
        const localOrder = {
          id: `local-${Date.now()}`,
          created_at: Math.floor(Date.now() / 1000),
          order_number: `#${Math.floor(Math.random() * 900000) + 100000}`,
          total_amount: payload.total_amount,
          status: 'pending',
          payment_method: extra.payment_method || 'local',
          payment_status: 'pending',
          // All email fields point to the same value for consistency
          user: orderOwnerEmail,
          user_email: orderOwnerEmail,
          customer_email: orderOwnerEmail,
          email: orderOwnerEmail,
          displayName: user?.displayName || user?.name || 'Usuario',
          // save items for reference
          items: payload.items || [],
        }
        console.debug('[Cart] CREATED LOCAL FALLBACK ORDER - owner email:', orderOwnerEmail);
        console.debug('[Cart] CREATED LOCAL FALLBACK ORDER:', JSON.stringify(localOrder, null, 2));
        try { console.debug('[Cart] creating local fallback order', { id: localOrder.id, order_number: localOrder.order_number, user: localOrder.user }); addLocalOrder(localOrder) } catch (e) { console.error('[Cart] addLocalOrder error', e) }
        // Reduce product stock even in offline mode (mirror mobile behavior)
        try {
          reduceStockForOrder(payload.items);
        } catch (e) {
          console.error('[Cart] Error reducing stock for offline order', e);
        }
        // Dispatch event so Orders page reloads
        try { window.dispatchEvent(new CustomEvent('local_orders:changed')) } catch (e) { console.error('Error dispatching local_orders:changed', e) }
        clearCart()
        return localOrder
      } catch (e) {
        throw err
      }
    }
  }, [items, token, user, sessionUser])

  const value = useMemo(() => ({ items, addToCart, updateQuantity, removeItem, clearCart, checkout }), [items, addToCart, updateQuantity, removeItem, clearCart, checkout])
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
