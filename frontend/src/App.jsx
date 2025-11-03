import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Register from "./pages/register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import FinanceManager from "./components/FinanceManager";
import jStat from "jstat";
window.jStat = jStat;
function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/manager" element={<FinanceManager />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
            
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
