import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

import Layout from "./components/layout/Layout";
import LandingPage from "./components/pages/auth/LandingPage";
import Dashboard from "./components/pages/common/Dashboard";
import ManageUniversities from "./components/pages/admin/ManageUniversities";
import IssueCertificate from "./components/pages/university/IssueCertificate";
import CertificateHistory from "./components/pages/university/CertificateHistory";
import MyCertificates from "./components/pages/student/MyCertificates";
import PublicHome from "./components/pages/common/Home";
import RegisterStudent from "./components/pages/student/RegisterStudent";
import StudentRequests from "./components/pages/university/StudentRequests";
import VerifiedStudents from "./components/pages/university/VerifiedStudents";
import UniversityAnalytics from "./components/pages/university/UniversityAnalytics";
import VerifyCertificate from "./components/pages/recruiter/VerifyCertificate";
import SharedCertificateViewer from "./components/pages/common/SharedCertificateViewer";
import MessagingPage from "./components/messaging/MessagingPage";

const RootRouter = () => {
  const { role, isStudentLike, isInitialized, isLoading, userConnected } = useAuth();

  // Not initialized or loading → LandingPage
  if (!isInitialized || isLoading) {
    return (
      <Routes>
        <Route path="*" element={<LandingPage />} />
      </Routes>
    );
  }

  // Not connected → public routes only
  if (!userConnected) {
    return (
      <Routes>
        <Route path="/verify" element={<VerifyCertificate />} />
        <Route path="/certificate/:token" element={<SharedCertificateViewer />} />
        <Route path="*" element={<LandingPage />} />
      </Routes>
    );
  }

  // Connected → protected routes
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route element={<Layout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/home" element={role === "public" ? <PublicHome /> : <Navigate to="/dashboard" replace />} />
        <Route path="/register-student" element={<RegisterStudent />} />
        <Route path="/verify" element={<VerifyCertificate />} />


        <Route
          path="/manage-universities"
          element={role === "admin" ? <ManageUniversities /> : <Navigate to="/dashboard" replace />}
        />

        <Route
          path="/my-certificates"
          element={isStudentLike ? <MyCertificates /> : <Navigate to="/dashboard" replace />}
        />

        <Route
          path="/issue"
          element={role === "university" ? <IssueCertificate /> : <Navigate to="/dashboard" replace />}
        />

        <Route
          path="/history"
          element={role === "university" ? <CertificateHistory /> : <Navigate to="/dashboard" replace />}
        />

        <Route
          path="/student-requests"
          element={role === "university" ? <StudentRequests /> : <Navigate to="/dashboard" replace />}
        />

        <Route
          path="/verified-students"
          element={role === "university" ? <VerifiedStudents /> : <Navigate to="/dashboard" replace />}
        />

        <Route
          path="/university-analytics"
          element={role === "university" ? <UniversityAnalytics /> : <Navigate to="/dashboard" replace />}
        />

        {/* Messaging route - permission check is done inside MessagingPage */}
        <Route path="/messages" element={<MessagingPage />} />

        {/* Catch-all: only for truly unknown paths */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
};

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
