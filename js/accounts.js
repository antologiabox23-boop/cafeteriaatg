// ══════════════════════════════════════════════
// ACCOUNTS — Gestión de cuentas y transacciones
// ══════════════════════════════════════════════

let accounts = loadAccountsData();
let currentViewMonth = new Date().getMonth();
let currentViewYear  = new Date().getFullYear();
let txFilter = 'current';
let isEditing = false;
let currentEditId = null;

function saveAccounts() {
  saveAccountsData(accounts);
  syncModulo('accounts', accounts);
}

function getTotalGeneral() {
  let t = 0;
  for (const k in accounts) {
    accounts[k].transactions.forEach(tx => { t += tx.amount; });
  }
  return t;
}

function getAccountBalance(k) {
  return (accounts[k]?.transactions || []).reduce((s, tx) => s + tx.amount, 0);
}

function addTransaction(k, tx) {
  if (!accounts[k]) return;
  accounts[k].transactions.push(tx);
  saveAccounts();
}

function updateUI() {
  const total = getTotalGeneral();
  document.getElementById('totalGeneral').textContent = `$ ${fmt(total)}`;
  for (const k in CONFIG.CUENTAS) {
    const el = document.getElementById(`${k}Balance`);
    if (el) {
      const bal = getAccountBalance(k);
      el.textContent = `$ ${fmt(bal)}`;
      el.className = `acc-bal ${bal >= 0 ? 'positive' : 'negative'}`;
    }
  }
  updateCajaHdr();
}

function updateCajaHdr() {
  const today = fmtDateInput(new Date());
  let tv = 0, cv = 0;
  for (const k in accounts) {
    accounts[k].transactions.forEach(tx => {
      if (tx.date === today && tx.esventa) { tv += tx.amount; cv++; }
    });
  }
  document.getElementById('ventasHoy').textContent = `$ ${fmt(tv)}`;
  document.getElementById('txHoy').textContent = cv;
  document.getElementById('cajaDate').textContent =
    new Date().toLocaleDateString('es-CO', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
}

// ── Formulario de transacción ──
document.getElementById('transactionForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const id     = document.getElementById('transactionId').value;
  const k      = document.getElementById('account').value;
  const type   = document.getElementById('type').value;
  const amount = parseFloat(document.getElementById('amount').value);
  const date   = document.getElementById('date').value;
  const concept= document.getElementById('concept').value.trim();
  if (!k || !amount || !date || !concept) return;
  const val = type === 'egreso' ? -Math.abs(amount) : Math.abs(amount);

  if (isEditing && id) {
    const origK = document.getElementById('originalAccount').value;
    const idx = accounts[origK]?.transactions.findIndex(t => t.id === parseInt(id));
    if (idx > -1) {
      if (origK !== k) {
        accounts[origK].transactions.splice(idx, 1);
        accounts[k].transactions.push({ id:parseInt(id), date, concept, amount:val, type });
      } else {
        accounts[k].transactions[idx] = { id:parseInt(id), date, concept, amount:val, type };
      }
    }
  } else {
    accounts[k].transactions.push({ id:genId(), date, concept, amount:val, type, esventa:false });
  }
  saveAccounts(); updateUI(); loadTransactions(); loadAccountsTab();
  document.getElementById('transactionModal').classList.remove('active');
  resetTxForm();
  notify(isEditing ? '✏️ Movimiento actualizado' : '✅ Movimiento guardado', 'success');
});

document.getElementById('addTransactionBtn').addEventListener('click', () => {
  resetTxForm();
  document.getElementById('modalTitle').textContent = 'Nueva Transacción';
  document.getElementById('transactionModal').classList.add('active');
  setTodayDate();
});
document.querySelectorAll('.close-modal').forEach(btn => {
  btn.addEventListener('click', () => {
    document.getElementById('transactionModal').classList.remove('active');
    resetTxForm();
  });
});

function editTx(k, id) {
  const tx = accounts[k]?.transactions.find(t => t.id === id);
  if (!tx) return;
  isEditing = true; currentEditId = id;
  document.getElementById('modalTitle').textContent = 'Editar Movimiento';
  document.getElementById('transactionId').value = id;
  document.getElementById('originalAccount').value = k;
  document.getElementById('account').value = k;
  document.getElementById('type').value = tx.amount >= 0 ? 'ingreso' : 'egreso';
  document.getElementById('amount').value = Math.abs(tx.amount);
  document.getElementById('date').value = tx.date;
  document.getElementById('concept').value = tx.concept;
  document.getElementById('deleteTransactionBtn').style.display = 'inline-flex';
  document.getElementById('transactionModal').classList.add('active');
}

document.getElementById('deleteTransactionBtn').addEventListener('click', () => {
  const id = parseInt(document.getElementById('transactionId').value);
  const k  = document.getElementById('originalAccount').value;
  eliminarTx(k, id);
  document.getElementById('transactionModal').classList.remove('active');
  resetTxForm();
});

function delTx(k, id) {
  if (!confirm('¿Eliminar este movimiento?')) return;
  eliminarTx(k, id);
}

