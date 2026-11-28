# Huellas PetID 
Sistema de Identificación y Seguimiento Médico Digital para Mascotas}

## Descripción del Proyecto
**Huellas PetID** es una solución tecnológica diseñada para clínicas veterinarias que permite digitalizar historiales clínicos, asociar placas de identificación con códigos QR únicos y brindar a los dueños ("Pet Parents") un acceso rápido a los datos vitales de sus mascotas ante emergencias, sin necesidad de instalar aplicaciones.

---

## Estructura Tecnológica
El proyecto está desarrollado bajo una arquitectura web moderna:
- **Frontend:** React (desarrollado con Vite y VS Code) -> Desplegado en **Vercel**.
- **Backend:** Node.js + Express -> Alojado en **Railway**
- **Base de Datos:** MySQL (Diseñado en MySQL Workbench y alojado en **Railway**)
- **Control de Versiones:** Git y GitHub.

---

## Integrantes del Grupo 04 (UTP)
- Castilla Marcos José Junior (Scrum Master / Desarrollador)
- Fernandez Campaña Aldo Patrick (Product Owner / Desarrollador)

---

## Conexión de la aplicación

- Para trabajar en local, copia `backend/.env.example` a `backend/.env` y configura MySQL allí. Deja el archivo de ejemplo sin contraseñas ni claves. También se aceptan `MYSQLHOST`, `MYSQLPORT`, `MYSQLUSER`, `MYSQLPASSWORD` y `MYSQLDATABASE` de Railway. Mantén un `AUTH_SECRET` aleatorio y estable en Railway. Si el backend recibe tráfico por un proxy, ajusta `TRUST_PROXY_HOPS` al número de saltos de confianza para aplicar los límites por cliente.
- Inicia el backend desde `backend` con `npm ci` y `npm start`. El servicio prepara las tablas en la base configurada. `GET /` informa si MySQL responde.
- Usa `frontend` como directorio raíz de Vercel. Define `VITE_API_URL` con la URL HTTPS del servicio de Railway y vuelve a desplegar el frontend después de modificarla. En desarrollo, Vite usa `http://localhost:4000` si falta esa variable.

### Cuentas de clínica

Entra por **Personal Clínico** en el login. Con una cuenta administradora, el menú **Administración → Cuentas de usuario** muestra todas las cuentas, incluidas las de propietarios, y permite filtrarlas por rol o buscarlas por nombre y correo. Recepción tiene un inicio con mascotas, propietarios, recordatorios y alertas GPS de la base configurada.

En la carpeta `backend`, ejecuta `npm run admin`. La terminal indica el nombre de la base y lista los correos de administrador. Si todavía no hay una cuenta administradora, te pide tu nombre, correo y una contraseña de al menos 12 caracteres. La contraseña se introduce sin mostrarla. Luego entra desde **Personal Clínico**.

Si olvidaste la contraseña de una cuenta administradora, usa `npm run admin -- --reset-password` e indica el correo listado. La opción **Olvidé mi contraseña** del sitio también funciona si Resend está configurado. En instalaciones automatizadas se pueden seguir usando `STAFF_ADMIN_NAME`, `STAFF_ADMIN_EMAIL` y `STAFF_ADMIN_PASSWORD`.

Las contraseñas de demostración y las sesiones anteriores quedan invalidadas. Las cuentas guardadas únicamente en el navegador deben registrarse en la aplicación. Un perfil anterior sin cuenta puede vincularse desde el registro al verificar el correo y usar el mismo DNI. Para corregir datos de perfiles existentes, comunícate con la clínica. Los registros de mascotas y los carnets ya almacenados se conservan.

### Operación del dashboard

