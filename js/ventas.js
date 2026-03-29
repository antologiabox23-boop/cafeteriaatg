// ══════════════════════════════════════════════
// VENTAS — Cobros, pendientes, cierre de caja
// ══════════════════════════════════════════════

let pendientes = loadPendientesData();
let selectedPayMethod = 'efectivo';

function savePendientes() {
  savePendientesData(pendientes);
  syncModulo('pendientes', pendientes);
}

// ── Cobro ──
function abrirCobro(fromPendiente = false, pendienteId = null) {
  const total = fromPendiente
    ? pendientes.find(p => p.id === pendienteId)?.total || 0
    : getOrdenTotal();

  if (total <= 0 && !fromPendiente) {
    notify('Agrega productos o registra venta manual', 'warn');
    return;
  }

  document.getElementById('cobroTotal').textContent = `$ ${fmt(total)}`;
  document.getElementById('cobroModal').dataset.pendienteId = pendienteId || '';
  document.getElementById('cobroModal').classList.add('active');
  // reset method
  document.querySelectorAll('.pmb').forEach(b => b.classList.remove('sel'));
  document.querySelector('.pmb[data-cuenta="efectivo"]').classList.add('sel');
  selectedPayMethod = 'efectivo';
}

function selPay(btn) {
  document.querySelectorAll('.pmb').forEach(b => b.classList.remove('sel'));
  btn.classList.add('sel');
  selectedPayMethod = btn.dataset.cuenta;
}

function confirmarCobro() {
  const k      = selectedPayMethod;
  const nota   = document.getElementById('cobroNota').value.trim();
  const pId    = document.getElementById('cobroModal').dataset.pendienteId;
  const today  = fmtDateInput(new Date());

  if (pId) {
    // Cobrar pendiente
    const pend = pendientes.find(p => p.id === parseInt(pId));
    if (!pend) return;
    const concept = `Cobro pedido${pend.cliente ? ` · ${pend.cliente}` : ''}${nota ? ` · ${nota}` : ''}`;
    addTransaction(k, { id:genId(), date:today, concept, amount:pend.total, type:'ingreso', esventa:true });
    pendientes = pendientes.filter(p => p.id !== parseInt(pId));
    savePendientes();
    updatePendientesList();
  } else {
    // Cobrar orden actual
    const total  = getOrdenTotal();
    const monto  = total > 0 ? total : parseFloat(document.getElementById('vmMonto').value || 0);
    if (monto <= 0) { notify('Monto inválido', 'danger'); return; }
    const items  = orden.length
      ? orden.map(x => `${x.nombre} x${x.qty}`).join(', ')
      : document.getElementById('vmDesc').value || 'Venta';
    const cliente= document.getElementById('ordenCliente').value.trim();
    const concept= `${items}${cliente ? ` · ${cliente}` : ''}${nota ? ` · ${nota}` : ''}`;
    addTransaction(k, { id:genId(), date:today, concept, amount:monto, type:'ingreso', esventa:true });
    limpiarOrden();
    document.getElementById('vmDesc').value = '';
    document.getElementById('vmMonto').value = '';
  }

  document.getElementById('cobroModal').classList.remove('active');
  document.getElementById('cobroNota').value = '';
  updateUI(); updateVentasList();
  notify('✅ Venta registrada', 'success');
}

// ── Venta manual rápida ──
function ventaManualRapida() {
  const desc  = document.getElementById('vmDesc').value.trim();
  const monto = parseFloat(document.getElementById('vmMonto').value);
  if (!desc || !monto) { notify('Completa descripción y monto', 'warn'); return; }
  document.getElementById('cobroTotal').textContent = `$ ${fmt(monto)}`;
  document.getElementById('cobroModal').dataset.pendienteId = '';
  document.getElementById('cobroModal').classList.add('active');
}

// ── Pendientes ──
function guardarPendiente() {
  const total  = getOrdenTotal();
  if (!total && !orden.length) { notify('Agrega productos al pedido primero', 'warn'); return; }
  const cliente = document.getElementById('ordenCliente').value.trim();
  pendientes.push({
    id: genId(),
    cliente,
    items: orden.map(x => ({ ...x })),
    total,
    savedAt: new Date().toISOString(),
  });
  savePendientes();
  limpiarOrden();
  updatePendientesList();
  notify('📋 Pedido guardado como pendiente', 'info');
}

