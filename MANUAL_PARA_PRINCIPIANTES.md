# Manual para entender el proyecto B.E.M.C.

Este manual esta escrito para una persona que no sabe programacion o que apenas esta empezando. La idea no es memorizar todo, sino entender poco a poco que hace cada parte del proyecto, como se conectan las carpetas y para que sirve el codigo.

## 1. Que es este proyecto

Este proyecto es una pagina web completa para B.E.M.C. Soluciones SST.

Tiene dos partes principales:

- `client`: es lo que ve la persona en el navegador. Botones, formularios, paginas, panel del cliente y panel administrador.
- `server`: es la parte invisible que trabaja por detras. Guarda usuarios, valida contrasenas, consulta la base de datos, crea solicitudes y protege el panel administrador.

La app sirve para:

- mostrar servicios SST al publico;
- registrar clientes;
- permitir que un cliente solicite un servicio;
- permitir que un administrador vea clientes, empresas, pagos y solicitudes;
- manejar inicio de sesion;
- preparar recuperacion de contrasena y login con Google/Facebook.

## 2. Explicacion con una comparacion sencilla

Piensa el proyecto como una empresa fisica:

- `client` es la recepcion, las vitrinas, los formularios y las pantallas que ve el cliente.
- `server` es la oficina interna donde se revisan datos, permisos y registros.
- `MongoDB` es el archivador donde se guardan usuarios, servicios, solicitudes, empresas y pagos.
- `JWT` es como una escarapela temporal: cuando el usuario inicia sesion, recibe un token que demuestra quien es.
- `API` es la ventanilla por donde el frontend le pide cosas al backend.

Cuando un cliente hace clic en "Solicitar cotizacion", pasa algo asi:

1. El cliente mira un servicio en el navegador.
2. El navegador envia una peticion al servidor.
3. El servidor revisa si el usuario inicio sesion.
4. El servidor guarda la solicitud en MongoDB.
5. El panel administrador puede ver esa solicitud.

## 3. Estructura general de carpetas

```text
bemc-platform/
  client/
    public/
    src/
      api/
      assets/
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
      seed/
      services/
      utils/
  package.json
  README.md
  DEPLOY.md
  render.yaml
```

## 4. Carpetas de la raiz

### `package.json`

Es como el control principal del proyecto.

Dice:

- como instalar dependencias;
- como arrancar el proyecto;
- como compilarlo para produccion.

Scripts importantes:

- `npm run dev`: prende frontend y backend al mismo tiempo.
- `npm run dev:server`: prende solo el backend.
- `npm run dev:client`: prende solo el frontend.
- `npm run build`: prepara el frontend para produccion.
- `npm run install:all`: instala dependencias de la raiz, servidor y cliente.

### `package-lock.json`

Es un archivo automatico de Node.

Guarda la version exacta de cada paquete instalado. No se escribe a mano.

### `README.md`

Es una guia rapida del proyecto.

Tiene:

- descripcion;
- stack usado;
- comandos para desarrollo;
- usuario administrador por defecto;
- mapa resumido de archivos.

### `DEPLOY.md`

Explica como subir el proyecto a un hosting real, especialmente Render.

### `render.yaml`

Es la configuracion para Render.

Le dice a Render:

- como instalar;
- como construir;
- como arrancar;
- que variables necesita el servidor.

## 5. Que significa frontend y backend

### Frontend

El frontend es lo que ve el usuario.

En este proyecto esta en:

```text
client/
```

Usa:

- React: para crear pantallas con componentes.
- Vite: para correr y construir el frontend.
- Bootstrap: para estilos, botones, tablas, columnas e iconos.
- Axios: para hablar con el backend.

### Backend

El backend es el servidor.

En este proyecto esta en:

```text
server/
```

Usa:

- Express: para crear rutas como `/api/auth/login`.
- MongoDB: para guardar datos.
- Mongoose: para hablar con MongoDB usando modelos.
- JWT: para sesiones.
- bcrypt: para cifrar contrasenas.

## 6. Como se conectan las partes

El frontend llama al backend usando el archivo:

```text
client/src/api/client.js
```

Ese archivo crea un cliente Axios con esta base:

```js
baseURL: import.meta.env.VITE_API_URL || '/api'
```

Eso significa:

- si existe `VITE_API_URL`, usa esa direccion;
- si no existe, usa `/api`, el mismo servidor donde esta la app.

Ejemplo:

```js
api.post('/auth/login', { identifier, password })
```

Eso realmente llama a:

```text
/api/auth/login
```

El backend recibe esa ruta en:

```text
server/src/routes/auth.routes.js
```

## 7. Dependencias principales

Las dependencias son paquetes externos que el proyecto usa para no tener que crear todo desde cero.

### Dependencias del frontend

Estan en:

```text
client/package.json
```

- `react`: permite crear pantallas con componentes.
- `react-dom`: conecta React con el navegador.
- `react-router-dom`: maneja rutas como `/login`, `/portal`, `/admin`.
- `axios`: hace peticiones HTTP al backend.
- `bootstrap`: estilos listos para botones, tablas, columnas.
- `bootstrap-icons`: iconos como usuario, pago, escudo, etc.
- `vite`: herramienta para desarrollo y build.
- `@vitejs/plugin-react`: soporte de React para Vite.

