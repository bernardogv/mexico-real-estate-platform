# Documentation

This directory contains documentation for the Mexico Real Estate Platform.

## Contents

- [Architecture Overview](architecture.md)
- [Setup Guide](setup.md)
- [API Documentation](api.md)
- [User Guide](user-guide.md)

## Project Structure

The project follows a standard structure:

```
/
├── frontend/           # React/Next.js frontend application
├── backend/            # Node.js/Express backend API
├── database/           # Database schema and migrations
├── docs/               # Documentation
└── infrastructure/     # Docker, deployment configs
```

## Tech Stack

### Frontend
- React.js with Next.js
- Tailwind CSS for styling
- i18next for internationalization
- Mapbox for interactive maps

### Backend
- Node.js with Express
- PostgreSQL database
- Prisma ORM
- JWT authentication

### Infrastructure
- Docker for containerization
- Nginx for reverse proxy
- AWS/Azure for cloud hosting (TBD)
