import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';

import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import GithubAnalyzerPage from './pages/github/GithubAnalyzerPage';
import ResearchAgentPage from './pages/research/ResearchAgentPage';
import OpenSourcePage from './pages/opensource/OpenSourcePage';
import ContestTrackerPage from './pages/contests/ContestTrackerPage';
import JobSearchPage from './pages/jobs/JobSearchPage';
import MarketIntelligencePage from './pages/market/MarketIntelligencePage';

const AppLayout = () => {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <ProtectedRoute />
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Routes inside AppLayout */}
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/github" element={<GithubAnalyzerPage />} />
            <Route path="/research" element={<ResearchAgentPage />} />
            <Route path="/opensource" element={<OpenSourcePage />} />
            <Route path="/contests" element={<ContestTrackerPage />} />
            <Route path="/jobs" element={<JobSearchPage />} />
            <Route path="/market" element={<MarketIntelligencePage />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
