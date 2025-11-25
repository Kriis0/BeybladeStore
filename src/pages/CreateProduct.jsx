import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { createProduct, updateProduct, deleteProduct, getProduct } from '../api/xano.js'
import UserBar from '../components/UserBar.jsx'
import { useNavigate, useSearchParams } from 'react-router-dom'

export default function CreateProduct() {
  const { user, token } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const editId = searchParams.get('id')
  
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [stock, setStock] = useState('')
  const [brand, setBrand] = useState('')
  const [type, setType] = useState('')
  const [series, setSeries] = useState('')
  const [images, setImages] = useState([])
  const [imagePreview, setImagePreview] = useState([])
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [isEdit, setIsEdit] = useState(false)

  useEffect(() => {
    if (editId && token) {
      setIsEdit(true)
      loadProduct()
    }
  }, [editId, token])

  async function loadProduct() {
    try {
      setLoading(true)
      console.log('[CreateProduct] Cargando producto desde Xano:', editId)
      const prod = await getProduct(editId, { token })
      console.log('[CreateProduct] Producto cargado:', prod)
      if (prod) {
        setName(prod.name || '')
        setDescription(prod.description || '')
        setPrice((prod.price || 0).toString())
        setStock((prod.stock_quantity || prod.stock || 0).toString())
        setBrand(prod.brand || '')
        setType(prod.type || prod.category || '')
        setSeries(prod.series || '')
        if (Array.isArray(prod.images)) {
          setImagePreview(prod.images.map(img => typeof img === 'string' ? { url: img } : img))
        }
      }
    } catch (err) {
      console.error('[CreateProduct] Error cargando producto:', err)
      setMsg('Error al cargar producto: ' + (err.message || ''))
    } finally {
      setLoading(false)
    }
  }

  function handleImageSelect(e) {
    const files = Array.from(e.target.files || [])
    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = (event) => {
        setImagePreview(prev => [...prev, { 
          url: event.target?.result, 
          name: file.name,
          file: file 
        }])
      }
      reader.readAsDataURL(file)
    })
    e.target.value = ''
  }

  function removeImage(idx) {
    setImagePreview(prev => prev.filter((_, i) => i !== idx))
  }

  async function handleDelete() {
    if (!editId || !confirm('¿Seguro que quieres eliminar este producto?')) return
    try {
      setLoading(true)
      console.log('[CreateProduct] Eliminando producto de Xano:', editId)
      await deleteProduct(token, editId)
      console.log('[CreateProduct] ✅ Producto eliminado de Xano')
      setMsg('Producto eliminado')
      setTimeout(() => navigate('/home'), 1000)
    } catch (err) {
      console.error('[CreateProduct] Error eliminando:', err)
      setMsg(err?.message || 'Error al eliminar')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    setMsg('')
    if (!name.trim()) return setMsg('El nombre es obligatorio')
    const priceNum = parseFloat(price)
    if (isNaN(priceNum) || priceNum <= 0) return setMsg('El precio debe ser un número positivo')

    try {
      setLoading(true)
      const payload = {
        name: name.trim(),
        description: description.trim(),
        price: priceNum,
        stock_quantity: parseInt(stock) || 0,
        brand: brand.trim(),
        type: type.trim(),
        series: series.trim(),
      }

      if (isEdit && editId) {
        console.log('[CreateProduct] Actualizando producto en Xano:', editId, payload)
        await updateProduct(token, editId, payload)
        console.log('[CreateProduct] ✅ Producto actualizado en Xano')
        setMsg('✅ Producto actualizado en Xano exitosamente')
        setTimeout(() => navigate('/home'), 800)
      } else {
        console.log('[CreateProduct] Creando nuevo producto en Xano:', payload)
        const result = await createProduct(token, payload)
        console.log('[CreateProduct] ✅ Producto creado en Xano:', result)
        setMsg('✅ Producto creado en Xano exitosamente')
        setTimeout(() => navigate('/home'), 800)
      }
    } catch (err) {
      console.error('[CreateProduct] Error guardando:', err)
      setMsg(err?.message || `Error al ${isEdit ? 'actualizar' : 'crear'} producto`)
    } finally {
      setLoading(false)
    }
  }

  if (user?.is_admin !== true) {
    return (
      <div className="container py-3">
        <UserBar />
        <div className="alert alert-danger">No tienes permiso para acceder a esta página.</div>
      </div>
    )
  }

  return (
    <div className="container py-3">
      <UserBar />
      <h1 className="mb-3">{isEdit ? 'Editar Producto' : 'Crear Producto'}</h1>
      <div style={{ maxWidth: 640 }}>
        <label className="form-label">Nombre *</label>
        <input className="form-control mb-2" value={name} onChange={(e) => setName(e.target.value)} />
        
        <label className="form-label">Descripción</label>
        <textarea className="form-control mb-2" rows="3" value={description} onChange={(e) => setDescription(e.target.value)}></textarea>
        
        <label className="form-label">Precio *</label>
        <input type="number" className="form-control mb-2" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
        
        <label className="form-label">Stock</label>
        <input type="number" className="form-control mb-2" value={stock} onChange={(e) => setStock(e.target.value)} />
        
        <label className="form-label">Marca</label>
        <input className="form-control mb-2" value={brand} onChange={(e) => setBrand(e.target.value)} />
        
        <label className="form-label">Tipo</label>
        <input className="form-control mb-2" value={type} onChange={(e) => setType(e.target.value)} />
        
        <label className="form-label">Serie</label>
        <input className="form-control mb-2" value={series} onChange={(e) => setSeries(e.target.value)} />
        
        <label className="form-label">Imágenes</label>
        <input 
          type="file" 
          multiple 
          accept="image/*" 
          className="form-control mb-2"
          onChange={handleImageSelect}
          disabled={loading}
        />
        <small className="text-muted d-block mb-2">Puedes seleccionar múltiples imágenes</small>
        
        {imagePreview.length > 0 && (
          <div className="mb-3">
            <label className="form-label">Vista previa de imágenes</label>
            <div className="d-flex gap-2 overflow-auto pb-2">
              {imagePreview.map((img, idx) => (
                <div key={idx} className="position-relative flex-shrink-0" style={{ width: 120, height: 120 }}>
                  <img 
                    src={img.url || img} 
                    alt={`Preview ${idx}`} 
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover',
                      borderRadius: 8
                    }} 
                  />
                  <button 
                    type="button"
                    className="btn btn-sm btn-danger position-absolute top-0 end-0"
                    onClick={() => removeImage(idx)}
                    disabled={loading}
                    style={{ borderRadius: '50%', width: 28, height: 28, padding: 0 }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="d-flex gap-2">
          <button className="btn btn-primary" disabled={loading} onClick={handleSave}>
            {loading ? 'Guardando...' : isEdit ? 'Actualizar en Xano' : 'Crear en Xano'}
          </button>
          {isEdit && (
            <button className="btn btn-danger" disabled={loading} onClick={handleDelete}>
              {loading ? 'Eliminando...' : 'Eliminar de Xano'}
            </button>
          )}
        </div>
        {msg && (
          <div className={`alert mt-3 ${msg.includes('✅') ? 'alert-success' : msg.includes('Error') ? 'alert-danger' : 'alert-info'}`}>
            {msg}
          </div>
        )}
      </div>
    </div>
  )
}