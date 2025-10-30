export default () => ({
  database: {
    url: process.env.DATABASE_URL,
  },
  clerk: {
    publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
    secretKey: process.env.CLERK_SECRET_KEY,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
  },
});
