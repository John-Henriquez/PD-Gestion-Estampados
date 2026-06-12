# PD — Gestión de Estampados

Plataforma web full-stack para talleres de estampado. Centraliza la gestión de inventario por color y talla, el control de pedidos con pasarela de pago integrada, y expone un panel administrativo con reportes y trazabilidad completa de movimientos.

> Proyecto de tesis universitaria — arquitectura orientada a producción con React, Node.js, PostgreSQL y Docker.

---

## Tabla de contenidos

- [Descripción](#descripción)
- [Stack tecnológico](#stack-tecnológico)
- [Funcionalidades](#funcionalidades)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Instalación y uso](#instalación-y-uso)
- [Variables de entorno](#variables-de-entorno)
- [API — resumen de endpoints](#api--resumen-de-endpoints)
- [Screenshots](#screenshots)
- [Autor](#autor)

---

## Descripción

Los talleres de estampado manejan inventario multidimensional: un mismo producto existe en combinaciones de tipo, color y talla, cada una con su propio stock. PD-Gestión-Estampados resuelve ese problema con:

- Un **inventario estructurado** por tipo de ítem, color y talla, con niveles mínimos configurables y alertas de stock crítico.
- Un **e-commerce** que permite compras como usuario registrado o como invitado, con integración a MercadoPago.
- Un **panel administrativo** con dashboard de ventas, historial de movimientos de inventario, gestión de packs/promociones y reportes exportables.
- **Trazabilidad completa**: cada movimiento de stock queda registrado con operación, cantidad, responsable y snapshot del estado del ítem.

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | React 18, Vite, React Router, Context API |
| Backend | Node.js, Express, Passport JWT |
| Base de datos | PostgreSQL, TypeORM |
| Pagos | MercadoPago SDK |
| Contenedores | Docker, Docker Compose |
| Validación | Joi |
| Email | Nodemailer |

---

## Funcionalidades

### Panel administrativo
- Dashboard con gráficos de ventas, categorías y stock crítico
- Gestión de inventario: tipos de ítems, colores, tallas, niveles de estampado
- Historial de movimientos con filtros por operación, fecha y responsable
- Gestión de packs y promociones con vigencia y descuentos
- Administración de pedidos con cambio de estado
- Gestión de usuarios y roles
- Papelera con soft-delete y restauración de ítems

### Tienda
- Catálogo de productos y packs
- Carrito de compras persistente
- Checkout para usuarios registrados e invitados
- Integración con MercadoPago (redirect flow)
- Confirmación de pedido por email
- Historial de pedidos del usuario

### Sistema
- Autenticación JWT con cookies HttpOnly
- Control de acceso basado en roles (`administrador` / `usuario`)
- Geografía chilena precargada (regiones, comunas, zonas de despacho)
- Generación de PDF de comprobantes
- Upload de imágenes con validación de tipo y extensión

---

## Estructura del proyecto

```
pd-gestion-estampados/
├── docker-compose.yml
├── backend/
│   └── src/
│       ├── config/          # DB, env, setup inicial
│       ├── constants/       # Datos estáticos (colores, geografía, operaciones, tarifas)
│       ├── controllers/     # Manejo de requests HTTP
│       ├── entity/          # Entidades TypeORM (esquemas de BD)
│       ├── helpers/         # bcrypt, RUT, facturación
│       ├── middlewares/     # Auth JWT, autorización, upload
│       ├── routes/          # Definición de endpoints
│       ├── services/        # Lógica de negocio
│       └── validations/     # Esquemas Joi
└── frontend/
    └── src/
        ├── components/      # UI reutilizable y componentes por dominio
        ├── context/         # AuthContext, CartContext
        ├── hooks/           # Custom hooks por entidad
        ├── pages/           # Vistas (tienda, admin, auth)
        ├── services/        # Llamadas a la API
        └── styles/          # CSS modular por componente y página
```

---

## Instalación y uso

### Con Docker (recomendado)

```bash
# 1. Clonar el repositorio
git clone https://github.com/John-Henriquez/PD-Gestion-Estampados.git
cd PD-Gestion-Estampados

# 2. Copiar y completar variables de entorno
cp .env.example .env

# 3. Levantar servicios
docker compose up --build
```

El backend queda disponible en `http://localhost:3000` y el frontend en `http://localhost:5173`.

### Sin Docker

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend (en otra terminal)
cd frontend
npm install
npm run dev
```

---

## Variables de entorno

Copiar `.env.example` a `.env` y completar los valores:

```env
# Base de datos
HOST=localhost
DB_USERNAME=
PASSWORD=
DATABASE=

# Servidor
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
ALLOWED_ORIGINS=http://localhost:5173

# Seguridad
ACCESS_TOKEN_SECRET=
cookieKey=

# Admin inicial (seed)
ADMIN_EMAIL=
ADMIN_PASSWORD=
ADMIN_RUT=

# Email
EMAIL_USER=
EMAIL_PASS=

# MercadoPago
MP_ACCESS_TOKEN=
```

---

## API — resumen de endpoints

| Módulo | Base | Descripción |
|---|---|---|
| Auth | `/api/auth` | Login, registro, logout |
| Usuarios | `/api/users` | CRUD de usuarios (admin) |
| Inventario | `/api/item-types` `/api/item-stock` | Tipos de ítem y stock |
| Colores | `/api/colors` | Catálogo de colores |
| Packs | `/api/packs` | Gestión de promociones |
| Pedidos | `/api/orders` | Creación y gestión de órdenes |
| Pagos | `/api/payment` | Integración MercadoPago |
| Movimientos | `/api/inventory-movements` | Historial de stock |
| Reportes | `/api/reports` | Exportación de datos |
| Geografía | `/api/geography` | Regiones y comunas |
| Archivos | `/api/upload` | Subida de imágenes |

---

## Screenshots

> _Próximamente — panel de administración, vista de tienda y detalle de pedido._

---

## Autor

**John Henríquez**
[GitHub](https://github.com/John-Henriquez)

---

_Desarrollado como proyecto de tesis — arquitectura refactorizada a estándar de producción en rama `refactor-v2`._