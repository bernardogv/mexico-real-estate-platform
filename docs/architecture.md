# Architecture Overview

This document describes the architecture of the Mexico Real Estate Platform.

## System Architecture

```
┌────────────┐     ┌────────────┐     ┌────────────┐
│            │     │            │     │            │
│  Frontend  │────►│  Backend   │────►│  Database  │
│            │     │            │     │            │
└────────────┘     └────────────┘     └────────────┘
      │                   │                  
      │                   │                  
      ▼                   ▼                  
┌────────────┐     ┌────────────┐           
│            │     │            │           
│   CDN      │     │ File Store │           
│            │     │            │           
└────────────┘     └────────────┘           
```

## Frontend Architecture

The frontend follows a component-based architecture using React and Next.js:

- Pages: Main routes/views of the application
- Components: Reusable UI elements
- Context/Store: State management
- Services: API communication
- Hooks: Custom React hooks for shared logic
- Utils: Helper functions
- i18n: Internationalization resources

## Backend Architecture

The backend follows a layered architecture:

- Routes: HTTP endpoints
- Controllers: Request handlers
- Services: Business logic
- Models: Data access layer with Prisma
- Middleware: Request processing (auth, validation)
- Utils: Helper functions

## Data Model

See the [database schema](../database/schema.prisma) for detailed data model.

Core entities:
- Users
- Properties
- Addresses
- Media
- Favorites
- Messages

## Authentication Flow

1. User registers or logs in
2. Backend validates credentials and issues JWT
3. Frontend stores JWT in local storage
4. JWT is sent with authenticated requests
5. Token refresh mechanism for extended sessions

## Search Architecture

1. User inputs search criteria
2. Frontend sends search parameters to backend
3. Backend queries database with filters
4. Results are paginated and returned to frontend
5. Map view displays properties with location data

## Performance Considerations

- Image optimization and CDN
- Database indexing for search performance
- API response caching
- Server-side rendering for SEO and initial load
- Lazy loading for media content
