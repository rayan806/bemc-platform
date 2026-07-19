# Despliegue permanente

Para que la app sea pública y permanezca disponible, debe desplegarse en un hosting real.

## Requisitos
- Cuenta en GitHub
- Cuenta en Render
- Base de datos MongoDB (MongoDB Atlas recomendado)

## Pasos
1. Sube este proyecto a GitHub.
2. Crea una base de datos en MongoDB Atlas y obtén la cadena de conexión.
3. En Render, crea un nuevo Web Service y conecta el repositorio.
4. Usa estos valores:
   - Build Command: npm install && npm install --prefix server && npm install --prefix client && npm run build --prefix client
   - Start Command: npm run start --prefix server
   - Variables de entorno:
     - NODE_ENV=production
     - PORT=10000
     - JWT_SECRET=alguna-clave-segura
     - MONGODB_URI=tu_cadena_de_conexion
5. Despliega y espera a que Render entregue la URL pública.
6. Si quieres un nombre propio, añade un dominio personalizado.

## Solucion de problemas Atlas (querySrv ECONNREFUSED)

Si en los logs del backend aparece `querySrv ECONNREFUSED _mongodb._tcp...`:

1. Verifica `MONGODB_URI` en Render:
  - Debe iniciar con `mongodb+srv://`
  - Sin espacios al inicio o final
  - Con base de datos al final (ejemplo: `/bemc`)
2. En Atlas, revisa:
  - Usuario de DB activo y credenciales correctas
  - IP Access List (para prueba rapida: `0.0.0.0/0`)
  - Cluster en estado `Available`
3. Fuerza redeploy en Render (idealmente con "Clear build cache").
4. Revisa de nuevo `GET /api/health`.

Si persiste el error, usa temporalmente Mongo local para validar funcionalidad y continua con QA del flujo mientras se estabiliza Atlas.