### Dependencias del backend

Estan en:

```text
server/package.json
```

- `express`: crea el servidor y las rutas.
- `mongoose`: conecta el codigo con MongoDB.
- `dotenv`: lee variables desde `.env`.
- `jsonwebtoken`: crea y valida tokens JWT.
- `bcryptjs`: cifra contrasenas.
- `cors`: permite que frontend y backend se hablen.
- `morgan`: muestra logs de peticiones en consola.
- `express-rate-limit`: limita intentos, por ejemplo en login.
- `express-validator`: valida datos que llegan en formularios.
- `mongodb-memory-server`: crea MongoDB temporal en desarrollo si no hay MongoDB local.

## 8. Flujo completo de inicio de sesion

Archivo de pantalla:

```text
client/src/pages/LoginPage.jsx
```

Flujo:

1. El usuario escribe correo/telefono y contrasena.
2. `LoginPage.jsx` llama a `login(...)`.
3. `login(...)` vive en `client/src/context/AuthContext.jsx`.
4. `AuthContext.jsx` usa `api.post('/auth/login', ...)`.
5. Esa peticion llega al backend en `server/src/routes/auth.routes.js`.
6. El backend busca el usuario.
7. Compara la contrasena usando `bcrypt`.
8. Si todo esta bien, crea un token JWT.
9. El frontend guarda el token en `localStorage`.
10. Si el usuario es admin, lo manda a `/admin`; si es cliente, a `/portal`.

## 9. Flujo completo de registro

Archivo de pantalla:

```text
client/src/pages/RegisterPage.jsx
```

Flujo:

1. El usuario elige si es persona o empresa.
2. Llena nombre, correo, telefono y contrasena.
3. Si es empresa, tambien llena razon social y NIT.
4. El frontend valida campos basicos.
5. Llama a `api.post('/auth/register', payload)`.
6. El backend crea el usuario.
7. Si es empresa, crea tambien una empresa en MongoDB.
8. El backend devuelve token y datos del usuario.

## 10. Flujo completo de solicitud de servicio

Pantalla publica:

```text
client/src/pages/ServiceDetailPage.jsx
```

Backend:

```text
server/src/routes/requests.routes.js
```

Flujo:

1. El usuario entra a un servicio.
2. Puede escribir una nota.
3. Presiona "Solicitar cotizacion".
4. Si no inicio sesion, se manda a login.
5. Si inicio sesion, el frontend envia `serviceId` y `clientNotes`.
6. El backend crea una `ServiceRequest`.
7. El backend crea tambien un `Payment` pendiente.
8. El cliente ve su solicitud en `/portal/solicitudes`.
9. El admin la ve en `/admin/solicitudes`.

## 11. Flujo del panel administrador

Pantallas:

```text
client/src/pages/admin/
```

Backend:

```text
server/src/routes/admin.routes.js
server/src/routes/requests.routes.js
server/src/routes/payments.routes.js
```

Solo entran usuarios con rol:

- `admin`
- `consultor`
- `auxiliar`
- `supervisor`

Como tu proyecto tendra un solo administrador, lo normal es que solo exista un usuario con rol `admin`.

## 12. Que es un rol

Un rol es el tipo de permiso del usuario.

En `server/src/models/User.js` aparecen estos roles:

```js
['admin', 'consultor', 'auxiliar', 'supervisor', 'client']
```

Significado sencillo:

- `admin`: puede entrar al panel administrador.
- `consultor`: podria ayudar a gestionar solicitudes.
- `auxiliar`: podria apoyar operaciones.
- `supervisor`: podria revisar procesos.
- `client`: cliente normal, solo entra al portal.

Si solo quieres un administrador, puedes usar solo:

- `admin`
- `client`

## 13. Explicacion de `client`

La carpeta `client` contiene la pagina web que ve el usuario.

### `client/index.html`

Es la plantilla base del navegador.

React se monta dentro de un elemento HTML llamado normalmente:

```html
<div id="root"></div>
```

### `client/vite.config.js`

Configura Vite.

Importante:

- usa puerto `5173`;
- permite abrir el frontend localmente;
- envia peticiones `/api` hacia `http://localhost:5000` durante desarrollo.

Eso permite que el frontend y backend se hablen aunque esten en puertos diferentes.

### `client/public/bemc-logo.png`

Logo publico disponible para el navegador.

### `client/src/assets/bemc-logo.png`

Logo importado dentro de componentes React.

## 14. Explicacion de `client/src`

### `client/src/main.jsx`

Es la puerta de entrada del frontend.

Hace esto:

- importa React;
- importa el router;
- importa el proveedor de autenticacion;
- importa Bootstrap;
- importa estilos globales;
- monta la app en el navegador.

Palabras importantes:

---

## FASE 1 - Analisis y diseno del Marketplace de Profesionales SST

Esta seccion documenta el diseno tecnico aprobado para integrar el nuevo modulo de Marketplace SST sin romper lo que ya funciona.

### 1) Regla principal de esta fase

- En Fase 1 no se reemplaza arquitectura.
- En Fase 1 no se eliminan funciones existentes.
- En Fase 1 se define diseno, contratos, reutilizacion y plan de implementacion por fases.

