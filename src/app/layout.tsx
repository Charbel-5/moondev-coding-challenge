import './globals.css';
import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import Navbar from '@/components/Navbar';
import SessionTimeoutMonitor from '@/components/SessionTimeoutMonitor';

export const metadata: Metadata = {
  title: 'MoonDev Coding Challenge',
  description: 'Application assessment platform for MoonDev',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <meta name="color-scheme" content="light dark" />
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#0a0a0a" media="(prefers-color-scheme: dark)" />
      </head>
      <body className={`${GeistSans.variable} ${GeistMono.variable} h-full bg-neutral-50 dark:bg-neutral-900`}>
        <AuthProvider>
          <Navbar />
          {children}
          <SessionTimeoutMonitor />
          <Toaster 
            position="bottom-right"
            toastOptions={{
              className: "shadow-card border border-neutral-100 dark:border-neutral-800",
              style: {
                background: 'var(--background, #ffffff)',
                color: 'var(--foreground, #171717)',
              },
              success: {
                iconTheme: {
                  primary: '#10B981',
                  secondary: '#ffffff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#EF4444',
                  secondary: '#ffffff',
                },
              }
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
