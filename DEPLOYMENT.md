# Pishkar Deployment Guide

This guide explains how to deploy the Pishkar application (server + landing) on your VPS using Docker Compose.

## Prerequisites

- VPS with Docker and Docker Compose installed
- Access to your Docker registry
- Domain names configured (optional, for production)

## Setup Instructions

### 1. Create Deployment Directory

SSH into your VPS and create the deployment directory:

```bash
mkdir -p /home/$USER/opt/pishkar
cd /home/$USER/opt/pishkar
```

### 2. Copy Configuration Files

Copy the following files to your VPS deployment directory:
- `docker-compose.yml`
- `.env.example` → rename to `.env`
- `nginx.conf.example` → rename to `nginx/nginx.conf` (if using Nginx)

```bash
# Create .env from example
cp .env.example .env
```

### 3. Configure Environment Variables

Edit the `.env` file with your actual values:

```bash
nano .env
```

**Important variables to update:**
- `IMAGE_NAME` - Your server Docker image path
- `LANDING_IMAGE_NAME` - Your landing Docker image path
- `POSTGRES_PASSWORD` - Strong database password
- `DB_CONNECTION_STRING` - Database connection string
- `JWT_SECRET` - Secure JWT secret key (min 32 characters)
- `JWT_ISSUER` and `JWT_AUDIENCE` - Your domain URLs
- `NEXT_PUBLIC_API_URL` - Backend API URL for frontend

### 4. Login to Docker Registry

```bash
docker login your-registry.com
# Enter your credentials
```

### 5. Start Services

```bash
# Pull latest images
docker compose pull

# Start all services
docker compose up -d

# View logs
docker compose logs -f
```

### 6. Verify Deployment

Check that all services are running:

```bash
docker compose ps
```

Expected output should show:
- `pishkar-server` - Running on port 5000
- `pishkar-landing` - Running on port 3000
- `pishkar-postgres` - Running on port 5432

Test the services:

```bash
# Test server health
curl http://localhost:5000/health

# Test landing page
curl http://localhost:3000
```

## Service URLs

- **Landing Page**: `http://your-vps-ip:3000`
- **API Server**: `http://your-vps-ip:5000`
- **PostgreSQL**: `localhost:5432` (internal only)

## Monitoring & Maintenance

### View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f server
docker compose logs -f landing
```

### Restart Services

```bash
# Restart all
docker compose restart

# Restart specific service
docker compose restart server
```

### Update Services

The CI/CD pipeline automatically:
1. Builds and pushes new Docker images
2. Updates the `IMAGE_TAG` and `LANDING_IMAGE_TAG` in `.env`
3. Pulls new images and restarts services

Manual update:

```bash
docker compose pull
docker compose up -d
```

### Stop Services

```bash
docker compose down
```

### Clean Up Old Images

```bash
docker image prune -f
```

## Database Backup

```bash
# Backup PostgreSQL database
docker compose exec postgres pg_dump -U postgres pishkar > backup_$(date +%Y%m%d).sql

# Restore from backup
docker compose exec -T postgres psql -U postgres pishkar < backup_20260215.sql
```

## Using Nginx Reverse Proxy (Optional)

If you want to use Nginx for SSL termination and routing:

1. Uncomment the `nginx` service in `docker-compose.yml`
2. Create nginx directory and copy config:
   ```bash
   mkdir -p nginx/ssl
   cp nginx.conf.example nginx/nginx.conf
   ```
3. Update `nginx.conf` with your domain names
4. Generate SSL certificates (using Let's Encrypt):
   ```bash
   # Install certbot
   sudo apt install certbot
   
   # Generate certificates
   sudo certbot certonly --standalone -d your-domain.com -d api.your-domain.com
   
   # Copy to nginx directory
   sudo cp /etc/letsencrypt/live/your-domain.com/*.pem nginx/ssl/
   ```
5. Restart nginx:
   ```bash
   docker compose restart nginx
   ```

## Troubleshooting

### Service Won't Start

```bash
# Check logs for errors
docker compose logs service-name

# Check service status
docker compose ps
```

### Database Connection Issues

1. Verify PostgreSQL is running: `docker compose ps postgres`
2. Check connection string in `.env`
3. Test database connection:
   ```bash
   docker compose exec postgres psql -U postgres -d pishkar
   ```

### Port Already in Use

If ports 3000, 5000, or 5432 are already in use, modify the port mappings in `docker-compose.yml`:

```yaml
ports:
  - "3001:3000"  # Change host port (left side)
```

## Security Recommendations

1. **Never commit `.env` file** - It contains sensitive credentials
2. **Use strong passwords** - For PostgreSQL and JWT secrets
3. **Enable firewall** - Only expose necessary ports
4. **Use HTTPS** - Deploy Nginx with SSL certificates
5. **Regular updates** - Keep Docker images and system packages updated
6. **Backup database** - Schedule regular automated backups

## GitHub Secrets Required

Make sure these secrets are configured in your GitHub repository:

- `IMAGE_NAME` - Server Docker image path
- `LANDING_IMAGE_NAME` - Landing Docker image path
- `REGISTRY` - Docker registry URL
- `DOCKERHUB_USERNAME` - Registry username
- `DOCKERHUB_TOKEN` - Registry access token
- `VPS_HOST` - Your VPS IP or hostname
- `VPS_USER` - SSH username
- `VPS_SSH_PORT` - SSH port (default: 22)
- `VPS_SSH_PRIVATE_KEY` - SSH private key for authentication

## Support

For issues or questions, refer to the project documentation or create an issue in the repository.
