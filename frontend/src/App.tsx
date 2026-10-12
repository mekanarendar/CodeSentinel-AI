/**
 * CodeSentinel AI - Application Entry Point & Router
 */
import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext.tsx';
import { ThemeProvider } from './contexts/ThemeContext.tsx';
import { AuthenticatedLayout } from './components/layout/AuthenticatedLayout.tsx';

// Pages
import { LandingPage } from './pages/LandingPage.tsx';
import { LoginPage } from './pages/LoginPage.tsx';
import { RegisterPage } from './pages/RegisterPage.tsx';
import { DashboardPage } from './pages/DashboardPage.tsx';
import { CodeReviewPage } from './pages/CodeReviewPage.tsx';
import { ProjectAnalyzerPage } from './pages/ProjectAnalyzerPage.tsx';
import { ProjectsPage } from './pages/ProjectsPage.tsx';
import { ReviewHistoryPage } from './pages/ReviewHistoryPage.tsx';
import { ReviewDetailPage } from './pages/ReviewDetailPage.tsx';
import { ReviewComparePage } from './pages/ReviewComparePage.tsx';
import { SettingsPage } from './pages/SettingsPage.tsx';

function AppContent() {
  const { isAuthenticated, loading } = useAuth();
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname || '/';
  });

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-xs font-mono">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-500 animate-ping" />
          <span>Initializing CodeSentinel AI Security Core...</span>
        </div>
      </div>
    );
  }

  // Handle Review Detail Route (/review/:id)
  if (currentPath.startsWith('/review/') && currentPath !== '/review') {
    const reviewId = currentPath.replace('/review/', '');
    if (!isAuthenticated) {
      return <LoginPage onNavigate={navigate} />;
    }
    return (
      <AuthenticatedLayout currentPath={currentPath} navigate={navigate}>
        <ReviewDetailPage reviewId={reviewId} onNavigate={navigate} />
      </AuthenticatedLayout>
    );
  }

  // Unauthenticated routes
  if (!isAuthenticated) {
    if (currentPath === '/register') {
      return <RegisterPage onNavigate={navigate} />;
    }
    if (currentPath === '/login') {
      return <LoginPage onNavigate={navigate} />;
    }
    return <LandingPage onNavigate={navigate} />;
  }

  // Authenticated routes
  return (
    <AuthenticatedLayout currentPath={currentPath} navigate={navigate}>
      {currentPath === '/dashboard' && <DashboardPage onNavigate={navigate} />}
      {currentPath === '/review' && <CodeReviewPage />}
      {currentPath === '/project-analyzer' && <ProjectAnalyzerPage />}
      {currentPath === '/projects' && <ProjectsPage onNavigate={navigate} />}
      {currentPath === '/history' && <ReviewHistoryPage onNavigate={navigate} />}
      {currentPath === '/compare' && <ReviewComparePage />}
      {currentPath === '/settings' && <SettingsPage />}
      {currentPath === '/' && <DashboardPage onNavigate={navigate} />}
    </AuthenticatedLayout>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
