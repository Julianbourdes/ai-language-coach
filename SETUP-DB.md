# Setup PostgreSQL et Redis pour AI Language Coach

Ce guide vous aide à configurer PostgreSQL (pour l'authentification) et Redis (pour les sessions et rate limiting) nécessaires au template Vercel AI Chatbot.

## Option 1 : Docker (Recommandé)

### 1. Démarrer PostgreSQL et Redis

```bash
# Lancer les conteneurs PostgreSQL et Redis
docker compose up -d

# Vérifier que les conteneurs tournent
docker compose ps
```

Vous devriez voir deux conteneurs :
- `ai-language-coach-db` (PostgreSQL)
- `ai-language-coach-redis` (Redis)

### 2. Initialiser la base de données

```bash
# Exécuter les migrations Drizzle
pnpm db:migrate
```

### 3. Lancer l'application

```bash
pnpm dev
```

### 4. Arrêter les services (optionnel)

```bash
# Arrêter sans supprimer les données
docker compose stop

# Arrêter et supprimer les données
docker compose down -v
```

## Option 2 : Installation locale

Si vous préférez installer PostgreSQL et Redis directement :

### 1. Installation

```bash
# macOS
brew install postgresql@16
brew services start postgresql@16

# Linux
sudo apt-get install postgresql-16
sudo systemctl start postgresql
```

### 2. Créer la base de données

```bash
# Se connecter à PostgreSQL
psql postgres

# Créer l'utilisateur et la base
CREATE USER languagecoach WITH PASSWORD 'local_dev_password';
CREATE DATABASE languagecoach OWNER languagecoach;
\q
```

### 3. Installer et démarrer Redis

```bash
# macOS
brew install redis
brew services start redis

# Linux
sudo apt-get install redis-server
sudo systemctl start redis
```

### 4. Configurer .env.local

Le fichier `.env.local` est déjà configuré avec :

```
POSTGRES_URL=postgresql://languagecoach:local_dev_password@localhost:5432/languagecoach
REDIS_URL=redis://localhost:6379
```

### 5. Exécuter les migrations

```bash
pnpm db:migrate
```

## Vérification

### PostgreSQL

```bash
# Se connecter à la base
docker exec -it ai-language-coach-db psql -U languagecoach

# Lister les tables
\dt

# Quitter
\q
```

Vous devriez voir les tables créées par Drizzle (User, Chat, Message, Vote, Document).

### Redis

```bash
# Tester Redis via Docker
docker exec -it ai-language-coach-redis redis-cli ping
# Devrait retourner "PONG"

# Ou si Redis est installé localement
redis-cli ping
```

## Troubleshooting

### Port 5432 déjà utilisé

Si le port 5432 est déjà utilisé par une autre instance PostgreSQL :

```bash
# Option 1 : Arrêter l'instance existante (macOS)
brew services stop postgresql

# Option 2 : Changer le port dans docker-compose.yml
# Remplacer "5432:5432" par "5433:5432"
# Et mettre à jour .env.local avec le nouveau port
```

### Erreur de connexion PostgreSQL

```bash
# Vérifier que PostgreSQL est démarré
docker compose ps

# Voir les logs
docker compose logs postgres

# Redémarrer le conteneur
docker compose restart postgres
```

### Erreur de connexion Redis

```bash
# Vérifier que Redis est démarré
docker compose ps

# Voir les logs
docker compose logs redis

# Redémarrer le conteneur
docker compose restart redis
```

### Réinitialiser les bases

```bash
# Supprimer toutes les données
docker compose down -v

# Recréer et relancer
docker compose up -d
pnpm db:migrate
```

## Note Importante

PostgreSQL et Redis sont utilisés uniquement pour l'authentification et les sessions du template Vercel AI Chatbot. Les fonctionnalités spécifiques d'**AI Language Coach** (conversations, feedback, scénarios) utilisent Zustand avec localStorage et ne nécessitent pas ces services.

Si vous voulez utiliser uniquement les fonctionnalités Language Coach sans l'interface du template, vous pouvez :
- Aller directement sur `/coach` après login
- Utiliser le mode guest (automatique si non connecté)
