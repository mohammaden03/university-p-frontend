/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';

// Pages
import { DashboardPage } from './pages/DashboardPage';
import { ManuscriptLibraryPage } from './pages/ManuscriptLibraryPage';
import { ManuscriptDetailsPage } from './pages/ManuscriptDetailsPage';
import { UploadRecognitionPage } from './pages/UploadRecognitionPage';
import { TranscriptionEditorPage } from './pages/TranscriptionEditorPage';
import { SearchPage } from './pages/SearchPage';
import { DatasetPage } from './pages/DatasetPage';
import { ProcessingHistoryPage } from './pages/ProcessingHistoryPage';
import { UsersPage } from './pages/UsersPage';
import { SettingsPage } from './pages/SettingsPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

// Configure TanStack Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30000,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Auth Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Protected App Routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<DashboardPage />} />
                <Route path="manuscripts" element={<ManuscriptLibraryPage />} />
                <Route path="manuscripts/:id" element={<ManuscriptDetailsPage />} />
                <Route path="upload" element={<UploadRecognitionPage />} />
                <Route path="transcription/:pageId" element={<TranscriptionEditorPage />} />
                <Route path="search" element={<SearchPage />} />
                <Route path="datasets" element={<DatasetPage />} />
                <Route path="history" element={<ProcessingHistoryPage />} />
                <Route
                  path="users"
                  element={
                    <ProtectedRoute requireAdmin>
                      <UsersPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="settings" element={<SettingsPage />} />
              </Route>

              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}
