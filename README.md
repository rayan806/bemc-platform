# B.E.M.C. Platform

Plataforma web para gestión de **Seguridad y Salud en el Trabajo (SST)**, clientes, empresas, servicios, pagos y panel administrativo.

## Estado actual

- Producción activa en Render.
- Frontend y backend funcionando.
- API de salud: `/api/health`.

## Stack

- **Frontend:** React 18 + Vite + Bootstrap 5
- **Backend:** Node.js + Express + MongoDB (Mongoose)
- **Auth:** JWT + registro email (Facebook OAuth preparado)

## Requisitos

- Node.js 18+
- MongoDB en ejecución (`mongodb://127.0.0.1:27017`)

## Instalación

```bash
cd C:\Users\mateu\Projects\bemc-platform
npm run install:all
```

Copia el archivo de entorno del servidor:

```bash
copy server\.env.example server\.env
```

Edita `server/.env` si necesitas cambiar `MONGODB_URI` o `JWT_SECRET`.

## Desarrollo

En una terminal (desde la raíz del proyecto):

```bash
npm run dev
```

- **Frontend:** http://localhost:5173  
- **API:** http://localhost:5000  

## Usuario administrador por defecto

Al iniciar el servidor por primera vez se crea:

| Campo | Valor |
|-------|--------|
| Email | `admin@bemc.com` |
| Contraseña | `Admin123!` |

Cámbiala después del primer acceso. Puedes personalizar con `ADMIN_EMAIL` y `ADMIN_PASSWORD` en `.env`.

## Estructura

```
bemc-platform/
├── client/          # React (portal público, cliente, admin)
├── server/          # API Express
│   └── src/
│       ├── models/
│       ├── routes/
│       └── seed/    # Servicios SST y admin inicial
└── package.json
```

## Mapa del código (que hace cada parte)

### Frontend (`client/src`)

- `main.jsx`: punto de entrada de React, carga estilos globales y monta router + contexto de autenticación.
- `App.jsx`: define todas las rutas de la app (publicas, portal cliente y admin).
- `api/client.js`: cliente Axios con token JWT automatico y manejo global de `401`.
- `context/AuthContext.jsx`: estado de sesion, login/logout y datos del usuario autenticado.
- `components/`:
	- `PublicLayout.jsx`: layout de paginas publicas.
	- `ClientLayout.jsx`: layout de portal de clientes.
	- `AdminLayout.jsx`: layout del panel administrativo.
	- `ProtectedRoute.jsx`: protege rutas privadas y controla acceso por rol.
	- `components/auth/*`: componentes reutilizables para login/registro/recuperacion.
- `pages/`:
	- Publicas: `HomePage`, `ServicesPage`, `ServiceDetailPage`.
	- Auth: `LoginPage`, `RegisterPage`, `ForgotPasswordPage`, `ResetPasswordPage`, `AuthCallbackPage`.
	- Portal cliente: `portal/*`.
	- Admin: `admin/*`.
- `utils/servicePresentation.js`: normaliza nombres, iconos y metadatos visuales de servicios.

### Backend (`server/src`)

- `index.js`: arranca Express, conecta DB, registra middlewares, rutas API y servido del frontend (`client/dist`).
- `config/db.js`: conexion MongoDB Atlas/local y fallback en memoria en desarrollo.
- `middleware/`:
	- `auth.js`: valida JWT y roles (`authenticate`, `isStaff`, etc.).
	- `errorHandler.js`: control centralizado de errores y 404.
- `models/` (Mongoose):
	- `User`, `Company`, `Service`, `ServiceRequest`, `Payment`, `Document`, `AuditLog`.
- `routes/`:
	- `auth.routes.js`: registro, login, perfil y OAuth.
	- `services.routes.js`: CRUD/consulta de servicios SST.
	- `requests.routes.js`: solicitudes del cliente y gestion staff.
	- `payments.routes.js`: pagos y confirmaciones.
	- `admin.routes.js`: metricas y operaciones administrativas.
- `services/oauth.service.js`: flujo OAuth (Google/Facebook).
- `seed/seedServices.js`: precarga servicios SST.
- `seed/seedAdmin.js`: crea admin inicial si no existe.
- `utils/jwt.js`: firma y validacion de tokens.
- `utils/audit.js`: bitacora de acciones relevantes.

## Referencia completa por archivo

### Frontend (client/src)

