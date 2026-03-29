// ══════════════════════════════════════════════
// STORAGE — Persistencia en localStorage
// ══════════════════════════════════════════════

const KEYS = {
  ACCOUNTS: 'antologia_accounts',
  PRODUCTS: 'antologia_products',
  GASTOS:   'antologia_gastos',
  CREDITOS: 'antologia_creditos',
  PENDIENTES:'antologia_pendientes',
  INVENTARIO:'antologia_inventario',
  FACTURAS:  'antologia_facturas',
  SHEETS_URL:'antologia_sheets_url',
};

// Cuentas
function loadAccountsData() {
  const def = {
    efectivo:    { name:'Efectivo',    transactions:[] },
    nequi:       { name:'Nequi',       transactions:[] },
    bancolombia: { name:'Bancolombia', transactions:[] },
    daviplata:   { name:'Daviplata',   transactions:[] },
  };
  try {
    const raw = localStorage.getItem(KEYS.ACCOUNTS);
    return raw ? JSON.parse(raw) : def;
  } catch { return def; }
}
function saveAccountsData(data) { localStorage.setItem(KEYS.ACCOUNTS, JSON.stringify(data)); }

// Productos
function loadProductsData() {
  const def = [
    { id:1, emoji:'☕', nombre:'Café Americano', precio:3500 },
    { id:2, emoji:'🥤', nombre:'Proteína Shake', precio:8000 },
    { id:3, emoji:'💧', nombre:'Agua 500ml',     precio:2000 },
  ];
  try {
    const raw = localStorage.getItem(KEYS.PRODUCTS);
    return raw ? JSON.parse(raw) : def;
  } catch { return def; }
}
function saveProductsData(data) { localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(data)); }

// Gastos
function loadGastosData() {
  try { return JSON.parse(localStorage.getItem(KEYS.GASTOS) || '[]'); } catch { return []; }
}
function saveGastosData(data) { localStorage.setItem(KEYS.GASTOS, JSON.stringify(data)); }

// Créditos
function loadCreditosData() {
  try { return JSON.parse(localStorage.getItem(KEYS.CREDITOS) || '[]'); } catch { return []; }
}
function saveCreditosData(data) { localStorage.setItem(KEYS.CREDITOS, JSON.stringify(data)); }

// Pendientes
function loadPendientesData() {
  try { return JSON.parse(localStorage.getItem(KEYS.PENDIENTES) || '[]'); } catch { return []; }
}
function savePendientesData(data) { localStorage.setItem(KEYS.PENDIENTES, JSON.stringify(data)); }

// Inventario
function loadInventarioData() {
  try { return JSON.parse(localStorage.getItem(KEYS.INVENTARIO) || '[]'); } catch { return []; }
}
function saveInventarioData(data) { localStorage.setItem(KEYS.INVENTARIO, JSON.stringify(data)); }

// Facturas de compra
function loadFacturasData() {
  try { return JSON.parse(localStorage.getItem(KEYS.FACTURAS) || '[]'); } catch { return []; }
}
function saveFacturasData(data) { localStorage.setItem(KEYS.FACTURAS, JSON.stringify(data)); }

// URL de Sheets
function loadSheetsUrl() { return localStorage.getItem(KEYS.SHEETS_URL) || ''; }
function saveSheetsUrl(url) { localStorage.setItem(KEYS.SHEETS_URL, url); }

// Exportar todo para sincronización
function exportAllData() {
  return {
    accounts:   loadAccountsData(),
    products:   loadProductsData(),
    gastos:     loadGastosData(),
    creditos:   loadCreditosData(),
    pendientes: loadPendientesData(),
    inventario: loadInventarioData(),
    facturas:   loadFacturasData(),
    exportedAt: new Date().toISOString(),
  };
}

// Importar todo desde sincronización
function importAllData(data) {
  if (data.accounts)   saveAccountsData(data.accounts);
  if (data.products)   saveProductsData(data.products);
  if (data.gastos)     saveGastosData(data.gastos);
  if (data.creditos)   saveCreditosData(data.creditos);
  if (data.pendientes) savePendientesData(data.pendientes);
  if (data.inventario) saveInventarioData(data.inventario);
  if (data.facturas)   saveFacturasData(data.facturas);
}
