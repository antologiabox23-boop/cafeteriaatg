// ══════════════════════════════════════════════
// INVENTARIO — Control de stock
// ══════════════════════════════════════════════

let inventario = loadInventarioData();

function saveInventario() {
  saveInventarioData(inventario);
  syncModulo('inventario', inventario);
}

function abrirModalProductoInventario(id) {
  document.getElementById('invProdForm').reset();
  document.getElementById('invProdId').value = '';
  document.getElementById('deleteInvProdBtn').style.display = 'none';
  document.getElementById('invProdModalTitle').textContent = 'Nuevo Artículo';
  if (id) {
    const item = inventario.find(x => x.id === id);
    if (item) {
      document.getElementById('invProdId').value = item.id;
      document.getElementById('invProdNombre').value = item.nombre;
      document.getElementById('invProdCodigo').value = item.codigo || '';
      document.getElementById('invProdCategoria').value = item.categoria || 'Otros';
      document.getElementById('invProdUnidad').value = item.unidad || 'unidades';
      document.getElementById('invProdStock').value = item.stock;
      document.getElementById('invProdStockMin').value = item.stockMin || 5;
      document.getElementById('invProdCosto').value = item.costo || '';
      document.getElementById('invProdVenta').value = item.precioVenta || '';
      document.getElementById('invProdProveedor').value = item.proveedor || '';
      document.getElementById('deleteInvProdBtn').style.display = 'inline-flex';
      document.getElementById('invProdModalTitle').textContent = 'Editar Artículo';
    }
  }
  document.getElementById('invProdModal').classList.add('active');
}

document.getElementById('invProdForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const id         = document.getElementById('invProdId').value;
  const nombre     = document.getElementById('invProdNombre').value.trim();
  const codigo     = document.getElementById('invProdCodigo').value.trim();
  const categoria  = document.getElementById('invProdCategoria').value;
  const unidad     = document.getElementById('invProdUnidad').value;
  const stock      = parseFloat(document.getElementById('invProdStock').value) || 0;
  const stockMin   = parseFloat(document.getElementById('invProdStockMin').value) || 5;
  const costo      = parseFloat(document.getElementById('invProdCosto').value) || 0;
  const precioVenta= parseFloat(document.getElementById('invProdVenta').value) || 0;
  const proveedor  = document.getElementById('invProdProveedor').value.trim();
  if (!nombre) return;

  const item = { nombre, codigo, categoria, unidad, stock, stockMin, costo, precioVenta, proveedor, updatedAt: new Date().toISOString() };

  if (id) {
    const idx = inventario.findIndex(x => x.id === parseInt(id));
    if (idx > -1) inventario[idx] = { ...inventario[idx], ...item };
  } else {
    inventario.push({ id:genId(), ...item, createdAt: new Date().toISOString() });
  }
  saveInventario(); loadInventarioList();
  document.getElementById('invProdModal').classList.remove('active');
  notify('✅ Artículo guardado', 'success');
});

document.getElementById('deleteInvProdBtn').addEventListener('click', function() {
  const id = parseInt(document.getElementById('invProdId').value);
  if (!confirm('¿Eliminar este artículo del inventario?')) return;
  inventario = inventario.filter(x => x.id !== id);
  saveInventario(); loadInventarioList();
  document.getElementById('invProdModal').classList.remove('active');
  notify('Artículo eliminado', 'info');
});

// Ajuste rápido de stock
function ajustarStock(id, delta) {
  const idx = inventario.findIndex(x => x.id === id);
  if (idx < 0) return;
  inventario[idx].stock = Math.max(0, (inventario[idx].stock || 0) + delta);
  inventario[idx].updatedAt = new Date().toISOString();
  saveInventario(); loadInventarioList();
}

function filtrarInventario() {
  loadInventarioList();
}

function loadInventarioList() {
  const el       = document.getElementById('inventarioList');
  const buscar   = (document.getElementById('invBuscar')?.value || '').toLowerCase();
  const catFilt  = document.getElementById('invCategoria')?.value || '';

  let lista = inventario.filter(item => {
    const matchBuscar = !buscar || item.nombre.toLowerCase().includes(buscar) || (item.codigo||'').toLowerCase().includes(buscar);
    const matchCat    = !catFilt || item.categoria === catFilt;
    return matchBuscar && matchCat;
  }).sort((a, b) => a.nombre.localeCompare(b.nombre));

  // Resumen
  const stockBajo = inventario.filter(x => x.stock <= (x.stockMin || 5) && x.stock > 0).length;
  const sinStock  = inventario.filter(x => x.stock <= 0).length;
  const valorTotal= inventario.reduce((s, x) => s + (x.stock * (x.costo || 0)), 0);
  document.getElementById('invTotalItems').textContent = inventario.length;
  document.getElementById('invStockBajo').textContent  = stockBajo + sinStock;
  document.getElementById('invValorTotal').textContent = `$ ${fmt(valorTotal)}`;

  if (!lista.length) {
    el.innerHTML = '<div class="empty"><i class="fas fa-boxes"></i><h3>Sin artículos</h3><p>Agrega productos al inventario</p></div>';
    return;
  }

  el.innerHTML = lista.map(item => {
    const bajo   = item.stock <= (item.stockMin || 5) && item.stock > 0;
    const sinStk = item.stock <= 0;
    const cls    = sinStk ? 'sin-stock' : bajo ? 'stock-bajo' : '';
    const margin = item.costo && item.precioVenta ? `${Math.round(((item.precioVenta - item.costo) / item.precioVenta) * 100)}%` : '—';
    return `
      <div class="inv-card ${cls}">
        <div class="inv-info">
          <div class="inv-nombre">${item.nombre} ${item.codigo ? `<span class="badge bi">${item.codigo}</span>` : ''}</div>
          <div class="inv-meta">${item.categoria} · ${item.proveedor || 'Sin proveedor'} · Margen: ${margin}</div>
          ${bajo ? '<div style="font-size:.72rem;color:var(--err);margin-top:3px;"><i class="fas fa-exclamation-triangle"></i> Stock bajo</div>' : ''}
          ${sinStk ? '<div style="font-size:.72rem;color:#999;margin-top:3px;"><i class="fas fa-times-circle"></i> Sin stock</div>' : ''}
        </div>
        <div class="inv-stock">
          <div class="inv-stock-num ${bajo||sinStk?'bajo':''}">${item.stock}</div>
          <div class="inv-stock-label">${item.unidad || 'uds'}</div>
        </div>
        <div class="inv-actions">
          <button class="btn btn-s btn-sm" onclick="ajustarStock(${item.id},-1)" ${item.stock<=0?'disabled':''}>−1</button>
          <button class="btn btn-s btn-sm" onclick="ajustarStock(${item.id},1)">+1</button>
          <button class="btn btn-i btn-sm" onclick="abrirModalProductoInventario(${item.id})"><i class="fas fa-edit"></i></button>
        </div>
      </div>`;
  }).join('');
}
