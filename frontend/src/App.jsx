import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Register from "./pages/register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import ProtectedRoute from "./components/ProtectedRoute";
import FinanceManager from "./components/FinanceManager";
import Analytics from "./components/Analytics";
import "./pages/theme.css";

//  Context Providers
import { ToastProvider } from './context/ToastContext';
import { OnboardingProvider } from './context/OnboardingContext';

//  Onboarding Modal
import OnboardingModal from './components/OnboardingModal';

import jStat from "jstat";
window.jStat = jStat;

function App() {
  return (
    <ToastProvider>
      <OnboardingProvider>
        {/*  Onboarding Modal - Tüm sayfalarda render olur ama sadece gerektiğinde gösterilir */}
        <OnboardingModal />
        
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/manager" element={<FinanceManager />} />
          <Route path="/analytics" element={<Analytics />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
        </Routes>
      </OnboardingProvider>
    </ToastProvider>
  );
}

export default App;
