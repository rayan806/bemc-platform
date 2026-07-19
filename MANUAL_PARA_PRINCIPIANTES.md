# Manual para Principiantes - B.E.M.C. Platform

Version: julio 2026
Objetivo: explicar el proyecto con lenguaje simple para que cualquier persona pueda arrancarlo, usarlo y hacer cambios basicos sin perderse.

## 1. Que es este proyecto

B.E.M.C. Platform es una aplicacion web de Seguridad y Salud en el Trabajo (SST) con 2 partes:

- Frontend: lo que ves en el navegador.
- Backend: lo que procesa datos por detras.

La plataforma ya incluye:

- sitio publico de servicios;
- autenticacion (login, registro, recuperacion de clave);
- portal de empresa/cliente;
- panel administrativo;
- marketplace SST con flujo empresa <-> profesional;
- perfil profesional avanzado tipo hoja de vida digital;
- perfil publico del profesional;
- notificaciones, asignaciones, reportes y calificaciones base.

## 2. Como pensar la arquitectura (explicacion simple)

Piensalo como una oficina:

- client = recepcion y pantallas.
- server = oficina interna que valida y guarda.
- MongoDB = archivador.
- API = ventanilla de comunicacion.
- JWT = credencial temporal de sesion.

Flujo tipico:

1. Usuario hace clic en una pantalla React.
2. Frontend llama la API.
3. Backend valida permisos y datos.
4. Backend lee/escribe en MongoDB.
5. Backend responde.
6. Frontend actualiza la vista.

## 3. Estructura general del repo

```text
bemc-platform/
  client/
    src/
      api/
      components/
      context/
      pages/
      styles/
      utils/
  server/
    src/
      config/
      middleware/
      models/
      routes/
      services/
      seed/
      utils/
  README.md
  DEPLOY.md
  MANUAL_PARA_PRINCIPIANTES.md
  render.yaml
```

## 4. Tecnologias principales

Frontend:

- React + Vite
- React Router
- Axios
- Bootstrap + Bootstrap Icons

Backend:

- Node.js + Express
- MongoDB + Mongoose
- JWT + bcrypt
- express-validator

## 5. Requisitos para correrlo local

Necesitas instalar:

- Node.js 18+ (recomendado 20)
- npm
- MongoDB local (opcional si usas URI remota)

## 6. Primer arranque (paso a paso)

Desde la raiz del proyecto:

```bash
npm run install:all
npm run dev
```

Con eso normalmente queda:

- frontend: http://localhost:5173
- backend: http://localhost:5000

Si quieres correr por separado:

```bash
npm run dev:server
npm run dev:client
```

## 7. Variables de entorno basicas

Backend (server/.env):

- PORT
- NODE_ENV
- MONGODB_URI
- JWT_SECRET
- JWT_EXPIRES_IN
- CLIENT_URL
- ADMIN_EMAIL
- ADMIN_PASSWORD

Frontend (client/.env):

- VITE_API_URL

Regla practica:

- En local, si no defines VITE_API_URL, el cliente usa /api.

## 8. Roles del sistema

Roles principales:

- admin
- client (empresa/persona)
- professional_sst

Que hace cada uno:

- admin: controla operacion y vistas administrativas.
- client empresa: crea solicitudes y gestiona marketplace empresarial.
- professional_sst: completa su perfil, postula, ejecuta servicios y publica hoja de vida.

## 9. Rutas clave del frontend

Publicas:

- /
- /servicios
- /servicios/:slug
- /profesionales-sst
- /profesionales-sst/:id
- /login
- /registro

Privadas profesional:

- /profesional
- /profesional/perfil
- /profesional/documentos
- /profesional/certificaciones
- /profesional/solicitudes
- /profesional/postulaciones
- /profesional/calendario
- /profesional/notificaciones
- /profesional/configuracion

Privadas empresa/cliente:

- /portal
- /portal/marketplace
- /portal/solicitudes

Admin:

- /admin
- /admin/marketplace
- /admin/solicitudes
- /admin/pagos

## 10. Rutas clave del backend

Autenticacion:

- /api/auth/register
- /api/auth/login
- /api/auth/me

Core:

- /api/services
- /api/requests
- /api/payments
- /api/admin

Marketplace:

- /api/marketplace/professionals/me
- /api/marketplace/professionals/me/documents
- /api/marketplace/opportunities
- /api/marketplace/applications
- /api/marketplace/assignments
- /api/marketplace/reports
- /api/marketplace/ratings

Public marketplace:

- /api/public/professionals
- /api/public/professionals/:id

## 11. Flujo basico de marketplace (resumen simple)

Empresa:

