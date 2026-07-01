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
