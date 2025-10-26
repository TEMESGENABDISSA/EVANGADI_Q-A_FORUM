import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useContext } from "react";
import Terms from "../components/Footer/Terms.jsx";
import QuestionAndAnswer from "../Pages/QuestionAndAnswer/QuestionAndAnswer.jsx";
import AskQuestion from "../Pages/AskQuestion/AskQuestion.jsx";
import PrivacyPolicy from "../Pages/PrivacyPolicy/PrivacyPolicy.jsx";
import Home from "../Pages/Home/Home.jsx";
import AuthLayout from "../Pages/AuthLayout/AuthLayout.jsx";
import PasswordReset from "../Pages/Password/PasswordReset.jsx";
import HowItWorks from "../Pages/HowItWorks/HowItWorks.jsx";
import { UserState } from "../App";
import ProtectedRoute from "../components/ProtectedRoute/ProtectedRoute";

// Public route wrapper to prevent authenticated users from accessing auth pages
function PublicRoute({ children }) {
  const { user } = useContext(UserState);
  const token = localStorage.getItem("Evangadi_Forum");
  const location = useLocation();

  if (token && user) {
    // If user is authenticated, redirect to home or previous location
    const from = location.state?.from?.pathname || "/home";
    return <Navigate to={from} replace />;
  }

  return children;
}

function AppRouter() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="/auth" element={
        <PublicRoute>
          <AuthLayout />
        </PublicRoute>
      } />
      <Route path="/reset-password/:token" element={<PasswordReset />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/how-it-works" element={<HowItWorks />} />

      {/* Protected routes */}
      <Route path="/home" element={
        <ProtectedRoute>
          <Home />
        </ProtectedRoute>
      } />
      <Route path="/ask" element={
        <ProtectedRoute>
          <AskQuestion />
        </ProtectedRoute>
      } />
      <Route path="/question/:questionId" element={
        <ProtectedRoute>
          <QuestionAndAnswer />
        </ProtectedRoute>
      } />

      {/* Catch all other routes */}
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}

export default AppRouter;
