// ══════════════════════════════════════════════
// UI — Navegación, tabs, helpers de interfaz
// ══════════════════════════════════════════════

// ── Tabs ──
document.querySelectorAll('.nav-tab').forEach(tab => {
  tab.addEventListener('click', function() {
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    this.classList.add('active');
    const target = document.getElementById(this.dataset.tab);
    if (target) target.classList.add('active');
    // Cargar datos al cambiar tab
    onTabChange(this.dataset.tab);
  });
});

function onTabChange(tab) {
  switch(tab) {
    case 'caja':         loadProdGrid(); updateVentasList(); updateCajaHdr(); break;
    case 'pendientes':   updatePendientesList(); break;
    case 'creditos':     loadCreditosList(); break;
    case 'gastos':       updateGastosList(); break;
    case 'inventario':   loadInventarioList(); break;
    case 'facturas':     loadFacturasList(); break;
    case 'resumen':      updateUI(); break;
    case 'transacciones':loadTransactions(); break;
    case 'productos':    loadProductsList(); break;
    case 'cuentas':      loadAccountsTab(); break;
    case 'sync':
      const url = loadSheetsUrl();
      if (url) document.getElementById('sheetsUrl').value = url;
      break;
  }
}

// ── Modal helpers ──
// Cerrar modales al hacer clic fuera
document.querySelectorAll('.modal').forEach(modal => {
  modal.addEventListener('click', function(e) {
    if (e.target === this) this.classList.remove('active');
  });
});

// ── Sugerencias de clientes ──
function actualizarSugerenciasClientes() {
  const clientes = new Set();
  for (const k in accounts) {
    accounts[k].transactions.forEach(tx => {
      if (tx.esventa && tx.concept) {
        const match = tx.concept.match(/·\s*([^·]+)$/);
        if (match) clientes.add(match[1].trim());
      }
    });
  }
  const dl = document.getElementById('clientesSuggestions');
  if (dl) dl.innerHTML = [...clientes].map(c => `<option value="${c}">`).join('');
}

// Inicializar mes en filtro de movimientos
document.getElementById('currentMonthDisplay').textContent =
  getMonthName(currentViewMonth, currentViewYear);