### 2) Reutilizacion del sistema actual (sin duplicar)

Se reutiliza lo siguiente:

- Autenticacion JWT existente (`AuthContext`, `api/client.js`, middleware `authenticate`).
- Roles y permisos actuales (`admin`, `consultor`, `auxiliar`, `supervisor`, `client`).
- Layouts actuales (`PublicLayout`, `ClientLayout`, `AdminLayout`).
- Sistema de auditoria (`logAudit`).
- Estructura de rutas separadas por dominio (`/api/auth`, `/api/admin`, etc.).

### 3) Nuevo rol: Profesional SST

Se agrega un nuevo rol en `User`:

- `professional_sst`

Nota:

- No reemplaza `client` ni `admin`.
- Convive con el modelo de autenticacion actual.

### 4) Diseno de datos (propuesta Fase 2 en adelante)

#### 4.1 Extender `User` (reutilizacion)

Se extiende el usuario para profesionales, evitando crear tabla duplicada de personas.

Campos nuevos sugeridos:

- `professionalProfile` (objeto):
  - `mainProfession`
  - `mainRole`
  - `yearsExperience`
  - `licenseNumber`
  - `licenseExpiryDate`
  - `specialties` (array)
  - `city`
  - `department`
  - `serviceMunicipalities` (array)
  - `canTravel` (boolean)
  - `availabilityStatus` (`available`, `busy`, `unavailable`)
  - `ratingAvg`
  - `completedServicesCount`

#### 4.2 Nuevo modelo: `ProfessionalCertification`

Motivo:

- Certificaciones son multiples y pueden crecer con el tiempo.

Campos sugeridos:

- `professional` (ref `User`)
- `type` (`licencia_sst`, `alturas`, `curso_50h`, `curso_20h`, `espacios_confinados`, `primeros_auxilios`, `otra`)
- `title`
- `fileUrl`
- `issuedAt`
- `expiresAt`
- `isVerified`
- `verifiedBy`

#### 4.3 Nuevo modelo: `MarketplaceRequest`

Motivo:

- No mezclar reglas del marketplace con `ServiceRequest` de consultoria actual.

Campos sugeridos:

- Empresa y contacto:
  - `company` (ref `Company`)
  - `contactName`
  - `contactPhone`
  - `contactEmail`
- Servicio requerido:
  - `city`
  - `department`
  - `address`
  - `startDate`
  - `estimatedEndDate`
  - `requiredProfessionalType`
  - `workersCount`
  - `riskLevel`
  - `schedule`
  - `requiresWorkingAtHeights`
  - `requiresConfinedSpaces`
  - `description`
  - `attachments` (array)
- Estado:
  - `status` (`draft`, `published`, `in_postulation`, `professional_selected`, `in_execution`, `finished`, `cancelled`)
- Auditoria/fechas:
  - `createdBy` (ref `User`)
  - timestamps

#### 4.4 Nuevo modelo: `MarketplaceApplication`

Campos sugeridos:

- `request` (ref `MarketplaceRequest`)
- `professional` (ref `User`)
- `availabilityNote`
- `economicProposal`
- `observations`
- `appliedAt`
- `status` (`active`, `rejected`, `selected`, `closed`)

#### 4.5 Nuevo modelo: `MarketplaceAssignment`

Campos sugeridos:

- `request` (ref `MarketplaceRequest`)
- `professional` (ref `User`)
- `company` (ref `Company`)
- `assignedAt`
- `agreedValue`
- `status` (`assigned`, `in_execution`, `finished`, `cancelled`)

#### 4.6 Nuevo modelo: `MarketplaceReport`

Campos sugeridos:

- `assignment` (ref `MarketplaceAssignment`)
- `reportDate`
- `activities`
- `inspections`
- `evidencePhotos` (array)
- `workedHours`
- `observations`

#### 4.7 Nuevo modelo: `MarketplaceRating`

Campos sugeridos:

- `assignment` (ref `MarketplaceAssignment`)
- `fromUser`
- `toUser`
- `score` (1-5)
- `comment`
- `type` (`company_to_professional`, `professional_to_company`)

#### 4.8 Nuevo modelo: `Notification`

Campos sugeridos:

- `user` (ref `User`)
- `type`
- `title`
- `message`
- `payload` (objeto)
- `channel` (`in_app` por ahora)
- `readAt`

### 5) Emparejamiento (matching) desacoplado

Se crea un servicio dedicado, por ejemplo:

- `server/src/services/marketplaceMatcher.service.js`

Criterios minimos:

- Tipo de profesional requerido.
- Cobertura por ciudad/municipio.
- Disponibilidad actual.
- Licencia SST vigente.
- Especialidades requeridas.

Regla:

- Si no cumple criterios minimos, no se muestra como candidato.

### 6) Rutas backend propuestas (nuevo modulo)

Grupo sugerido:

- `/api/marketplace/professionals`
- `/api/marketplace/requests`
- `/api/marketplace/applications`
- `/api/marketplace/assignments`
- `/api/marketplace/reports`
- `/api/marketplace/ratings`
- `/api/notifications`

Importante:

- Mantener middleware actual (`authenticate`, `isStaff`, y nuevo guard por rol profesional cuando aplique).

