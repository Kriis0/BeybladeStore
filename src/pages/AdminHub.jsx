import React from 'react'
import { Link } from 'react-router-dom'
import UserBar from '../components/UserBar.jsx'

export default function AdminHub() {
  return (
    <div className="container py-3">
      <UserBar />
      <h1 className="mb-3">Panel de Administración</h1>
      <div className="d-grid gap-2" style={{ maxWidth: 480 }}>
        <Link to="/create-product" className="btn btn-primary">Agregar producto</Link>
        <Link to="/admin/catalog" className="btn btn-secondary">Gestionar catálogo / stock</Link>
        <Link to="/admin/ordenes" className="btn btn-outline-secondary">Órdenes de clientes</Link>
        <Link to="/admin/users" className="btn btn-outline-dark">Gestionar usuarios</Link>
      </div>
    </div>
  )
}
