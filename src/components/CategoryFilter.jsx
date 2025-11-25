// src/components/CategoryFilter.jsx - Filtro de categorías para productos
import React, { useEffect, useState } from 'react';
import { xanoStore } from '../api/client.js';

export default function CategoryFilter({ selectedCategory, onCategoryChange }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    try {
      setLoading(true);
      const data = await xanoStore.listCategories();
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error al cargar categorías:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="d-flex gap-2 flex-wrap align-items-center">
      <span className="fw-bold">Categoría:</span>
      <button
        onClick={() => onCategoryChange(null)}
        className={`btn btn-sm ${!selectedCategory ? 'btn-dark' : 'btn-outline-dark'}`}
        disabled={loading}
      >
        Todas
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onCategoryChange(cat.id)}
          className={`btn btn-sm ${selectedCategory === cat.id ? 'btn-dark' : 'btn-outline-dark'}`}
          disabled={loading}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
}
