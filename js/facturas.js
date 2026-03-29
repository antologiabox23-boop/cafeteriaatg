// ══════════════════════════════════════════════
// FACTURAS — Facturas de compra a proveedores
// ══════════════════════════════════════════════

let facturas = loadFacturasData();
let facItemsCount = 0;

function saveFacturas() {
  saveFacturasData(facturas);
  syncModulo('facturas', facturas);
}

// ── Abrir / cerrar modal ──
function abrirModalFactura(id) {
  facItemsCount = 0;
  document.getElementById('facturaForm').reset();
  document.getElementById('facturaId').value = '';
  document.getElementById('deleteFacturaBtn').style.display = 'none';
  document.getElementById('facturaModalTitle').textContent = 'Nueva Factura de Compra';
  document.getElementById('facItemsContainer').innerHTML = '';
  document.getElementById('facSubtotal').textContent = '$ 0';
  document.getElementById('facTotal').textContent = '$ 0';
  setTodayDate();
  agregarItemFactura(); // Iniciar con una fila vacía

  if (id) {
    const fac = facturas.find(f => f.id === id);
    if (fac) {
      document.getElementById('facturaId').value = fac.id;
      document.getElementById('facProveedor').value = fac.proveedor;
      document.getElementById('facNumero').value = fac.numero || '';
      document.getElementById('facFecha').value = fac.fecha;
      document.getElementById('facCuenta').value = fac.cuenta || 'efectivo';
      document.getElementById('facDescuento').value = fac.descuento || 0;
      document.getElementById('facIva').value = fac.iva || 0;
      document.getElementById('facObservaciones').value = fac.observaciones || '';
      document.getElementById('deleteFacturaBtn').style.display = 'inline-flex';
      document.getElementById('facturaModalTitle').textContent = 'Editar Factura';
      // Cargar ítems
      document.getElementById('facItemsContainer').innerHTML = '';
      facItemsCount = 0;
      (fac.items || []).forEach(item => agregarItemFactura(item));
      calcularTotalFactura();
    }
  }
  document.getElementById('facturaModal').classList.add('active');
}

function cerrarFacturaModal() {
  document.getElementById('facturaModal').classList.remove('active');
}

// ── Fila de ítem ──
function agregarItemFactura(data) {
  const cont = document.getElementById('facItemsContainer');
  const idx  = facItemsCount++;
  const div  = document.createElement('div');
  div.className = 'fac-item-row';
  div.id = `facRow_${idx}`;
  div.innerHTML = `
    <div class="fg">
      <label>${idx === 0 ? 'Artículo / Descripción' : ''}</label>
      <input type="text" id="facItem_desc_${idx}" placeholder="Ej: Proteína Whey 1kg" value="${data?.descripcion||''}" required>
    </div>
    <div class="fg">
      <label>${idx === 0 ? 'Cant.' : ''}</label>
      <input type="number" id="facItem_qty_${idx}" placeholder="1" min="0" step="0.01" value="${data?.cantidad||1}" oninput="calcularTotalFactura()">
    </div>
    <div class="fg">
      <label>${idx === 0 ? 'Precio unit. ($)' : ''}</label>
      <input type="number" id="facItem_precio_${idx}" placeholder="0" min="0" value="${data?.precio||''}" oninput="calcularTotalFactura()">
    </div>
    <div class="fg" style="display:flex;align-items:flex-end;padding-bottom:1px;">
      <button type="button" class="btn btn-d btn-sm" onclick="eliminarItemFactura(${idx})" title="Quitar fila">
        <i class="fas fa-times"></i>
      </button>
    </div>`;
  cont.appendChild(div);
  calcularTotalFactura();
}

function eliminarItemFactura(idx) {
  const row = document.getElementById(`facRow_${idx}`);
  if (row) row.remove();
  calcularTotalFactura();
}

function calcularTotalFactura() {
  let subtotal = 0;
  for (let i = 0; i < facItemsCount; i++) {
    const qty    = parseFloat(document.getElementById(`facItem_qty_${i}`)?.value || 0);
    const precio = parseFloat(document.getElementById(`facItem_precio_${i}`)?.value || 0);
    subtotal += qty * precio;
  }
  const descuento = parseFloat(document.getElementById('facDescuento').value || 0);
  const ivaPct    = parseFloat(document.getElementById('facIva').value || 0);
  const conDesc   = subtotal - descuento;
  const total     = conDesc + (conDesc * ivaPct / 100);
  document.getElementById('facSubtotal').textContent = `$ ${fmt(subtotal)}`;
  document.getElementById('facTotal').textContent    = `$ ${fmt(total)}`;
}