| Archivo | Responsabilidad |
|---------|------------------|
| `client/src/main.jsx` | Punto de entrada del frontend; monta React con `BrowserRouter`, `AuthProvider` y estilos globales. |
| `client/src/App.jsx` | Router principal; define rutas públicas, auth, portal cliente y admin con protección por rol. |
| `client/src/api/client.js` | Cliente HTTP (Axios) con token JWT automático y manejo global de errores `401`. |
| `client/src/context/AuthContext.jsx` | Estado global de autenticación: login, register, logout, OAuth y persistencia en localStorage. |
| `client/src/components/PublicLayout.jsx` | Layout base para páginas públicas con navegación superior. |
| `client/src/components/ClientLayout.jsx` | Layout del portal cliente con navegación interna. |
| `client/src/components/AdminLayout.jsx` | Layout administrativo con menú lateral y navegación por módulos. |
| `client/src/components/ProtectedRoute.jsx` | Componente de guardia para restringir acceso por autenticación y rol (`staffOnly`). |
| `client/src/components/auth/AuthLayout.jsx` | Layout visual compartido para páginas de autenticación. |
| `client/src/components/auth/AuthGlassCard.jsx` | Contenedor visual reutilizable para formularios de auth. |
| `client/src/components/auth/PasswordInput.jsx` | Campo de contraseña con visibilidad toggle (mostrar/ocultar). |
| `client/src/components/auth/SocialAuthButtons.jsx` | Botones de login social (Google/Facebook) para flujo OAuth. |
| `client/src/pages/HomePage.jsx` | Página principal pública con presentación de servicios y CTA. |
| `client/src/pages/ServicesPage.jsx` | Catálogo de servicios SST con filtros y navegación a detalle. |
| `client/src/pages/ServiceDetailPage.jsx` | Detalle de un servicio y formulario para crear solicitud. |
| `client/src/pages/LoginPage.jsx` | Formulario de inicio de sesión (local + opciones OAuth). |
| `client/src/pages/RegisterPage.jsx` | Registro de usuario persona/empresa con validaciones de formulario. |
| `client/src/pages/ForgotPasswordPage.jsx` | Flujo para solicitar recuperación de contraseña. |
| `client/src/pages/ResetPasswordPage.jsx` | Restablecimiento de contraseña usando token temporal. |
| `client/src/pages/AuthCallbackPage.jsx` | Manejo del callback OAuth y almacenamiento de sesión. |
| `client/src/pages/portal/PortalHome.jsx` | Dashboard inicial del cliente autenticado. |
| `client/src/pages/portal/PortalServices.jsx` | Vista de servicios dentro del portal cliente. |
| `client/src/pages/portal/PortalRequests.jsx` | Historial de solicitudes del cliente con estados y detalle. |
| `client/src/pages/admin/AdminDashboard.jsx` | Métricas administrativas y resumen operativo. |
| `client/src/pages/admin/AdminRequests.jsx` | Gestión de solicitudes (filtros, actualización de estado, notas). |
| `client/src/pages/admin/AdminClients.jsx` | Administración/listado de clientes registrados. |
| `client/src/pages/admin/AdminCompanies.jsx` | Administración/listado de empresas registradas. |
| `client/src/pages/admin/AdminPayments.jsx` | Gestión y confirmación manual de pagos. |
| `client/src/pages/admin/AdminServices.jsx` | Gestión/listado administrativo de servicios. |
| `client/src/utils/servicePresentation.js` | Normalización de categorías, etiquetas e iconografía de servicios. |
| `client/src/styles/index.css` | Estilos globales y variables de diseño de la aplicación. |
| `client/src/styles/auth.css` | Estilos específicos de páginas y componentes de autenticación. |
| `client/src/assets/bemc-logo.png` | Recurso gráfico del logo principal del sistema. |

### Backend (server/src)

| Archivo | Responsabilidad |
|---------|------------------|
| `server/src/index.js` | Bootstrap de Express: middlewares, rutas API, estáticos frontend, conexión DB y arranque HTTP. |
| `server/src/config/db.js` | Conexión MongoDB principal y fallback en memoria para desarrollo local. |
| `server/src/middleware/auth.js` | Autenticación JWT y autorización por roles para rutas protegidas. |
| `server/src/middleware/errorHandler.js` | Manejo centralizado de errores y respuestas de rutas no encontradas. |
| `server/src/models/User.js` | Modelo de usuario con perfil, autenticación local y proveedores OAuth. |
| `server/src/models/Company.js` | Modelo de empresa asociado a usuarios y datos legales/comerciales. |
| `server/src/models/Service.js` | Modelo de servicios SST (precio, categoría, requisitos, estado). |
| `server/src/models/ServiceRequest.js` | Modelo de solicitud de servicio y su ciclo de vida operativo. |
| `server/src/models/Payment.js` | Modelo de pago vinculado a solicitud, con estado y confirmación. |
| `server/src/models/Document.js` | Modelo de documentos por solicitud con categorías y versionado. |
| `server/src/models/AuditLog.js` | Bitácora de auditoría para trazabilidad de acciones críticas. |
| `server/src/routes/auth.routes.js` | Endpoints de autenticación: registro, login, perfil, OAuth y recuperación. |
| `server/src/routes/services.routes.js` | Endpoints CRUD/consulta de servicios SST. |
| `server/src/routes/requests.routes.js` | Endpoints para crear y administrar solicitudes de servicio. |
| `server/src/routes/payments.routes.js` | Endpoints para consulta y confirmación de pagos. |
| `server/src/routes/admin.routes.js` | Endpoints administrativos de dashboard y gestión operativa. |
| `server/src/services/oauth.service.js` | Lógica de OAuth (state, intercambio de código, upsert de usuario). |
| `server/src/seed/seedAdmin.js` | Seed de administrador inicial para primer arranque. |
| `server/src/seed/seedServices.js` | Seed del catálogo base de servicios SST. |
| `server/src/utils/jwt.js` | Utilidades para firmar/verificar tokens JWT. |
| `server/src/utils/audit.js` | Utilidad para registrar eventos de auditoría en base de datos. |

