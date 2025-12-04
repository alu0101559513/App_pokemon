# Proyecto-E09 - Pokémon Trading Platform

**Plataforma de intercambio de cartas Pokémon TCG con trading en tiempo real, gestión de colecciones y notificaciones.**

Proyecto desarrollado con **Node.js, Express, TypeScript y MongoDB** en el backend, y **React, Redux Toolkit y Tailwind CSS** en el frontend.

## Descripción

Aplicación full-stack para coleccionistas de cartas Pokémon TCG que permite:

- **Trading de Cartas**: Intercambiar cartas con otros usuarios (público o privado)
- **Gestión de Colección**: Organizar y valorar tu colección personal
- **Wishlist**: Lista de deseos de cartas que quieres obtener
- **Comunicación en Tiempo Real**: Chat privado y notificaciones de trading vía Socket.io
- **Búsqueda de Cartas**: Acceso a base de datos completa de cartas Pokémon TCG
- **Multiidioma**: Soporte para Español e Inglés
- **Sistema de Amistad**: Conecta con otros coleccionistas

## Tecnologías

### Backend
- **Node.js** - Entorno de ejecución de JavaScript
- **Express** - Framework web minimalista
- **TypeScript** - Lenguaje tipado para JavaScript
- **MongoDB** - Base de datos NoSQL
- **Mongoose** - ODM (Object Document Mapper) para MongoDB
- **Socket.io** - WebSockets para comunicación en tiempo real
- **JWT** - Autenticación con tokens
- **bcryptjs** - Hashing seguro de contraseñas

### Frontend
- **React** - Librería de UI componentes
- **TypeScript** - Tipado estático
- **Redux Toolkit** - Gestión de estado
- **Vite** - Build tool moderno
- **Tailwind CSS** - Framework CSS utilitario
- **i18next** - Internacionalización
- **Socket.io Client** - Cliente de WebSockets

### Testing
- **Vitest** - Framework de testing rápido
- **Selenium** - Testing E2E
- **Supertest** - Testing de API HTTP

## Instalación

### Requisitos previos
- Node.js (v16+)
- MongoDB (local o Atlas)
- npm o yarn

### Pasos

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/SyTW2526/Proyecto-E09.git
   cd Proyecto-E09
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   Crea un archivo `.env` en la raíz:
   ```env
   # Base de datos
   MONGODB_URL=mongodb+srv://usuario:contraseña@cluster.mongodb.net/pokemon-trading
   
   # Autenticación
   JWT_SECRET=tu-clave-secreta-muy-segura
   
   # Servidor
   PORT=3000
   NODE_ENV=development
   ```

## Ejecución

### Desarrollo

**Cliente (React) - Terminal 1:**
```bash
npm run dev:client
```
Abre http://localhost:5173

**Servidor (Express) - Terminal 2:**
```bash
npm run dev:server
```
Servidor en http://localhost:3000

### Compilar para Producción

```bash
npm run build
```

Genera:
- `dist/client/` - Aplicación React compilada
- `dist/server/` - Servidor compilado

### Ejecutar en Producción

```bash
npm start
```

## Estructura del Proyecto

```
Proyecto-E09/
├── src/
│   ├── server/
│   │   ├── index.ts                  # Servidor principal con Socket.io
│   │   ├── api.ts                    # Configuración de Express
│   │   ├── db/
│   │   │   └── mongoose.ts           # Conexión a MongoDB
│   │   ├── models/                   # Esquemas de Mongoose
│   │   │   ├── User.ts
│   │   │   ├── PokemonCard.ts
│   │   │   ├── Card.ts
│   │   │   ├── Trade.ts
│   │   │   ├── TradeRequest.ts
│   │   │   ├── UserCard.ts
│   │   │   └── ... (otros modelos)
│   │   ├── routers/                  # Rutas de API
│   │   │   ├── users.ts              # Auth, perfil, amigos (1068 líneas)
│   │   │   ├── pokemon.ts            # Búsqueda de cartas
│   │   │   ├── card.ts               # Gestión de cartas
│   │   │   ├── usercard.ts
│   │   │   ├── trade.ts
│   │   │   ├── trade_request.ts
│   │   │   ├── notification.ts
│   │   │   ├── preferences.ts
│   │   │   └── ... (otros routers)
│   │   ├── services/                 # Lógica de negocio
│   │   │   ├── pokemon.ts            # Integración con API tcgDex
│   │   │   ├── cards.ts              # Sincronización de cartas
│   │   │   └── tcgdx.ts              # Utilidades de TCGdex
│   │   └── middleware/
│   │       └── authMiddleware.ts     # Autenticación JWT
│   │
│   └── client/
│       ├── main.tsx                  # Punto de entrada React
│       ├── App.tsx                   # Componente raíz
│       ├── types.ts                  # Interfaces TypeScript
│       ├── socket.ts                 # Socket.io client
│       ├── services/
│       │   ├── apiService.ts         # Llamadas API REST
│       │   └── authService.ts        # Autenticación
│       ├── store/
│       │   └── store.ts              # Configuración de Redux
│       ├── features/                 # Redux slices
│       │   ├── cards/
│       │   ├── users/
│       │   ├── trades/
│       │   ├── collection/
│       │   └── ... (otros slices)
│       ├── hooks/
│       │   └── useLanguage.ts
│       ├── i18n/                     # Internacionalización
│       ├── pages/
│       ├── components/
│       └── styles/
│
├── test/                             # Archivos de prueba
│   ├── e2e/
│   ├── individuales/
│   └── selenium/
│
├── vite.config.ts                    # Configuración de Vite
├── vitest.config.ts                  # Configuración de Vitest
├── tailwind.config.js                # Configuración de Tailwind
├── DOCUMENTATION.md                  # Documentación detallada
├── README.md                         # Este archivo
└── package.json                      # Dependencias y scripts
```

