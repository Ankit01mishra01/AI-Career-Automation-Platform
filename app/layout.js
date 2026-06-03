import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import Header from "@/components/header";
import ErrorBoundary from "@/components/error-boundary";
import { ClerkProvider } from "@clerk/nextjs";
import { Inter } from "next/font/google";
import { dark } from "@clerk/themes";
import { Toaster } from "sonner";

// Check if Clerk is properly configured
const isClerkConfigured = () => {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  return publishableKey && 
         publishableKey !== 'pk_test_YOUR_PUBLISHABLE_KEY_HERE' && 
         publishableKey !== 'pk_test_YOUR_PUBLISHABLE_KEY_HERE' &&
         publishableKey.startsWith('pk_') &&
         publishableKey.length > 20;
};

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: {
    default: "Career Genius | AI Career Automation Platform",
    template: "%s | Career Genius",
  },
  description:
    "AI-powered resume builder, cover letters, interview prep, and industry insights to accelerate your career.",
  keywords: [
    "career",
    "resume builder",
    "cover letter",
    "interview prep",
    "AI career",
    "ATS resume",
  ],
  openGraph: {
    title: "Career Genius | AI Career Automation Platform",
    description:
      "Build resumes, cover letters, and prepare for interviews with AI-powered tools.",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  // Show setup message if Clerk keys are not configured
  if (!isClerkConfigured()) {
    return (
      <html lang="en" suppressHydrationWarning>
        <body className={`${inter.className} antialiased min-h-screen flex flex-col`}>
          <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-8">
            <div className="max-w-2xl text-center space-y-6">
              <h1 className="text-4xl font-bold text-red-400">⚠️ Clerk Authentication Setup Required</h1>
              <div className="bg-gray-800 p-6 rounded-lg text-left space-y-4">
                <h2 className="text-xl font-semibold text-yellow-400">Steps to Fix:</h2>
                <ol className="list-decimal list-inside space-y-2 text-gray-300">
                  <li>Go to <a href="https://dashboard.clerk.com/" className="text-blue-400 underline" target="_blank">dashboard.clerk.com</a></li>
                  <li>Create a free account and new application</li>
                  <li>Copy your API keys from the dashboard</li>
                  <li>Update your .env.local file with real keys:</li>
                </ol>
                <div className="bg-gray-900 p-4 rounded font-mono text-sm text-green-400">
                  <div>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_real_key</div>
                  <div>CLERK_SECRET_KEY=sk_test_your_real_key</div>
                </div>
                <p className="text-sm text-gray-400">Your Gemini AI key is already configured: ✅</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    );
  }

  return (
    <ClerkProvider appearance={{ baseTheme: dark }}>
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${inter.className} antialiased min-h-screen flex flex-col`}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            {/* header */}
            <Header />

            {/* main grows to fill space */}
            <ErrorBoundary>
              <main className="flex-grow">{children}</main>
            </ErrorBoundary>
            <Toaster richColors />

            {/* footer */}
            <footer className="bg-muted/50 py-12">
              <div className="container mx-auto px-4 text-center text-gray-200">
                <p>Made by Ankit Mishra</p>
              </div>
            </footer>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
