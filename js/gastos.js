// ══════════════════════════════════════════════
// GASTOS — Registro de gastos operativos
// ══════════════════════════════════════════════

let gastos = loadGastosData();

function saveGastos() {
  saveGastosData(gastos);
  syncModulo('gastos', gastos);
}

function abrirGastoModal(id) {
  document.getElementById('gastoForm').reset();
  document.getElementById('gastoId').value = '';
  document.getElementById('deleteGastoBtn').style.display = 'none';
  document.getElementById('gastoModalTitle').textContent = 'Nuevo Gasto';
  setTodayDate();
  if (id) {
    const g = gastos.find(x => x.id === id);
    if (g) {
      document.getElementById('gastoId').value = g.id;
      document.getElementById('gastoMonto').value = g.monto;
      document.getElementById('gastoFecha').value = g.fecha;
      document.getElementById('gastoConcepto').value = g.concepto;
      document.getElementById('gastoCategoria').value = g.categoria;
      document.getElementById('gastoCuenta').value = g.cuenta || 'efectivo';
      document.getElementById('deleteGastoBtn').style.display = 'inline-flex';
      document.getElementById('gastoModalTitle').textContent = 'Editar Gasto';
    }
  }
  document.getElementById('gastoModal').classList.add('active');
}

document.getElementById('gastoForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const id        = document.getElementById('gastoId').value;
  const monto     = parseFloat(document.getElementById('gastoMonto').value);
  const fecha     = document.getElementById('gastoFecha').value;
  const concepto  = document.getElementById('gastoConcepto').value.trim();
  const categoria = document.getElementById('gastoCategoria').value;
  const cuenta    = document.getElementById('gastoCuenta').value;
  if (!monto || !fecha || !concepto) return;

  if (id) {
    const idx = gastos.findIndex(x => x.id === parseInt(id));
    if (idx > -1) gastos[idx] = { id:parseInt(id), monto, fecha, concepto, categoria, cuenta };
  } else {
    gastos.push({ id:genId(), monto, fecha, concepto, categoria, cuenta });
    // Registrar egreso en la cuenta correspondiente
    addTransaction(cuenta, {
      id:genId(), date:fecha, concept:`Gasto: ${concepto}`, amount:-monto, type:'egreso'
    });
  }
  saveGastos(); updateUI(); updateGastosList();
  document.getElementById('gastoModal').classList.remove('active');
  notify('✅ Gasto registrado', 'success');
});

document.getElementById('deleteGastoBtn').addEventListener('click', function() {
  const id = parseInt(document.getElementById('gastoId').value);
  if (!confirm('¿Eliminar gasto?')) return;
  gastos = gastos.filter(g => g.id !== id);
  saveGastos(); updateGastosList();
  document.getElementById('gastoModal').classList.remove('active');
  notify('Gasto eliminado', 'info');
});

function updateGastosList() {
  const el = document.getElementById('gastosList');
  const today = fmtDateInput(new Date());
  const mes = today.slice(0, 7);
  const todayGastos = gastos.filter(g => g.fecha === today);
  const mesGastos   = gastos.filter(g => g.fecha.startsWith(mes));
  const totalHoy    = todayGastos.reduce((s, g) => s + g.monto, 0);
  const totalMes    = mesGastos.reduce((s, g) => s + g.monto, 0);

  document.getElementById('gastosTotalHoy').textContent = `$ ${fmt(totalHoy)}`;
  document.getElementById('gastosTotalMes').textContent = `$ ${fmt(totalMes)}`;
  document.getElementById('gastosCount').textContent = todayGastos.length;

  const lista = [...gastos].sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).slice(0, 50);
  if (!lista.length) {
    el.innerHTML = '<div class="empty"><i class="fas fa-receipt"></i><h3>Sin gastos registrados</h3></div>';
    return;
  }
  el.innerHTML = lista.map(g => `
    <div class="gasto-item">
      <div class="gi-info">
        <div class="gi-concept">${g.concepto}</div>
        <div class="gi-meta">${fmtDate(g.fecha)} · ${g.categoria} · ${CONFIG.CUENTAS[g.cuenta]?.name || g.cuenta}</div>
      </div>
      <div style="display:flex;align-items:center;gap:8px;">
        <div class="gi-amount">- $ ${fmt(g.monto)}</div>
        <div class="gi-actions">
          <button class="btn btn-s btn-sm" onclick="abrirGastoModal(${g.id})"><i class="fas fa-edit"></i></button>
        </div>
      </div>
    </div>`).join('');
}
