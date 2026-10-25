# Shared Component Registry

| Component | Path | Props / Purpose |
|---|---|---|
| `Sidebar` | `src/components/Sidebar.jsx` | Linear-style primary & secondary navigation sidebar with user avatar, search hint, and mobile drawer. |
| `CommandPalette` | `src/components/CommandPalette.jsx` | `isOpen, onClose` — Quick keyboard modal (Cmd+K / Ctrl+K) for quick navigation and AI queries. |
| `ProtectedRoute` | `src/components/ProtectedRoute.jsx` | React Router outlet wrapper that redirects unauthenticated sessions to `/login`. |
| `ErrorBoundary` | `src/components/common/ErrorBoundary.jsx` | Catch-all React error boundary with fallback UI and reload action. |
| `ToastContext` | `src/context/ToastContext.jsx` | `toast.success`, `toast.error`, `toast.info`, `toast.warning` notifications with clean dark surfaces. |
| `AuthContext` | `src/context/AuthContext.jsx` | User authentication state provider (`user`, `login`, `register`, `logout`, `updateUser`). |
| `LayoutContext` | `src/context/LayoutContext.jsx` | Responsive navigation state provider (`mobileSidebarOpen`, `setMobileSidebarOpen`). |
| `LoadingSpinner` | `src/components/LoadingSpinner.jsx` | Standard centered loading spinner with subtle animation. |
| `EmptyState` | `src/components/common/EmptyState.jsx` | Consistent empty state presentation with icon, title, message, and action CTA. |
| `ErrorState` | `src/components/common/ErrorState.jsx` | Consistent error display with retry callback support. |
| `LoadingState` | `src/components/common/LoadingState.jsx` | Skeleton and loader wrapper for async page data fetches. |
