# Edu4.AI Deployment Guide

This guide provides step-by-step instructions for deploying the Edu4.AI platform to AWS.

## Prerequisites

- AWS CLI configured with appropriate permissions
- Docker and Docker Compose installed
- Node.js 18+ and npm
- Git

## Environment Setup

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd edu4ai
```

### 2. Install Dependencies

```bash
# Install all dependencies
npm run install:all

# Build shared types
cd shared && npm run build && cd ..
```

### 3. Configure Environment Variables

#### Backend Configuration
```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your configuration:

```env
# Database
DATABASE_URL="postgresql://username:password@your-db-host:5432/edu4ai"

# Redis
REDIS_URL="redis://your-redis-host:6379"

# JWT & Session
JWT_SECRET="your-secure-jwt-secret"
SESSION_SECRET="your-secure-session-secret"

# AI Providers (configure at least one)
OPENAI_API_KEY="your-openai-api-key"
ANTHROPIC_API_KEY="your-anthropic-api-key"
GOOGLE_API_KEY="your-google-api-key"

# Safety Settings
MIN_SAFETY_SCORE=0.7
MAX_TOKENS_PER_REQUEST=4000
```

#### Frontend Configuration
```bash
cp frontend/.env.example frontend/.env.local
```

Edit `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=https://your-api-domain.com
NEXT_PUBLIC_APP_URL=https://your-app-domain.com
```

## Local Development

### 1. Start Development Services

```bash
# Start database and Redis with Docker
docker-compose up -d postgres redis

# Run database migrations
cd backend && npm run db:migrate && cd ..

# Start development servers
npm run dev
```

### 2. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Health Check: http://localhost:8000/ping

## AWS Deployment

### Option 1: AWS ECS with Docker

#### 1. Setup AWS Infrastructure

Create the following AWS resources:

**VPC and Networking:**
- VPC with public and private subnets
- Internet Gateway and NAT Gateway
- Security Groups for web traffic, database access

**Database:**
- RDS PostgreSQL instance in private subnet
- ElastiCache Redis cluster in private subnet

**Load Balancer:**
- Application Load Balancer for HTTPS termination
- Target groups for frontend and backend services

**ECS:**
- ECS Cluster with Fargate
- Task definitions for frontend and backend
- Services with auto-scaling

#### 2. Build and Push Docker Images

```bash
# Build images
docker build -t edu4ai-frontend ./frontend
docker build -t edu4ai-backend ./backend

# Tag for ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

docker tag edu4ai-frontend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/edu4ai-frontend:latest
docker tag edu4ai-backend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/edu4ai-backend:latest

# Push to ECR
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/edu4ai-frontend:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/edu4ai-backend:latest
```

#### 3. Deploy with ECS

Create ECS task definitions and services using the AWS Console or Terraform/CloudFormation.

### Option 2: AWS App Runner (Simpler)

#### 1. Setup Database

- Create RDS PostgreSQL instance
- Create ElastiCache Redis cluster
- Note connection strings

#### 2. Deploy Backend to App Runner

```bash
# Create apprunner.yaml in backend/
cat > backend/apprunner.yaml << EOF
version: 1.0
runtime: nodejs18
build:
  commands:
    build:
      - npm ci
      - npx prisma generate
      - npm run build
run:
  runtime-version: 18
  command: node dist/index.js
  network:
    port: 8000
    env: PORT
  env:
    - name: NODE_ENV
      value: production
EOF
```

Deploy via AWS Console or CLI.

#### 3. Deploy Frontend to Amplify

- Connect your GitHub repository to AWS Amplify
- Configure build settings for Next.js
- Set environment variables in Amplify console

### Option 3: Traditional EC2 Deployment

#### 1. Launch EC2 Instance

```bash
# Launch Ubuntu 22.04 LTS instance
# Install Docker and Docker Compose
sudo apt update
sudo apt install -y docker.io docker-compose-v2
sudo usermod -aG docker ubuntu
```

#### 2. Setup Application

```bash
# Clone repository
git clone <your-repo-url>
cd edu4ai

# Copy production docker-compose
cp infrastructure/docker-compose.prod.yml docker-compose.yml

# Set environment variables
export DATABASE_URL="your-database-url"
export REDIS_URL="your-redis-url"
export OPENAI_API_KEY="your-openai-key"
# ... other environment variables

# Deploy
sudo docker-compose up -d
```

## Domain and SSL Setup

### 1. Configure Domain

- Point your domain to the load balancer or EC2 instance
- Set up DNS records for both www and non-www versions

### 2. SSL Certificate

#### Option A: AWS Certificate Manager (for ALB)
- Request SSL certificate through ACM
- Attach to Application Load Balancer

#### Option B: Let's Encrypt (for EC2)
```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Setup auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## Monitoring and Logging

### 1. CloudWatch Setup

- Configure log groups for application logs
- Set up CloudWatch alarms for key metrics
- Create dashboards for monitoring

### 2. Application Monitoring

```bash
# Install monitoring agents on EC2
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
sudo rpm -U ./amazon-cloudwatch-agent.rpm
```

## Security Best Practices

### 1. Environment Variables

- Store sensitive data in AWS Secrets Manager
- Use IAM roles instead of access keys where possible
- Rotate secrets regularly

### 2. Network Security

- Use private subnets for databases
- Configure security groups with minimal required access
- Enable VPC Flow Logs

### 3. Application Security

- Keep dependencies updated
- Enable AWS WAF for web application firewall
- Configure rate limiting
- Monitor for security vulnerabilities

## Scaling Considerations

### 1. Auto Scaling

- Configure ECS service auto-scaling
- Set up CloudWatch alarms for scaling triggers
- Use Application Load Balancer for load distribution

### 2. Database Scaling

- Configure RDS read replicas for read scaling
- Use connection pooling
- Consider database sharding for high load

### 3. Caching

- Implement Redis caching for frequent queries
- Use CloudFront CDN for static assets
- Configure proper cache headers

## Backup and Disaster Recovery

### 1. Database Backups

- Enable automated RDS backups
- Configure point-in-time recovery
- Test backup restoration procedures

### 2. Application Backups

- Regular code repository backups
- Environment configuration backups
- Document recovery procedures

## Cost Optimization

### 1. Resource Optimization

- Use appropriate instance sizes
- Implement auto-scaling to reduce idle costs
- Use Spot instances where appropriate

### 2. Monitoring Costs

- Set up AWS budgets and alerts
- Use AWS Cost Explorer for analysis
- Regular cost reviews and optimization

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Check security groups
   - Verify connection strings
   - Check database status

2. **AI Provider API Errors**
   - Verify API keys
   - Check rate limits
   - Monitor error logs

3. **High Memory Usage**
   - Monitor application metrics
   - Check for memory leaks
   - Optimize queries

### Health Checks

The application includes built-in health checks:

- `/ping` - Basic connectivity
- `/api/v1/health` - Comprehensive health status

## Support

For deployment issues:

1. Check application logs in CloudWatch
2. Verify all environment variables are set
3. Ensure all AWS resources are properly configured
4. Review security group settings

For additional help, refer to the main README.md or create an issue in the repository.