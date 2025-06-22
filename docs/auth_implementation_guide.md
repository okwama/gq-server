# Authentication System Implementation Guide

## Quick Setup

### Environment Variables
```bash
JWT_SECRET=your_jwt_secret_key_here
DATABASE_URL=mysql://user:password@localhost:3306/database
NODE_ENV=production
```

### Database Schema
```prisma
model Token {
  id          Int       @id @default(autoincrement())
  token       String
  salesRepId  Int
  createdAt   DateTime  @default(now())
  expiresAt   DateTime
  blacklisted Boolean   @default(false)
  lastUsedAt  DateTime?
  tokenType   String    @default("access")
  user        SalesRep  @relation(fields: [salesRepId], references: [id], onDelete: Cascade)
}
```

## Core Implementation

### Token Generation Utility
```javascript
const generateTokens = async (userId, role) => {
  const accessToken = jwt.sign(
    { userId, role, type: 'access' },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );

  const refreshToken = jwt.sign(
    { userId, role, type: 'refresh' },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  await prisma.token.createMany({
    data: [
      {
        token: accessToken,
        salesRepId: userId,
        tokenType: 'access',
        expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000)
      },
      {
        token: refreshToken,
        salesRepId: userId,
        tokenType: 'refresh',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    ]
  });

  return { accessToken, refreshToken };
};
```

### Authentication Middleware
```javascript
const authenticateToken = async (req, res, next) => {
  try {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Access token required' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== 'access') {
      return res.status(401).json({ error: 'Invalid token type' });
    }

    const tokenRecord = await prisma.token.findFirst({
      where: {
        token,
        salesRepId: decoded.userId,
        tokenType: 'access',
        blacklisted: false,
        expiresAt: { gt: new Date() }
      }
    });

    if (!tokenRecord) {
      // Auto-refresh tokens
      const user = await prisma.salesRep.findUnique({
        where: { id: decoded.userId }
      });
      
      await prisma.token.updateMany({
        where: { token, salesRepId: decoded.userId },
        data: { blacklisted: true }
      });

      const { accessToken, refreshToken } = await generateTokens(user.id, user.role);
      req.user = user;
      req.tokensRefreshed = true;
      req.newTokens = { accessToken, refreshToken };
    } else {
      req.user = await prisma.salesRep.findUnique({
        where: { id: decoded.userId }
      });
      req.tokensRefreshed = false;
    }

    next();
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed' });
  }
};
```

### Token Refresh Middleware
```javascript
const handleTokenRefresh = (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    if (req.tokensRefreshed && req.newTokens) {
      let responseData = typeof data === 'string' ? JSON.parse(data) : data;
      responseData.tokensRefreshed = true;
      responseData.newAccessToken = req.newTokens.accessToken;
      responseData.newRefreshToken = req.newTokens.refreshToken;
      
      res.setHeader('X-Token-Refreshed', 'true');
      return originalSend.call(this, JSON.stringify(responseData));
    }
    return originalSend.call(this, data);
  };
  
  next();
};
```

## Client Implementation

### JavaScript/React
```javascript
class AuthService {
  constructor() {
    this.accessToken = localStorage.getItem('accessToken');
    this.refreshToken = localStorage.getItem('refreshToken');
  }

  async login(phoneNumber, password) {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber, password })
    });

    const data = await response.json();
    if (data.success) {
      this.setTokens(data.accessToken, data.refreshToken);
      return data;
    }
    throw new Error(data.error);
  }

  async apiCall(url, options = {}) {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${this.accessToken}`
      }
    });

    if (response.headers.get('X-Token-Refreshed') === 'true') {
      const data = await response.json();
      this.setTokens(data.newAccessToken, data.newRefreshToken);
    }

    return response;
  }

  setTokens(accessToken, refreshToken) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }
}
```

### Flutter/Dart
```dart
class AuthService {
  String? _accessToken;
  String? _refreshToken;
  
  Future<Map<String, dynamic>> login(String phoneNumber, String password) async {
    final response = await http.post(
      Uri.parse('$baseURL/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode({'phoneNumber': phoneNumber, 'password': password}),
    );
    
    final data = json.decode(response.body);
    if (data['success'] == true) {
      await _setTokens(data['accessToken'], data['refreshToken']);
      return data;
    }
    throw Exception(data['error']);
  }
  
  Future<http.Response> apiCall(String endpoint) async {
    final response = await http.get(
      Uri.parse('$baseURL$endpoint'),
      headers: {'Authorization': 'Bearer $_accessToken'},
    );
    
    if (response.headers['x-token-refreshed'] == 'true') {
      final data = json.decode(response.body);
      await _setTokens(data['newAccessToken'], data['newRefreshToken']);
    }
    
    return response;
  }
}
```

## Security Features

### Rate Limiting
```javascript
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many authentication attempts' }
});

const refreshLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { error: 'Too many token refresh attempts' }
});
```

### Token Cleanup
```javascript
const cleanupExpiredTokens = async () => {
  await prisma.token.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } },
        { blacklisted: true }
      ]
    }
  });
};

// Run daily at 2 AM
const schedule = require('node-cron');
schedule.schedule('0 2 * * *', cleanupExpiredTokens);
```

## Testing

### Unit Tests
```javascript
describe('Authentication', () => {
  test('should login user', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        phoneNumber: '1234567890',
        password: 'password123'
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body).toHaveProperty('accessToken');
  });

  test('should refresh token', async () => {
    const response = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: 'valid_refresh_token' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
```

## Best Practices

1. **Token Storage**: Use secure storage (localStorage for web, secure storage for mobile)
2. **Error Handling**: Implement graceful error handling and retry logic
3. **Security**: Use HTTPS, implement rate limiting, monitor for suspicious activity
4. **Performance**: Minimize database queries, implement caching where appropriate
5. **Monitoring**: Log authentication events and monitor token usage

## API Endpoints

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/api/auth/register` | No | User registration |
| POST | `/api/auth/login` | No | User login |
| POST | `/api/auth/refresh` | No | Token refresh |
| POST | `/api/auth/logout` | Yes | User logout |
| DELETE | `/api/auth/delete` | Yes | Account deletion | 