// ── Guardar factura ──
document.getElementById('facturaForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const id          = document.getElementById('facturaId').value;
  const proveedor   = document.getElementById('facProveedor').value.trim();
  const numero      = document.getElementById('facNumero').value.trim();
  const fecha       = document.getElementById('facFecha').value;
  const cuenta      = document.getElementById('facCuenta').value;
  const descuento   = parseFloat(document.getElementById('facDescuento').value || 0);
  const iva         = parseFloat(document.getElementById('facIva').value || 0);
  const observaciones = document.getElementById('facObservaciones').value.trim();

  if (!proveedor || !fecha) { notify('Completa proveedor y fecha', 'warn'); return; }

  // Recopilar ítems
  const items = [];
  for (let i = 0; i < facItemsCount; i++) {
    const descEl   = document.getElementById(`facItem_desc_${i}`);
    const qtyEl    = document.getElementById(`facItem_qty_${i}`);
    const precioEl = document.getElementById(`facItem_precio_${i}`);
    if (!descEl) continue;
    const desc   = descEl.value.trim();
    const qty    = parseFloat(qtyEl?.value || 0);
    const precio = parseFloat(precioEl?.value || 0);
    if (desc || qty || precio) {
      items.push({ descripcion: desc, cantidad: qty, precio });
      // Actualizar stock en inventario si existe el artículo
      actualizarStockPorFactura(desc, qty);
    }
  }

  if (!items.length) { notify('Agrega al menos un artículo', 'warn'); return; }

  // Calcular total
  const subtotal = items.reduce((s, it) => s + it.cantidad * it.precio, 0);
  const conDesc  = subtotal - descuento;
  const total    = conDesc + (conDesc * iva / 100);

  const fac = { proveedor, numero, fecha, cuenta, descuento, iva, observaciones, items, subtotal, total };

  if (id) {
    const idx = facturas.findIndex(f => f.id === parseInt(id));
    if (idx > -1) facturas[idx] = { id:parseInt(id), ...fac };
  } else {
    facturas.push({ id: genId(), ...fac, createdAt: new Date().toISOString() });
    // Registrar egreso si no es a crédito
    if (cuenta !== 'credito') {
      addTransaction(cuenta, {
        id:genId(), date:fecha,
        concept:`Factura compra · ${proveedor}${numero ? ` #${numero}` : ''}`,
        amount: -total, type:'egreso'
      });
    }
  }

  saveFacturas(); updateUI(); loadFacturasList();
  cerrarFacturaModal();
  notify('✅ Factura guardada', 'success');
});

// Actualizar inventario automáticamente al ingresar factura
function actualizarStockPorFactura(descripcion, cantidad) {
  if (!descripcion || !cantidad) return;
  const term = descripcion.toLowerCase();
  const idx  = inventario.findIndex(x => x.nombre.toLowerCase().includes(term) || term.includes(x.nombre.toLowerCase()));
  if (idx > -1) {
    inventario[idx].stock = (inventario[idx].stock || 0) + cantidad;
    inventario[idx].updatedAt = new Date().toISOString();
    saveInventario();
    loadInventarioList();
  }
}

document.getElementById('deleteFacturaBtn').addEventListener('click', function() {
  const id = parseInt(document.getElementById('facturaId').value);
  if (!confirm('¿Eliminar esta factura?')) return;
  facturas = facturas.filter(f => f.id !== id);
  saveFacturas(); loadFacturasList();
  cerrarFacturaModal();
  notify('Factura eliminada', 'info');
});

