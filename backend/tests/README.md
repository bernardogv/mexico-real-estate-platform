# Mexico Real Estate Platform Tests

This directory contains tests for the Mexico Real Estate Platform backend API. The tests are organized into unit tests for controllers and integration tests for API endpoints.

## Test Structure

```
tests/
├── api/                   # API endpoint tests using supertest
│   ├── auth.test.js       # Auth endpoint tests
│   ├── health.test.js     # Health check endpoint tests
│   ├── media.test.js      # Media endpoint tests
│   └── property.test.js   # Property endpoint tests
├── auth.controller.test.js    # Unit tests for auth controller
├── media.controller.test.js   # Unit tests for media controller
├── property.controller.test.js # Unit tests for property controller
├── user.controller.test.js    # Unit tests for user controller
├── setup.js              # Test setup and environment configuration
└── README.md             # This file
```

## Running Tests

### Running All Tests

```bash
npm test
```

### Running Tests in Watch Mode

```bash
npm run test:watch
```

### Generating Test Coverage Reports

```bash
npm run test:coverage
```

## Testing Approach

### Controller Unit Tests

Controller unit tests use Jest mocks to isolate the controller logic from external dependencies:

- Database operations (Prisma) are mocked
- File system operations are mocked
- JWT operations are mocked
- Bcrypt operations are mocked

Each controller test verifies:
- Happy path (successful operations)
- Error paths (including validation errors, not found errors, permission errors)
- Edge cases

### API Endpoint Tests

API endpoint tests use Supertest to make HTTP requests to the API and verify the responses:

- Authentication/authorization
- Request validation
- Proper HTTP status codes
- Response structure and content

## Mocking Strategy

### Database Mocking

The Prisma client is mocked to avoid hitting a real database during tests. Each model's methods are mocked to return test data for specific scenarios.

### Authentication Mocking

JWT verification is mocked to simulate different authentication scenarios:

- Authenticated users with different roles
- Unauthenticated requests
- Invalid tokens

### File System Mocking

File system operations are mocked to avoid creating real files and directories during tests:

- Reading and writing files
- Creating directories
- Deleting files

## Test Coverage

The tests aim to cover all critical paths through the application, including:

- User authentication and registration
- Property creation, reading, updating, and deletion
- Media upload and management
- Error handling and validation

## Extending Tests

When adding new features to the platform, corresponding tests should be added:

1. Add unit tests for any new controller methods
2. Add API endpoint tests for any new routes or modified behavior
3. Update existing tests if behavior has changed

## Best Practices

- Tests should be independent and not rely on the state of other tests
- Use descriptive test names that explain what is being tested
- Use a consistent structure: Arrange, Act, Assert
- Mock external dependencies to isolate what's being tested
- Test both happy paths and error conditions
