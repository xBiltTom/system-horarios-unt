# Arquitectura del Sistema - Gestión de Horarios UNT

A continuación se detalla la arquitectura de alto nivel del sistema, ilustrando la separación de responsabilidades, el flujo de información y el stack tecnológico utilizado para garantizar un entorno seguro, reactivo y de alto rendimiento.

```mermaid
flowchart TD
    %% Define Styles
    classDef actor fill:#0A192F,stroke:#D4AF37,stroke-width:2px,color:#FFF,font-weight:bold;
    classDef frontend fill:#1E293B,stroke:#38BDF8,stroke-width:2px,color:#FFF;
    classDef backend fill:#166534,stroke:#4ADE80,stroke-width:2px,color:#FFF;
    classDef database fill:#1E3A8A,stroke:#60A5FA,stroke-width:2px,color:#FFF;
    classDef external fill:#7F1D1D,stroke:#F87171,stroke-width:2px,color:#FFF;
    classDef queue fill:#854D0E,stroke:#FACC15,stroke-width:2px,color:#FFF;

    %% Actors
    subgraph Usuarios ["👥 Usuarios (RBAC)"]
        direction LR
        A_Admin(["Administrador"]):::actor
        A_Director(["Director de escuela"]):::actor
        A_Secretaria(["Secretaria Académica"]):::actor
        A_Docente(["Docente (Usuario Final)"]):::actor
    end

    %% Frontend
    subgraph Frontend ["💻 Frontend (Next.js 14)"]
        direction TB
        UI["App Router & UI (Tailwind CSS)"]:::frontend
        Store["Zustand (Estado Local)"]:::frontend
        Query["React Query (Caché & Fetching)"]:::frontend
        SocketClient["Socket.io Client"]:::frontend
        
        UI <--> Store
        UI <--> Query
        UI <--> SocketClient
    end

    %% Backend
    subgraph Backend ["⚙️ Backend (Node.js + Express)"]
        direction TB
        Router["Rutas & Controladores"]:::backend
        Middleware["Middlewares (Auth JWT, Zod RBAC)"]:::backend
        Services["Servicios (Lógica de Negocio)"]:::backend
        SocketServer["Socket.io Server"]:::backend
        
        Router --> Middleware
        Middleware --> Services
        SocketServer <--> Services
    end

    %% Data Layer
    subgraph DataLayer ["🗄️ Capa de Datos & Background Jobs"]
        direction LR
        Prisma["Prisma ORM"]:::database
        PostgreSQL[("PostgreSQL 16")]:::database
        Redis[("Redis (Pub/Sub & Caché)")]:::queue
        BullMQ["BullMQ (Workers)"]:::queue
        
        Prisma --> PostgreSQL
        BullMQ <--> Redis
    end

    %% External Services
    subgraph External ["🌐 Integraciones Externas"]
        direction LR
        Gemini["Google Gemini (Chatbot IA)"]:::external
    end

    %% Connections
    A_Admin --> UI
    A_Director --> UI
    A_Secretaria --> UI
    A_Docente --> UI

    Query <-->|REST API - JSON| Router
    SocketClient <-->|WebSockets - Live Updates| SocketServer

    Services <-->|Querys y Transacciones ACID| Prisma
    Services -->|Encola Tareas Pesadas| BullMQ
    SocketServer <-->|Sincronizacion| Redis

    BullMQ -->|Despacha correos masivos| Email
    Services <-->|Consultas de Consola| Gemini
```

### Notas Arquitectónicas

1. **Desacoplamiento Total:** El Frontend (Next.js) y el Backend (Node.js) se comunican exclusivamente mediante interfaces RESTful y WebSockets. No existe renderizado del lado del servidor (SSR) acoplado a la lógica de negocio.
2. **Alta Concurrencia:** Durante la "Selección de Horarios", el `Socket.io Server` y `Redis` mantienen en memoria el bloqueo temporal de celdas para prevenir que dos docentes escojan la misma aula/hora de forma simultánea.
3. **Procesamiento Asíncrono:** La generación masiva de Anexos en PDF y envíos de notificaciones recaen en `BullMQ`, evitando el cuello de botella en los `Services` de Express.
4. **Inteligencia Artificial Segura:** El servicio de chat interactúa con `Google Gemini` asegurando enviar contexto estricto, logrando que el "Asistente UNT" responda bajo el perfil del usuario autenticado (RBAC).