function updatePendientesList() {
  const el = document.getElementById('pendientesList');
  const badge = document.getElementById('pendBadge');
  if (!pendientes.length) {
    el.innerHTML = '<div class="empty"><i class="fas fa-clock"></i><h3>Sin pendientes</h3></div>';
    badge.style.display = 'none';
    return;
  }
  badge.style.display = 'inline-block';
  badge.textContent = pendientes.length;

  el.innerHTML = pendientes.map(p => `
    <div class="pending-card">
      <div class="pc-hdr">
        <div class="pc-name">${p.cliente || 'Sin nombre'}</div>
        <div class="pc-total">$ ${fmt(p.total)}</div>
      </div>
      <div class="pc-items">${p.items.map(x=>`${x.nombre} x${x.qty}`).join(' · ')}</div>
      <div class="pc-time"><i class="fas fa-clock"></i> ${new Date(p.savedAt).toLocaleTimeString('es-CO',{hour:'2-digit',minute:'2-digit'})}</div>
      <div class="pc-actions" style="margin-top:8px;">
        <button class="btn btn-ok btn-sm" onclick="abrirCobro(true,${p.id})"><i class="fas fa-money-bill-wave"></i> Cobrar</button>
        <button class="btn btn-d btn-sm" onclick="eliminarPendiente(${p.id})"><i class="fas fa-trash"></i></button>
      </div>
    </div>`).join('');
}

function eliminarPendiente(id) {
  pendientes = pendientes.filter(p => p.id !== id);
  savePendientes(); updatePendientesList();
  notify('Pendiente eliminado', 'info');
}

// ── Lista ventas del día ──
function updateVentasList() {
  const el = document.getElementById('ventasList');
  const today = fmtDateInput(new Date());
  let ventas = [];
  for (const k in accounts) {
    accounts[k].transactions
      .filter(tx => tx.date === today && tx.esventa)
      .forEach(tx => ventas.push({ ...tx, accountKey: k, accountName: accounts[k].name }));
  }
  ventas.sort((a, b) => b.id - a.id);
  if (!ventas.length) {
    el.innerHTML = '<div class="empty"><i class="fas fa-coffee"></i><h3>Sin ventas hoy</h3></div>';
    return;
  }
  el.innerHTML = ventas.map(tx => `
    <div class="vi">
      <div>
        <div class="vi-concept">${tx.concept}</div>
        <div class="vi-meta">${accounts[tx.accountKey]?.name} · ${fmtDate(tx.date)}</div>
      </div>
      <div style="display:flex;align-items:center;gap:8px;">
        <div class="vi-amount positive">$ ${fmt(tx.amount)}</div>
        <button class="btn btn-d btn-sm" onclick="delTx('${tx.accountKey}',${tx.id})"><i class="fas fa-trash"></i></button>
      </div>
    </div>`).join('');
}

// ── Cierre de caja ──
function cerrarCaja() {
  const today = fmtDateInput(new Date());
  let tv = 0, cv = 0;
  const pc = {};
  for (const k in accounts) {
    accounts[k].transactions.forEach(tx => {
      if (tx.date === today && tx.esventa) {
        tv += tx.amount; cv++;
        pc[accounts[k].name] = (pc[accounts[k].name] || 0) + tx.amount;
      }
    });
  }
  const gastos = loadGastosData();
  const todayGastos = gastos.filter(g => g.fecha === today).reduce((s, g) => s + g.monto, 0);
  const credPend = pendientes.length;

  const desglose = Object.entries(pc).map(([k,v]) =>
    `<div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--cream)"><span>${k}</span><strong>$ ${fmt(v)}</strong></div>`
  ).join('');

  document.getElementById('cierreCajaContent').innerHTML = `
    <div style="text-align:center;margin-bottom:18px">
      <div style="font-size:.75rem;color:#888">${new Date().toLocaleDateString('es-CO',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</div>
      <div style="font-family:'Playfair Display',serif;font-size:2.2rem;font-weight:700;color:var(--cw);margin:8px 0">$ ${fmt(tv)}</div>
      <div style="font-size:.85rem;color:#888">${cv} ventas realizadas</div>
    </div>
    <div class="stitle" style="font-size:.86rem;"><i class="fas fa-wallet"></i> Por método de pago</div>
    <div style="background:var(--latte);border-radius:var(--r);padding:13px;margin-bottom:14px">${desglose || '<p style="color:#bbb;text-align:center;padding:8px">Sin ventas hoy</p>'}</div>
    <div style="background:var(--latte);border-radius:var(--r);padding:13px;margin-bottom:14px">
      <div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--cream)"><span>Gastos del día</span><span class="negative">- $ ${fmt(todayGastos)}</span></div>
      <div style="display:flex;justify-content:space-between;padding:7px 0">${tv-todayGastos>=0?'+':''}<strong><span class="${(tv-todayGastos)>=0?'positive':'negative'}">$ ${fmt(tv-todayGastos)}</span></strong> <span>Neto del día</span></div>
      ${credPend > 0 ? `<div style="display:flex;justify-content:space-between;padding:7px 0;border-top:1px solid var(--cream)"><span>Pedidos pendientes</span><span class="negative">${credPend}</span></div>` : ''}
    </div>
    <button class="btn btn-p btn-full" onclick="document.getElementById('cierreCajaModal').classList.remove('active')"><i class="fas fa-check"></i> Listo</button>`;
  document.getElementById('cierreCajaModal').classList.add('active');
}