### 7) Pantallas frontend propuestas (reutilizando diseno actual)

Publico:

- Listado de profesionales SST.
- Perfil publico del profesional.

Empresa/cliente:

- Crear solicitud marketplace.
- Ver postulaciones.
- Comparar candidatos.
- Seleccionar profesional.

Profesional SST:

- Dashboard profesional.
- Perfil profesional editable.
- Solicitudes recomendadas.
- Mis postulaciones.
- Mis asignaciones.
- Reportes diarios.
- Historial y calificaciones.

Admin:

- Supervisar marketplace.
- Ver metricas y trazabilidad.

### 8) Dashboard (extension)

Se agregan indicadores sin quitar los actuales:

- Empresas registradas.
- Profesionales registrados.
- Solicitudes activas.
- Solicitudes finalizadas.
- Profesionales disponibles.
- Servicios en ejecucion.
- Calificacion promedio de profesionales.
- Calificacion promedio de empresas.

### 9) Migraciones y cambios de datos

En Fase 1:

- No se ejecutan migraciones reales.
- Se define el plan de migraciones para fases siguientes.

En Fase 2+ (propuesto):

- Migracion 001: ampliar `User` con rol y perfil profesional.
- Migracion 002: crear colecciones marketplace nuevas.
- Migracion 003: indices para matching y filtros.

### 10) Fases de implementacion recomendadas

Fase 1 (actual): Analisis y diseno.

Fase 2: Base de datos y modelos + migraciones minimas.

Fase 3: API backend marketplace + auditoria + notificaciones internas.

Fase 4: Frontend profesional/empresa/admin para marketplace.

Fase 5: Seguimiento, calificaciones, cierre, certificado e informe final.

Fase 6: Pruebas integrales, endurecimiento y validacion final.

### 11) Pruebas minimas por fase (regla obligatoria)

Antes de pasar de fase:

- Pruebas del modulo nuevo.
- Pruebas de regresion del modulo existente (auth, panel admin, portal cliente, solicitudes y pagos actuales).
- Validacion de roles y permisos.
- Verificacion de auditoria.

### 12) Resultado de Fase 1

- Analisis tecnico completo: listo.
- Diseno de arquitectura Marketplace SST: listo.
- Plan por fases con reglas de no regresion: listo.
- Cambios funcionales en runtime: ninguno (intencional en Fase 1).

- `import`: trae codigo desde otro archivo o paquete.
- `ReactDOM.createRoot`: le dice a React donde dibujar la app.
- `BrowserRouter`: permite usar rutas como `/login`.
- `AuthProvider`: envuelve la app para que todas las pantallas sepan si hay usuario.

### `client/src/App.jsx`

Define las paginas del sitio.

Ejemplos:

- `/` muestra `HomePage`.
- `/login` muestra `LoginPage`.
- `/registro` muestra `RegisterPage`.
- `/portal` muestra el portal del cliente.
- `/admin` muestra el panel administrador.

Palabras importantes:

- `Routes`: grupo de rutas.
- `Route`: una ruta individual.
- `Navigate`: redirige a otra ruta.
- `ProtectedRoute`: protege paginas privadas.

### `client/src/api/client.js`

Es el mensajero del frontend.

Cada vez que el frontend necesita hablar con el backend, normalmente usa este archivo.

Hace tres cosas importantes:

- define la URL base de la API;
- agrega el token del usuario automaticamente;
- si el servidor responde `401`, limpia la sesion y manda al login.

Palabras importantes:

- `axios.create`: crea un cliente HTTP.
- `interceptors.request`: modifica una peticion antes de enviarla.
- `interceptors.response`: revisa una respuesta despues de recibirla.
- `localStorage`: memoria del navegador donde se guarda el token.

### `client/src/context/AuthContext.jsx`

Es la memoria central de la sesion.

Guarda:

- usuario actual;
- si esta cargando;
- funcion para iniciar sesion;
- funcion para registrarse;
- funcion para cerrar sesion;
- si el usuario es staff/admin.

Palabras importantes:

- `createContext`: crea una bolsa global de informacion.
- `useContext`: lee esa bolsa.
- `useState`: guarda datos que cambian.
- `useEffect`: ejecuta algo cuando carga la pantalla.
- `login`: funcion para iniciar sesion.
- `logout`: funcion para cerrar sesion.

### `client/src/components/ProtectedRoute.jsx`

Es el guardia de seguridad del frontend.

Si no hay usuario:

```text
manda al login
```

Si la ruta es solo para staff y el usuario no es staff:

```text
manda al portal
```

### `client/src/components/PublicLayout.jsx`

Es el marco de las paginas publicas.

Incluye:

- barra superior;
- logo;
- enlace a servicios;
- botones de login/registro;
- footer.

### `client/src/components/ClientLayout.jsx`

Es el marco del portal del cliente.

Incluye:

- navegacion interna;
- enlaces a inicio, servicios y solicitudes;
- nombre del usuario;
- boton de salir.

### `client/src/components/AdminLayout.jsx`

Es el marco del panel administrador.

Incluye:

- menu lateral;
- enlaces a dashboard, solicitudes, clientes, empresas, pagos y servicios;
- correo y rol del usuario;
- boton para cerrar sesion.

