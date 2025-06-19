const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Optimize connection pool
  log: ['error', 'warn'],
  // Increase connection pool settings
  __internal: {
    engine: {
      connectionLimit: 20, // Increased from default 9
      pool: {
        min: 2,
        max: 20,
        acquireTimeoutMillis: 30000, // 30 seconds
        createTimeoutMillis: 30000,
        destroyTimeoutMillis: 5000,
        idleTimeoutMillis: 30000,
        reapIntervalMillis: 1000,
        createRetryIntervalMillis: 200,
      }
    }
  }
});

// Handle connection errors gracefully
prisma.$on('error', (e) => {
  console.error('Prisma Client error:', e);
});

prisma.$on('warn', (e) => {
  console.warn('Prisma Client warning:', e);
});

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

module.exports = prisma;
