# B.E.M.C. Platform

Plataforma web para gestión de **Seguridad y Salud en el Trabajo (SST)**, clientes, empresas, servicios, pagos y panel administrativo.

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

## Funcionalidades actuales

- Registro persona natural o empresa
- Login con email y contraseña
- Catálogo de servicios SST (6 servicios precargados)
- Solicitar servicio → pago pendiente
- Portal del cliente (solicitudes)
- Panel admin: dashboard, solicitudes, clientes, empresas, pagos, servicios
- Confirmación manual de pagos (transferencia)

## Próximos pasos

- Subida de documentos (Multer)
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
