# Checklist Operativo Atlas + QA End-to-End

Fecha base: 2026-07-18

## 1) Variables obligatorias en Render (Web Service)

Verifica estas variables en el servicio:
- NODE_ENV=production
- PORT=10000
- JWT_SECRET=<valor seguro>
- MONGODB_URI=<uri de Atlas>

Regla de URI:
- Debe iniciar con `mongodb+srv://`
- Debe incluir usuario, clave, host y base de datos.
- Si la clave tiene caracteres especiales (`@`, `:`, `/`, `?`, `#`), codificala en URL.

Ejemplo valido:
- mongodb+srv://user:pass_codificada@cluster0.xxxxx.mongodb.net/bemc?retryWrites=true&w=majority

## 2) Checklist de Atlas (conectividad)

En MongoDB Atlas valida:
- Usuario de base de datos creado y activo (Database Access).
- Permisos del usuario: Read and write to any database (o permisos equivalentes para `bemc`).
- IP Access List abierta para Render:
  - Opcion rapida para pruebas: `0.0.0.0/0`
  - Opcion segura: restringir a egress IPs de tu proveedor.
- Cluster en estado `Available`.
- DNS SRV del cluster funcional (sin bloqueos de red corporativa).

## 3) Si aparece error `querySrv ECONNREFUSED`

Acciones inmediatas:
1. Copia de nuevo el `MONGODB_URI` desde Atlas (evitar host viejo).
2. Verifica que no existan espacios al inicio/fin de la variable en Render.
3. Revisa que no falte la base de datos al final de la URI.
4. Revisa IP Access List de Atlas (abrir temporalmente `0.0.0.0/0`).
5. Forzar nuevo deploy en Render (Clear build cache + Deploy latest commit).
6. Revisar logs de arranque del backend tras el deploy.

## 4) Verificacion minima post-deploy

### Salud API
- GET /api/health
- Esperado: 200 con JSON de estado.

### Frontend
- Carga home publica `/`
- Navegacion a `/login` y `/registro`

## 5) QA funcional por rol (smoke test)

### A. Empresa
1. Registrar cuenta tipo empresa.
2. Entrar a Portal.
3. Ir a Marketplace SST.
4. Crear solicitud con `publishNow` activo.
5. Confirmar que aparece en listado de solicitudes propias.

### B. Profesional SST
1. Registrar cuenta tipo profesional SST.
2. Entrar a Portal.
3. Ir a Marketplace SST.
4. Ver oportunidades y postularse a una solicitud.
5. Confirmar que la postulacion aparece en "Mis postulaciones".

### C. Empresa (continuacion)
1. Abrir postulaciones de la solicitud.
2. Seleccionar profesional y valor acordado.
3. Verificar asignacion creada y estado actualizado.

### D. Profesional SST (continuacion)
1. Cambiar estado asignacion a `in_execution`.
2. Finalizar en `finished`.
3. Verificar links de certificado/informe final en asignacion.

### E. Admin
1. Entrar a `/admin`.
2. Revisar KPI generales + KPI de marketplace.
3. Entrar a `/admin/marketplace` y verificar solicitudes/asignaciones.
4. Abrir campana de notificaciones y probar "Marcar todas".

## 6) Criterios de salida (Done)

Se considera estable cuando:
- API salud responde 200.
- Registro/login funciona para empresa y profesional.
- Flujo marketplace (publicar -> postular -> seleccionar -> ejecutar -> finalizar) completo.
- Panel admin muestra metricas marketplace sin errores.
- Notificaciones in-app funcionan en portal/admin.
- No hay errores de build frontend ni errores de sintaxis backend.

## 7) Plan B temporal (si Atlas sigue fallando)

Para no frenar demo interna:
- Levantar backend local con Mongo local (`mongodb://127.0.0.1:27017/bemc`).
- Ejecutar QA funcional completo localmente.
- Mantener Render para frontend/API solo cuando Atlas quede estable.
