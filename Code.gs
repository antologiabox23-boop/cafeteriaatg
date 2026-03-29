// ══════════════════════════════════════════════════════════════════
//  ANTOLOGÍA BOX 23 — Apps Script para Google Sheets
//  Archivo: apps-script/Code.gs
//
//  INSTRUCCIONES DE INSTALACIÓN:
//  1. Ve a https://script.google.com y crea un nuevo proyecto
//  2. Copia y pega todo este código en el editor
//  3. Cambia el valor de SPREADSHEET_ID por el ID de tu hoja
//  4. Ve a "Implementar" → "Nueva implementación"
//  5. Tipo: "Aplicación web"
//     - Ejecutar como: Tu cuenta
//     - Quién tiene acceso: "Cualquier persona"
//  6. Copia la URL generada y pégala en la pestaña "Sincronizar" de la app
// ══════════════════════════════════════════════════════════════════

// ── CONFIGURACIÓN ──────────────────────────────────────────────────
const SPREADSHEET_ID = 'TU_SPREADSHEET_ID_AQUI'; // ← Cambia esto
// Si dejas vacío, el script usará la hoja activa del proyecto

const SHEETS = {
  TRANSACCIONES: 'Transacciones',
  PRODUCTOS:     'Productos',
  GASTOS:        'Gastos',
  CREDITOS:      'Créditos',
  PENDIENTES:    'Pendientes',
  INVENTARIO:    'Inventario',
  FACTURAS:      'Facturas',
  FAC_ITEMS:     'Factura_Items',
  LOG:           'Log_Sync',
};

