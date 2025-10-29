import { Link, useNavigate } from "react-router-dom";
import "./Home.css";

function Home() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="home">
      {/* NAVBAR */}
      <nav className="navbar">
        <h2 className="logo" onClick={() => navigate("/")}>
          Fintech<span>Dashboard</span>
        </h2>

        <div className="nav-links">
          {!user ? (
            <>
              <Link to="/register" className="nav-btn">Kayıt Ol</Link>
              <Link to="/login" className="nav-btn">Giriş Yap</Link>
            </>
          ) : (
            <>
              <span className="user-email">{user.email}</span>
              <button className="logout-btn" onClick={handleLogout}>Çıkış Yap</button>
            </>
          )}
        </div>
      </nav>

      {/* HERO ALANI */}
      <section className="hero">
        <div className="overlay">
          <h1 className="hero-title">Fintech Dashboard</h1>
          <p className="hero-subtitle">
            Finansal verilerini analiz et, tasarrufunu keşfet ve yatırım önerilerini al.
          </p>

          {!user && (
            <div className="hero-links">
              <Link to="/login" className="hero-link">Giriş Yap</Link>
              <Link to="/register" className="hero-link outline">Kayıt Ol</Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default Home;
