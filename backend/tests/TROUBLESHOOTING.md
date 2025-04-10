# Troubleshooting Test Issues

## Common Issues and Solutions

### 1. "afterAll is not defined" Error

If you see errors like:

```
ReferenceError: afterAll is not defined
```

This means Jest cannot find the global test functions. Solutions include:

- Make sure Jest is installed: `npm install --save-dev jest`
- Try running tests with: `npx jest` instead of `npm test`
- If using the `setup.js` file, you might need to ensure it's properly loaded in your Jest config

### 2. Mock Application Issues

If you're having issues with mocking the Express app, you can try the simpler test approach:

```bash
npm test tests/simple-health.test.js
```

This test uses a minimal Express app and doesn't require mocking of the entire application.

### 3. Database Connection Errors

The tests might try to connect to a real database even though it's supposed to be mocked. Check that:

- The PrismaClient is properly mocked in each test file
- No tests are importing the real PrismaClient directly
- The mocks are cleared between tests

### 4. Authentication Issues in Tests

If authentication-related tests are failing:

- Make sure `jsonwebtoken` is properly mocked
- The JWT verification mock returns the expected user data
- Check that the auth middleware is being properly bypassed in tests

## Running Individual Tests

To run a specific test file:

```bash
npm test -- tests/simple-health.test.js
```

To run a specific test within a file:

```bash
npm test -- -t "should return UP status"
```

## Debugging Tests

You can add console logs in your tests and see them in the test output. To run tests in verbose mode:

```bash
npm test -- --verbose
```

For more detailed debugging, you can use Node's inspector:

```bash
node --inspect-brk node_modules/.bin/jest --runInBand tests/simple-health.test.js
```

Then open Chrome and navigate to `chrome://inspect` to debug the tests.

## Alternative Testing Approach

If you continue to have issues with the current test setup, you might want to consider:

1. Creating a test database and running integration tests against it
2. Using a simpler mocking approach with libraries like `jest-mock-extended`
3. Using alternative testing libraries like Mocha if Jest is causing problems

## Getting Help

If you're still having issues, check:

- Jest documentation: https://jestjs.io/docs/getting-started
- Supertest documentation: https://github.com/visionmedia/supertest
- Express testing guide: https://expressjs.com/en/guide/testing.html
