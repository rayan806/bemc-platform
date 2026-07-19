# Migracion 20260718 - Marketplace SST (Plan)

## Objetivo
Introducir soporte de Marketplace SST sin romper modulos existentes.

## Cambios de esquema propuestos

1. Extender coleccion `users`:
- Nuevo rol: `professional_sst`
- Nuevo objeto `professionalProfile`

2. Crear colecciones:
- `marketplacerequests`
- `marketplaceapplications`
- `marketplaceassignments`
- `marketplacereports`
- `marketplaceratings`
- `professionalcertifications`
- `notifications`

## Indices recomendados

- `marketplacerequests`: `(status, city, requiredProfessionalType)`
- `marketplaceapplications`: unico `(request, professional)`
- `marketplaceassignments`: unico `(request)`
- `notifications`: `(user, readAt, createdAt)`

## Rollback conceptual

- Mantener campos previos de `users`.
- Desactivar rutas marketplace si es necesario.
- No afecta colecciones de consultorias (`ServiceRequest`, `Payment`, `Service`).