1. Crea solicitud con criterios.
2. Publica solicitud.
3. Revisa postulaciones y perfiles.
4. Selecciona profesional.

Profesional SST:

1. Completa perfil profesional.
2. Sube documentos y certificaciones.
3. Ve oportunidades.
4. Se postula.
5. Acepta o rechaza asignacion.
6. Reporta ejecucion y cierra servicio.

Sistema:

1. Hace matching por criterios (perfil, experiencia, disponibilidad, servicios).
2. Actualiza estados.
3. Guarda trazabilidad.

## 12. Perfil profesional avanzado (lo importante)

El perfil profesional ahora es tipo CV digital e incluye:

- datos personales;
- datos profesionales;
- licencia SST;
- areas de experiencia;
- servicios ofrecidos;
- cobertura geografia;
- experiencia laboral;
- formacion academica;
- documentos;
- certificaciones;
- porcentaje de completitud.

Tambien existe un perfil publico para que empresas comparen candidatos.

## 13. Archivos clave para principiantes

Frontend:

- client/src/main.jsx
- client/src/App.jsx
- client/src/api/client.js
- client/src/context/AuthContext.jsx
- client/src/pages/professional/ProfessionalProfile.jsx
- client/src/pages/PublicProfessionalProfilePage.jsx
- client/src/pages/portal/PortalMarketplace.jsx

Backend:

- server/src/index.js
- server/src/config/db.js
- server/src/middleware/auth.js
- server/src/models/User.js
- server/src/models/MarketplaceRequest.js
- server/src/models/MarketplaceApplication.js
- server/src/models/MarketplaceAssignment.js
- server/src/models/ProfessionalDocument.js
- server/src/routes/auth.routes.js
- server/src/routes/marketplace.routes.js
- server/src/routes/public.routes.js
- server/src/services/marketplaceMatcher.service.js

## 14. Comandos utiles del dia a dia

Desde la raiz:

```bash
npm run install:all
npm run dev
npm run build
```

Frontend:

```bash
cd client
npm run dev
npm run build
```

Backend:

```bash
cd server
npm run dev
npm start
```

## 15. Checklist rapido antes de hacer push

1. Compila frontend.
2. Verifica que no haya errores de consola graves.
3. Prueba login por rol.
4. Prueba flujo critico que tocaste.
5. Revisa git status.

## 16. Checklist rapido despues de deploy (smoke test)

1. Login admin, empresa y profesional.
2. Profesional: perfil, documentos, certificaciones, configuracion.
3. Perfil publico profesional: carga completa y textos correctos.
4. Empresa: crear solicitud marketplace y ver postulaciones.
5. Verificar API publica de profesionales.

## 17. Problemas comunes y solucion

1) Caracteres raros (ej: Construcci�n)

- Causa: texto guardado con codificacion incorrecta.
- Solucion: normalizar texto al mostrar/guardar y validar UTF-8.

2) Avatar no carga en perfil publico

- Causa: URL externa bloqueada.
- Solucion: fallback visual con inicial del usuario.

3) 404 en rutas nuevas en produccion

- Causa: deploy aun no aplicado.
- Solucion: esperar build de Render y volver a probar.

4) 401 en vistas privadas

- Causa: token vencido o sesion invalida.
- Solucion: cerrar sesion, volver a iniciar.

## 18. Seguridad basica recomendada

- Nunca subir secretos reales al repositorio.
- Usar variables de entorno en Render.
- Cambiar credenciales por defecto de admin.
- Revisar permisos por rol en cada endpoint nuevo.

## 19. Deploy en Render (resumen)

1. Hacer push a la rama desplegada.
2. Render detecta cambios y compila.
3. Revisar logs de build y runtime.
4. Ejecutar smoke test.
5. Documentar resultado del release.

Para detalle completo, revisar DEPLOY.md.

## 20. Ruta recomendada para aprender el proyecto

Orden sugerido:

1. README.md
2. client/src/main.jsx
3. client/src/App.jsx
4. client/src/context/AuthContext.jsx
5. server/src/index.js
6. server/src/models/User.js
7. server/src/routes/auth.routes.js
8. server/src/routes/marketplace.routes.js
9. client/src/pages/professional/ProfessionalProfile.jsx
10. client/src/pages/PublicProfessionalProfilePage.jsx

## 21. Resumen final

Este proyecto ya esta en una fase funcional alta:

- arquitectura separada frontend/backend;
- roles claros;
- marketplace operativo;
- deploy productivo en Render.

Idea clave para no perderse:

```text
Pantalla React -> API (Axios) -> Ruta Express -> Modelo Mongoose -> MongoDB
```

Si entiendes esa linea, entiendes la mayor parte del sistema.