## Flujo funcional resumido

1. Usuario se registra o inicia sesion.
2. Frontend guarda JWT (`bemc_token`) y lo envia en cada request.
3. Cliente consulta servicios y crea una solicitud.
4. Backend crea `ServiceRequest` y `Payment` pendiente.
5. Admin/staff gestiona estado de solicitud y pago.
6. Auditoria guarda trazabilidad de eventos clave.

## Rutas importantes

### Frontend

- `/` home publica.
- `/servicios` catalogo.
- `/login`, `/registro` autenticacion.
- `/portal/*` area cliente autenticada.
- `/admin/*` area administrativa con control de rol.

### API

- `GET /api/health` estado del servicio.
- `POST /api/auth/register` registro.
- `POST /api/auth/login` login.
- `GET /api/services` listado de servicios.
- `POST /api/requests` crear solicitud.
- `PATCH /api/requests/:id` actualizar solicitud (staff).
- `GET /api/admin/dashboard` metricas admin.

## Funcionalidades actuales

- Registro persona natural o empresa
- Login con email y contraseña
- Catálogo de servicios SST (6 servicios precargados)
- Solicitar servicio → pago pendiente
- Portal del cliente (solicitudes)
- Panel admin: dashboard, solicitudes, clientes, empresas, pagos, servicios
- Confirmación manual de pagos (transferencia)

## Próximos pasos

- Subida de documentos (pendiente de implementar endpoint y almacenamiento)
- Facebook OAuth callback completo
- Pasarela de pago (Wompi/ePayco)
- Facturas PDF simples (sin DIAN)
- Calendario y notificaciones
- Reportes Excel/PDF

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | API + frontend en paralelo |
| `npm run dev:server` | Solo API |
| `npm run dev:client` | Solo frontend |
| `npm run build` | Build de producción del cliente |

## Checklist de mantenimiento seguro (si tocas X, revisa Y)

1. Si tocas autenticacion (`client/src/context/AuthContext.jsx`, `server/src/routes/auth.routes.js`, `server/src/middleware/auth.js`), revisa:
	- Login, logout y persistencia de token.
	- Rutas protegidas (`/portal/*`, `/admin/*`).
	- `GET /api/health` y `POST /api/auth/login`.

2. Si tocas rutas frontend (`client/src/App.jsx`), revisa:
	- Navegacion publica y privada.
	- Redirecciones al entrar sin sesion.
	- Pantalla 404 o fallback al home.

3. Si tocas modelos (`server/src/models/*`), revisa:
	- Compatibilidad de campos usados por formularios frontend.
	- Consultas en rutas (`server/src/routes/*`).
	- Seeds (`server/src/seed/*`) en ambiente nuevo.

4. Si tocas solicitudes/pagos (`server/src/routes/requests.routes.js`, `server/src/routes/payments.routes.js`), revisa:
	- Creacion de solicitud -> pago pendiente.
	- Actualizacion de estado por staff/admin.
	- Vista en portal cliente y panel admin.

5. Si tocas estilos globales (`client/src/styles/index.css`, `client/src/styles/auth.css`), revisa:
	- Login, registro, home, servicios, portal y admin en desktop y movil.
	- Contraste visual y legibilidad.

6. Si tocas API base (`client/src/api/client.js`), revisa:
	- Header `Authorization` en requests autenticados.
	- Manejo de `401` y redireccion a `/login`.

7. Antes de subir a produccion, ejecuta siempre:

```bash
npm run build --prefix client
```

8. Despues de desplegar, valida rapido:
	- Home publica: `/`
	- API health: `/api/health`
	- Login y una ruta privada (`/portal` o `/admin`)
