import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "./useAuth.js";

export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const { isAuthenticated, isInitializing } = useAuth();

  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(312deg,#0b0f2b_0%,#2b1a58_13.94%,#3b1f6a_29.33%,#1a1446_50.47%,#341d5b_68.17%,#1f1852_88.46%,#0b0f2b_100%)] px-6 text-center text-white">
        <div className="rounded-[24px] border border-white/10 bg-[#17142d]/90 px-8 py-6 shadow-[0_18px_40px_rgba(0,0,0,0.35)]">
          <p className="text-[18px] font-medium text-[#d8edff]">
            Проверяем вашу сессию...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
