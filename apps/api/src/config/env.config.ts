export default () => ({
  port: parseInt(process.env.PORT ?? '3001', 10) || 3001,
  database_url: process.env.DATABASE_URL || '',
  frontend_url: process.env.FRONTEND_URL || 'http://localhost:3000',
});
