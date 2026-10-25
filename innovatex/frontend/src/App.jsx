import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { LayoutProvider } from './context/LayoutContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import CommandPalette from './components/CommandPalette';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import GithubAnalyzerPage from './pages/github/GithubAnalyzerPage';
import OpenSourcePage from './pages/opensource/OpenSourcePage';
import ContestTrackerPage from './pages/contests/ContestTrackerPage';
import JobSearchPage from './pages/jobs/JobSearchPage';
import MarketIntelligencePage from './pages/market/MarketIntelligencePage';
import ResearchAgentPage from './pages/research/ResearchAgentPage';
import ReportsPage from './pages/reports/ReportsPage';
import SettingsPage from './pages/settings/SettingsPage';
import ProfilePage from './pages/profile/ProfilePage';

import ErrorBoundary from './components/common/ErrorBoundary';

const AppLayout = () => {
  const [commandOpen, setCommandOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandOpen((prev) => !prev);
      }
    };

    const handleCustomOpen = () => {
      setCommandOpen(true);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-command-palette', handleCustomOpen);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-command-palette', handleCustomOpen);
    };
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-canvas)' }}>
      {/* Top Navbar everywhere on every page */}
      <Navbar />

      <main style={{ flex: 1, width: '100%' }}>
        <ErrorBoundary>
          <ProtectedRoute />
        </ErrorBoundary>
      </main>

      <CommandPalette isOpen={commandOpen} onClose={() => setCommandOpen(false)} />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <LayoutProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Landing Page */}
              <Route path="/" element={<LandingPage />} />

              {/* Public Auth Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Protected Routes inside AppLayout with Top Navbar */}
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/overview" element={<Navigate to="/dashboard" replace />} />
                
                {/* Core Feature Routes */}
                <Route path="/github" element={<GithubAnalyzerPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/opensource" element={<OpenSourcePage />} />
                <Route path="/contests" element={<ContestTrackerPage />} />
                <Route path="/jobs" element={<JobSearchPage />} />
                <Route path="/market" element={<MarketIntelligencePage />} />
                <Route path="/research" element={<ResearchAgentPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/settings" element={<SettingsPage />} />

                {/* Subroute aliases and redirects */}
                <Route path="/opportunities" element={<Navigate to="/opensource" replace />} />
                <Route path="/resume" element={<Navigate to="/jobs" replace />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </LayoutProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