## 15. Componentes de autenticacion

Estan en:

```text
client/src/components/auth/
```

### `AuthLayout.jsx`

Es el fondo y estructura general de las paginas de login, registro y recuperacion.

### `AuthGlassCard.jsx`

Es la tarjeta visual donde aparecen los formularios.

Recibe:

- `title`: titulo;
- `subtitle`: texto secundario;
- `wide`: si la tarjeta debe ser mas ancha;
- `children`: contenido interno.

### `PasswordInput.jsx`

Es un campo de contrasena con boton para mostrar u ocultar.

Palabras importantes:

- `visible`: guarda si la contrasena se muestra o no.
- `setVisible`: cambia ese estado.
- `type="password"`: oculta el texto.
- `type="text"`: muestra el texto.

### `SocialAuthButtons.jsx`

Muestra botones para entrar con Google o Facebook.

Llama al backend en:

```text
/api/auth/google
/api/auth/facebook
```

## 16. Paginas publicas

### `HomePage.jsx`

Es la pagina principal.

Muestra:

- presentacion de B.E.M.C.;
- pilares de SST;
- servicios destacados;
- proceso de solicitud;
- llamados a crear cuenta o iniciar sesion.

Tambien consulta servicios con:

```js
api.get('/services')
```

### `ServicesPage.jsx`

Muestra el catalogo de servicios.

Cada servicio tiene:

- nombre;
- categoria;
- descripcion;
- boton para ver mas.

### `ServiceDetailPage.jsx`

Muestra el detalle de un servicio.

Tambien permite crear una solicitud.

Si el usuario no inicio sesion, lo manda a login.

Si inicio sesion, crea la solicitud usando:

```js
api.post('/requests', ...)
```

## 17. Paginas de login y cuenta

### `LoginPage.jsx`

Formulario de inicio de sesion.

Pide:

- correo o telefono;
- contrasena.

Si entra un admin, lo manda a:

```text
/admin
```

Si entra un cliente, lo manda a:

```text
/portal
```

### `RegisterPage.jsx`

Formulario de registro.

Permite registrar:

- persona;
- empresa.

Si es empresa, pide razon social y NIT.

### `ForgotPasswordPage.jsx`

Pantalla para pedir recuperacion de contrasena.

Actualmente el backend genera el token, pero falta conectar envio real de correo.

### `ResetPasswordPage.jsx`

Pantalla para crear una nueva contrasena usando un token.

### `AuthCallbackPage.jsx`

Pantalla que recibe el regreso desde Google o Facebook.

Guarda el token y manda al usuario al portal o al admin.

## 18. Portal del cliente

Carpeta:

```text
client/src/pages/portal/
```

### `PortalHome.jsx`

Pagina inicial del cliente.

Muestra:

- saludo;
- tipo de cuenta;
- acceso a servicios;
- acceso a solicitudes;
- aviso de documentos proximamente.

### `PortalServices.jsx`

Reutiliza `ServicesPage`.

Esto evita duplicar codigo.

### `PortalRequests.jsx`

Muestra las solicitudes del cliente.

Consulta:

```js
api.get('/requests')
```

El backend decide que solicitudes devolver segun el usuario.

## 19. Panel administrador

Carpeta:

```text
client/src/pages/admin/
```

### `AdminDashboard.jsx`

Muestra resumen general:

- clientes;
- empresas;
- servicios en curso;
- completados;
- pagos;
- documentos;
- solicitudes recientes;
- alertas.

Consulta:

```js
api.get('/admin/dashboard')
```

### `AdminRequests.jsx`

Muestra solicitudes de clientes.

Permite cambiar estado:

- pago pendiente;
- pagado;
- en curso;
- completado;
- cancelado.

### `AdminClients.jsx`

Lista los clientes registrados.

### `AdminCompanies.jsx`

Lista empresas registradas.

### `AdminPayments.jsx`

Lista pagos.

Permite confirmar pago.

### `AdminServices.jsx`

Lista servicios existentes.

Actualmente no edita servicios desde pantalla, solo los muestra.

## 20. Utilidades del frontend

### `client/src/utils/servicePresentation.js`

Convierte categorias tecnicas en presentacion visual.

Ejemplo:

```js
'sg-sst': 'SG-SST'
```

Tambien decide que icono usar para cada tipo de servicio.

## 21. Estilos del frontend

### `client/src/styles/index.css`

Estilos generales del sitio.

Define:

- colores principales;
- botones;
- tarjetas;
- hero de inicio;
- secciones;
- badges de estados;
- responsive para celular.

### `client/src/styles/auth.css`

Estilos de login, registro y recuperacion.

Define:

- fondo oscuro;
- tarjeta tipo glass;
- inputs;
- botones;
- mensajes de error;
- botones sociales.

## 22. Explicacion de `server`

La carpeta `server` contiene el backend.

El backend:

- recibe peticiones;
- valida datos;
- revisa permisos;
- habla con MongoDB;
- responde al frontend.

## 23. `server/src/index.js`

Es el archivo que prende el backend.

Hace esto:

- carga variables de entorno;
- crea la app Express;
- configura CORS;
- permite recibir JSON;
- registra rutas API;
- conecta la base de datos;
- ejecuta seeds;
- inicia el servidor.