## Endpoints Principales de API

### Autenticación
- `POST /users/register` - Registrar nuevo usuario
- `POST /users/login` - Iniciar sesión
- `GET /users/profile` - Obtener perfil (requiere auth)

### Cartas
- `GET /cards` - Listar cartas paginadas
- `GET /cards/featured` - Cartas destacadas
- `GET /cards/search?q=...` - Búsqueda de cartas
- `GET /pokemon/cards/:id` - Detalle de carta

### Trading
- `POST /trades` - Iniciar trading
- `PATCH /trades/:id` - Actualizar estado de trade
- `GET /trades` - Mis trades
- `POST /trade-requests` - Solicitar carta específica

### Colección
- `GET /usercards` - Mi colección
- `POST /usercards` - Agregar carta
- `PATCH /usercards/:id` - Editar carta
- `DELETE /usercards/:id` - Eliminar carta

### Notificaciones
- `GET /notifications` - Mis notificaciones
- `PATCH /notifications/:id/read` - Marcar como leída

##  Flujos de Negocio Principales

### 1. Autenticación y Registro
1. Usuario se registra con username, email y contraseña
2. Contraseña se hashea con bcryptjs 
3. Usuario recibe JWT para autenticación
4. JWT se almacena en localStorage
5. Se usa para autorizar solicitudes HTTP y Socket.io

### 2. Trading entre Usuarios
1. Usuario A inicia trade con Usuario B (público o privado)
2. Si es privado, se genera código de sala único
3. Usuario B recibe notificación y acepta/rechaza
4. En salas privadas, Socket.io permite chat en tiempo real
5. Ambos usuarios seleccionan cartas a intercambiar
6. Sistema valida diferencia de valor (máx 10% en público)
7. Ambos confirman el intercambio
8. Trade se marca como completado

### 3. Gestión de Colección
1. Usuario ve cartas que posee
2. Puede editar: condición, visibilidad, favoritas, para trade
3. Valor se calcula automáticamente
4. Puede crear wishlist de cartas deseadas
5. Ve estadísticas de colección

### 4. Búsqueda de Cartas
1. Usuario busca carta por nombre/atributos
2. Se busca primero en BD local (para velocidad)
3. Opción de buscar en API tcgDex en tiempo real
4. Resultados muestran precios de múltiples mercados
5. Puede guardar cartas favoritas

## Testing

### Ejecutar Tests
```bash
npm run test
```

### Coverage
```bash
npm run test:coverage
```

### E2E con Selenium
```bash
npm run test:e2e
```

## Idiomas

La aplicación soporta:
- **Español (es)** - Idioma por defecto
- **Inglés (en)**

El idioma se detecta automáticamente del navegador y se puede cambiar manualmente.

## Variables de Entorno

### Backend (.env)
```env
MONGODB_URL=mongodb+srv://...     # URL de MongoDB Atlas o local
JWT_SECRET=tu-clave-secreta       # Clave para firmar JWTs
PORT=3000                         # Puerto del servidor
NODE_ENV=development              # Entorno (development/production)
```

### Frontend (automático desde Vite)
- API_BASE_URL=http://localhost:3000 (desarrollo)
- VITE_API_URL=... (producción en .env.production)

## Autores del Proyecto

Proyecto E09 - Universidad (SyTW2526)
- **Marta Rosa Cordero**
- **Abdón Senén Meléndez Díaz**
- **Iker Díaz Cabrera**

## Licencia

Proyecto educativo de la Universidad.

**Última actualización:** Diciembre 4, 2025

**Estado del Proyecto:** En desarrollo activo 
