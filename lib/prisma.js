const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Connection pool configuration
  log: ['error', 'warn'],
});

// Handle connection pool errors
prisma.$on('query', (e) => {
  if (e.duration > 5000) { // Log slow queries (>5s)
    console.warn(`Slow query detected: ${e.query} (${e.duration}ms)`);
  }
});

// Handle connection errors
prisma.$on('error', (e) => {
  console.error('Prisma error:', e);
});

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

module.exports = prisma;
