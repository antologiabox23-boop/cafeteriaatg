# Antología Box 23 — App de Caja y Gestión
> Versión 2.0 · Arquitectura modular · Google Sheets como base de datos

## 📁 Estructura del proyecto

```
antologia-box23/
├── index.html              ← App principal (página única)
├── css/
│   └── main.css            ← Estilos globales
├── js/
│   ├── config.js           ← Constantes y configuración
│   ├── utils.js            ← Funciones auxiliares
│   ├── storage.js          ← Persistencia en localStorage
│   ├── sheets.js           ← Sincronización con Google Sheets
│   ├── accounts.js         ← Cuentas y transacciones
│   ├── productos.js        ← Catálogo de venta rápida
│   ├── ventas.js           ← Cobros, pendientes, cierre caja
│   ├── gastos.js           ← Gastos operativos
│   ├── creditos.js         ← Clientes con crédito
│   ├── inventario.js       ← Control de stock
│   ├── facturas.js         ← Facturas de compra a proveedores
│   ├── ui.js               ← Navegación y helpers de UI
│   └── app.js              ← Inicialización principal
└── apps-script/
    └── Code.gs             ← Backend en Google Apps Script
```

---

## 🚀 Cómo usar en GitHub Pages

1. **Sube el proyecto a GitHub**
   ```bash
   git init
   git add .
   git commit -m "Antología Box 23 v2.0"
   git remote add origin https://github.com/TU_USUARIO/antologia-box23.git
   git push -u origin main
   ```

2. **Activa GitHub Pages**
   - Ve a Settings → Pages
   - Fuente: `main` / `root`
   - URL: `https://TU_USUARIO.github.io/antologia-box23/`

---

## ☁️ Conectar con Google Sheets

### Paso 1 — Crear la hoja de cálculo

1. Ve a [Google Sheets](https://sheets.google.com) y crea una nueva hoja
2. Copia el **ID** de la URL: `https://docs.google.com/spreadsheets/d/**ID_AQUI**/edit`

### Paso 2 — Publicar el Apps Script

1. Ve a [Apps Script](https://script.google.com) → **Nuevo proyecto**
2. Copia todo el contenido de `apps-script/Code.gs`
3. Reemplaza `TU_SPREADSHEET_ID_AQUI` con el ID de tu hoja
4. Guarda el proyecto (Ctrl+S)
5. Ejecuta `testSetup()` manualmente para crear las hojas
6. **Implementar** → **Nueva implementación**:
   - Tipo: **Aplicación web**
   - Ejecutar como: *Tu cuenta*
   - Quién tiene acceso: **Cualquier persona**
7. Copia la **URL** generada (termina en `/exec`)

### Paso 3 — Conectar en la app

1. Abre la app → pestaña **Sincronizar**
2. Pega la URL en el campo "URL del Web App"
3. Clic en **Guardar URL** y luego **Probar Conexión**
4. Usa **Subir a Sheets** para sincronizar todos tus datos

---

## 📋 Hojas creadas en Google Sheets

| Hoja              | Contenido                          |
|-------------------|------------------------------------|
| `Transacciones`   | Todos los movimientos de cuentas   |
| `Productos`       | Catálogo de productos de venta     |
| `Gastos`          | Gastos operativos registrados      |
| `Créditos`        | Clientes con saldo pendiente       |
| `Pendientes`      | Pedidos pendientes de cobro        |
| `Inventario`      | Stock de artículos                 |
| `Facturas`        | Facturas de compra a proveedores   |
| `Factura_Items`   | Detalle de ítems por factura       |
| `Log_Sync`        | Historial de sincronizaciones      |

---

## 📱 Módulos de la app

| Módulo        | Descripción                                       |
|---------------|---------------------------------------------------|
| **Caja**      | Venta rápida, cobros, registro manual, cierre día |
| **Pendientes**| Pedidos guardados sin cobrar                      |
| **Créditos**  | Clientes con deuda, registro de abonos            |
| **Gastos**    | Gastos del día con categorías                     |
| **Inventario**| Stock, alertas de nivel bajo, ajuste rápido       |
| **Facturas**  | Ingreso de facturas de compra con múltiples ítems |
| **Resumen**   | Saldos por cuenta (Nequi, Bancolombia, etc.)      |
| **Movimientos**| Historial filtrable por mes                      |
| **Productos** | Gestión del catálogo de venta                     |
| **Cuentas**   | Detalle de movimientos por cuenta bancaria        |
| **Sincronizar**| Conexión y sync con Google Sheets                |

---

## 💡 Flujo de facturas de compra

1. Ve a **Facturas** → **Nueva Factura**
2. Ingresa: proveedor, número, fecha, método de pago
3. Agrega los artículos con cantidad y precio unitario
4. El sistema calcula subtotal, descuento e IVA automáticamente
5. Al guardar:
   - Se registra el egreso en la cuenta seleccionada
   - Si el artículo coincide con un ítem del **Inventario**, el stock se actualiza automáticamente

---

## 🔄 Sincronización en tiempo real

La app usa `localStorage` para funcionar offline. Cada vez que guardas un dato, se intenta una sincronización silenciosa con Google Sheets si hay URL configurada.

También puedes sincronizar manualmente desde la pestaña **Sincronizar**.

---

## 🛠 Requisitos técnicos

- Navegador moderno (Chrome, Firefox, Safari)
- Sin dependencias externas de npm/build
- Funciona offline (los datos viven en localStorage)
- Google Account para el backend de Sheets (opcional pero recomendado)
