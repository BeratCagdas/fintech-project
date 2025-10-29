import { useState } from "react";

function Login() {
  const [form, setForm] = useState({ email: "", password: "" });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();

    if (data.token) {
      localStorage.setItem("user", JSON.stringify(data));
       localStorage.setItem("token", data.token);
      alert("Giriş başarılı! ve Token kaydedildi.");
    } else {
      alert(data.message || "Giriş başarısız.");
    }
  };

  return (
    <div className="container">
      <h2>Giriş Yap</h2>
      <form onSubmit={handleSubmit}>
        <input name="email" placeholder="E-posta" onChange={handleChange} required />
        <input name="password" type="password" placeholder="Şifre" onChange={handleChange} required />
        <button type="submit">Giriş Yap</button>
      </form>
    </div>
  );
}

export default Login;
