// app/layout.tsx
'use client'; 

import { Inter } from 'next/font/google'; 
import localFont from "next/font/local";
import { ReactNode, useEffect } from "react";
import "./globals.css";
import { AuthProvider, useAuth } from '@/context/AuthContext';
import Navbar from "@/components/navbar/navbar";
import Footer from "@/components/footer/footer";
import ScrollToTopButton from "@/components/ui/ScrollToTopButton";
import { useRouter, usePathname } from 'next/navigation';

// Fonts
const ibmPlexSans = localFont({
  src: [
    { path: "/fonts/IBMPlexSans-Regular.ttf", weight: "400", style: "normal" },
    { path: "/fonts/IBMPlexSans-Medium.ttf", weight: "500", style: "normal" },
    { path: "/fonts/IBMPlexSans-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "/fonts/IBMPlexSans-Bold.ttf", weight: "700", style: "normal" },
  ],
});

const bebasNeue = localFont({
  src: [{ path: "/fonts/BebasNeue-Regular.ttf", weight: "400", style: "normal" }],
  variable: "--bebas-neue",
});

const AuthWrapper: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading, userRole, mustChangePassword } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading) {
      // Define ALL public routes that do NOT require authentication
      // Use regex for dynamic routes like /reinitialiser-mot-de-passe/[token]
      const publicRoutes = [
        '/',
        '/connexion',
        '/sign-up',
        '/mot-de-passe-oublie', // NEW public route
        /^\/reinitialiser-mot-de-passe\/.+$/, // NEW: Regex for dynamic reset password link
        '/ltim/presentation',
        '/ltim/membres',
        '/ltim/publications',
        '/ltim/theses',
        '/ltim/masters-stages',
      ];

      // Check if the current path is a public route (using test for regex)
      const isPublicRoute = publicRoutes.some(route => 
        typeof route === 'string' ? pathname === route : route.test(pathname)
      );

      // Check if the current path is a dashboard-related route
      const isDashboardRoute = pathname.startsWith('/dashboard');

      if (!isAuthenticated) {
        // If not authenticated:
        if (isDashboardRoute && !isPublicRoute) { 
          router.replace('/connexion');
        }
        // If it's a public route, do nothing (allow access)
      } else {
        // If authenticated:
        if (pathname === '/connexion' || pathname === '/sign-up' || pathname === '/mot-de-passe-oublie') {
          router.replace('/dashboard');
        }
      }
    }
  }, [isAuthenticated, isLoading, userRole, router, pathname, mustChangePassword]);

  return <>{children}</>;
};


const RootLayout = ({ children }: { children: ReactNode }) => {
  return (
    <html lang="en"> 
      <body className="relative min-h-screen flex flex-col bg-white">
        <AuthProvider>
            <AuthWrapper>
              <Navbar />
              <div className="flex-grow relative pt-16"> 
                {children}
              </div>
              <Footer />
              <ScrollToTopButton />
            </AuthWrapper>
        </AuthProvider>
      </body>
    </html>
  );
};

export default RootLayout;
