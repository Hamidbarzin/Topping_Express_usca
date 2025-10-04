// Configuration module - centralized environment variables
// In production, all values must come from Render environment variables

// Only load .env in development
if (process.env.NODE_ENV !== 'production') {
  // Note: dotenv is not installed, so we rely on environment variables being set
  console.log('[config] Running in development mode');
}

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3000),
  
  // Database
  databaseUrl: process.env.DATABASE_URL,
  
  // Stallion Express API
  stallionApiKey: process.env.STALLION_API_KEY || process.env.STALLION_API_TOKEN,
  stallionApiUrl: process.env.STALLION_API_URL || 'https://api.stallionexpress.ca',
  
  // Postmark Email
  postmarkApiKey: process.env.POSTMARK_API_KEY || process.env.postmark_API_Tokens,
  postmarkFromEmail: process.env.POSTMARK_FROM_EMAIL || 'no-reply@toppingcourier.ca',
  
  // Admin
  adminEmail: process.env.ADMIN_EMAIL || 'toppingcourier.ca@gmail.com',
  
  // Session
  sessionSecret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
};

// Validate required environment variables in production
if (config.nodeEnv === 'production') {
  const requiredVars = [
    { key: 'DATABASE_URL', value: config.databaseUrl },
    { key: 'STALLION_API_KEY', value: config.stallionApiKey },
    { key: 'POSTMARK_API_KEY', value: config.postmarkApiKey },
    { key: 'SESSION_SECRET', value: config.sessionSecret },
  ];
  
  const missing = requiredVars.filter(v => !v.value).map(v => v.key);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing);
    console.error('Please set these variables in your Render dashboard');
    process.exit(1);
  }
  
  // Log what's configured (without exposing values)
  console.log('✅ Production configuration loaded:');
  console.log(`   NODE_ENV: ${config.nodeEnv}`);
  console.log(`   PORT: ${config.port}`);
  console.log(`   DATABASE_URL: ${config.databaseUrl ? '✓ Set' : '✗ Missing'}`);
  console.log(`   STALLION_API_KEY: ${config.stallionApiKey ? '✓ Set' : '✗ Missing'}`);
  console.log(`   STALLION_API_URL: ${config.stallionApiUrl}`);
  console.log(`   POSTMARK_API_KEY: ${config.postmarkApiKey ? '✓ Set' : '✗ Missing'}`);
  console.log(`   POSTMARK_FROM_EMAIL: ${config.postmarkFromEmail}`);
  console.log(`   ADMIN_EMAIL: ${config.adminEmail}`);
}
