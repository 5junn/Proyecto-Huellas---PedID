## Descripción del Cambio
Describe brevemente qué se implementa o corrige en este Pull Request.

## Tipo de Cambio
- [ ] Nueva funcionalidad (`feat`)
- [ ] Corrección de errores (`fix`)
- [ ] Seguridad / DevSecOps (`security`)
- [ ] Refactorización / Documentación (`chore` / `docs`)

## Lista de Verificación de Seguridad y Calidad
- [ ] No se incluyen archivos `.env`, contraseñas, tokens ni claves privadas en el commit.
- [ ] Las consultas a MySQL usan parámetros preparados (`?`) sin concatenación directa de entrada de usuario.
- [ ] Las entradas de usuario y datos renderizados están validados/sanitizados.
- [ ] Se ejecutó `npm run build` / `npm run lint` (frontend) y verificación de sintaxis (backend).
- [ ] Los checks de GitHub Actions (`CI`, `CodeQL`, `DevSecOps`) pasan correctamente.
