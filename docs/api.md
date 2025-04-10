# API Documentation

This document provides an overview of the Mexico Real Estate Platform API endpoints.

## Base URL

```
http://localhost:3001/api
```

## Authentication

All authenticated endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

### Auth Endpoints

#### Register User

```
POST /auth/register
```

Request body:
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+52 555 123 4567"
}
```

Response:
```json
{
  "message": "User registered successfully",
  "userId": 1
}
```

#### Login

```
POST /auth/login
```

Request body:
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

Response:
```json
{
  "message": "Login successful",
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

#### Refresh Token

```
POST /auth/refresh-token
```

Request body:
```json
{
  "refreshToken": "refresh_token_here"
}
```

Response:
```json
{
  "token": "new_jwt_token_here",
  "refreshToken": "new_refresh_token_here"
}
```

## Property Endpoints

### Get Properties

```
GET /properties
```

Query parameters:
- `page` (default: 1)
- `limit` (default: 10)
- `type` (optional): HOUSE, APARTMENT, LAND, COMMERCIAL
- `minPrice` (optional)
- `maxPrice` (optional)
- `location` (optional): city or state
- `bedrooms` (optional): minimum number of bedrooms
- `bathrooms` (optional): minimum number of bathrooms

Response:
```json
{
  "data": [
    {
      "id": 1,
      "title": "Modern Apartment in Polanco",
      "price": 350000,
      "currency": "USD",
      "type": "APARTMENT",
      "bedrooms": 2,
      "bathrooms": 2,
      "address": {
        "city": "Mexico City",
        "state": "MEXICO_CITY",
        "neighborhood": "Polanco"
      },
      "mainImage": "https://example.com/image.jpg"
    }
  ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "pages": 10
  }
}
```

### Get Property by ID

```
GET /properties/:id
```

Response:
```json
{
  "id": 1,
  "title": "Modern Apartment in Polanco",
  "description": "Beautiful modern apartment...",
  "price": 350000,
  "currency": "USD",
  "type": "APARTMENT",
  "status": "ACTIVE",
  "bedrooms": 2,
  "bathrooms": 2,
  "buildingSize": 120,
  "constructionYear": 2020,
  "address": {
    "street": "Av. Presidente Masaryk",
    "streetNumber": "123",
    "neighborhood": "Polanco",
    "postalCode": "11560",
    "city": "Mexico City",
    "state": "MEXICO_CITY",
    "latitude": 19.435,
    "longitude": -99.140
  },
  "features": [
    { "name": "Swimming Pool" },
    { "name": "Gym" }
  ],
  "media": [
    {
      "id": 1,
      "type": "IMAGE",
      "url": "https://example.com/image1.jpg",
      "isMain": true
    },
    {
      "id": 2,
      "type": "FLOOR_PLAN",
      "url": "https://example.com/floorplan.jpg",
      "isMain": false
    }
  ],
  "owner": {
    "id": 1,
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+52 555 123 4567",
    "email": "john@example.com"
  }
}
```

### Create Property (Authenticated)

```
POST /properties
```

Request body: (multipart/form-data to allow image uploads)
```json
{
  "title": "Modern Apartment in Polanco",
  "description": "Beautiful modern apartment...",
  "price": 350000,
  "currency": "USD",
  "type": "APARTMENT",
  "bedrooms": 2,
  "bathrooms": 2,
  "buildingSize": 120,
  "constructionYear": 2020,
  "address": {
    "street": "Av. Presidente Masaryk",
    "streetNumber": "123",
    "neighborhood": "Polanco",
    "postalCode": "11560",
    "city": "Mexico City",
    "state": "MEXICO_CITY",
    "latitude": 19.435,
    "longitude": -99.140
  },
  "features": ["Swimming Pool", "Gym"]
}
```

Also include file uploads for images.

Response:
```json
{
  "message": "Property created successfully",
  "property": {
    "id": 1,
    "title": "Modern Apartment in Polanco",
    "...other fields": "..."
  }
}
```

## User Endpoints

### Get User Profile (Authenticated)

```
GET /users/profile
```

Response:
```json
{
  "id": 1,
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+52 555 123 4567",
  "role": "USER",
  "language": "SPANISH"
}
```

### Update User Profile (Authenticated)

```
PUT /users/profile
```

Request body:
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "phone": "+52 555 987 6543",
  "language": "ENGLISH"
}
```

Response:
```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Smith",
    "phone": "+52 555 987 6543",
    "language": "ENGLISH"
  }
}
```

### Get Saved Properties (Authenticated)

```
GET /users/saved-properties
```

Response:
```json
{
  "data": [
    {
      "id": 1,
      "title": "Modern Apartment in Polanco",
      "...other fields": "..."
    }
  ]
}
```

### Save Property (Authenticated)

```
POST /users/saved-properties
```

Request body:
```json
{
  "propertyId": 1
}
```

Response:
```json
{
  "message": "Property saved successfully"
}
```

### Remove Saved Property (Authenticated)

```
DELETE /users/saved-properties/:propertyId
```

Response:
```json
{
  "message": "Property removed from saved properties"
}
```

## Error Responses

All endpoints return standardized error responses:

```json
{
  "message": "Error message here",
  "error": "Detailed error (development mode only)"
}
```

Common status codes:
- 400: Bad Request (invalid input)
- 401: Unauthorized (invalid or missing token)
- 403: Forbidden (insufficient permissions)
- 404: Not Found (resource doesn't exist)
- 500: Internal Server Error
