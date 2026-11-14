# SOS FIRE · Inspección de extintores

App para inspeccionar extintores desde el teléfono y seguir el trabajo en tiempo real desde la computadora. Usa el formato de inspección de la **hoja 2** (Paso 1: describir el extintor · Paso 2: verificar su estado).

## Qué hace

**Técnico (teléfono)**
- **¿Dónde trabajas hoy?**: arriba lo que toca hoy (por ejemplo, Decameron los martes), luego los fijados y los del mes. Un buscador encuentra cualquier proyecto.
- **Nuevo proyecto** desde el teléfono: cliente, lugar y frecuencia. Los extintores se agregan durante el recorrido o se sube el Excel del cliente. Si el nombre se parece a un cliente existente, la app lo avisa para no duplicarlo.
- **Lista por zonas** con búsqueda (número, serie o área) y filtros: Pendientes, Con falla, Por vencer y OK. El botón **✓ OK** marca un extintor en buen estado con un toque.
- **Ficha del extintor**: datos del Paso 1 arriba, **✓ Todo bien · Guardar** y cada punto del Paso 2 con botones grandes (Bueno/Malo, Sí/No). Las fechas de recarga y el PH vienen de la visita anterior. Tiene botón *Se recargó hoy*, observaciones rápidas y **Deshacer**.
- Agregar extintores nuevos, corregir sus datos (si lo sustituyen o lo mueven) o quitarlos de la lista.
- Varios técnicos trabajan en la misma visita al mismo tiempo, y cada uno ve lo que marcan los demás. Sin señal, se guarda en el teléfono y se envía al volver la conexión.
- **Reporte**: avance por zona, recargas por vencer, hallazgos, descarga en Excel y PDF, y *Terminar visita*.

**Administrador (computadora)**
- **Proyectos**:
  - Totales del día.
  - **Fijados**, siempre arriba, con avance en vivo, técnicos con nombre y punto verde si están en línea, fallas y recargas por vencer.
  - **Este mes**, con botón *Fijar*.
  - **Archivo**, con buscador y filtro por mes.
- **Detalle del proyecto**: avance por zona, técnicos en campo, actividad en vivo, hallazgos y vencimientos, historial de visitas con Excel/PDF, datos del proyecto (frecuencia, día, fijado) y *Ver como técnico*.
- **Técnicos**: se registran una sola vez (usuario y contraseña inicial que el técnico cambia al entrar). El acceso se quita con un clic.
- **Reportes guardados**: las visitas terminadas se borran solas después del plazo elegido (2 a 24 meses). Los clientes y sus extintores no se borran.

**Reportes**
- **Excel**: llena la plantilla de la hoja 2 (`assets/plantilla_extintores.xlsx`) con ✓ en la columna correspondiente (Bueno/Malo, Sí/No). Las fallas y las recargas por vencer van en rojo.
- **PDF**: una página de resumen con los hallazgos y las recargas por vencer, y después la tabla completa del Paso 1 y el Paso 2.

## Supuestos (fáciles de cambiar en `src/app.js` → `CRIT`)
- Presión del manómetro: Correcta / Baja / Alta.
- Altura: Correcta / Incorrecta.
- Fechas de recarga como **MM/AAAA**; PH como año (**AAAA**).
- "Por vencer" = la próxima recarga es este mes o el siguiente.

## Estructura

```
src/app.html                   Página y estilos
src/app.js                     Pantallas del técnico y del administrador, Excel y PDF
src/cloud.js                   Conexión con Firebase (colecciones ext_*)
assets/plantilla_extintores.xlsx   Hoja 2 lista para llenar
assets/decameron_salinitas.json    Los 302 extintores de Decameron Salinitas (de la hoja 2)
firestore.rules                Reglas de seguridad (de las DOS apps)
build.mjs                      Une todo en dist/index.html
render.yaml                    Configuración para Render
```

## Puesta en marcha

### 1. Firebase (se usa el mismo proyecto `sos-fire` de la otra app)
Los datos de esta app van en colecciones aparte (`ext_usuarios`, `ext_clientes`, `ext_visitas`, `ext_config`), así que no se mezclan con los de detectores y lámparas.

1. **Reglas:** abra [`firestore.rules`](firestore.rules) y cambie `CORREO_DEL_ADMIN@ejemplo.com` por el correo del administrador (puede poner varios: `['uno@gmail.com', 'otro@gmail.com']`). En Firebase → **Firestore Database → Reglas**, borre todo, pegue el archivo completo y toque **Publicar**. Este archivo ya incluye las reglas de la otra app.
2. **Cuenta del administrador:** debe existir en **Authentication → Usuarios** con ese correo (puede ser una que ya tenga).
3. **Dominio autorizado:** en Authentication → Configuración → **Dominios autorizados**, agregue el dominio que le dé Render (por ejemplo `sos-fire-extintores.onrender.com`).

### 2. Render
1. **New + → Static Site** → elija el repositorio `Sos-fire-extintores`.
2. Build Command: `npm ci && npm run build` · Publish Directory: `dist`.
3. En **Environment**, agregue dos variables:
   - `FIREBASE_CONFIG`: el mismo bloque `const firebaseConfig = { … }` que usó en la otra app.
   - `ADMIN_EMAILS`: el correo del administrador (el mismo que puso en las reglas). Si son varios, sepárelos con coma.
4. **Create Static Site**. En el registro debe salir `Firebase: proyecto "…"` y `Administradores por correo: 1`.

### 3. Primer uso
1. El administrador entra con su correo y contraseña de Firebase.
2. Toca **Cargar Decameron Salinitas** (carga los 302 extintores y lo deja fijado, visita los martes).
3. En **Técnicos**, crea a cada técnico (nombre, usuario y contraseña inicial) y le pasa esos datos.
4. El técnico abre el enlace en el teléfono, lo instala (menú → *Agregar a pantalla principal*), entra, cambia su contraseña y empieza.

## Probar en la computadora

```bash
npm install
FIREBASE_CONFIG='{...}' ADMIN_EMAILS='admin@correo.com' npm run build
npm start      # http://localhost:3000
```
