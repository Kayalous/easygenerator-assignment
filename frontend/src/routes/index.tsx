import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import SignIn from "../pages/SignIn";
import SignUp from "../pages/SignUp";
import Dashboard from "../pages/Dashboard";

function RequireAuth({ children }: { children: JSX.Element }) {
  const { user, isLoadingUser } = useAuth();
  const location = useLocation();

  if (isLoadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/signin"
        state={{ from: location }}
        replace
      />
    );
  }

  return children;
}

function RequireUnauth({ children }: { children: JSX.Element }) {
  const { user, isLoadingUser } = useAuth();

  if (isLoadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (user) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }

  return children;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/signin"
        element={
          <RequireUnauth>
            <SignIn />
          </RequireUnauth>
        }
      />
      <Route
        path="/signup"
        element={
          <RequireUnauth>
            <SignUp />
          </RequireUnauth>
        }
      />
      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <Dashboard />
          </RequireAuth>
        }
      />
      <Route
        path="/"
        element={
          <Navigate
            to="/signin"
            replace
          />
        }
      />
    </Routes>
  );
}
