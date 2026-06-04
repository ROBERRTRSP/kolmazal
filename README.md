# KolMazal - Voz de la Suerte

Plataforma web moderna para venta de jugadas de lotería dominicana por voz, chat, QR y cajero.

## Stack

- Next.js 15+
- React + TypeScript
- TailwindCSS
- PostgreSQL (Neon)
- Prisma ORM
- Autenticación con cookies seguras

## Setup

```bash
npm install
cp .env.example .env
# Configura DATABASE_URL y AUTH_SECRET en .env
npm run db:push
npm run db:seed
npm run dev
```

## Usuarios de prueba

| Rol     | Teléfono   | PIN  |
|---------|------------|------|
| Jugador | 8290000000 | 1234 |
| Cajero  | 8291111111 | 1234 |
| Admin   | 8292222222 | 1234 |

## Scripts

```bash
npm run dev        # Desarrollo
npm run build      # Build producción
npm run start      # Servidor producción
npm run lint       # ESLint
npm run typecheck  # TypeScript
npm run test       # Vitest
npm run db:push    # Sincronizar schema
npm run db:seed    # Datos iniciales
```

## Deploy (Vercel + Neon)

1. Crear proyecto en [Neon](https://neon.tech) y copiar `DATABASE_URL`
2. Generar `AUTH_SECRET`: `openssl rand -base64 32`
3. Conectar repo en Vercel
4. Configurar variables de entorno
5. Ejecutar `npm run db:push && npm run db:seed` en build o manualmente

## Rutas

- `/login` - Autenticación
- `/player` - Panel jugador (mobile-first)
- `/cashier` - Panel cajero
- `/admin/dashboard` - Panel administrador

## Licencia

Privado - KolMazal
