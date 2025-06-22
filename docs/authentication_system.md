# Authentication & Refresh Token System Documentation

## Overview

This API implements a secure JWT-based authentication system with automatic token refresh capabilities. The system uses a dual-token approach with short-lived access tokens and long-lived refresh tokens, providing both security and user convenience.

## Architecture

### Token Types

1. **Access Token**
   - **Lifetime**: 8 hours
   - **Purpose**: Used for API authentication
   - **Storage**: Database + JWT
   - **Type**: `access`

2. **Refresh Token**
   - **Lifetime**: 7 days
   - **Purpose**: Used to obtain new access tokens
   - **Storage**: Database + JWT
   - **Type**: `refresh`

### Database Schema

```sql
-- Token table structure
model Token {
  id          Int       @id @default(autoincrement())
  token       String    -- The actual JWT token
  salesRepId  Int       -- User ID
  createdAt   DateTime  @default(now())
  expiresAt   DateTime  -- Token expiration timestamp
  blacklisted Boolean   @default(false) -- Token revocation flag
  lastUsedAt  DateTime? -- Last usage timestamp
  tokenType   String    @default("access") -- "access" or "refresh"
  user        SalesRep  @relation(fields: [salesRepId], references: [id], onDelete: Cascade)
}
```

## Authentication Flow

### 1. User Registration

**Endpoint**: `POST /api/auth/register`

**Process**:
1. Validate required fields (name, email, phoneNumber, password, countryId, region_id, region)
2. Check for existing user (email or phoneNumber)
3. Hash password using bcrypt (salt rounds: 10)
4. Create user record in database
5. Generate both access and refresh tokens
6. Store tokens in database
7. Return user data and tokens

**Response**:
```json
{
  "message": "Registration successful",
  "salesRep": { /* user data */ },
  "accessToken": "jwt_token_here",
  "refreshToken": "refresh_token_here"
}
```

### 2. User Login

**Endpoint**: `POST /api/auth/login`

**Process**:
1. Validate phoneNumber and password
2. Check if user exists and account is active (status !== 1)
3. Verify password using bcrypt
4. Generate new access and refresh tokens
5. Store tokens in database
6. Return user data and tokens

**Response**:
```json
{
  "success": true,
  "salesRep": { /* user data */ },
  "accessToken": "jwt_token_here",
  "refreshToken": "refresh_token_here",
  "expiresIn": 28800
}
```

### 3. Token Refresh

**Endpoint**: `POST /api/auth/refresh`

**Process**:
1. Validate refresh token from request body
2. Verify JWT signature and expiration
3. Check if token exists in database and is not blacklisted
4. If refresh token is invalid/expired:
   - Blacklist old refresh token
   - Generate new access and refresh tokens
   - Store new tokens in database
5. If refresh token is valid:
   - Generate new access token only
   - Keep existing refresh token
   - Update lastUsedAt timestamp
6. Return new tokens

**Response**:
```json
{
  "success": true,
  "accessToken": "new_access_token",
  "refreshToken": "refresh_token", // Same or new depending on validity
  "expiresIn": 28800,
  "tokensRegenerated": false, // true if both tokens were regenerated
  "user": { /* user data */ }
}
```

### 4. User Logout

**Endpoint**: `POST /api/auth/logout`

**Process**:
1. Blacklist all tokens (both access and refresh) for the user
2. Return success message

**Response**:
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

## Middleware System

### Authentication Middleware

**File**: `middleware/authMiddleware.js`

**Function**: `authenticateToken`

**Process**:
1. Extract token from Authorization header (`Bearer <token>`)
2. Verify JWT signature and expiration
3. Validate token type (must be 'access')
4. Check token in database (if available)
5. If token not found in database but JWT is valid:
   - Automatically refresh tokens
   - Set new tokens in response headers
6. Set user data in request object
7. Add security headers

