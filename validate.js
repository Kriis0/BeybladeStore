#!/usr/bin/env node

/**
 * Quick Validation Script for BeybladeStore Web App
 * 
 * Este script verifica que los cambios críticos fueron aplicados correctamente
 * sin necesidad de levantar el servidor
 */

const fs = require('fs');
const path = require('path');

const CHECKS = [];

function check(name, condition, errorMsg = '') {
  const result = condition ? '✅' : '❌';
  console.log(`${result} ${name}`);
  if (!condition && errorMsg) console.log(`   └─ ${errorMsg}`);
  CHECKS.push({ name, passed: condition });
  return condition;
}

console.log('\n🔍 Validando cambios críticos...\n');

// 1. Verificar que main.jsx NO tenga StrictMode
const mainJsPath = path.join(__dirname, 'src', 'main.jsx');
const mainJsContent = fs.readFileSync(mainJsPath, 'utf-8');
const hasStrictMode = mainJsContent.includes('StrictMode');
check(
  'main.jsx: NO tiene StrictMode',
  !hasStrictMode,
  'StrictMode causa double renders y duplication en carrito'
);

// 2. Verificar que UserBar NO tenga alert con "Usuario:"
const userBarPath = path.join(__dirname, 'src', 'components', 'UserBar.jsx');
const userBarContent = fs.readFileSync(userBarPath, 'utf-8');
const hasUserAlert = userBarContent.includes('alert alert-secondary') && userBarContent.includes('Usuario:');
check(
  'UserBar.jsx: NO tiene alert "Usuario: Usuario"',
  !hasUserAlert,
  'El alert fue removido por innecesario'
);

// 3. Verificar que ProductDetail NO tenga campos brand/series/type
const productDetailPath = path.join(__dirname, 'src', 'pages', 'ProductDetail.jsx');
const productDetailContent = fs.readFileSync(productDetailPath, 'utf-8');
const hasBrandField = productDetailContent.includes('brand');
const hasSeriesField = productDetailContent.includes('series');
const hasTypeField = productDetailContent.includes('type') && productDetailContent.includes('product.type');

check(
  'ProductDetail.jsx: NO muestra campo "brand"',
  !hasBrandField,
  'Campo brand fue removido'
);
check(
  'ProductDetail.jsx: NO muestra campo "series"',
  !hasSeriesField,
  'Campo series fue removido'
);
check(
  'ProductDetail.jsx: NO muestra campo "type"',
  !hasTypeField,
  'Campo type fue removido'
);

// 4. Verificar que ProductDetail NO tenga alert() en onClick
const hasAlertInProductDetail = productDetailContent.includes('alert(') && productDetailContent.includes('Producto añadido');
check(
  'ProductDetail.jsx: NO tiene alert("Producto añadido")',
  !hasAlertInProductDetail,
  'Alert popup removido para flujo async limpio'
);

// 5. Verificar que CartContext esté correctamente implementado
const cartContextPath = path.join(__dirname, 'src', 'context', 'CartContext.jsx');
const cartContextContent = fs.readFileSync(cartContextPath, 'utf-8');
const hasAddToCartConsolidation = cartContextContent.includes('found.quantity + qty');
check(
  'CartContext.jsx: addToCart consolida items correctamente',
  hasAddToCartConsolidation,
  'El método addToCart debe incrementar qty en lugar de duplicar'
);

// 6. Verificar App.jsx tiene rutas protegidas
const appPath = path.join(__dirname, 'src', 'App.jsx');
const appContent = fs.readFileSync(appPath, 'utf-8');
const hasAdminNavVisibilityCheck = appContent.includes("user.role !== 'admin'") || appContent.includes('user?.role === \'admin\'');
check(
  'App.jsx: Tiene lógica de rol-based navigation',
  hasAdminNavVisibilityCheck,
  'Las rutas deben ocultarse según el rol del usuario'
);

// 7. Verificar que Categorías NO visible para admin
const hasCategoriesRoleCheck = appContent.includes("!user || user.role !== 'admin'") && appContent.includes('categorias');
check(
  'App.jsx: "Categorías" oculto para admin',
  hasCategoriesRoleCheck,
  'Admin no debe ver "Categorías" en navegación'
);

// 8. Verificar que AdminHub existe con 4 botones
const adminHubPath = path.join(__dirname, 'src', 'pages', 'AdminHub.jsx');
if (fs.existsSync(adminHubPath)) {
  const adminHubContent = fs.readFileSync(adminHubPath, 'utf-8');
  const hasBtn1 = adminHubContent.includes('Agregar producto');
  const hasBtn2 = adminHubContent.includes('Gestionar catálogo');
  const hasBtn3 = adminHubContent.includes('Órdenes');
  const hasBtn4 = adminHubContent.includes('Gestionar usuarios');
  
  check(
    'AdminHub.jsx: Tiene 4 botones correctos',
    hasBtn1 && hasBtn2 && hasBtn3 && hasBtn4,
    'AdminHub debe tener: Agregar, Catálogo, Órdenes, Usuarios'
  );
} else {
  check('AdminHub.jsx: Existe el archivo', false, 'Archivo no encontrado');
}

// 9. Verificar que Profile NO tenga email
const profilePath = path.join(__dirname, 'src', 'pages', 'Profile.jsx');
const profileContent = fs.readFileSync(profilePath, 'utf-8');
const hasEmailFieldInProfile = profileContent.includes('email') && profileContent.includes('form-control');
// Nota: puede haber 'email' en comentarios o contexto, pero no debe haber input de email
const hasEmailInput = profileContent.match(/input[^>]*placeholder[^>]*email/i) || profileContent.match(/label[^>]*email/i);
check(
  'Profile.jsx: NO muestra campo "email"',
  !hasEmailInput,
  'Profile no debe mostrar email (no en móvil)'
);

// 10. Verificar que localStorage se usa para carrito
const hasLocalStorageInCart = cartContextContent.includes('localStorage.setItem(\'cart_items\'');
check(
  'CartContext.jsx: Usa localStorage para persistencia',
  hasLocalStorageInCart,
  'El carrito debe persistir en localStorage'
);

// Resumen
console.log('\n' + '='.repeat(60));
const passed = CHECKS.filter(c => c.passed).length;
const total = CHECKS.length;
const percentage = Math.round((passed / total) * 100);

console.log(`\nResumen: ${passed}/${total} verificaciones pasadas (${percentage}%)\n`);

if (passed === total) {
  console.log('✅ ¡TODAS LAS VERIFICACIONES PASARON!');
  console.log('\nPróximos pasos:');
  console.log('1. Ejecutar: npm install');
  console.log('2. Ejecutar: npm run dev');
  console.log('3. Seguir TESTING_CHECKLIST.md para manual testing');
  process.exit(0);
} else {
  console.log('❌ ALGUNAS VERIFICACIONES FALLARON');
  console.log('\nVerificaciones fallidas:');
  CHECKS.filter(c => !c.passed).forEach(c => {
    console.log(`  - ${c.name}`);
  });
  console.log('\nPor favor revisa los archivos mencionados arriba');
  process.exit(1);
}
