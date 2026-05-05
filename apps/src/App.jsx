import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Layout & Common Components
import Layout from "./components/layout/Layout";
import LandingPage from "./components/pages/auth/LandingPage";
import RoleSelect from "./components/pages/auth/RoleSelect";
import Dashboard from "./components/pages/common/Dashboard";

// Role-based Page Imports
import ManageUniversities from "./components/pages/admin/ManageUniversities";
import IssueCertificate from "./components/pages/university/IssueCertificate";

// ============================================
// 3-Step Auth Flow Router
// ============================================
const RootRouter = () => {
  const { walletAddress, role, isInitialized } = useAuth();

  // Step 1: Loading state - show landing while initializing
  if (!isInitialized) {
    return (
      <Routes>
        <Route path="*" element={<LandingPage />} />
      </Routes>
    );
  }

  // Step 2: No wallet connected - show LandingPage
  if (!walletAddress) {
    return (
      <Routes>
        <Route path="*" element={<LandingPage />} />
      </Routes>
    );
  }

  // Step 3: Wallet connected but no role - show RoleSelect
  if (!role || role === "public") {
    return (
      <Routes>
        <Route path="*" element={<RoleSelect />} />
      </Routes>
    );
  }
  

  // Step 4: Wallet + Role exists - show role-specific pages wrapped in Layout
  return (
    <Layout>
      <Routes>
        {/* Default redirect to dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Common dashboard for all authenticated roles */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* ADMIN Routes */}
        {role === "admin" && (
          <>
            <Route path="/manage-universities" element={<ManageUniversities />} />
          </>
        )}

        {/* UNIVERSITY Routes */}
        {role === "university" && (
          <>
            <Route path="/issue" element={<IssueCertificate />} />
            <Route path="/history" element={<DegreeHistory />} />
          </>
        )}

        {/* STUDENT Routes */}
        {role === "student" && (
          <>
            <Route path="/my-degrees" element={<MyDegrees />} />
          </>
        )}
        

        {/* Invalid paths redirect to dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
};

// ============================================
// Main App Component
// ============================================
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <RootRouter />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

App.jsx
