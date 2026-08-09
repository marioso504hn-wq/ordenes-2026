# MecaPro - Sistema de Órdenes de Trabajo & Punto de Venta con InstantDB

Aplicación web completa para la gestión de órdenes de cliente con reloj de tiempo de espera en tiempo real, inventario de contrapiezas y punto de venta con carrito, facturación y ticket imprimible. Integrada de forma nativa con **InstantDB** para base de datos y autenticación en tiempo real.

---

## 🚀 Características Principales

1. **Órdenes de Trabajo (OT) en Tiempo Real**:
   - Ingreso de órdenes con datos de cliente, número de OT, nombre de item, cantidad, referencia, tipo de contrapieza e ingeniero a cargo.
   - **Reloj / Temporizador en tiempo real** que muestra el tiempo transcurrido en espera con alertas visuales por colores.
   - Edición y eliminación de registros sincronizado en tiempo real.

2. **Consulta de Stock e Inventario**:
   - Inventario de productos, contrapiezas y repuestos.
   - Alerta automática de **Stock Bajo** cuando la cantidad cae bajo el mínimo requerido.
   - Ajuste rápido de stock y edición de productos.

3. **Punto de Venta (POS) & Facturación**:
   - Selección rápida de productos desde el stock.
   - Carrito de compras reactivo con desglose de Subtotal e IVA (19%).
   - Selección de cliente y medio de pago (Efectivo, Tarjeta, Transferencia).
   - Deducción automática de stock en InstantDB al procesar la venta.
   - **Ticket / Factura Imprimible** con formato térmico (80mm) optimizado para impresión directa.

4. **Historial de Ventas & Clientes**:
   - Consulta de comprobantes emitidos y total facturado.
   - Reimpresión de tickets en cualquier momento.
   - Directorio completo de clientes con RUT/NIT/DNI y datos de contacto.

5. **InstantDB Realtime Database & Auth**:
   - `instant.schema.ts` e `instant.perms.ts` incluidos.
   - Sincronización en tiempo real usando `db.useQuery` y `db.transact`.
   - Autenticación segura mediante InstantDB Auth con Magic Code por correo electrónico.

---

## 🛠️ Tecnologías Utilizadas

- **React 19**
- **TypeScript 5**
- **Vite 6**
- **Tailwind CSS 4**
- **InstantDB** (`@instantdb/react`)
- **Lucide React** (Iconografía)

---

## 📦 Instalación y Desarrollo Local

1. **Clonar el repositorio:**
   ```bash
   git clone <URL_DE_TU_REPOSITTORIO>
   cd <NOMBRE_DEL_PROYECTO>
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno:**
   Crea un archivo `.env` o `.env.local` basado en `.env.example`:
   ```env
   VITE_INSTANT_APP_ID=tu_instant_app_id
   ```

4. **Iniciar servidor de desarrollo:**
   ```bash
   npm run dev
   ```

---

## 🌐 Despliegue en Vercel

1. Sube tu proyecto a un repositorio de **GitHub**.
2. Ingresa a [Vercel](https://vercel.com) e importa tu repositorio.
3. En la sección **Environment Variables**, agrega:
   - `VITE_INSTANT_APP_ID`: Tu App ID público de InstantDB.
4. Presiona **Deploy**. El archivo `vercel.json` ya está configurado para manejar el enrutamiento SPA.
