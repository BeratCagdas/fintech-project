
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api"; // ✅ DÜZELTME: "../api/axios" yerine "../api"
import "./auth.css";

function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // ✅ Artık baseURL otomatik olarak doğru backend'e yönlenecek
      const res = await api.post("/api/auth/login", form);
      const data = res.data;

      if (data.token) {
        localStorage.setItem("user", JSON.stringify(data));
        localStorage.setItem("token", data.token);
        navigate("/");
      } else {
        setError(data.message || "Giriş başarısız.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err.response?.data?.message || "Giriş başarısız.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-bg-pattern"></div>

      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">💰</div>
          <h1>Hoş Geldiniz</h1>
          <p>Hesabınıza giriş yapın</p>
        </div>

        {error && (
          <div className="error-message">
            <span>⚠️</span>
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>📧 Email</label>
            <input
              type="email"
              name="email"
              placeholder="ornek@email.com"
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>🔒 Şifre</label>
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-footer">
            <label className="checkbox-label">
              <input type="checkbox" />
              <span>Beni hatırla</span>
            </label>
            <a href="#" className="forgot-link">Şifremi unuttum?</a>
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner-small"></span>
                Giriş yapılıyor...
              </>
            ) : (
              <>
                <span>🚀</span>
                Giriş Yap
              </>
            )}
          </button>
        </form>

        <div className="auth-divider">
          <span>veya</span>
        </div>

        <div className="social-login">
          <button className="social-btn google">
            <span>G</span>
            Google ile Giriş
          </button>
          <button className="social-btn github">
            <span>⚡</span>
            GitHub ile Giriş
          </button>
        </div>

        <div className="auth-switch">
          <p>Hesabınız yok mu?</p>
          <Link to="/register" className="switch-link">
            Kayıt Ol →
          </Link>
        </div>
      </div>

      <div className="auth-footer">
        <p>© 2025 FinTech. Tüm hakları saklıdır.</p>
      </div>
    </div>
  );
}

export default Login;
