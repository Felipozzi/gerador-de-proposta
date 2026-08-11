# Gerador de Proposta

Sistema de geração de propostas para serviços de alimentação personalizada.

## 🚀 Quick Start

### Instalação

```bash
# Install dependencies
npm install

# Setup local database
npm run db:push
```

### Desenvolvimento

```bash
# Start development server
npm run dev

# Open http://localhost:3000
```

## 🗄️ Database Setup

### Local Development
The project uses SQLite for local development. No additional setup required - the database file will be created automatically at `prisma/dev.db`.

### Production Deployment (Vercel)

**Important**: SQLite is not suitable for production deployments on Vercel because files are not persisted between deployments. You must use a cloud database service.

#### Recommended Options:

1. **PostgreSQL** (Recommended)
   - Services: Vercel Postgres, Railway, Render, Supabase
   - Environment variable: `postgresql://user:password@host:5432/database`

2. **MySQL**
   - Services: Planetscale, Railway, Render
   - Environment variable: `mysql://user:password@host:3306/database`

3. **MongoDB**
   - Services: MongoDB Atlas (free tier available)
   - Environment variable: `mongodb+srv://user:password@cluster.mongodb.net/database`

#### Setup Steps:

1. Create a database account with your chosen provider
2. Get the connection string
3. Add to Vercel environment variables:
   ```
   DATABASE_URL = <your-connection-string>
   ```
4. Deploy to Vercel

## 📝 Environment Variables

Copy `.env.example` to `.env.local` for development:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your local database URL.

## 🔧 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
npm run db:push      # Sync schema with database
npm run db:migrate   # Create migrations
npm run db:reset     # Reset database (CAREFUL!)
```

## 📦 Database Schema

The application manages three main models:

- **Client**: Client information and preferences
- **Proposal**: Generated proposals for clients
- **PricingConfig**: Service pricing configuration

See `prisma/schema.prisma` for detailed schema.

## 🛠️ Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS, Shadcn/ui
- **Backend**: Next.js API Routes
- **Database**: Prisma ORM + SQLite (dev) / Cloud DB (production)
- **Styling**: Tailwind CSS with custom components

## 📄 License

This project is private.
