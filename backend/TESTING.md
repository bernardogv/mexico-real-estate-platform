# Testing Guide for Mexico Real Estate Platform

## Testing Approaches

This project uses Jest for testing. Due to some configuration challenges, we've implemented multiple testing approaches:

1. **Minimal Tests**: Simple tests that use a minimal Jest configuration
2. **Manual Test Runner**: A Node.js script that runs tests without Jest
3. **Controller Tests**: Unit tests for controller functions
4. **API Tests**: Endpoint tests using Supertest

## Running Tests

### 1. Basic Tests

To run the simplest test (verifies Jest is working):

```bash
npm run test:basic
```

### 2. Controller Tests

To run tests for the controllers:

```bash
npm run test:controllers
```

### 3. API Tests

To run API endpoint tests:

```bash
npm run test:api
```

### 4. All Minimal Tests

To run all tests that use the minimal configuration:

```bash
npm test
```

### 5. Manual Test Runner (No Jest)

To run tests using our custom Node.js test runner (no Jest):

```bash
npm run test:manual
```

### 6. Test Coverage

To generate test coverage reports:

```bash
npm run test:coverage
```

## Testing Strategy

### Controller Tests

The controller tests verify that:

- Controllers correctly interact with the database (Prisma)
- Controllers handle authentication correctly
- Controllers validate input properly
- Controllers return appropriate responses
- Error conditions are handled correctly

### API Tests

The API tests verify that:

- Endpoints return the expected status codes
- Response bodies match expected formats
- Authentication is enforced correctly
- Error responses are handled properly

## Troubleshooting

If you encounter issues with the tests:

1. Try running the basic test first to confirm Jest is working
2. Run the manual test runner to verify your test logic outside of Jest
3. Check that you're using the correct test script
4. Look for detailed error messages in the console output

## Test File Structure

- `basic.test.js`: Simplest possible Jest test
- `controllers.test.js`: Tests for the controllers
- `api.test.js`: Tests for API endpoints
- `run-test.js`: Manual test runner (no Jest)
- `minimal.jest.config.js`: Minimal Jest configuration

## Adding New Tests

When adding new tests:

1. Follow the patterns in existing test files
2. Keep tests focused on a single functionality
3. Use descriptive test names
4. Include arrange, act, assert phases in each test
