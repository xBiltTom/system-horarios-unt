# Sistema Integral de Gestión de Horarios Académicos - UNT

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-14.2-black?logo=next.js)
![Node.js](https://img.shields.io/badge/Node.js-20.x-green?logo=node.js)
![Prisma](https://img.shields.io/badge/Prisma-ORM-blue?logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?logo=postgresql)
![Redis](https://img.shields.io/badge/Redis-Cache%20%26%20Queues-red?logo=redis)

## 📌 Descripción del Proyecto

El **Sistema Integral de Gestión de Horarios Académicos** es una plataforma moderna, robusta y escalable desarrollada específicamente para la **Universidad Nacional de Trujillo (UNT)**. Su propósito central es optimizar, auditar y automatizar el crítico proceso de asignación de carga lectiva y no lectiva, la gestión de disponibilidad de docentes, el control exhaustivo de los ambientes físicos y la emisión automatizada de reportes institucionales.

El sistema elimina la redundancia de datos y las colisiones de horarios mediante algoritmos de validación en tiempo real (vía WebSockets), colas de procesamiento asíncrono y una arquitectura transaccional de alto rendimiento. Además, incorpora inteligencia artificial (IA) de vanguardia para asistir a los usuarios operativos en la toma de decisiones y consulta de bases de datos complejas mediante lenguaje natural.

---

## ✨ Características Principales

- **Gestión Inteligente de Carga Lectiva:** Asignación estructurada de docentes a cursos teóricos, prácticos y de laboratorio, garantizando matemáticamente la no superposición de horas y ambientes.
- **Carga No Lectiva (Declaración Jurada):** Interfaz dedicada para el registro y validación de actividades complementarias (investigación, tutoría, preparación de clases, cargos administrativos), asegurando el cumplimiento de la normativa universitaria.
- **Ventanas de Atención Dinámicas:** Control estricto de tiempos y plazos mediante la apertura de "ventanas de atención" configurables, bloqueando ediciones fuera de fecha.
- **Auditoría y Trazabilidad (Logging):** Registro inmutable de acciones. Capacidad para auditar quién, cuándo, desde dónde y qué exactamente se modificó en el ecosistema de datos.
- **Asistente UNT (Integración IA):** Módulo conversacional avanzado alimentado por *Google AI Studio*, configurado estrictamente bajo lineamientos institucionales para resolver consultas operativas según las credenciales del usuario.
- **Motor de Reportes Asíncronos:** Generación de formatos oficiales en PDF y Excel de alto peso informático manejados en background mediante `BullMQ` y `Redis`, evitando el bloqueo del flujo de la interfaz de usuario.

---

## 🛠️ Arquitectura y Stack Tecnológico

El proyecto ha sido concebido bajo un enfoque Full-Stack utilizando **TypeScript** de extremo a extremo, empleando un paradigma cliente-servidor totalmente desacoplado.

### Frontend (Cliente UI/UX)
- **Framework Core:** Next.js 14 (App Router)
- **Lenguaje:** TypeScript estricto.
- **Estilos:** Tailwind CSS. (Arquitectura de tokens de diseño "Dossier Académico" con soporte 100% nativo y reactivo de Modo Claro/Oscuro).
- **Manejo de Estado:** Zustand (estado global ligero) & React Query (Cacheo, Fetching, Mutaciones).
- **UI & Iconografía:** Componentes base accesibles y minimalistas (inspirados en shadcn/ui) renderizados junto a la librería de íconos Lucide.

### Backend (Servidor API REST)
- **Framework Core:** Node.js con Express.
- **Arquitectura:** Estructura modular orientada a dominio (Domain-Driven Design simplificado).
- **Base de Datos y ORM:** PostgreSQL 16 administrado a través de Prisma ORM.
- **Caché y Mensajería:** Instancia de Redis gestionada por BullMQ para tareas en segundo plano.
- **Tiempo Real:** Servidor Socket.io adjunto para broadcast de disponibilidad de aulas.
- **Inteligencia Artificial:** Google Generative AI SDK (Prompts inyectados con contexto RBAC).

---

## 📂 Estructura del Repositorio

La disposición de los directorios ha sido limpiada y refactorizada para asegurar su escalabilidad y mantenibilidad por múltiples equipos:

```text
system-horarios-unt/
├── backend/                  # API REST y Capa de Negocio
│   ├── prisma/               # Modelos, esquemas relacionales y migraciones
│   └── src/
│       ├── app.ts            # Bootstrapping de Express
│       ├── cola/             # Definición de colas de tareas (Reportes, Emails)
│       ├── config/           # Inicializadores de infraestructura (DB, Redis, JWT)
│       ├── lib/              # Utilidades puras, constantes y tipado global
│       ├── middleware/       # Middlewares de Express (Autenticación, RBAC, Rate-Limit)
│       ├── modules/          # Los 18 dominios del negocio (Cursos, Horarios, Auth, Chat, etc.)
│       ├── websocket/        # Setup de Socket.io y despachadores de eventos
│       └── workers/          # Consumidores (Workers) de las colas BullMQ
├── frontend/                 # Interfaz de Usuario y SSR (Next.js)
│   └── src/
│       ├── app/              # Segmentos de ruta, Layouts y Pages (App Router)
│       ├── components/       # Componentes desacoplados (UI core, modales, widgets)
│       ├── config/           # Variables de entorno cliente
│       ├── hooks/            # Encapsulación de lógica React (WebSockets, mutaciones)
│       ├── lib/              # Funciones auxiliares y formateadores
│       ├── services/         # Clientes Axios estructurados por dominio para consumir la API
│       └── stores/           # Stores globales persistentes (Zustand)
├── docs/                     # Repositorio de requerimientos, esquemas markdown y manuales
├── docker-compose.yml        # Archivo de orquestación local (DB y Caché)
└── README.md                 # Documentación técnica principal
```

---

## 👥 Módulos y Perfiles de Acceso (RBAC)

La plataforma garantiza la integridad de la información mediante un control de acceso estricto basado en roles. El JSON Web Token (JWT) dictamina el acceso y filtra las operaciones de base de datos.

1. **Administrador (Root):** Acceso irrestricto y de configuración de superusuario. Gestiona los metadatos troncales (escuelas, ciclos), despliegue de llaves de mensajería y revisión pura del historial de auditoría global.
2. **Director de Escuela:** Visión macroestratégica. Ingresa a la interfaz analítica (Dashboard) para examinar métricas consolidadas, total de vacantes cubiertas y horas dictadas por ciclo o categoría docente.
3. **Secretaria Académica (Operador):** Eje operativo administrativo. Administra la vigencia de los periodos, configura y abre las "Ventanas de Atención", resuelve colisiones forzadas y despacha los reportes consolidados en lote.
4. **Docente:** El cliente final de la interfaz de declaración. Observa el currículo a su cargo, selecciona celdas de dictado, especifica sus horas administrativas y genera su "Anexo Oficial". Su vista se comporta como un Ledger/Dossier de lectura cuando la ventana está cerrada.

---

## 🚀 Flujo Operativo Principal

1. **Apertura y Parametrización:** El Director o la Secretaria inaugura el "Periodo Académico Vigente" y sincroniza los currículos en el sistema.
2. **Definición de Límites:** La administración configura las "Ventanas de Atención" determinando fechas precisas en las que el portal de selección horaria se habilita para la plana docente.
3. **Ingreso y Formulación:** El docente inicia sesión de manera segura. Al entrar, visualiza su Carga Lectiva asignada (Top-down) y procede a seleccionar los horarios semanales de dictado, además de declarar sus horas investigativas.
4. **Validación Reactiva (Live):** Mientras se construyen las celdas de tiempo, el sistema consulta en memoria (vía Redis/WebSockets) si el aula o la franja horaria acaban de ser ocupadas por otro docente, evitando cruces antes del `submit`.
5. **Cierre y Consolidación:** La ventana de tiempo culmina. El servidor bloquea automáticamente las escrituras. El sistema compila y encola en background la generación masiva de Anexos PDF, enviando las notificaciones correspondientes por correo.

---

## 🔒 Seguridad y Manejo de Errores

El proyecto implementa capas densas de validación y seguridad:
- **Rate Limiting:** Prevención activa contra ataques de denegación de servicio (DDoS) a nivel de Express.
- **Hashing y Autenticación:** Cifrado Bcrypt para passwords, con rotación segura de tokens JWT (Access & Refresh tokens).
- **Zod Schemas:** La validación de los Request Payload está asegurada por Zod, cortando peticiones malformadas antes de que toquen el controlador.
- **Transacciones ACID:** Los guardados de horario complejos (múltiples tablas interconectadas) utilizan el motor transaccional de Prisma para que, ante cualquier falla, se ejecute un `rollback` automático garantizando consistencia pura.

---

## ⚙️ Instalación y Configuración (Guía de Desarrollo)

Se requiere **Node.js (v20+)**, **PostgreSQL (v16)**, **Redis** instalados localmente y `pnpm` como manejador de dependencias.

### 1. Infraestructura Inmediata (Docker)
Recomendamos inicializar los motores de persistencia utilizando los contenedores orquestados:
```bash
docker-compose up -d
```
*(Esto levantará PostgreSQL en el puerto 5432 y Redis en el puerto 6379).*

### 2. Puesta en marcha del Servidor (Backend)
```bash
cd backend
pnpm install

# Crea tu archivo .env basándote en .env.example
# cp .env.example .env

# Sincroniza la estructura de la base de datos
pnpm run prisma:migrate

# Ejecuta el servidor (Cargará en el puerto 4000 por defecto)
pnpm run dev
```

### 3. Puesta en marcha del Cliente (Frontend)
```bash
cd frontend
pnpm install

# Crea tu archivo .env.local y configura NEXT_PUBLIC_API_URL
# cp .env.example .env.local

# Ejecuta el servidor Next.js
pnpm run dev
```
*(Navegar a http://localhost:3000)*

---

## 📜 Scripts y Comandos (`pnpm`)

### Entorno Backend
- `pnpm run dev`: Inicia en modo de vigilancia local usando `ts-node` y `nodemon`.
- `pnpm run build`: Transpila estrictamente el código a la carpeta `/dist`.
- `pnpm start`: Ejecuta el entorno puro de producción (Node.js sobre `/dist`).
- `pnpm run seed`: Puebla la base de datos con un árbol de datos falsos pero coherentes institucionales (Ciclos, Docentes, Cursos) para pruebas de integración.

### Entorno Frontend
- `pnpm run dev`: Ejecuta el servidor Next.js con HMR (Hot Module Replacement).
- `pnpm run build`: Construye el paquete de producción en la carpeta `.next`.
- `pnpm start`: Arranca el servidor SSR optimizado para la red productiva.
- `pnpm run lint`: Realiza un análisis profundo de ESLint para asegurar convenciones.

---

## 🎨 Tesis de Diseño (UI/UX)

La aplicación web ha sido elaborada bajo una fuerte filosofía **Frontend-Design**, rechazando deliberadamente estilos "genéricos o de plantilla". El aspecto emula la distinción de una entidad universitaria consolidada.

- **Identidad Visual:** "Dossier y Consola Operativa".
- **Colorimetría Institucional:** Se utiliza el *Azul Marino Profundo* (Deep Navy `#0A192F`) y acentos *Oro Puro* (Gold `#D4AF37`) contrastados contra fondos gélidos (Slate-50) para lograr una jerarquía absoluta de lectura.
- **Soporte Responsivo y Bi-Modal:** Se incorporó un sistema tipográfico *pixel-perfect* (Inter/Outfit) que muta elegantemente al modo oscuro. Al activarse el Dark Mode, la aplicación adopta la estética de un "HUD" táctico o consola central, sin sacrificar la legibilidad de documentos, reportes y tablas matriciales.
- **Micro-interacciones:** Retroalimentación constante en cada click mediante modales sutiles, *hover-states* de alto nivel y transiciones suaves impulsadas por la aceleración GPU de Tailwind.

---

## 🤖 El "Asistente UNT" (Ingeniería Prompt - Gemini)

La asistencia al usuario está cubierta por una IA embebida accesible desde cualquier pantalla del sistema administrativo.
- **El Motor:** Respaldado por *Google Generative AI (Gemini 3.5 Flash)*.
- **Restricción Conceptual:** Se ha programado su cerebro algorítmico mediante un Prompt altamente restrictivo para responder exclusivamente con carácter *institucional, sobrio y técnico*, emulando un submódulo lógico del sistema, lejos del trato coloquial clásico de un bot.
- **Contexto de Seguridad:** El Asistente extrae silenciosamente de la sesión JWT el nivel de autorización ("Rol") de quien consulta. Esto le permite recomendar reportes a un director o denegar comandos fuera de alcance a un usuario final.

---

## 💻 Créditos y Autoría

Desarrollo integral planificado y escrito a medida para abordar las falencias estructurales y analógicas del manejo de horarios de la Universidad Nacional de Trujillo. 
Arquitectado sobre metodologías de **Clean Code**, **Separation of Concerns (SoC)** y enrutamiento predictivo.

---
*© 2026 Universidad Nacional de Trujillo.*
