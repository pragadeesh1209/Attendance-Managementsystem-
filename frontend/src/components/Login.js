import React, { useState } from "react";
import axios from "axios";

const API = "http://localhost:4000";

const Login = ({ setPage, saveToken }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const login = async () => {
    if (!email || !password) return alert("Fill all fields");
    try {
      const res = await axios.post(`${API}/login`, { email, password });
      if (res.data.token) {
        saveToken(res.data.token, res.data.role);
        setPage("dashboard");
      } else {
        alert(res.data.msg || "Login failed");
      }
    } catch (err) {
      console.error(err);
      alert("Login error");
    }
  };

  return (
    <div className="container">
      <h2>Login</h2>
      <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
      <input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
      <button onClick={login}>Login</button>
    </div>
  );
};

export default Login;
