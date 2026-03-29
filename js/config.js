// ══════════════════════════════════════════════
// CONFIG — Antología Box 23
// Modifica SHEETS_URL con la URL de tu Web App
// ══════════════════════════════════════════════

const CONFIG = {
  APP_NAME: 'Antología Box 23',
  VERSION: '2.0.0',
  // Categorías de gastos
  CATEGORIAS_GASTO: ['Operación','Insumos','Nómina','Servicios','Mantenimiento','Otros'],
  // Categorías inventario
  CATEGORIAS_INV: ['Suplementos','Ropa','Equipos','Bebidas','Otros'],
  // Cuentas disponibles
  CUENTAS: {
    efectivo:  { name: 'Efectivo',    icon: 'fa-money-bill-wave', color: '#d97706' },
    nequi:     { name: 'Nequi',       icon: 'fa-mobile-alt',      color: '#7c3aed' },
    bancolombia: { name: 'Bancolombia', icon: 'fa-university',    color: '#0284c7' },
    daviplata: { name: 'Daviplata',   icon: 'fa-wallet',          color: '#059669' },
  }
};
