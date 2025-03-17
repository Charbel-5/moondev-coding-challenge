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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${GeistSans.variable} ${GeistMono.variable}`}>
        <AuthProvider>
          <Navbar />
          <main>
            {children}
          </main>
          <SessionTimeoutMonitor />
          <Toaster position="bottom-right" />
        </AuthProvider>
      </body>
    </html>
  );
}
