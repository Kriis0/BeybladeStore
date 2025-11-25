// diagnose.js - Script para diagnosticar endpoints de Xano
// Úsalo en la consola del navegador: copy-paste el contenido

const XANO_BASE = 'https://x8ki-letl-twmt.n7.xano.io/api:cctv-gNX';

const endpoints = [
  // Intentar diferentes rutas de autenticación
  '/auth/login',
  '/login',
  '/user/login',
  '/users/login',
  '/authenticate',
  '/auth',
  '/auth/signin',
  
  // Verificar si existen usuarios
  '/user',
  '/users',
  '/auth/me',
  
  // Rutas de producto (conocidas como funcionales)
  '/product',
];

async function testEndpoint(path, method = 'GET') {
  try {
    const url = XANO_BASE + path;
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' }
    });
    
    const text = await res.text();
    let body = {};
    try { body = JSON.parse(text); } catch (e) { body = { raw: text }; }
    
    return {
      path,
      method,
      status: res.status,
      statusText: res.statusText,
      body
    };
  } catch (err) {
    return {
      path,
      method,
      error: err.message
    };
  }
}

async function diagnose() {
  console.log('🔍 Diagnostic: Testing Xano endpoints...\n');
  
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint, endpoint.includes('product') ? 'GET' : 'OPTIONS');
    console.log(`${endpoint}:`, result);
    console.log('---');
  }
  
  // Intenta POST a /login específicamente
  console.log('\n📝 Testing POST /login with demo credentials...');
  const loginResult = await testEndpoint('/login', 'POST');
  console.log('POST /login:', loginResult);
  
  console.log('\n✅ Diagnostic complete. Check endpoints above.');
}

// Ejecuta
diagnose();
