import React, { useState } from "react";
import Navbar from "./components/Navbar";
import Register from "./components/Register";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import './App.css';


function App() {
  const [page, setPage] = useState("register");
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [userRole, setUserRole] = useState("");

  const saveToken = (t, r) => {
    setToken(t);
    setUserRole(r);
    localStorage.setItem("token", t);
  };

  const logout = () => {
    setToken("");
    setUserRole("");
    localStorage.removeItem("token");
    setPage("login");
  };

  return (
    <div>
      <Navbar setPage={setPage} token={token} logout={logout} />
      {page === "register" && <Register setPage={setPage} />}
      {page === "login" && <Login setPage={setPage} saveToken={saveToken} />}
      {page === "dashboard" && token && <Dashboard token={token} userRole={userRole} logout={logout} />}
    </div>
  );
}

export default App;
