# Limpieza estructural — 11 de julio de 2026

## Objetivo

Eliminar duplicados, artefactos y puntos de entrada sin uso sin cambiar las
rutas HTTP, la interfaz, el esquema de Prisma ni datos existentes.

## Archivos retirados

| Ubicación | Motivo | Comprobación |
| --- | --- | --- |
| `backend_seed_main.ts` | Copia de semilla fuera de la ubicación oficial. | Sin referencias; la semilla configurada es `backend/prisma/seed.ts`. |
| `backend_seed_advance.ts` | Copia alternativa de semilla fuera de la ubicación oficial. | Sin referencias. |
| `frontend_cursos_main.tsx` | Copia de trabajo fuera de `frontend/src`. | Sin referencias ni ruta de Next.js. |
| `frontend_cursos_advance.tsx` | Copia alternativa fuera de `frontend/src`. | Sin referencias ni ruta de Next.js. |
| `sidebar_main.tsx` | Copia de `Sidebar` fuera del árbol de componentes. | Sin referencias; la aplicación importa `frontend/src/components/layouts/Sidebar.tsx`. |
| `sidebar_advance.tsx` | Copia alternativa fuera del árbol de componentes. | Sin referencias. |
| `package-lock.json` (raíz) | Bloqueo sin `package.json` raíz. | Frontend y backend poseen sus propios manifiestos y bloqueos. |
| `prisma/seed.ts` (raíz) | Envoltorio redundante de la semilla del backend. | No lo invoca ningún script; el script oficial apunta a `backend/prisma/seed.ts`. |
| `frontend/tsconfig.tsbuildinfo` | Caché de TypeScript generada. | Se vuelve a generar automáticamente y ahora está ignorada. |

## Elementos conservados deliberadamente

- `backend/prisma/migrations/**`: son historial de producción y no deben
  modificarse retrospectivamente.
- `frontend/src/components/dashboard/**/page.tsx`: aunque el nombre pueda
  sugerir una ruta, están importados por las rutas de `src/app`.
- `backend/prisma/*.csv` y `seed_data.ts`: `seed.ts` los usa como insumos.
- `backend/docker-compose.yml` y `docker-compose.yml`: pueden atender ámbitos
  de despliegue distintos; no existe evidencia suficiente para retirar ninguno.
- Cambios previos en `backend/package-lock.json` y `frontend/package-lock.json`:
  se preservan sin modificación.

## Verificación requerida

Desde cada aplicación, ejecutar:

```powershell
cd backend; npm run build
cd ../frontend; npm run build
```

La limpieza no requiere ejecutar migraciones ni semillas y no altera la base de
datos.

## Resultado de la verificación de esta limpieza

- `backend: npm run build`: correcto.
- `frontend: npm run build`: no llegó a la comprobación de aplicación porque
  Next.js no pudo abrir `frontend/.next/trace` (`EPERM`), una caché local
  bloqueada por el entorno.
- `frontend: npx tsc --noEmit --incremental false`: bloqueado por un error
  preexistente en `src/app/(dashboard)/docente/carga-no-lectiva/page.tsx:796`:
  el texto JSX comienza con `>` sin escapar. La línea pertenece al commit
  `9a01ae9c` del 8 de julio de 2026. Se corrigió posteriormente escapando el
  carácter como `&gt;`; la corrección no cambia el texto mostrado al usuario.
- La comprobación siguiente detectó tres usos de `disabled` que el componente
  `SelectorInstitucional` no declaraba. Se añadió la propiedad y se aplica al
  botón, manteniendo deshabilitados los filtros dependientes hasta que tengan
  los datos requeridos.
- Tras ambas correcciones, `npx tsc --noEmit --incremental false` finaliza
  correctamente.
