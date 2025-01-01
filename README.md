# Order Management System with Real-time Chat

## Overview
This is a robust **Order Management System** built with **NestJS**, featuring real-time chat functionality for order discussions. The system allows users to create orders, manage them, and communicate about order details through an integrated chat system.

---

## Key Features

- **User Authentication** with JWT
- **Role-based Access Control** (Admin/Regular users)
- **Order Management System**
- **Real-time Chat Functionality** using WebSockets
- **PostgreSQL Database** with Prisma ORM
- **API Documentation** with Swagger
- **Comprehensive Test Coverage**
- **Docker Support**

---

## System Architecture

### Core Modules
1. **Auth Module**: Handles user authentication and authorization.
2. **Orders Module**: Manages order creation and processing.
3. **Chat Module**: Provides real-time communication features.
4. **Users Module**: Handles user management.
5. **Prisma Module**: Database connectivity and operations.

### Database Schema
The system uses PostgreSQL with the following main entities:
- **Users** (Admin/Regular roles)
- **Orders**
- **ChatRooms**
- **Messages**

---

## Prerequisites

- **Node.js** (v20 or higher)
- **PostgreSQL**
- **Docker**

---

## Installation

### Steps to Install
1. Clone the repository.
2. Install dependencies:

```bash
npm install
```

3. Configure environment variables in a `.env` file:

```env
DATABASE_URL="postgresql://user:password@localhost:5434/dbname"
JWT_SECRET="your-secret-key"
JWT_ACCESS_EXPIRATION="15m"
PORT=8000
POSTGRES_DB=your_db_name
POSTGRES_USER=your_user
POSTGRES_PASSWORD=your_password
```

---

## Running the Application

### Using Docker

```bash
npm run start:docker
```

### Development Mode

```bash
npm run start:dev
```

### Production Mode

```bash
npm run build
npm run start:prod
```

---

## API Documentation

Once the application is running, access the **Swagger documentation** at:

```
http://localhost:8000/docs
```

---

## WebSocket Events

The chat system supports the following WebSocket events:

1. **joinRoom**: Join a specific chat room.
2. **sendMessage**: Send a message in a chat room.
3. **closeRoom**: Close a chat room (Admin only).

---

## Testing

### Running Tests

#### End-to-End Tests

```bash
npm run test:e2e -- auth.e2e-spec.ts
npm run test:e2e -- orders.e2e-spec.ts
npm run test:e2e -- chat.e2e-spec.ts
npm run test:e2e -- users.e2e-spec.ts
```

---

## Database Management

### Prisma Commands

- **Generate Prisma Client**

```bash
npm run prisma:generate:client
```

- **Run Migrations**

```bash
npm run prisma:deploy
```

- **View Database**

```bash
npm run prisma:view
```

---

## Security Features

The application implements several security measures:
- **JWT-based Authentication**
- **Role-based Access Control**
- **Rate Limiting**
- **Helmet Security Headers**
- **CORS Protection**

---

## Code Structure

The main application code is organized as follows:

```plaintext
src/
├── main.ts
├── app.module.ts
├── common/
│   ├── decorators/
│   ├── guards/
│   ├── filters/
│   └── interfaces/
├── modules/
│   ├── auth/
│   ├── users/
│   ├── orders/
│   └── chat/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
└── test/
    ├── e2e/
    │   ├── auth.e2e-spec.ts
    │   ├── chat.e2e-spec.ts
    │   ├── orders.e2e-spec.ts
    │   └── users.e2e-spec.ts
    ├── unit/
    │   ├── auth/
    │   │   ├── auth.controller.spec.ts
    │   │   └── auth.service.spec.ts
    │   ├── users/
    │   │   ├── users.controller.spec.ts
    │   │   └── users.service.spec.ts
    │   ├── orders/
    │   │   ├── orders.controller.spec.ts
    │   │   └── orders.service.spec.ts
    │   └── chat/
    │       ├── chat.controller.spec.ts
    │       └── chat.service.spec.ts
    └── jest-e2e.json
```

---
