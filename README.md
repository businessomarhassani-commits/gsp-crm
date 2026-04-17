# ArchiCRM

CRM professionnel pour cabinets d'architecture — multi-tenant, sécurisé, en français.

## Stack

- **Frontend** : React 18 + Vite + TailwindCSS
- **Backend** : Node.js + Express
- **Base de données** : PostgreSQL (Supabase)
- **Auth** : JWT personnalisé

## Installation

### 1. Cloner le projet

```bash
git clone https://github.com/businessomarhassani-commits/gsp-crm.git
cd gsp-crm
```

### 2. Configurer les variables d'environnement

```bash
cp .env.example .env
# Remplir SUPABASE_URL, SUPABASE_ANON_KEY, JWT_SECRET
```

### 3. Installer les dépendances backend

```bash
npm install
```

### 4. Installer les dépendances frontend

```bash
cd client
npm install
cd ..
```

### 5. Appliquer le schéma SQL

Exécuter `server/db/schema.sql` dans votre projet Supabase (SQL Editor).

### 6. Lancer en développement

Terminal 1 – Backend :
```bash
npm run dev:server
```

Terminal 2 – Frontend :
```bash
npm run dev:client
```

Frontend : http://localhost:5173  
Backend : http://localhost:3001

## Comptes de test

| Email | Mot de passe | Rôle |
|-------|-------------|------|
| admin@archicrm.ma | Admin2024! | admin |
| karim@archicrm.ma | User2024! | user |
| sara@archicrm.ma | User2024! | user |
| youssef@archicrm.ma | User2024! | user |

## Déploiement Vercel

Variables d'environnement à configurer dans Vercel :
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `JWT_SECRET`

## API External (webhook leads)

```bash
POST /api/leads
Headers: X-API-Key: <votre_api_key>
Body: { name, phone, email, project_type, city, budget, source }
```
