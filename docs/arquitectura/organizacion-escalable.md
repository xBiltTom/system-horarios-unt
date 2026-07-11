# Organización escalable

## Alcance de esta reorganización

El sistema queda dividido por responsabilidad y con una única fuente para cada
concepto de infraestructura:

```text
system-horarios-unt/
├── backend/
│   ├── prisma/               # esquema, migraciones, semillas y datos de semilla
│   └── src/
│       ├── modules/          # módulos de negocio (ruta, controlador, servicio, esquema y tipos)
│       ├── config/           # configuración de proveedores e infraestructura
│       ├── lib/              # adaptadores compartidos (Prisma, Redis, errores)
│       ├── middleware/       # preocupaciones transversales HTTP
│       ├── websocket/        # comunicación en tiempo real
│       └── workers/          # procesos asíncronos
├── frontend/
│   └── src/
│       ├── app/              # rutas, layouts y pantallas de Next.js
│       ├── components/       # componentes reutilizables y composiciones de pantalla
│       ├── services/         # clientes HTTP por dominio
│       ├── hooks/            # lógica reutilizable de React
│       ├── stores/           # estado global de interfaz
│       ├── lib/              # utilidades, tipos y cliente HTTP común
│       └── config/           # configuración de la aplicación
└── docs/
    ├── arquitectura/         # decisiones de estructura y diseño
    └── cambios/              # registro de cambios relevantes
```

No se movieron en bloque las rutas ni los componentes existentes. En Next.js,
la ubicación de una pantalla determina su URL; trasladarlas sin una batería de
pruebas de navegación sería un riesgo innecesario para un sistema que ya está
funcionando. Los componentes de pantalla que viven temporalmente en
`frontend/src/components/dashboard/**` siguen importados por rutas de
`frontend/src/app/**` y, por tanto, no son archivos huérfanos.

## Patrón para cambios nuevos

### Backend

Cada capacidad de negocio debe vivir en `backend/src/modules/<dominio>/`:

```text
<dominio>/
├── <dominio>.routes.ts
├── <dominio>.controller.ts
├── <dominio>.service.ts
├── <dominio>.schema.ts       # validación de entrada
└── <dominio>.types.ts        # contratos propios del dominio
```

Las rutas se registran en `src/app.ts`. Los servicios no deben depender de
Express; las integraciones compartidas se incorporan en `src/lib` o `src/config`.

### Frontend

Las rutas conservan su ubicación dentro de `src/app`. Para funcionalidad nueva
que crezca más de una pantalla, se recomienda añadir un dominio en
`src/features/<dominio>/` con `components`, `hooks`, `services` y `types`, y
mantener en `app` solo el adaptador de ruta. La migración de un dominio existente
debe hacerse de uno en uno, actualizando sus importaciones y validando su ruta.

Los componentes genéricos continúan en `src/components/ui`; los componentes
específicos no se deben añadir a esa carpeta.

## Base de datos

`backend/prisma` es la única ubicación de base de datos del repositorio:

```text
backend/prisma/
├── schema.prisma             # modelo declarativo vigente
├── migrations/               # historial inmutable aplicado a las bases de datos
├── seed.ts                   # punto de entrada de la semilla
├── seed_data.ts              # datos estructurados de la semilla
└── *.csv                     # insumos que lee la semilla
```

Las migraciones ya aplicadas no se renombran, reordenan ni editan: hacerlo
rompería la trazabilidad de bases de datos existentes. Toda modificación de
estructura se realiza mediante una migración nueva desde `backend`:

```powershell
cd backend
npm run db:migrate -- --name descripcion_del_cambio
npm run db:generate
```

Antes de agregar una tabla, se debe identificar su módulo propietario; las
consultas de esa tabla viven en el servicio de dicho módulo. Para campos usados
en filtros o uniones frecuentes se deben añadir índices explícitos en
`schema.prisma` y validarlos con una migración nueva. Las semillas no deben
alterar el esquema con SQL ad-hoc: los cambios de columna pertenecen a
migraciones.

## Reglas de limpieza

- Los artefactos generados (`.next`, `dist`, `build` y `*.tsbuildinfo`) no se
  versionan.
- Un archivo solo se elimina después de comprobar que no es entrada de scripts,
  configuración de despliegue ni referencia de código.
- Las dependencias se gestionan dentro de `frontend` y `backend`; no se crea un
  `package-lock.json` en la raíz mientras no exista un `package.json` raíz.
- Los cambios de dependencias que ya estuvieran en el árbol de trabajo se
  conservan y no forman parte de esta limpieza.
