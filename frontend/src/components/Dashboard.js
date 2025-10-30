import React, { useEffect, useState } from "react";
import axios from "axios";

const API = "http://localhost:4000";

const Dashboard = ({ token, userRole, logout }) => {
  const [profile, setProfile] = useState({});
  const [users, setUsers] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [month, setMonth] = useState("");

  useEffect(() => {
    if (!token) return;
    const fetchAll = async () => {
      const headers = { Authorization: "Bearer " + token };
      try {
        const p = await axios.get(`${API}/profile`, { headers });
        setProfile(p.data);

        if (p.data.role === "Admin" || p.data.role === "Manager") {
          const u = await axios.get(`${API}/allUsers`, { headers });
          setUsers(Array.isArray(u.data) ? u.data : []);
        }

        const a = await axios.get(`${API}/attendanceAll`, { headers });
        setAttendance(Array.isArray(a.data) ? a.data : []);

        if (p.data.role === "Admin") {
          const ad = await axios.get(`${API}/audit`, { headers }).catch(() => ({ data: [] }));
          setAuditLogs(Array.isArray(ad.data) ? ad.data : []);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchAll();
  }, [token]);

  // --- Mark Attendance ---
  const markAttendance = async () => {
    try {
      await axios.post(
        `${API}/attendance`,
        { status: "Present" }, // Users can only mark Present
        { headers: { Authorization: "Bearer " + token } }
      );
      alert("Marked today as Present");
      const a = await axios.get(`${API}/attendanceAll`, { headers: { Authorization: "Bearer " + token } });
      setAttendance(Array.isArray(a.data) ? a.data : []);
    } catch (err) {
      console.error(err);
      alert("Error marking attendance");
    }
  };

  // --- Edit Attendance ---
  const editAttendance = async (id, currentStatus, recordUserRole, employeeName) => {
    // Admin can edit anyone; Manager only employees
    if (!(userRole === "Admin" || (userRole === "Manager" && recordUserRole === "User"))) {
      alert("Not allowed");
      return;
    }

    // toggle status automatically for simplicity
    const newStatus = currentStatus === "Present" ? "Absent" : "Present";

    try {
      await axios.put(
        `${API}/attendance/${id}`,
        { status: newStatus },
        { headers: { Authorization: "Bearer " + token } }
      );
      alert(`${employeeName} status changed from ${currentStatus} to ${newStatus}`);
      const a = await axios.get(`${API}/attendanceAll`, { headers: { Authorization: "Bearer " + token } });
      setAttendance(Array.isArray(a.data) ? a.data : []);

      if (userRole === "Admin") {
        const ad = await axios.get(`${API}/audit`, { headers: { Authorization: "Bearer " + token } });
        setAuditLogs(Array.isArray(ad.data) ? ad.data : []);
      }
    } catch (err) {
      console.error(err);
      alert("Error updating attendance");
    }
  };

  // --- Delete Attendance ---
  const deleteAttendance = async (id, recordUserRole) => {
    if (!window.confirm("Delete this record?")) return;

    if (userRole === "User") {
      alert("Not allowed");
      return;
    }
    if (userRole === "Manager" && recordUserRole !== "User") {
      alert("Managers can delete only employees");
      return;
    }

    try {
      await axios.delete(`${API}/attendance/${id}`, { headers: { Authorization: "Bearer " + token } });
      alert("Deleted");
      setAttendance(at => at.filter(x => x._id !== id));
    } catch (err) {
      console.error(err);
      alert("Error deleting attendance");
    }
  };

  // --- User Summary ---
  const fetchUserSummary = async (userId) => {
    try {
      const q = month ? `?month=${month}` : "";
      const res = await axios.get(`${API}/attendance/summary/user/${userId}${q}`, {
        headers: { Authorization: "Bearer " + token }
      });
      alert(`Present: ${res.data.present || 0}, Absent: ${res.data.absent || 0}`);
    } catch (err) {
      console.error(err);
      alert("Error fetching summary");
    }
  };

  // --- Team Summary ---
  const fetchTeamSummary = async () => {
    try {
      const q = month ? `?month=${month}` : "";
      const res = await axios.get(`${API}/attendance/summary/team${q}`, {
        headers: { Authorization: "Bearer " + token }
      });
      console.table(res.data);
      alert("Team summary in console");
    } catch (err) {
      console.error(err);
      alert("Error fetching team summary");
    }
  };

  return (
    <div className="container">
      <h2>{profile.role || userRole} Dashboard</h2>
      <p>Welcome, {profile.name}</p>

      {(userRole === "User" || userRole === "Manager") && (
        <button onClick={markAttendance}>Mark Attendance (Present)</button>
      )}

      <div style={{ marginTop: 12 }}>
        <input type="month" value={month} onChange={e => setMonth(e.target.value)} />
        <button onClick={fetchTeamSummary} disabled={!(userRole === "Admin" || userRole === "Manager")}>
          Team Summary
        </button>
      </div>

      <h3>Attendance Records</h3>
      <ul>
        {attendance.map(a => {
          const recordUser = users.find(u => u._id === a.userId);
          const recordUserRole = recordUser ? recordUser.role : "User";
          return (
            <li key={a._id}>
              <strong>{a.userName}</strong> — {new Date(a.date).toLocaleString()} — {a.status}
              {(userRole === "Admin" || (userRole === "Manager" && recordUserRole === "User")) && (
                <>
                  <button onClick={() => editAttendance(a._id, a.status, recordUserRole, a.userName)}>Edit</button>
                  <button onClick={() => deleteAttendance(a._id, recordUserRole)}>Delete</button>
                </>
              )}
              <button onClick={() => fetchUserSummary(a.userId)}>User summary</button>
            </li>
          );
        })}
      </ul>

      {userRole === "Admin" && (
        <>
          <h3>Audit Logs</h3>
          <ul>
            {auditLogs.map(log => (
              <li key={log._id}>
                <strong>{new Date(log.timestamp).toLocaleString()}</strong> — {log.action} by {log.changedByName} — Attendance ID: {log.attendanceId}<br/>
                Old: {log.oldValue ? `Status: ${log.oldValue.status}, Date: ${new Date(log.oldValue.date).toLocaleString()}` : "N/A"}<br/>
                New: {log.newValue ? `Status: ${log.newValue.status}, Date: ${new Date(log.newValue.date).toLocaleString()}` : "N/A"}
              </li>
            ))}
          </ul>
        </>
      )}

      <button onClick={logout}>Logout</button>
    </div>
  );
};

export default Dashboard;
