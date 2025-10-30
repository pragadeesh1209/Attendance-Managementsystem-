**Project Title**

**Attendance Management System using MERN Stack (MongoDB, Express, React, Node.js)**

**Aim:**

To design and develop a web-based Attendance Management System that allows employees to mark attendance, managers to monitor employee attendance, and administrators to manage users and audit all attendance changes.

**Objectives:**

  To provide secure authentication for Admin, Manager, and User roles.
  To enable employees to mark their daily attendance.
  To allow managers to view and edit attendance of employees under them.
  To enable administrators to view all records and maintain audit logs of all changes.
  To store all data securely using MongoDB and JWT-based authorization.
  To create a user-friendly interface using React.js.

**Modules:**


**1. Authentication Module:**

  Register – New users (Admin, Manager, User) can register with name, email, password, and role.Login – Authenticates users using JWT (JSON Web Token).
  Passwords are encrypted using bcrypt.js before saving.

**2. Role Management"**

  Admin: Full access — can view, edit, and delete all attendance records, and view audit logs.
  Manager: Can manage attendance for “User” role employees only.
  User (Employee): Can mark their own attendance as “Present” once per day.

**3. Attendance Module:**

  Employees can mark attendance once per day.
  Admin and Manager can edit (Present/Absent) and delete attendance records.
  Attendance data is stored with date, userId, and status.

**4. Audit Log Module:**

  Every time attendance is edited or deleted, an entry is added to the Audit collection.
  Logs include action type (EDIT/DELETE), user who made the change, target user, old value, new value, and timestamp.
  Admin can view all audit logs.

**5. Frontend (React.js):**

  Built with React and Axios to communicate with backend APIs.

***Pages:***

  Register Page: Collects name, email, password, and role.
  Login Page: Authenticates users and stores JWT in localStorage.

***Dashboard:***

  Displays user’s profile and role.
  Shows attendance records.
  Allows attendance marking, editing, and deleting based on role.
  Admin view includes an Audit Log list.
  Styled with custom CSS for a modern, clean layout.

**Algorithm:**

  Start the Application
  Backend server starts at port 4000 (Node.js + Express).
  Frontend runs on port 3000 (React.js).

***User Registration:***

  User enters details → Data sent to /register.
  Backend encrypts password and saves user info to MongoDB.

***User Login:***

  User submits credentials → Verified at /login.
  JWT token generated and sent to frontend.

***Dashboard:***

  React fetches user profile and attendance using the JWT token.
  Displays data according to user role.

***Attendance Marking:***

  User clicks “Mark Attendance” → Request sent to /attendance.
  System checks if attendance is already marked today.
  If not, adds new record to database.

***Edit/Delete Attendance:***

  Admin/Manager updates or deletes a record via /attendance/:id.
  An audit log entry is created.

***View Audit Logs:***

  Admin fetches /audit endpoint to view all logs.

***Logout:***

  JWT is removed from localStorage → Redirects to login page.

**Technology used:**

  **Frontend**	              React.js, Axios, HTML, CSS
  **Backend**                	Node.js, Express.js
  **Database**          	    MongoDB
  **Authentication**     	    JWT (JSON Web Token)
  **Password Encryption**   	bcrypt.js

**Key Features:**

  Secure authentication using JWT.
  Role-based access control (Admin / Manager / User).
  One-click daily attendance marking.
  Editable and deletable attendance (Admin & Manager).
  Real-time audit logging of changes.
  Simple, user-friendly UI with dynamic rendering.

**Conclusion:**

  This Attendance Management System successfully demonstrates a complete full-stack application built using the MERN stack. It provides secure authentication, role-based access control, and efficient attendance tracking, ensuring data integrity through audit logging and modern user interface design.

