# Política de Seguridad - Huellas PetID

## Versiones Soportadas

| Rama / Versión | Estado de Soporte |
| -------------- | ----------------- |
| `main`         | Soportada (actualizaciones activas de seguridad) |
| `desarrollo`   | Soportada (pre-producción) |

## Reporte Responsable de Vulnerabilidades

Si descubres una vulnerabilidad de seguridad en **Huellas PetID** (por ejemplo: exposición de credenciales, inyección SQL, XSS, fallos de autenticación o dependencias vulnerables):

1. **No abras un Issue público** con detalles explotables.
2. Reporta el hallazgo de forma privada usando **GitHub Security Advisories** (`Security` -> `Advisories` -> `Report a vulnerability`) o contactando directamente al equipo responsable del proyecto (Grupo 04 - UTP).
3. Incluye en el reporte:
   - Descripción del problema y archivo/endpoint afectado.
   - Pasos reproducibles o prueba de concepto mínima.
   - Impacto potencial estimado.

## Controles de Seguridad Automatizados (DevSecOps)

Este repositorio implementa controles automáticos en GitHub Actions:
- **Endurecimiento de Runners y Supply Chain:** Acciones fijadas por SHA de commit inmutable (40 caracteres), `persist-credentials: false`, principio de menor privilegio (`permissions: {}` por defecto) y monitoreo en tiempo real con StepSecurity Harden-Runner.
- **SAST (Análisis Estático):** CodeQL con consultas `security-extended` para JavaScript/TypeScript.
- **Detección de Secretos:** Escaneo completo del historial Git con TruffleHog OSS.
- **SCA y Licencias:** Auditoría `npm audit`, generación de SBOM CycloneDX y Dependency Review en Pull Requests.
- **Auditoría de Workflows:** Validación de seguridad de los propios pipelines con Zizmor.
- **Dependabot:** Actualización semanal de dependencias `npm` y `github-actions`.