function eliminarTx(k, id) {
  const idx = accounts[k]?.transactions.findIndex(t => t.id === id);
  if (idx > -1) {
    accounts[k].transactions.splice(idx, 1);
    saveAccounts(); updateUI(); loadTransactions(); loadAccountsTab();
    updateVentasList(); updateGastosList();
    notify('Movimiento eliminado', 'info');
  }
}

function resetTxForm() {
  isEditing = false; currentEditId = null;
  document.getElementById('transactionForm').reset();
  setTodayDate();
  document.getElementById('transactionId').value = '';
  document.getElementById('originalAccount').value = '';
  document.getElementById('deleteTransactionBtn').style.display = 'none';
}

// ── Lista movimientos ──
function loadTransactions() {
  const list = document.getElementById('transactionsList');
  let txs = [];
  for (const k in accounts) {
    accounts[k].transactions.forEach(tx => txs.push({ ...tx, accountKey: k, accountName: accounts[k].name }));
  }
  if (txFilter === 'current') {
    txs = txs.filter(tx => {
      const d = parseDateStr(tx.date);
      return d.getMonth() === currentViewMonth && d.getFullYear() === currentViewYear;
    });
  }
  txs.sort((a, b) => new Date(b.date) - new Date(a.date));

  if (!txs.length) {
    list.innerHTML = '<div class="empty"><i class="fas fa-exchange-alt"></i><h3>Sin movimientos</h3></div>';
    document.getElementById('monthSummary').style.display = 'none';
    return;
  }

  const income  = txs.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const expense = txs.filter(t => t.amount < 0).reduce((s, t) => s + t.amount, 0);
  document.getElementById('monthSummary').style.display = 'grid';
  document.getElementById('monthTotal').textContent   = `$ ${fmt(income + expense)}`;
  document.getElementById('monthIncome').textContent  = `$ ${fmt(income)}`;
  document.getElementById('monthExpense').textContent = `$ ${fmt(expense)}`;
  document.getElementById('monthTotal').className = `sval ${(income+expense) >= 0 ? 'positive':'negative'}`;

  list.innerHTML = txs.map(tx => `
    <div class="vi">
      <div>
        <div class="vi-concept">${tx.concept}</div>
        <div class="vi-meta">${fmtDate(tx.date)} · ${tx.accountName}</div>
      </div>
      <div style="display:flex;align-items:center;gap:8px;">
        <div class="vi-amount ${tx.amount>=0?'positive':'negative'}">${tx.amount>=0?'+':''} $ ${fmt(tx.amount)}</div>
        <div class="vi-actions">
          <button class="btn btn-s btn-sm" onclick="editTx('${tx.accountKey}',${tx.id})"><i class="fas fa-edit"></i></button>
          <button class="btn btn-d btn-sm" onclick="delTx('${tx.accountKey}',${tx.id})"><i class="fas fa-trash"></i></button>
        </div>
      </div>
    </div>`).join('');
}

// ── Cuentas tab ──
function loadAccountsTab() {
  const el = document.getElementById('accountsList');
  let html = '';
  for (const k in accounts) {
    const bal = getAccountBalance(k);
    const cfg = CONFIG.CUENTAS[k];
    const recent = [...accounts[k].transactions].sort((a,b) => new Date(b.date)-new Date(a.date)).slice(0,5);
    html += `
      <div style="margin-bottom:18px;">
        <div class="stitle"><i class="fas ${cfg.icon}" style="color:${cfg.color}"></i> ${cfg.name}
          <span class="acc-bal ${bal>=0?'positive':'negative'}" style="margin-left:auto;">$ ${fmt(bal)}</span>
        </div>
        <div class="vlist">
          ${recent.length ? recent.map(tx => `
            <div class="vi">
              <div><div class="vi-concept">${tx.concept}</div><div class="vi-meta">${fmtDate(tx.date)}</div></div>
              <div class="vi-amount ${tx.amount>=0?'positive':'negative'}">${tx.amount>=0?'+':''} $ ${fmt(tx.amount)}</div>
            </div>`).join('') : '<div class="empty" style="padding:16px"><p>Sin movimientos</p></div>'}
        </div>
      </div>`;
  }
  el.innerHTML = html;
}

// ── Filtros mes ──
document.getElementById('prevMonthBtn').addEventListener('click', () => {
  currentViewMonth--;
  if (currentViewMonth < 0) { currentViewMonth = 11; currentViewYear--; }
  document.getElementById('currentMonthDisplay').textContent = getMonthName(currentViewMonth, currentViewYear);
  loadTransactions();
});
document.getElementById('nextMonthBtn').addEventListener('click', () => {
  currentViewMonth++;
  if (currentViewMonth > 11) { currentViewMonth = 0; currentViewYear++; }
  document.getElementById('currentMonthDisplay').textContent = getMonthName(currentViewMonth, currentViewYear);
  loadTransactions();
});
document.querySelectorAll('.fbtn').forEach(btn => {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.fbtn').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    txFilter = this.dataset.filter;
    loadTransactions();
  });
});
