// ══════════════════════════════════════════════
// PRODUCTOS — Catálogo de venta
// ══════════════════════════════════════════════

let products = loadProductsData();

function saveProducts() {
  saveProductsData(products);
  syncModulo('products', products);
}

// ── Grid de venta rápida ──
let orden = [];

function loadProdGrid() {
  const grid = document.getElementById('prodGrid');
  if (!products.length) {
    grid.innerHTML = '<div class="empty" style="grid-column:1/-1;padding:20px;"><p>No hay productos. Agrégalos en la pestaña Productos.</p></div>';
    return;
  }
  grid.innerHTML = products.map(p => `
    <button class="prod-btn" onclick="addToOrden(${p.id})">
      <div class="pe">${p.emoji || '🛍️'}</div>
      <div class="pn">${p.nombre}</div>
      <div class="pp">$ ${fmt(p.precio)}</div>
    </button>`).join('');
}

function addToOrden(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  const existing = orden.find(x => x.id === id);
  if (existing) existing.qty++;
  else orden.push({ id, nombre: p.nombre, precio: p.precio, qty: 1 });
  renderOrden();
}

function renderOrden() {
  const items = document.getElementById('ordenItems');
  if (!orden.length) {
    items.innerHTML = '<div class="empty" style="padding:18px"><i class="fas fa-coffee" style="font-size:1.6rem;color:var(--cw);"></i><p style="color:#bbb;margin-top:6px;font-size:.82rem;">Selecciona productos</p></div>';
    document.getElementById('ordenTotal').textContent = '$ 0';
    return;
  }
  items.innerHTML = orden.map(item => `
    <div class="oi">
      <div><div class="oi-name">${item.nombre}</div><div class="oi-price">$ ${fmt(item.precio)} c/u</div></div>
      <div class="qty-ctrl">
        <button class="qbtn qm" onclick="cambiarQty(${item.id},-1)">−</button>
        <span class="qn">${item.qty}</span>
        <button class="qbtn qp" onclick="cambiarQty(${item.id},1)">+</button>
      </div>
      <strong>$ ${fmt(item.precio * item.qty)}</strong>
    </div>`).join('');
  const total = orden.reduce((s, x) => s + x.precio * x.qty, 0);
  document.getElementById('ordenTotal').textContent = `$ ${fmt(total)}`;
}

function cambiarQty(id, delta) {
  const idx = orden.findIndex(x => x.id === id);
  if (idx < 0) return;
  orden[idx].qty += delta;
  if (orden[idx].qty <= 0) orden.splice(idx, 1);
  renderOrden();
}

function limpiarOrden() {
  orden = [];
  document.getElementById('ordenCliente').value = '';
  renderOrden();
}

function getOrdenTotal() {
  return orden.reduce((s, x) => s + x.precio * x.qty, 0);
}

// ── Gestión de catálogo ──
function loadProductsList() {
  const el = document.getElementById('productsList');
  if (!products.length) {
    el.innerHTML = '<div class="empty"><i class="fas fa-coffee"></i><h3>Sin productos</h3></div>';
    return;
  }
  el.innerHTML = products.map(p => `
    <div class="pmcard">
      <div><span style="font-size:1.2rem;margin-right:8px;">${p.emoji||'🛍️'}</span><span class="pmname">${p.nombre}</span></div>
      <div style="display:flex;align-items:center;gap:10px;">
        <span class="pmprice">$ ${fmt(p.precio)}</span>
        <button class="btn btn-s btn-sm" onclick="editProd(${p.id})"><i class="fas fa-edit"></i></button>
      </div>
    </div>`).join('');
}

function abrirProdModal(id) {
  document.getElementById('prodForm').reset();
  document.getElementById('prodId').value = '';
  document.getElementById('deleteProdBtn').style.display = 'none';
  document.getElementById('prodModalTitle').textContent = 'Nuevo Producto';
  if (id) {
    const p = products.find(x => x.id === id);
    if (p) {
      document.getElementById('prodId').value = p.id;
      document.getElementById('prodEmoji').value = p.emoji || '';
      document.getElementById('prodNombre').value = p.nombre;
      document.getElementById('prodPrecio').value = p.precio;
      document.getElementById('deleteProdBtn').style.display = 'inline-flex';
      document.getElementById('prodModalTitle').textContent = 'Editar Producto';
    }
  }
  document.getElementById('prodModal').classList.add('active');
}

function editProd(id) { abrirProdModal(id); }

document.getElementById('prodForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const id     = document.getElementById('prodId').value;
  const emoji  = document.getElementById('prodEmoji').value.trim() || '🛍️';
  const nombre = document.getElementById('prodNombre').value.trim();
  const precio = parseFloat(document.getElementById('prodPrecio').value);
  if (!nombre || !precio) return;

  if (id) {
    const idx = products.findIndex(x => x.id === parseInt(id));
    if (idx > -1) products[idx] = { id:parseInt(id), emoji, nombre, precio };
  } else {
    products.push({ id: genId(), emoji, nombre, precio });
  }
  saveProducts();
  loadProductsList();
  loadProdGrid();
  document.getElementById('prodModal').classList.remove('active');
  notify('✅ Producto guardado', 'success');
});

function eliminarProducto() {
  const id = parseInt(document.getElementById('prodId').value);
  if (!confirm('¿Eliminar producto?')) return;
  products = products.filter(p => p.id !== id);
  saveProducts(); loadProductsList(); loadProdGrid();
  document.getElementById('prodModal').classList.remove('active');
  notify('Producto eliminado', 'info');
}
