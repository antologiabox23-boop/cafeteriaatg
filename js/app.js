// ══════════════════════════════════════════════
// APP — Inicialización principal
// ══════════════════════════════════════════════

function reloadAll() {
  accounts   = loadAccountsData();
  products   = loadProductsData();
  gastos     = loadGastosData();
  creditos   = loadCreditosData();
  pendientes = loadPendientesData();
  inventario = loadInventarioData();
  facturas   = loadFacturasData();

  updateUI();
  loadProdGrid();
  updateVentasList();
  updatePendientesList();
  loadCreditosList();
  updateGastosList();
  loadInventarioList();
  loadFacturasList();
  loadProductsList();
  loadAccountsTab();
  loadTransactions();
  actualizarSugerenciasClientes();
}

// ── Init ──
document.addEventListener('DOMContentLoaded', () => {
  setTodayDate();
  reloadAll();

  // Sync URL en pestaña sync
  const url = loadSheetsUrl();
  if (url) document.getElementById('sheetsUrl').value = url;
});
