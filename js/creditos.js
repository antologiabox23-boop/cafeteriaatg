// ══════════════════════════════════════════════
// CRÉDITOS — Clientes con deuda
// ══════════════════════════════════════════════

let creditos = loadCreditosData();

function saveCreditos() {
  saveCreditosData(creditos);
  syncModulo('creditos', creditos);
}

function deudaRestante(c) {
  const abonos = (c.abonos || []).reduce((s, a) => s + a.monto, 0);
  return c.monto - abonos;
}

function abrirNuevoCredito() {
  document.getElementById('creditoForm').reset();
  document.getElementById('creditoId').value = '';
  document.getElementById('creditoModalTitle').textContent = 'Nuevo Crédito';
  setTodayDate();
  document.getElementById('creditoModal').classList.add('active');
}

document.getElementById('creditoForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const id      = document.getElementById('creditoId').value;
  const cliente = document.getElementById('creditoCliente').value.trim();
  const monto   = parseFloat(document.getElementById('creditoMonto').value);
  const fecha   = document.getElementById('creditoFecha').value;
  const desc    = document.getElementById('creditoDesc').value.trim();
  if (!cliente || !monto || !fecha) return;

  if (id) {
    const idx = creditos.findIndex(c => c.id === parseInt(id));
    if (idx > -1) { creditos[idx].cliente = cliente; creditos[idx].monto = monto; creditos[idx].desc = desc; }
  } else {
    creditos.push({ id:genId(), cliente, monto, fecha, desc, abonos:[] });
  }
  saveCreditos(); loadCreditosList();
  document.getElementById('creditoModal').classList.remove('active');
  notify('✅ Crédito guardado', 'success');
});

function abonarCredito(id) {
  const c = creditos.find(x => x.id === id);
  if (!c) return;
  const deuda = deudaRestante(c);
  const val = parseFloat(prompt(`Abono para ${c.cliente}\nDeuda restante: $ ${fmt(deuda)}\nMonto del abono:`));
  if (!val || isNaN(val) || val <= 0) return;
  const abonoReal = Math.min(val, deuda);
  c.abonos = c.abonos || [];
  c.abonos.push({ id:genId(), monto:abonoReal, fecha:fmtDateInput(new Date()) });
  // Registrar ingreso en efectivo
  addTransaction('efectivo', { id:genId(), date:fmtDateInput(new Date()), concept:`Abono crédito · ${c.cliente}`, amount:abonoReal, type:'ingreso', esventa:false });
  saveCreditos(); updateUI(); loadCreditosList();
  notify(`✅ Abono de $ ${fmt(abonoReal)} registrado`, 'success');
}

function eliminarCredito(id) {
  if (!confirm('¿Eliminar este crédito?')) return;
  creditos = creditos.filter(c => c.id !== id);
  saveCreditos(); loadCreditosList();
  notify('Crédito eliminado', 'info');
}

function loadCreditosList() {
  const el = document.getElementById('creditosList');
  const sumEl = document.getElementById('creditoSummary');
  if (!creditos.length) {
    el.innerHTML = '<div class="empty"><i class="fas fa-user-clock"></i><h3>Sin créditos activos</h3></div>';
    sumEl.innerHTML = '';
    return;
  }
  const totalDeuda = creditos.reduce((s, c) => s + deudaRestante(c), 0);
  sumEl.innerHTML = `
    <div class="credito-summary">
      <div style="font-size:.75rem;opacity:.8;text-transform:uppercase;letter-spacing:1px;margin-bottom:5px">Total adeudado</div>
      <div style="font-family:'Playfair Display',serif;font-size:1.8rem;font-weight:700">$ ${fmt(totalDeuda)}</div>
      <div style="font-size:.82rem;opacity:.8;margin-top:3px">${creditos.length} cliente(s) con crédito</div>
    </div>`;

  el.innerHTML = creditos.map(c => {
    const deuda = deudaRestante(c);
    if (deuda <= 0) return '';
    return `
      <div class="credito-card">
        <div class="cc-hdr">
          <div class="cc-name"><i class="fas fa-user"></i> ${c.cliente}</div>
          <div class="cc-debt">$ ${fmt(deuda)}</div>
        </div>
        <div class="cc-history">
          ${c.desc ? `<div>${c.desc}</div>` : ''}
          <div>Desde ${fmtDate(c.fecha)} · Total original: $ ${fmt(c.monto)}</div>
          ${(c.abonos||[]).length ? `<div>Abonos: ${(c.abonos||[]).map(a=>`$ ${fmt(a.monto)}`).join(', ')}</div>` : ''}
        </div>
        <div class="cc-actions">
          <button class="btn btn-ok btn-sm" onclick="abonarCredito(${c.id})"><i class="fas fa-plus"></i> Abonar</button>
          <button class="btn btn-d btn-sm" onclick="eliminarCredito(${c.id})"><i class="fas fa-trash"></i></button>
        </div>
      </div>`;
  }).join('');
}
