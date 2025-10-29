import { useState } from "react";

function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch("http://localhost:5000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    alert(data.message || "Kayıt başarılı!");
  };

  return (
    <div className="container">
      <h2>Kayıt Ol</h2>
      <form onSubmit={handleSubmit}>
        <input name="name" placeholder="Ad Soyad" onChange={handleChange} required />
        <input name="email" placeholder="E-posta" onChange={handleChange} required />
        <input name="password" type="password" placeholder="Şifre" onChange={handleChange} required />
        <button type="submit">Kayıt Ol</button>
      </form>
    </div>
  );
}

export default Register;