// ── Lista de facturas ──
function loadFacturasList() {
  const el = document.getElementById('facturasList');
  const mes = fmtDateInput(new Date()).slice(0, 7);
  const facMes   = facturas.filter(f => f.fecha.startsWith(mes));
  const totalMes = facMes.reduce((s, f) => s + (f.total || 0), 0);
  const proveedores = new Set(facturas.map(f => f.proveedor)).size;

  document.getElementById('facTotalMes').textContent = `$ ${fmt(totalMes)}`;
  document.getElementById('facCount').textContent = facturas.length;
  document.getElementById('facProveedores').textContent = proveedores;

  const lista = [...facturas].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  if (!lista.length) {
    el.innerHTML = '<div class="empty"><i class="fas fa-file-invoice"></i><h3>Sin facturas registradas</h3><p>Registra tus facturas de compra a proveedores</p></div>';
    return;
  }

  el.innerHTML = lista.map(fac => `
    <div class="factura-card">
      <div class="fac-hdr">
        <div>
          <div class="fac-proveedor"><i class="fas fa-truck"></i> ${fac.proveedor}</div>
          ${fac.numero ? `<span class="badge bi"># ${fac.numero}</span>` : ''}
        </div>
        <div class="fac-total">$ ${fmt(fac.total || 0)}</div>
      </div>
      <div class="fac-meta">
        ${fmtDate(fac.fecha)} · ${fac.cuenta === 'credito' ? '📋 A crédito' : CONFIG.CUENTAS[fac.cuenta]?.name || fac.cuenta}
        ${fac.iva ? ` · IVA ${fac.iva}%` : ''}
      </div>
      <div class="fac-items-preview">
        ${(fac.items || []).slice(0,3).map(it => `${it.descripcion} × ${it.cantidad}`).join(' · ')}
        ${(fac.items||[]).length > 3 ? ` · +${(fac.items||[]).length-3} más` : ''}
      </div>
      <div class="fac-actions">
        <button class="btn btn-s btn-sm" onclick="verDetalleFactura(${fac.id})"><i class="fas fa-eye"></i> Ver</button>
        <button class="btn btn-i btn-sm" onclick="abrirModalFactura(${fac.id})"><i class="fas fa-edit"></i> Editar</button>
      </div>
    </div>`).join('');
}

// ── Detalle de factura ──
function verDetalleFactura(id) {
  const fac = facturas.find(f => f.id === id);
  if (!fac) return;
  document.getElementById('facturaDetalleContent').innerHTML = `
    <div style="margin-bottom:14px;">
      <div style="font-size:.75rem;color:#888;text-transform:uppercase;letter-spacing:1px;margin-bottom:3px;">Proveedor</div>
      <div style="font-weight:700;font-size:1.05rem;">${fac.proveedor}</div>
      ${fac.numero ? `<div class="badge bi" style="margin-top:4px;"># ${fac.numero}</div>` : ''}
    </div>
    <div class="frow" style="margin-bottom:14px;">
      <div><div class="slbl">Fecha</div><div style="font-weight:600;">${fmtDate(fac.fecha)}</div></div>
      <div><div class="slbl">Pago</div><div style="font-weight:600;">${fac.cuenta==='credito'?'A crédito':CONFIG.CUENTAS[fac.cuenta]?.name||fac.cuenta}</div></div>
    </div>
    <div class="stitle" style="font-size:.82rem;"><i class="fas fa-list"></i> Artículos</div>
    <div style="background:var(--latte);border-radius:var(--rs);padding:12px;margin-bottom:12px;">
      <div style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:6px;font-size:.72rem;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:.5px;padding-bottom:8px;border-bottom:1px solid var(--cream);">
        <span>Artículo</span><span style="text-align:center;">Cant.</span><span style="text-align:right;">Precio</span><span style="text-align:right;">Subtotal</span>
      </div>
      ${(fac.items||[]).map(it => `
        <div style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:6px;padding:7px 0;border-bottom:1px solid var(--cream);font-size:.85rem;">
          <span>${it.descripcion}</span>
          <span style="text-align:center;">${it.cantidad}</span>
          <span style="text-align:right;">$ ${fmt(it.precio)}</span>
          <span style="text-align:right;font-weight:600;">$ ${fmt(it.cantidad*it.precio)}</span>
        </div>`).join('')}
      <div style="padding-top:10px;">
        <div style="display:flex;justify-content:space-between;font-size:.85rem;margin-bottom:5px;"><span>Subtotal</span><span>$ ${fmt(fac.subtotal||0)}</span></div>
        ${fac.descuento ? `<div style="display:flex;justify-content:space-between;font-size:.85rem;margin-bottom:5px;"><span>Descuento</span><span class="negative">- $ ${fmt(fac.descuento)}</span></div>` : ''}
        ${fac.iva ? `<div style="display:flex;justify-content:space-between;font-size:.85rem;margin-bottom:5px;"><span>IVA (${fac.iva}%)</span><span>$ ${fmt(((fac.subtotal||0)-(fac.descuento||0))*(fac.iva/100))}</span></div>` : ''}
        <div style="display:flex;justify-content:space-between;font-size:1rem;font-weight:700;padding-top:8px;border-top:2px solid var(--cream);"><span>TOTAL</span><span style="color:var(--cw);font-family:'Playfair Display',serif;">$ ${fmt(fac.total||0)}</span></div>
      </div>
    </div>
    ${fac.observaciones ? `<div style="background:var(--latte);border-radius:var(--rs);padding:10px;font-size:.85rem;color:#666;"><i class="fas fa-sticky-note"></i> ${fac.observaciones}</div>` : ''}
    <button class="btn btn-p btn-full" style="margin-top:14px;" onclick="document.getElementById('facturaDetalleModal').classList.remove('active')"><i class="fas fa-check"></i> Cerrar</button>`;
  document.getElementById('facturaDetalleModal').classList.add('active');
}