**Security Headers Added**:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`

### Token Refresh Middleware

**Function**: `handleTokenRefresh`

**Process**:
1. Intercepts all API responses
2. If tokens were refreshed during request:
   - Adds token refresh information to response
   - Sets `X-Token-Refreshed: true` header
   - Includes new tokens in response body

### Role-Based Authorization

**File**: `middleware/roleAuth.js`

**Available Middleware**:
- `hasRole(roles)` - Check specific roles
- `atLeastRole(minimumRole)` - Check role hierarchy
- `isAdmin` - Admin-only access
- `isManager` - Manager-only access
- `isUser` - Any authenticated user

## Error Handling

### Authentication Errors

| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| `TOKEN_EXPIRED` | 401 | Access token has expired |
| `INVALID_TOKEN_TYPE` | 401 | Wrong token type used |
| `TOKEN_REFRESH_FAILED` | 401 | Failed to refresh tokens |
| `TOKEN_EXPIRED` | 401 | Token has expired |

### Common Error Responses

```json
{
  "success": false,
  "error": "Access token expired. Please refresh your token.",
  "code": "TOKEN_EXPIRED"
}
```

## Security Features

### 1. Token Blacklisting
- All tokens are stored in database
- Blacklisted tokens cannot be used
- Logout blacklists all user tokens

### 2. Automatic Token Refresh
- Middleware automatically refreshes expired tokens
- Seamless user experience
- New tokens returned in response headers

### 3. Database Validation
- Tokens validated against database records
- Prevents token reuse after logout
- Tracks token usage and expiration

### 4. Role-Based Access Control
- JWT contains user role information
- Middleware enforces role-based permissions
- Hierarchical role system

### 5. Security Headers
- Content-Type protection
- XSS protection
- Clickjacking protection
- HSTS enforcement

## Usage Examples

### Protecting Routes

```javascript
const { authenticateToken } = require('../middleware/authMiddleware');
const { hasRole } = require('../middleware/roleAuth');

// Protect all routes
router.use(authenticateToken);

// Role-specific protection
router.get('/admin', hasRole('ADMIN'), adminController);
router.get('/manager', hasRole(['ADMIN', 'MANAGER']), managerController);
```

### Client-Side Implementation

```javascript
// Login
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ phoneNumber, password })
});

const { accessToken, refreshToken } = await loginResponse.json();

// Store tokens
localStorage.setItem('accessToken', accessToken);
localStorage.setItem('refreshToken', refreshToken);

// API calls with automatic refresh
const apiCall = async (url, options = {}) => {
  const token = localStorage.getItem('accessToken');
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }
  });

  // Check if tokens were refreshed
  if (response.headers.get('X-Token-Refreshed') === 'true') {
    const data = await response.json();
    localStorage.setItem('accessToken', data.newAccessToken);
    localStorage.setItem('refreshToken', data.newRefreshToken);
  }

  return response;
};
```

## Best Practices

### 1. Token Storage
- Store tokens securely (localStorage/sessionStorage for web, secure storage for mobile)
- Never expose tokens in URLs
- Clear tokens on logout

### 2. Error Handling
- Handle token expiration gracefully
- Implement retry logic for failed requests
- Provide clear error messages to users

### 3. Security
- Use HTTPS in production
- Implement rate limiting
- Monitor for suspicious activity
- Regular token cleanup

### 4. Performance
- Minimize database queries
- Use efficient token validation
- Implement caching where appropriate

## Troubleshooting

### Common Issues

1. **Token Expired Errors**
   - Check if refresh token is valid
   - Ensure proper token storage
   - Verify automatic refresh is working

2. **Database Connection Issues**
   - System falls back to JWT-only validation
   - Check database connectivity
   - Monitor token storage operations

3. **Role Authorization Failures**
   - Verify user role in database
   - Check role hierarchy
   - Ensure proper middleware order

### Debug Information

Enable debug logging by setting environment variables:
```bash
DEBUG=auth:*
NODE_ENV=development
```

## API Endpoints Summary

| Method | Endpoint | Authentication | Description |
|--------|----------|----------------|-------------|
| POST | `/api/auth/register` | None | User registration |
| POST | `/api/auth/login` | None | User login |
| POST | `/api/auth/refresh` | None | Token refresh |
| POST | `/api/auth/logout` | Required | User logout |
| DELETE | `/api/auth/delete` | Required | Account deletion |

## Environment Variables

```bash
JWT_SECRET=your_jwt_secret_key_here
DATABASE_URL=your_database_connection_string
NODE_ENV=production
```

## Database Migrations

The token system requires the following database tables:
- `SalesRep` - User accounts
- `Token` - Token storage and management
- `Manager` - Manager-specific data (optional)

Run migrations to ensure proper schema:
```bash
npx prisma migrate dev
npx prisma generate
``` 