// ── ENTRY POINT ────────────────────────────────────────────────────
function doGet(e) {
  const action = e.parameter.action || '';
  let result;
  try {
    switch (action) {
      case 'ping':    result = { status: 'ok', message: 'Conectado a Google Sheets', ts: new Date().toISOString() }; break;
      case 'getAll':  result = getAllData(); break;
      default:        result = { status: 'error', message: 'Acción no reconocida: ' + action };
    }
  } catch(err) {
    result = { status: 'error', message: err.message };
  }
  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  let result;
  try {
    const body   = JSON.parse(e.postData.contents);
    const action = body.action || '';
    switch (action) {
      case 'syncAll':    result = syncAllData(body.data);     break;
      case 'syncModulo': result = syncModulo(body.modulo, body.datos); break;
      default:           result = { status: 'error', message: 'Acción no reconocida: ' + action };
    }
  } catch(err) {
    result = { status: 'error', message: err.message };
  }
  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── OBTENER SPREADSHEET ────────────────────────────────────────────
function getSpreadsheet() {
  return SPREADSHEET_ID !== 'TU_SPREADSHEET_ID_AQUI' && SPREADSHEET_ID
    ? SpreadsheetApp.openById(SPREADSHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet();
}

function getOrCreateSheet(name) {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

// ── SINCRONIZACIÓN COMPLETA ────────────────────────────────────────
function syncAllData(data) {
  if (!data) return { status: 'error', message: 'No se recibieron datos' };
  syncTransacciones(data.accounts);
  syncProductos(data.products);
  syncGastos(data.gastos);
  syncCreditos(data.creditos);
  syncPendientes(data.pendientes);
  syncInventario(data.inventario);
  syncFacturas(data.facturas);
  logSync('syncAll', 'Sincronización completa');
  return { status: 'ok', message: 'Todos los módulos sincronizados', ts: new Date().toISOString() };
}

function syncModulo(modulo, datos) {
  switch (modulo) {
    case 'accounts':   syncTransacciones(datos); break;
    case 'products':   syncProductos(datos); break;
    case 'gastos':     syncGastos(datos); break;
    case 'creditos':   syncCreditos(datos); break;
    case 'pendientes': syncPendientes(datos); break;
    case 'inventario': syncInventario(datos); break;
    case 'facturas':   syncFacturas(datos); break;
  }
  logSync('syncModulo:' + modulo, 'OK');
  return { status: 'ok', modulo, ts: new Date().toISOString() };
}

// ── MÓDULO: TRANSACCIONES ──────────────────────────────────────────
function syncTransacciones(accounts) {
  if (!accounts) return;
  const sheet = getOrCreateSheet(SHEETS.TRANSACCIONES);
  const headers = ['ID', 'Fecha', 'Cuenta', 'Concepto', 'Monto', 'Tipo', 'Es Venta', 'Actualizado'];
  sheet.clearContents();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold').setBackground('#00897b').setFontColor('white');

  const rows = [];
  for (const k in accounts) {
    (accounts[k].transactions || []).forEach(tx => {
      rows.push([
        tx.id, tx.date, accounts[k].name, tx.concept,
        tx.amount, tx.amount >= 0 ? 'Ingreso' : 'Egreso',
        tx.esventa ? 'Sí' : 'No', new Date().toISOString()
      ]);
    });
  }
  if (rows.length) {
    rows.sort((a, b) => new Date(b[1]) - new Date(a[1]));
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }
  formatSheet(sheet, headers.length);
}

// ── MÓDULO: PRODUCTOS ──────────────────────────────────────────────
function syncProductos(products) {
  if (!products) return;
  const sheet = getOrCreateSheet(SHEETS.PRODUCTOS);
  const headers = ['ID', 'Emoji', 'Nombre', 'Precio', 'Actualizado'];
  sheet.clearContents();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold').setBackground('#00897b').setFontColor('white');
  const rows = products.map(p => [p.id, p.emoji || '', p.nombre, p.precio, new Date().toISOString()]);
  if (rows.length) sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  formatSheet(sheet, headers.length);
}

// ── MÓDULO: GASTOS ─────────────────────────────────────────────────
function syncGastos(gastos) {
  if (!gastos) return;
  const sheet = getOrCreateSheet(SHEETS.GASTOS);
  const headers = ['ID', 'Fecha', 'Concepto', 'Categoría', 'Monto', 'Cuenta', 'Actualizado'];
  sheet.clearContents();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold').setBackground('#c62828').setFontColor('white');
  const rows = gastos.map(g => [g.id, g.fecha, g.concepto, g.categoria, g.monto, g.cuenta || '', new Date().toISOString()]);
  if (rows.length) {
    rows.sort((a, b) => new Date(b[1]) - new Date(a[1]));
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }
  formatSheet(sheet, headers.length);
}

// ── MÓDULO: CRÉDITOS ───────────────────────────────────────────────
function syncCreditos(creditos) {
  if (!creditos) return;
  const sheet = getOrCreateSheet(SHEETS.CREDITOS);
  const headers = ['ID', 'Cliente', 'Fecha', 'Monto Original', 'Total Abonado', 'Deuda Restante', 'Descripción', 'Actualizado'];
  sheet.clearContents();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold').setBackground('#7c3aed').setFontColor('white');
  const rows = creditos.map(c => {
    const abonado = (c.abonos || []).reduce((s, a) => s + a.monto, 0);
    return [c.id, c.cliente, c.fecha, c.monto, abonado, c.monto - abonado, c.desc || '', new Date().toISOString()];
  });
  if (rows.length) sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  formatSheet(sheet, headers.length);
}

// ── MÓDULO: PENDIENTES ─────────────────────────────────────────────
function syncPendientes(pendientes) {
  if (!pendientes) return;
  const sheet = getOrCreateSheet(SHEETS.PENDIENTES);
  const headers = ['ID', 'Cliente', 'Items', 'Total', 'Guardado'];
  sheet.clearContents();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold').setBackground('#e65100').setFontColor('white');
  const rows = pendientes.map(p => [
    p.id, p.cliente || '', p.items.map(x => `${x.nombre} x${x.qty}`).join(', '), p.total, p.savedAt
  ]);
  if (rows.length) sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  formatSheet(sheet, headers.length);
}

// ── MÓDULO: INVENTARIO ─────────────────────────────────────────────
function syncInventario(inventario) {
  if (!inventario) return;
  const sheet = getOrCreateSheet(SHEETS.INVENTARIO);
  const headers = ['ID', 'Nombre', 'Código', 'Categoría', 'Unidad', 'Stock', 'Stock Mín.', 'Costo', 'Precio Venta', 'Margen %', 'Proveedor', 'Actualizado'];
  sheet.clearContents();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold').setBackground('#0284c7').setFontColor('white');
  const rows = inventario.map(item => {
    const margen = item.costo && item.precioVenta
      ? Math.round(((item.precioVenta - item.costo) / item.precioVenta) * 100)
      : 0;
    return [item.id, item.nombre, item.codigo || '', item.categoria, item.unidad,
            item.stock, item.stockMin || 5, item.costo || 0, item.precioVenta || 0,
            margen, item.proveedor || '', item.updatedAt || ''];
  });
  if (rows.length) sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  // Resaltar stock bajo
  if (rows.length) {
    const stockCol = sheet.getRange(2, 6, rows.length, 1);
    const minCol   = sheet.getRange(2, 7, rows.length, 1).getValues();
    const stockVals= stockCol.getValues();
    stockVals.forEach((row, i) => {
      if (row[0] <= minCol[i][0]) {
        sheet.getRange(i + 2, 1, 1, headers.length).setBackground('#fff3e0');
      }
      if (row[0] <= 0) {
        sheet.getRange(i + 2, 1, 1, headers.length).setBackground('#ffebee');
      }
    });
  }
  formatSheet(sheet, headers.length);
}

// ── MÓDULO: FACTURAS ───────────────────────────────────────────────
function syncFacturas(facturas) {
  if (!facturas) return;
  // Hoja principal de facturas
  const sheet = getOrCreateSheet(SHEETS.FACTURAS);
  const headers = ['ID', 'Fecha', 'Proveedor', 'N° Factura', 'Cuenta', 'Subtotal', 'Descuento', 'IVA %', 'Total', 'Observaciones', 'Creado'];
  sheet.clearContents();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold').setBackground('#26a69a').setFontColor('white');
  const rows = facturas.map(f => [
    f.id, f.fecha, f.proveedor, f.numero || '', f.cuenta,
    f.subtotal || 0, f.descuento || 0, f.iva || 0, f.total || 0,
    f.observaciones || '', f.createdAt || ''
  ]);
  if (rows.length) {
    rows.sort((a, b) => new Date(b[1]) - new Date(a[1]));
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }
  formatSheet(sheet, headers.length);

  // Hoja de ítems de facturas (detalle)
  const sheetItems = getOrCreateSheet(SHEETS.FAC_ITEMS);
  const headersItems = ['Factura ID', 'Proveedor', 'Fecha', 'Artículo', 'Cantidad', 'Precio Unit.', 'Subtotal Ítem'];
  sheetItems.clearContents();
  sheetItems.getRange(1, 1, 1, headersItems.length).setValues([headersItems]).setFontWeight('bold').setBackground('#26a69a').setFontColor('white');
  const itemRows = [];
  facturas.forEach(f => {
    (f.items || []).forEach(it => {
      itemRows.push([f.id, f.proveedor, f.fecha, it.descripcion, it.cantidad, it.precio, it.cantidad * it.precio]);
    });
  });
  if (itemRows.length) sheetItems.getRange(2, 1, itemRows.length, headersItems.length).setValues(itemRows);
  formatSheet(sheetItems, headersItems.length);
}

// ── OBTENER TODOS LOS DATOS ────────────────────────────────────────
function getAllData() {
  const ss = getSpreadsheet();
  const result = { status: 'ok', data: {} };
  try { result.data.accounts   = readTransacciones(ss); } catch(e) { result.data.accounts = null; }
  try { result.data.products   = readSheet(ss, SHEETS.PRODUCTOS,   readProductos);   } catch(e) {}
  try { result.data.gastos     = readSheet(ss, SHEETS.GASTOS,     readGastos);     } catch(e) {}
  try { result.data.creditos   = readSheet(ss, SHEETS.CREDITOS,   readCreditos);   } catch(e) {}
  try { result.data.pendientes = readSheet(ss, SHEETS.PENDIENTES, readPendientes); } catch(e) {}
  try { result.data.inventario = readSheet(ss, SHEETS.INVENTARIO, readInventario); } catch(e) {}
  try { result.data.facturas   = readSheet(ss, SHEETS.FACTURAS,   readFacturas);   } catch(e) {}
  return result;
}

function readSheet(ss, name, parser) {
  const sheet = ss.getSheetByName(name);
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  return data.slice(1).filter(r => r[0]).map(parser);
}

function readTransacciones(ss) {
  const sheet = ss.getSheetByName(SHEETS.TRANSACCIONES);
  if (!sheet) return null;
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return null;
  const accounts = {
    efectivo:    { name:'Efectivo',    transactions:[] },
    nequi:       { name:'Nequi',       transactions:[] },
    bancolombia: { name:'Bancolombia', transactions:[] },
    daviplata:   { name:'Daviplata',   transactions:[] },
  };
  const keyMap = { 'Efectivo':'efectivo', 'Nequi':'nequi', 'Bancolombia':'bancolombia', 'Daviplata':'daviplata' };
  data.slice(1).forEach(r => {
    const k = keyMap[r[2]];
    if (k && accounts[k]) {
      accounts[k].transactions.push({
        id: r[0], date: r[1], concept: r[3], amount: r[4],
        type: r[5] === 'Ingreso' ? 'ingreso' : 'egreso', esventa: r[6] === 'Sí'
      });
    }
  });
  return accounts;
}

function readProductos(r)   { return { id:r[0], emoji:r[1], nombre:r[2], precio:r[3] }; }
function readGastos(r)      { return { id:r[0], fecha:r[1], concepto:r[2], categoria:r[3], monto:r[4], cuenta:r[5] }; }
function readCreditos(r)    { return { id:r[0], cliente:r[1], fecha:r[2], monto:r[3], desc:r[6], abonos:[] }; }
function readPendientes(r)  { return { id:r[0], cliente:r[1], items:[], total:r[3], savedAt:r[4] }; }
function readInventario(r)  { return { id:r[0], nombre:r[1], codigo:r[2], categoria:r[3], unidad:r[4], stock:r[5], stockMin:r[6], costo:r[7], precioVenta:r[8], proveedor:r[10] }; }
function readFacturas(r)    { return { id:r[0], fecha:r[1], proveedor:r[2], numero:r[3], cuenta:r[4], subtotal:r[5], descuento:r[6], iva:r[7], total:r[8], observaciones:r[9], items:[] }; }

// ── UTILIDADES ─────────────────────────────────────────────────────
function formatSheet(sheet, numCols) {
  try {
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, numCols);
  } catch(e) {}
}

function logSync(action, message) {
  try {
    const sheet = getOrCreateSheet(SHEETS.LOG);
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, 3).setValues([['Fecha', 'Acción', 'Resultado']]).setFontWeight('bold');
    }
    sheet.appendRow([new Date().toISOString(), action, message]);
    // Mantener máximo 500 registros
    if (sheet.getLastRow() > 501) sheet.deleteRow(2);
  } catch(e) {}
}

// ── FUNCIÓN DE PRUEBA (ejecutar manualmente) ───────────────────────
function testSetup() {
  const ss = getSpreadsheet();
  Logger.log('Spreadsheet conectado: ' + ss.getName());
  // Crear todas las hojas si no existen
  Object.values(SHEETS).forEach(name => getOrCreateSheet(name));
  Logger.log('✅ Todas las hojas creadas correctamente');
}
