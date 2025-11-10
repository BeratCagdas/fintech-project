// frontend/src/pages/Register.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios"; // ✅ Global axios sistemi
import "./auth.css";

function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
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
      const res = await api.post("/api/auth/register", form);
      const data = res.data;

      alert(data.message || "Kayıt başarılı!");
      navigate("/login");
    } catch (err) {
      console.error("Register error:", err);
      setError(err.response?.data?.message || "Kayıt başarısız.");
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
          <h1>Hesap Oluştur</h1>
          <p>Finansal geleceğinize başlayın</p>
        </div>

        {error && (
          <div className="error-message">
            <span>⚠️</span>
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>👤 İsim Soyisim</label>
            <input
              type="text"
              name="name"
              placeholder="Adınız Soyadınız"
              onChange={handleChange}
              required
            />
          </div>

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
              minLength={6}
            />
          </div>

          <label className="checkbox-label terms">
            <input type="checkbox" required />
            <span>
              <a href="#">Kullanım koşullarını</a> ve{" "}
              <a href="#">gizlilik politikasını</a> kabul ediyorum
            </span>
          </label>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner-small"></span>
                Kaydediliyor...
              </>
            ) : (
              <>
                <span>✨</span>
                Kayıt Ol
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
            Google ile Kayıt Ol
          </button>
          <button className="social-btn github">
            <span>⚡</span>
            GitHub ile Kayıt Ol
          </button>
        </div>

        <div className="auth-switch">
          <p>Zaten hesabınız var mı?</p>
          <Link to="/login" className="switch-link">
            Giriş Yap →
          </Link>
        </div>
      </div>

      <div className="auth-footer">
        <p>© 2025 FinTech. Tüm hakları saklıdır.</p>
      </div>
    </div>
  );
}

export default Register;
