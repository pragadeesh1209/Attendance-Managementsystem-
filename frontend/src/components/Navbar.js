import React from "react";

const Navbar = ({ setPage, token, logout }) => {
  return (
    <div className="navbar" style={{ marginBottom: 16 }}>
      <button onClick={()=>setPage("register")}>Register</button>
      <button onClick={()=>setPage("login")}>Login</button>
      {/* {token && <button onClick={logout}>Logout</button>} */}
    </div>
  );
};

export default Navbar;
