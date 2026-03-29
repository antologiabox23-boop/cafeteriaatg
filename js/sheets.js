// ══════════════════════════════════════════════
// SHEETS — Sincronización con Google Sheets
// ══════════════════════════════════════════════

function guardarUrlSheets() {
  const url = document.getElementById('sheetsUrl').value.trim();
  if (!url) { notify('Ingresa la URL del Web App', 'danger'); return; }
  saveSheetsUrl(url);
  notify('✅ URL guardada', 'success');
}

async function probarConexion() {
  const url = loadSheetsUrl();
  if (!url) { notify('Primero guarda la URL de tu Web App', 'danger'); return; }
  const statusEl = document.getElementById('syncStatus');
  statusEl.innerHTML = '<span class="sync-dot pending"></span> Probando conexión...';
  try {
    const res = await fetch(`${url}?action=ping`);
    const data = await res.json();
    if (data.status === 'ok') {
      statusEl.innerHTML = '<span class="sync-dot ok"></span> Conexión exitosa con Google Sheets';
      notify('✅ Conectado a Google Sheets', 'success');
    } else {
      throw new Error(data.message || 'Respuesta inesperada');
    }
  } catch(e) {
    statusEl.innerHTML = `<span class="sync-dot err"></span> Error: ${e.message}`;
    notify('❌ No se pudo conectar', 'danger');
  }
}

async function sincronizarTodo(direccion) {
  const url = loadSheetsUrl();
  if (!url) { notify('Configura la URL de Sheets primero', 'danger'); return; }
  const logEl = document.getElementById('syncLog');
  logEl.innerHTML = `⏳ ${direccion === 'subir' ? 'Subiendo' : 'Descargando'} datos...`;

  try {
    if (direccion === 'subir') {
      const payload = exportAllData();
      const res = await fetch(url, {
        method: 'POST',
        body: JSON.stringify({ action: 'syncAll', data: payload }),
        headers: { 'Content-Type': 'text/plain' }, // evitar preflight CORS
      });
      const result = await res.json();
      if (result.status === 'ok') {
        logEl.innerHTML = `✅ Datos subidos a Sheets — ${new Date().toLocaleTimeString('es-CO')}`;
        notify('✅ Sincronizado con Google Sheets', 'success');
      } else throw new Error(result.message);
    } else {
      const res = await fetch(`${url}?action=getAll`);
      const result = await res.json();
      if (result.status === 'ok' && result.data) {
        importAllData(result.data);
        reloadAll();
        logEl.innerHTML = `✅ Datos descargados — ${new Date().toLocaleTimeString('es-CO')}`;
        notify('✅ Datos actualizados desde Sheets', 'success');
      } else throw new Error(result.message || 'Sin datos');
    }
  } catch(e) {
    logEl.innerHTML = `❌ Error: ${e.message}`;
    notify('❌ Error al sincronizar', 'danger');
  }
}

// Sincronización automática de un módulo específico
async function syncModulo(modulo, datos) {
  const url = loadSheetsUrl();
  if (!url) return; // silencioso si no hay URL
  try {
    await fetch(url, {
      method: 'POST',
      body: JSON.stringify({ action: 'syncModulo', modulo, datos }),
      headers: { 'Content-Type': 'text/plain' },
    });
  } catch(e) {
    console.warn('Sync silencioso falló:', e.message);
  }
}
