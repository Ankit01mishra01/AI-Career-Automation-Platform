#!/usr/bin/env node

/**
 * Environment Setup Helper
 * Creates .env.local with all required variables for local development
 */

const fs = require("fs");
const path = require("path");

const envContent = `# Clerk Authentication - https://dashboard.clerk.com
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
CLERK_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
CLERK_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE

# PostgreSQL (Neon, Supabase, or local)
DATABASE_URL="postgresql://username:password@localhost:5432/career_genius_db"

# Google Gemini AI - https://aistudio.google.com/apikey
GEMINI_API_KEY=your_gemini_api_key_here

# Inngest (optional - for scheduled industry insights)
INNGEST_EVENT_KEY=your_inngest_event_key_here
INNGEST_SIGNING_KEY=your_inngest_signing_key_here
`;

const envPath = path.join(process.cwd(), ".env.local");

console.log("Setting up environment variables...\n");

if (fs.existsSync(envPath)) {
  console.log(".env.local already exists — update it with the keys above if needed.\n");
} else {
  try {
    fs.writeFileSync(envPath, envContent);
    console.log("Created .env.local\n");
  } catch (error) {
    console.log("Could not create .env.local — create it manually:\n");
    console.log(envContent);
  }
}

console.log("Next steps:");
console.log("1. Add Clerk keys from https://dashboard.clerk.com/");
console.log("2. Add DATABASE_URL from Neon/Supabase");
console.log("3. Add GEMINI_API_KEY from https://aistudio.google.com/apikey");
console.log("4. Run: npx prisma db push");
console.log("5. Run: npm run dev");
