import React, { useState } from "react";
import axios from "axios";

const API = "http://localhost:4000";

const Register = ({ setPage }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("User");

  const register = async () => {
    if (!name || !email || !password || !role) return alert("Fill all fields");
    try {
      const res = await axios.post(`${API}/register`, { name, email, password, role });
      alert(res.data.msg || "Registered");
      setName(""); setEmail(""); setPassword(""); setRole("User");
      setPage("login");
    } catch (err) {
      console.error(err);
      alert("Error registering");
    }
  };

  return (
    <div className="container">
      <h2>Register</h2>
      <input placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
      <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
      <input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
      <select value={role} onChange={e => setRole(e.target.value)}>
        <option value="User">Employee</option>
        <option value="Manager">Manager</option>
        <option value="Admin">Admin</option>
      </select>
      <button onClick={register}>Register</button>
    </div>
  );
};

export default Register;
