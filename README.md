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
