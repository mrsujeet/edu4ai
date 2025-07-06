# Edu4.AI - AI-Powered Safe Tutoring Platform

An intelligent tutoring platform that leverages generative AI to provide safe, personalized educational assistance to students.

## 🌟 Features

- **Safe AI Tutoring**: Content validation and safety filters ensure appropriate educational interactions
- **Multi-Provider AI Support**: Integration with OpenAI, Anthropic, and Google Gemini APIs
- **Query Planning & Execution**: Intelligent query processing with validation, planning, and execution pipeline
- **Modern UI**: Clean, responsive interface built with Next.js and Tailwind CSS
- **AWS Ready**: Configured for seamless AWS deployment
- **Real-time Chat**: Interactive tutoring sessions with contextual responses

## 🏗️ Architecture

```
├── frontend/          # Next.js React application
├── backend/           # Node.js Express API server
├── shared/            # Shared types and utilities
├── infrastructure/    # AWS deployment configurations
└── docs/             # Documentation and guides
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- AWS CLI (for deployment)
- API keys for AI providers (OpenAI, Anthropic, or Gemini)

### Development Setup

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd edu4ai
   npm run install:all
   ```

2. **Environment Configuration:**
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env.local
   ```
   
   Configure your API keys and settings in the `.env` files.

3. **Start Development Servers:**
   ```bash
   npm run dev
   ```

   This starts both frontend (http://localhost:3000) and backend (http://localhost:8000).

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety and better DX
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Smooth animations
- **React Hook Form** - Form handling
- **Zustand** - State management

### Backend
- **Node.js & Express** - Server runtime and framework
- **TypeScript** - Type safety
- **Prisma** - Database ORM
- **PostgreSQL** - Primary database
- **Redis** - Caching and session storage
- **Zod** - Runtime type validation
- **Winston** - Logging

### AI & Safety
- **OpenAI GPT-4** - Primary AI model
- **Anthropic Claude** - Alternative AI provider
- **Google Gemini** - Additional AI provider
- **Custom Safety Filters** - Content validation and moderation

### Infrastructure
- **AWS ECS** - Container orchestration
- **AWS RDS** - Managed PostgreSQL
- **AWS ElastiCache** - Managed Redis
- **AWS CloudFront** - CDN
- **AWS Application Load Balancer** - Load balancing
- **Docker** - Containerization

## 📚 API Documentation

### Core Endpoints

- `POST /api/chat` - Submit tutoring queries
- `GET /api/chat/history` - Retrieve chat history
- `POST /api/validate` - Validate query safety
- `GET /api/health` - Health check

### AI Provider Integration

The platform supports multiple AI providers with automatic fallback:

1. **Primary**: OpenAI GPT-4
2. **Secondary**: Anthropic Claude
3. **Tertiary**: Google Gemini

## 🔒 Safety Features

- **Content Filtering**: Multi-layer content validation
- **Query Planning**: Structured approach to educational queries
- **Context Awareness**: Maintains educational focus
- **Rate Limiting**: Prevents abuse
- **Audit Logging**: Comprehensive activity tracking

## 🚀 Deployment

### AWS Deployment

1. **Configure AWS credentials:**
   ```bash
   aws configure
   ```

2. **Deploy infrastructure:**
   ```bash
   npm run deploy:infrastructure
   ```

3. **Deploy application:**
   ```bash
   npm run deploy:app
   ```

## 📖 Documentation

- [API Reference](./docs/api.md)
- [Deployment Guide](./docs/deployment.md)
- [Safety Guidelines](./docs/safety.md)
- [Contributing](./docs/contributing.md)

## 🤝 Contributing

We welcome contributions! Please read our [Contributing Guidelines](./docs/contributing.md) for details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@edu4.ai or create an issue on GitHub.

---

**Built with ❤️ for safe, accessible AI education**