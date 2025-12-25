// Home.jsx
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "./Home.css";
import MarketData from "../components/MarketData";
import FinanceNews from "../components/FinanceNews";
import DarkModeToggle from "../components/DarkModeToggle.jsx";
import { useOnboarding } from '../context/OnboardingContext';

function Home() {
  const navigate = useNavigate();
  const { recheckOnboarding } = useOnboarding();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const user = JSON.parse(localStorage.getItem("user"));

  // ✅ Kullanıcı login olduğunda onboarding kontrolü
  useEffect(() => {
    const checkUser = async () => {
      const currentUser = JSON.parse(localStorage.getItem("user"));
      if (currentUser && currentUser.token) {
        await recheckOnboarding();
      }
    };

    checkUser();
  }, [recheckOnboarding]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="home">
      {/* NAVBAR */}
      <nav className="navbar">
        <div className="navbar-container">
          <h2 className="logo" onClick={() => navigate("/")}>
            💰 <span>FinTech</span>
          </h2>

          {/* Desktop Menu */}
          <div className="nav-menu">
            <Link to="/" className="nav-link">Ana Sayfa</Link>
            <Link to="/dashboard" className="nav-link">Dashboard</Link>
            <Link to="/analytics" className="nav-link">Analiz</Link>
            <Link to="/debts" className="nav-link">Borçlar</Link>
            <Link to="/credit-cards" className="nav-link">Kredi Kartları</Link>
            <Link to="/investments" className="nav-link">Yatırımlar</Link>
            <Link to="/assets" className="nav-link">Varlıklar</Link>
            <Link to="/net-worth" className="nav-link">Net Değer</Link>
            


           
            
              <DarkModeToggle />  
          </div>


          <div className="nav-actions">
            {!user ? (
              <>
                <Link to="/login" className="nav-btn login">Giriş Yap</Link>
                <Link to="/register" className="nav-btn register">Kayıt Ol</Link>
              </>
            ) : (
              <>
                <div className="user-info">
                  <div className="user-avatar">
                    {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                  </div>
                  <div className="user-details">
                    <span className="user-name">{user.name || 'Kullanıcı'}</span>
                    <span className="user-email">{user.email}</span>
                  </div>
                </div>
                <button className="logout-btn" onClick={handleLogout}>
                  🚪 Çıkış
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="mobile-menu">
            <Link to="/" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>Ana Sayfa</Link>
            <Link to="/dashboard" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
            <Link to="/analytics" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>Analytics</Link>
            <a href="#features" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>Özellikler</a>
            <a href="#market" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>Piyasalar</a>
            {!user && (
              <div className="mobile-actions">
                <Link to="/login" className="mobile-btn">Giriş Yap</Link>
                <Link to="/register" className="mobile-btn">Kayıt Ol</Link>
              </div>
            )}
          </div>
        )}
      </nav>

      {/* HERO SECTION */}
      <section className="hero">
        <div className="hero-bg-pattern"></div>
        <div className="hero-container">
          <div className="hero-content">
            <span className="hero-badge">🚀 Finansal Özgürlük</span>
            <h1 className="hero-title">
              Finansal Geleceğinizi <br />
              <span className="gradient-text">Keşfedin</span>
            </h1>
            <p className="hero-subtitle">
              Gelir ve giderlerinizi takip edin, yatırım önerilerini görün,
              hedeflerinize ulaşın. Yapay zeka destekli finansal asistanınız.
            </p>

      

            {!user ? (
              <div className="hero-actions">
                <Link to="/register" className="hero-btn primary">
                  <span>✨</span>
                  Hemen Başla
                </Link>
                <Link to="/login" className="hero-btn secondary">
                  <span>🚀</span>
                  Giriş Yap
                </Link>
              </div>
            ) : (
              <div className="hero-actions">
                <Link to="/dashboard" className="hero-btn primary">
                  <span>📊</span>
                  Dashboard'a Git
                </Link>
                <Link to="/analytics" className="hero-btn secondary">
                  <span>📈</span>
                  Analiz
                </Link>
              </div>
            )}
          </div>

          <div className="hero-visual">
            <div className="visual-card">
              <div className="visual-header">
                <div className="visual-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
               
              </div>
              <div className="visual-content">
                <div className="visual-graph"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="features" id="features">
        <div className="features-container">
          <div className="section-header">
            <h2 className="section-title">Güçlü Özellikler</h2>
            <p className="section-subtitle">Finansal hedeflerinize ulaşmanız için ihtiyacınız olan her şey</p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
           
              <h3>Analytics Dashboard</h3>
              <p>Gelir, gider ve tasarruflarınızı detaylı grafiklerle takip edin</p>
            </div>

            <div className="feature-card">
             
              <h3>Anomali Tespiti</h3>
              <p>Harcamalarınızdaki şüpheli işlemleri ve anormallikleri anında yakalayın</p>
            </div>

            <div className="feature-card">
             
              <h3>Nakit Akış Tahmini</h3>
              <p>Analizlerle gelecek aylardaki finansal durumunuzu ve nakit akışınızı öngörün</p>
            </div>

            <div className="feature-card">
            
              <h3>Bütçe Kontrolü</h3>
              <p>Harcama limitlerinizi belirleyin, bütçenizi aşmadan hedeflerinize emin adımlarla ulaşın</p>
            </div>

            <div className="feature-card">
             
              <h3>Kredi Skoru Hesaplama</h3>
              <p>Kredi notunuzu simüle edin ve puanınızı yükseltmek için kişisel tavsiyeler alın</p>
            </div>

            <div className="feature-card">
           
              <h3>Varlık & Borç Yönetimi</h3>
              <p>Tüm varlıklarınızı, borçlarınızı ve net değerinizi tek bir ekrandan kolayca yönetin</p>
            </div>

            <div className="feature-card">
           
              <h3>AI Yatırım Önerileri</h3>
              <p>Yapay zeka destekli kişiselleştirilmiş yatırım tavsiyeleri Ve günlük Inshightlar</p>
            </div>

            <div className="feature-card">
            
              <h3>Hesaplama Araçları</h3>
              <p>Faiz, kredi, emeklilik ve daha fazlası için hesaplayıcılar</p>
            </div>

            <div className="feature-card">
             
              <h3>Hedef Takibi</h3>
              <p>Finansal hedeflerinizi belirleyin ve ilerlemeyi görün</p>
            </div>

            <div className="feature-card">
              
              <h3>Piyasa Verileri</h3>
              <p>Döviz, kripto ve borsa verilerini anlık takip edin</p>
            </div>

            <div className="feature-card">
             
              <h3>Finans Haberleri</h3>
              <p>Bloomberg ve diğer kaynaklardan güncel haberler</p>
            </div>
          </div>
        </div>
      </section>

      {/* MARKET DATA SECTION */}
      <section className="market-section" id="market">
        <div className="market-container">
          <div className="section-header">
            <h2 className="section-title">Piyasa Verileri</h2>
            <p className="section-subtitle">Döviz, kripto ve borsa verilerini canlı takip edin</p>
          </div>
          <MarketData />
        </div>
      </section>

      {/* NEWS SECTION */}
      <section className="news-section">
        <div className="news-container">
          <div className="section-header">
            <h2 className="section-title">Finans Haberleri</h2>
            <p className="section-subtitle">Bloomberg'den son dakika finansal haberler</p>
          </div>
          <FinanceNews maxNews={6} />
        </div>
      </section>

      {/* CTA SECTION */}
      {!user && (
        <section className="cta-section">
          <div className="cta-container">
            <div className="cta-content">
              <h2>Finansal Geleceğinizi Bugün İnşa Edin</h2>
              <p>Ücretsiz hesap oluşturun ve tüm özelliklere erişin</p>
              <div className="cta-actions">
                <Link to="/register" className="cta-btn primary">
                  Ücretsiz Başla
                </Link>
                <Link to="/login" className="cta-btn secondary">
                  Giriş Yap
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-content">
            <div className="footer-brand">
              <h3>FinTech</h3>
              <p>Finansal özgürlüğünüz için akıllı çözümler</p>
            </div>

            <div className="footer-links">
              <div className="footer-column">
                <h4>Ürün</h4>
                <Link to="/dashboard">Dashboard</Link>
                <Link to="/analytics">Analytics</Link>
                <a href="#features">Özellikler</a>
              </div>

              <div className="footer-column">
                <h4>Şirket</h4>
                <a href="#">Hakkımızda</a>
                <a href="#">Blog</a>
                <a href="#">İletişim</a>
              </div>

              <div className="footer-column">
                <h4>Destek</h4>
                <a href="#">Yardım Merkezi</a>
                <a href="#">Gizlilik</a>
                <a href="#">Şartlar</a>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <p>© 2025 FinTech. Tüm hakları saklıdır.</p>
            <div className="footer-social">
              <a href="#">Twitter</a>
              <a href="#">LinkedIn</a>
              <a href="#">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;