// ══════════════════════════════════════════════
// UTILS — Funciones auxiliares
// ══════════════════════════════════════════════

function fmt(n) { return Math.abs(n).toLocaleString('es-CO'); }

function parseDateStr(ds) {
  if (!ds) return new Date();
  if (ds instanceof Date) return ds;
  if (/^\d{4}-\d{2}-\d{2}$/.test(ds)) {
    const p = ds.split('-');
    return new Date(p[0], p[1]-1, p[2]);
  }
  const d = new Date(ds);
  return isNaN(d.getTime()) ? new Date() : d;
}

function fmtDateInput(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function fmtDate(ds) {
  if (!ds) return '';
  const d = parseDateStr(ds);
  if (isNaN(d.getTime())) return ds;
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
}

function setTodayDate() {
  const today = fmtDateInput(new Date());
  ['date','gastoFecha','creditoFecha','facFecha'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = today;
  });
}

function notify(msg, type='info', dur=3000) {
  document.querySelectorAll('.notif').forEach(n => n.remove());
  const n = document.createElement('div');
  n.className = 'notif';
  const c = { success:'#2e7d32', warning:'var(--warn)', danger:'#c62828', warn:'#e65100', info:'var(--cr)' };
  n.style.background = c[type] || c.info;
  n.textContent = msg;
  document.body.appendChild(n);
  setTimeout(() => n.remove(), dur);
}

function genId() {
  return Date.now() + Math.floor(Math.random() * 1000);
}

function getMonthName(m, y) {
  const names = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  return `${names[m]} ${y}`;
}