- Los gráficos consultan MySQL y muestran mascotas registradas, distribución por especie y, para Administrador y Veterinario, consultas atendidas y dosis aplicadas en periodos de 7 días u 8 semanas. Los cortes diarios usan la hora de Perú.
- Los reportes activos aparecen en **Inicio → Mascotas extraviadas** desde que se activa el extravío. Recepción, Veterinario y Administrador ven el reporte aunque todavía no se haya recibido una ubicación GPS.
- En **Vacunas → Registrar lote**, ingresa el nombre de la vacuna, el lote del fabricante, su vencimiento y las dosis recibidas. Al aplicar una dosis, el carnet y las existencias se actualizan en la misma transacción. Las dosis anteriores conservan sus registros y el número de lote consignado originalmente.
- Para cargar una base nueva, crea la primera cuenta administradora, desde **Propietarios → Registrar propietario** guarda los datos de un cliente, registra su mascota y carga los lotes de la clínica. La cuenta del portal se vincula cuando el cliente verifica el mismo correo y DNI en el registro público. El archivo `backend/database.sql` incluye el esquema y el catálogo de razas. Si una instalación anterior importó ejemplos, esas filas siguen en la base correspondiente.

### IA y mensajería

El borrador clínico y las alertas preventivas se consultan desde el panel clínico. El backend también prepara recordatorios de vacunación y ofrece un asistente de emergencia desde la ficha QR. Gemini u OpenAI requieren la clave correspondiente en Railway. Sin proveedor disponible, las funciones usan reglas y plantillas locales.

Configura `CLINIC_PHONE`, `CLINIC_WHATSAPP` y `CLINIC_ADDRESS` con los datos públicos de la clínica. El botón de WhatsApp abre la aplicación para que la persona confirme el envío. Los recordatorios se guardan en MySQL. Para enviarlos por WhatsApp, SMS o correo, configura el proveedor del canal en el backend.

### Base de datos existente y verificación de correo

Al arrancar, el backend aplica la migración sobre la base indicada por `DB_NAME`. Conserva las filas y actualiza las columnas de usuarios, propietarios y carnet de vacunación. Si faltaban columnas de fecha, la migración las agrega y conserva vacías las fechas que el esquema anterior no registró. La migración también agrega las columnas clínicas faltantes de mascotas y consultas. El panel recupera la especie desde el catálogo cuando hay una raza asociada, y muestra los datos que faltan como pendientes de registrar. El usuario MySQL debe poder ejecutar `CREATE` y `ALTER`. Guarda una copia de la base antes de actualizar un entorno con datos reales. Para el renombre de la clave del carnet se requiere MySQL 8 o una versión compatible con `RENAME COLUMN`.

El registro público envía un código de seis dígitos mediante Resend. El código vence a los diez minutos. Tras cinco intentos fallidos, solicita otro. La cuenta y la sesión se crean al confirmar el código. Configura `RESEND_API_KEY` y `EMAIL_FROM` en `backend/.env`. Resend requiere un dominio verificado para enviar a cualquier destinatario. Su remitente de pruebas `onboarding@resend.dev` solo permite probar hacia el correo de tu cuenta de Resend. Conserva un `AUTH_SECRET` estable para que los códigos sigan siendo verificables tras reiniciar el backend. La opción **¿Olvidaste tu contraseña?** utiliza el mismo remitente de Resend. El código de recuperación vence a los diez minutos y, al guardar la nueva contraseña, se invalidan las sesiones anteriores de esa cuenta.

### Configuración de Gemini y WhatsApp

Configura `GEMINI_API_KEY` con una clave propia de Google AI Studio y `GEMINI_MODEL=gemini-3.1-flash-lite` en `backend/.env`. El modelo debe estar habilitado para tu cuenta. El backend consulta Gemini cuando la clave está configurada y usa reglas y plantillas locales si el proveedor falla.

Para Meta WhatsApp Cloud API, configura `WHATSAPP_CLOUD_TOKEN` y `WHATSAPP_PHONE_NUMBER_ID`. En la consola de Meta agrega el destinatario de pruebas con el prefijo de país y verifica el número. Si estableces `WHATSAPP_TEST_TO` con ese mismo número, el backend limitará los envíos de WhatsApp a los registros que ya tengan ese destinatario. Registra la cuenta de prueba con ese teléfono.

Para mensajes automáticos fuera de la ventana de atención de 24 horas, configura una plantilla de Meta aprobada en `WHATSAPP_TEMPLATE_NAME` y su código exacto de idioma en `WHATSAPP_TEMPLATE_LANGUAGE`. La integración usa una variable posicional de texto en el cuerpo de la plantilla. El contenido y el uso deben ajustarse a la plantilla aprobada. Cuando la plantilla queda vacía, el envío usa texto dentro de la ventana activa de WhatsApp.
