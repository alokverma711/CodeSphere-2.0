const { PrismaClient } = require('@prisma/client');

const databaseUrl = process.env.DATABASE_URL || '';

if (!databaseUrl.includes('.neon.tech')) {
  throw new Error(
    'Invalid DATABASE_URL: this backend is configured for Neon only. Set DATABASE_URL to a Neon connection string.'
  );
}

const prisma = new PrismaClient();

module.exports = prisma;