Rutas principales:

```js
app.use('/api/auth', authRoutes)
app.use('/api/services', servicesRoutes)
app.use('/api/requests', requestsRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/payments', paymentsRoutes)
```

Significado:

- todo lo de login/registro va a `authRoutes`;
- todo lo de servicios va a `servicesRoutes`;
- todo lo de solicitudes va a `requestsRoutes`;
- todo lo de admin va a `adminRoutes`;
- todo lo de pagos va a `paymentsRoutes`.

## 24. Configuracion de base de datos

### `server/src/config/db.js`

Conecta el backend con MongoDB.

Primero intenta usar:

```text
MONGODB_URI
```

Si no existe, usa:

```text
mongodb://127.0.0.1:27017/bemc
```

Si MongoDB local no esta disponible y no es produccion, usa una base temporal en memoria.

## 25. Middlewares

Un middleware es una funcion que se ejecuta entre la peticion y la respuesta.

Ejemplo:

```text
usuario pide algo -> middleware revisa -> ruta responde
```

### `server/src/middleware/auth.js`

Revisa si el usuario tiene token valido.

Funciones:

- `authenticate`: confirma que el usuario inicio sesion.
- `authorize`: confirma que el usuario tiene un rol permitido.
- `isAdmin`: solo admin.
- `isStaff`: admin, consultor, auxiliar o supervisor.

### `server/src/middleware/errorHandler.js`

Maneja errores.

Ejemplos:

- datos invalidos;
- correo duplicado;
- ID invalido;
- ruta no encontrada;
- error interno.

## 26. Modelos de la base de datos

Los modelos son la forma de decirle a MongoDB que datos existen y como deben verse.

Carpeta:

```text
server/src/models/
```

### `User.js`

Representa un usuario.

Campos importantes:

- `email`: correo.
- `password`: contrasena cifrada.
- `authProviders`: si entra con local, Google o Facebook.
- `facebookId`: ID de Facebook.
- `googleId`: ID de Google.
- `accountType`: persona o empresa.
- `role`: admin o cliente.
- `profile`: nombre, telefono, documento, direccion.
- `company`: empresa relacionada.
- `isActive`: si la cuenta esta activa.
- `lastLogin`: ultimo inicio.
- `passwordResetToken`: token para recuperar contrasena.

Tambien tiene funciones:

- antes de guardar, cifra la contrasena;
- `comparePassword`: compara contrasena escrita vs contrasena guardada;
- `toSafeJSON`: devuelve usuario sin contrasena ni tokens privados.

### `Company.js`

Representa una empresa.

Campos:

- razon social;
- NIT;
- direccion;
- telefono;
- correo;
- representante legal;
- usuario que la creo;
- si esta activa.

### `Service.js`

Representa un servicio SST.

Campos:

- nombre;
- slug;
- categoria;
- descripcion;
- descripcion corta;
- precio;
- moneda;
- duracion;
- documentos requeridos;
- imagen;
- si esta activo;
- orden.

El `slug` es una version del nombre lista para URL.

Ejemplo:

```text
Implementacion SG-SST -> implementacion-sg-sst
```

### `ServiceRequest.js`

Representa una solicitud de servicio.

Campos:

- cliente;
- empresa;
- servicio;
- estado;
- notas del cliente;
- notas internas;
- consultor asignado;
- fechas programadas;
- fecha de completado.

Estados:

- `draft`: borrador.
- `pending_payment`: pendiente de pago.
- `paid`: pagado.
- `in_progress`: en curso.
- `completed`: completado.
- `cancelled`: cancelado.

### `Payment.js`

Representa un pago.

Campos:

- solicitud relacionada;
- cliente;
- monto;
- moneda;
- metodo;
- estado;
- referencia;
- URL del comprobante;
- fecha de pago;
- quien confirmo;
- notas.

### `Document.js`

Representa un documento.

Este modelo esta preparado, pero todavia falta completar la subida real de documentos.

Campos:

- solicitud relacionada;
- quien subio;
- titulo;
- categoria;
- nombre de archivo;
- ruta del archivo;
- tipo de archivo;
- tamano;
- version;
- aprobacion;
- notas de revision.

### `AuditLog.js`

Es una bitacora.

Guarda acciones importantes:

- quien hizo algo;
- que accion hizo;
- sobre que entidad;
- que cambios hubo;
- IP;
- navegador.

## 27. Rutas del backend

Las rutas son puertas de entrada al servidor.

Ejemplo:

```text
POST /api/auth/login
```

Significa:

- `POST`: enviar datos.
- `/api/auth/login`: direccion.
- el backend recibe correo/contrasena y responde.

## 28. `server/src/routes/auth.routes.js`

Maneja autenticacion.

Rutas principales:

- `POST /api/auth/register`: registrar usuario.
- `POST /api/auth/login`: iniciar sesion.
- `GET /api/auth/me`: saber quien soy.
- `POST /api/auth/forgot-password`: pedir recuperacion.
- `POST /api/auth/reset-password`: cambiar contrasena con token.
- `POST /api/auth/change-password`: cambiar contrasena desde sesion.
- `GET /api/auth/facebook`: iniciar login con Facebook.
- `GET /api/auth/google`: iniciar login con Google.

