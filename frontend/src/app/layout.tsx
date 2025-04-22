'use client';

import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '@/contexts/AuthContext';
import { Suspense } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <Suspense fallback={<LoadingSpinner />}>
            {children}
          </Suspense>
        </AuthProvider>
      </body>
    </html>
  );
}
