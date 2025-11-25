// Utilities to manage local_orders with dedupe and safe read/write
export function getLocalOrders() {
  try {
    const raw = localStorage.getItem('local_orders')
    if (!raw) return []
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr : []
  } catch (e) { return [] }
}

export function setLocalOrders(arr) {
  try { localStorage.setItem('local_orders', JSON.stringify(Array.isArray(arr) ? arr : [])) } catch {}
  try { window.dispatchEvent(new CustomEvent('local_orders:changed')) } catch {}
}

export function addLocalOrder(order) {
  try {
    // normalize owner-related fields so comparisons are robust
    const norm = { ...order }
    norm.user_email = norm.user_email || norm.user || (norm.user?.email) || norm.email || ''
    norm.customer_email = norm.customer_email || norm.customer?.email || norm.customer_email || norm.email || ''
    norm.email = norm.email || norm.user_email || norm.customer_email || ''
    // Preserve important fields
    norm.displayName = norm.displayName || norm.user_name || 'Usuario'
    norm.items = Array.isArray(norm.items) ? norm.items : []

    const arr = getLocalOrders()
    const exists = arr.some(o => String(o.id) === String(norm.id) || String(o.order_number) === String(norm.order_number))
    if (!exists) {
      arr.unshift(norm)
      console.debug('[localOrders] addLocalOrder: adding', { id: norm.id, order_number: norm.order_number, user: norm.user_email, items: norm.items.length })
      setLocalOrders(arr)
    }
    return true
  } catch (e) { return false }
}

export function removeLocalOrderById(idOrNumber) {
  try {
    const arr = getLocalOrders()
    const filtered = arr.filter(o => String(o.id) !== String(idOrNumber) && String(o.order_number) !== String(idOrNumber))
    setLocalOrders(filtered)
    // Mark as deleted so it doesn't reappear from backend
    markOrderAsDeleted(idOrNumber)
    return true
  } catch (e) { return false }
}

export function getDeletedOrderIds() {
  try {
    const raw = localStorage.getItem('deleted_order_ids')
    if (!raw) return []
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr : []
  } catch (e) { return [] }
}

export function markOrderAsDeleted(idOrNumber) {
  try {
    const deleted = getDeletedOrderIds()
    const idStr = String(idOrNumber)
    if (!deleted.includes(idStr)) {
      deleted.push(idStr)
      localStorage.setItem('deleted_order_ids', JSON.stringify(deleted))
      console.debug('[localOrders] Marked order as deleted:', idOrNumber, 'Total deleted:', deleted.length)
    }
  } catch (e) { }
}

export function mergeOrders(remote = [], local = []) {
  // Filter out deleted orders first
  const deletedIds = getDeletedOrderIds()
  const deletedSet = new Set(deletedIds.map(String))
  
  // Create a map of local orders by ID for quick lookup
  const localMap = {}
  if (Array.isArray(local)) {
    local.forEach(o => {
      localMap[String(o.id)] = o
    })
  }
  
  // remote first (server), but ALWAYS enrich with items from local if available
  const filteredRemote = remote.filter(o => !deletedSet.has(String(o.id)) && !deletedSet.has(String(o.order_number)))
  const enrichedRemote = filteredRemote.map(remoteOrder => {
    const localOrder = localMap[String(remoteOrder.id)]
    // If we have a local version with items, use its items
    if (localOrder && localOrder.items && Array.isArray(localOrder.items) && localOrder.items.length > 0) {
      return {
        ...remoteOrder,
        items: localOrder.items,
        displayName: remoteOrder.displayName || localOrder.displayName,
      }
    }
    return remoteOrder
  })
  
  const existingIds = new Set(enrichedRemote.map(o => String(o.id)))
  const existingNumbers = new Set(enrichedRemote.map(o => String(o.order_number)))
  const toAdd = Array.isArray(local) ? local.filter(o => !existingIds.has(String(o.id)) && !existingNumbers.has(String(o.order_number)) && !deletedSet.has(String(o.id))) : []
  const merged = [...toAdd, ...enrichedRemote]
  // normalize created_at to number (seconds) and sort desc
  return merged
    .map(o => ({ ...o, created_at: o.created_at ? Number(o.created_at) : Math.floor(Date.now() / 1000) }))
    .sort((a, b) => Number(b.created_at) - Number(a.created_at))
}