## 29. `server/src/routes/services.routes.js`

Maneja servicios.

Rutas:

- `GET /api/services`: lista servicios activos.
- `GET /api/services/:slugOrId`: detalle de servicio.
- `POST /api/services`: crea servicio, solo admin.
- `PATCH /api/services/:id`: actualiza servicio, solo admin.
- `DELETE /api/services/:id`: desactiva servicio, solo admin.

## 30. `server/src/routes/requests.routes.js`

Maneja solicitudes.

Todas estas rutas requieren usuario con sesion.

Rutas:

- `GET /api/requests`: lista solicitudes.
- `GET /api/requests/:id`: detalle de una solicitud.
- `POST /api/requests`: crea una solicitud.
- `PATCH /api/requests/:id`: actualiza estado o datos internos, solo staff.

Regla importante:

- cliente normal solo ve sus solicitudes;
- admin/staff puede ver todas.

## 31. `server/src/routes/payments.routes.js`

Maneja pagos.

Rutas:

- `GET /api/payments`: lista pagos.
- `PATCH /api/payments/:id/confirm`: confirma pago, solo staff.
- `POST /api/payments/:id/proof`: registra comprobante del cliente.

## 32. `server/src/routes/admin.routes.js`

Maneja datos del panel administrador.

Todas requieren:

- usuario con sesion;
- rol de staff.

Rutas:

- `GET /api/admin/dashboard`: resumen de metricas.
- `GET /api/admin/clients`: lista clientes.
- `GET /api/admin/companies`: lista empresas.

## 33. Servicios internos del backend

### `server/src/services/oauth.service.js`

Maneja login con Google/Facebook.

Hace:

- crea estado de seguridad OAuth;
- valida el regreso;
- busca o crea usuario;
- redirige al frontend con token;
- intercambia codigo por perfil de usuario.

## 34. Seeds

Los seeds son datos iniciales.

### `server/src/seed/seedServices.js`

Crea servicios SST iniciales si no existen.

Ejemplos:

- Implementacion SG-SST.
- Auditoria SST.
- Capacitacion SST.
- Inspeccion de Seguridad.
- Evaluacion de Riesgos.
- Consultoria Empresarial SST.

### `server/src/seed/seedAdmin.js`

Crea el administrador inicial si no existe.

Por defecto:

```text
admin@bemc.com
Admin123!
```

Para produccion, lo correcto es cambiar estos valores usando variables privadas:

```text
ADMIN_EMAIL
ADMIN_PASSWORD
```

## 35. Utilidades del backend

### `server/src/utils/jwt.js`

Crea y valida tokens.

Funciones:

- `signToken`: crea token.
- `verifyToken`: valida token.

### `server/src/utils/audit.js`

Guarda acciones importantes en `AuditLog`.

Sirve para saber quien hizo algo y cuando.

## 36. Diccionario de palabras de codigo

### `import`

Trae algo desde otro archivo o paquete.

Ejemplo:

```js
import express from 'express';
```

Significa: trae Express para usarlo.

### `export`

Permite que otro archivo use algo de este archivo.

Ejemplo:

```js
export function login() {}
```

### `function`

Crea una funcion.

Una funcion es una accion reutilizable.

### `async`

Indica que la funcion puede esperar tareas lentas.

Ejemplo:

- consultar base de datos;
- pedir datos a otra API;
- guardar un usuario.

### `await`

Espera a que termine una tarea.

Ejemplo:

```js
await User.findOne({ email })
```

Significa: espera a que MongoDB busque ese usuario.

### `const`

Crea una variable que no se va a reasignar.

### `let`

Crea una variable que puede cambiar.

### `if`

Pregunta si algo es verdad.

Ejemplo:

```js
if (!user) {
  return res.status(401).json({ message: 'No autorizado' });
}
```

Significa: si no hay usuario, responde no autorizado.

### `return`

Devuelve una respuesta o termina una funcion.

### `try/catch`

Sirve para manejar errores.

```js
try {
  // intenta algo
} catch (err) {
  // si falla, entra aqui
}
```

### `req`

Abreviatura de request.

Es lo que llega al servidor desde el navegador.

Ejemplos:

- `req.body`: datos enviados.
- `req.params`: datos en la URL.
- `req.query`: filtros en la URL.
- `req.user`: usuario autenticado.

### `res`

Abreviatura de response.

Es la respuesta que el servidor envia.

Ejemplo:

```js
res.json({ message: 'ok' })
```

### `next`

Pasa al siguiente middleware o manda el error al manejador central.

### `router.get`

Ruta para pedir informacion.

Ejemplo:

```js
router.get('/services')
```

### `router.post`

Ruta para crear o enviar informacion.

### `router.patch`

Ruta para actualizar parte de algo.

### `router.delete`

Ruta para eliminar o desactivar algo.

### `schema`

Molde de datos en Mongoose.

Dice que campos tiene una coleccion.

### `model`

Modelo de Mongoose que permite crear, buscar, actualizar y eliminar documentos en MongoDB.

### `populate`

Rellena datos relacionados.

Ejemplo:

Una solicitud guarda el ID del cliente. `populate('client')` trae los datos del cliente.

### `middleware`

Funcion intermedia.

Puede revisar permisos, validar token o manejar errores.

### `JWT`

Token de sesion.

Es como una llave temporal para demostrar que el usuario ya inicio sesion.

### `hash`

Texto cifrado.

Las contrasenas no se guardan tal cual; se guardan cifradas.

### `bcrypt`

Herramienta para cifrar y comparar contrasenas.

### `localStorage`

Memoria del navegador.

Este proyecto guarda ahi:

- token;
- datos basicos del usuario.

### `state`

Dato que puede cambiar en React.

Ejemplo:

```js
const [loading, setLoading] = useState(false)
```

`loading` dice si algo esta cargando.

### `props`

Datos que un componente recibe desde otro.

### `children`

Contenido que va dentro de un componente.

### `map`

Recorre una lista y crea algo por cada elemento.

Ejemplo:

```js
services.map((service) => ...)
```

Significa: por cada servicio, dibuja una tarjeta.

### `filter`

Filtra una lista.

### `find`

Busca un elemento.

### `useEffect`

Ejecuta codigo cuando una pantalla carga o cuando cambia algo.

### `useState`

Guarda informacion que cambia en una pantalla.

### `useNavigate`

Permite mandar al usuario a otra ruta.

### `useParams`

Lee datos de la URL.

Ejemplo:

```text
/servicios/:slug
```

### `className`

En React, se usa `className` en lugar de `class`.

Sirve para aplicar estilos CSS.

### `onClick`

Accion cuando el usuario hace clic.

### `onChange`

Accion cuando el usuario escribe o cambia un campo.

### `value`

Valor actual de un campo.

### `disabled`

Desactiva un boton o campo.

## 37. Que pasa cuando el proyecto arranca

Cuando ejecutas:

```bash
npm run dev
```

Pasan dos cosas:

1. Se prende el backend en `http://localhost:5000`.
2. Se prende el frontend en `http://localhost:5173`.

El backend:

1. carga `.env`;
2. conecta MongoDB;
3. crea servicios iniciales si no existen;
4. crea admin inicial si no existe;
5. registra rutas;
6. escucha peticiones.

El frontend:

1. abre Vite;
2. carga React;
3. monta `App.jsx`;
4. revisa si hay token guardado;
5. muestra la pantalla correspondiente.

## 38. Variables de entorno

Las variables de entorno son configuraciones privadas.

Ejemplos:

- `PORT`: puerto del backend.
- `NODE_ENV`: modo development o production.
- `MONGODB_URI`: direccion de MongoDB.
- `JWT_SECRET`: clave privada para tokens.
- `JWT_EXPIRES_IN`: duracion del token.
- `CLIENT_URL`: URL del frontend.
- `ADMIN_EMAIL`: correo del admin.
- `ADMIN_PASSWORD`: contrasena inicial del admin.
- `GOOGLE_CLIENT_ID`: ID de Google OAuth.
- `GOOGLE_CLIENT_SECRET`: secreto de Google.
- `FACEBOOK_APP_ID`: ID de Facebook.
- `FACEBOOK_APP_SECRET`: secreto de Facebook.

No se deben publicar secretos reales.

## 39. Que esta completo

El proyecto ya tiene:

- sitio publico;
- catalogo de servicios;
- detalle de servicio;
- registro de clientes;
- login;
- roles;
- portal cliente;
- panel admin;
- solicitudes;
- pagos pendientes;
- confirmacion de pagos;
- modelos de documentos;
- seeds iniciales;
- deploy preparado para Render.

## 40. Que falta para estar mas completo

Falta o conviene mejorar:

- envio real de correo para recuperar contrasena;
- subida real de comprobantes y documentos;
- cambio de contrasena admin por variable privada;
- limitar CORS al dominio real;
- mensajes mas claros cuando una pantalla falla;
- edicion completa de servicios desde admin;
- gestion de documentos desde admin y cliente;
- opcion para cambiar datos del perfil;
- mejores pruebas automaticas.

## 41. Ruta mental para estudiar el proyecto

Si quieres entenderlo sin perderte, sigue este orden:

1. Lee `package.json`.
2. Lee `client/src/main.jsx`.
3. Lee `client/src/App.jsx`.
4. Lee `client/src/context/AuthContext.jsx`.
5. Lee `client/src/api/client.js`.
6. Lee `server/src/index.js`.
7. Lee `server/src/middleware/auth.js`.
8. Lee `server/src/models/User.js`.
9. Lee `server/src/routes/auth.routes.js`.
10. Lee `server/src/routes/requests.routes.js`.
11. Lee las paginas `LoginPage`, `RegisterPage`, `ServiceDetailPage`.
12. Lee las paginas admin.

## 42. Resumen final

Este proyecto esta dividido de forma normal para una app profesional:

- frontend en `client`;
- backend en `server`;
- base de datos en MongoDB;
- rutas API para comunicar ambos lados;
- JWT para sesion;
- roles para proteger el panel admin.

La parte mas importante para entenderlo es esta:

```text
Pantalla React -> api/client.js -> ruta Express -> modelo Mongoose -> MongoDB
```

Ese es el camino principal de casi todo el sistema.

