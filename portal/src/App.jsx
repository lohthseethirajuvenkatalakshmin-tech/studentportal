import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, NavLink, Navigate, useNavigate } from "react-router-dom";
import "./App.css";

/* ---------- helpers ---------- */
function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : initialValue;
    } catch {
      return initialValue;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  }, [key, value]);
  return [value, setValue];
}

/* ---------- Navbar ---------- */
function Navbar({ user, onLogout }) {
  return (
    <nav className="navbar">
      <h2 className="logo">🎓 Student Portal</h2>
      {user ? (
        <div className="nav-links">
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/courses">Courses</NavLink>
          <NavLink to="/dashboard">Dashboard</NavLink>
          <a href="#logout" onClick={(e) => { e.preventDefault(); onLogout(); }}>Logout</a>
        </div>
      ) : (
        <div className="nav-links">
          <NavLink to="/login">Login</NavLink>
          <NavLink to="/register">Register</NavLink>
        </div>
      )}
    </nav>
  );
}

/* ---------- Login ---------- */
function Login({ users, onLogin }) {
  const [form, setForm] = useState({ email: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = (e) => {
    e.preventDefault();
    const email = form.email.trim().toLowerCase();
    if (!users[email]) {
      setError("No account found with this email. Please register first.");
      return;
    }
    onLogin(email);
    navigate("/dashboard");
  };

  return (
    <div className="page narrow">
      <form className="card form" onSubmit={submit}>
        <h3>Login</h3>
        <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} />
        {error && <p className="error">{error}</p>}
        <button type="submit">Login</button>
        <p className="muted">New student? <NavLink to="/register">Create an account</NavLink></p>
      </form>
    </div>
  );
}

/* ---------- Register ---------- */
function Register({ users, setUsers, onLogin }) {
  const [form, setForm] = useState({ name: "", email: "", course: "", year: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = (e) => {
    e.preventDefault();
    const email = form.email.trim().toLowerCase();
    if (!form.name.trim() || !email) {
      setError("Name and email are required.");
      return;
    }
    if (users[email]) {
      setError("An account with this email already exists.");
      return;
    }
    setUsers({
      ...users,
      [email]: {
        name: form.name.trim(),
        email,
        course: form.course.trim(),
        year: form.year.trim(),
        courses: [],
      },
    });
    onLogin(email);
    navigate("/dashboard");
  };

  return (
    <div className="page narrow">
      <form className="card form" onSubmit={submit}>
        <h3>Create Account</h3>
        <input name="name" placeholder="Full name" value={form.name} onChange={handleChange} />
        <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} />
        <input name="course" placeholder="Course (e.g. Computer Science Engineering)" value={form.course} onChange={handleChange} />
        <input name="year" placeholder="Year (e.g. 4th year)" value={form.year} onChange={handleChange} />
        {error && <p className="error">{error}</p>}
        <button type="submit">Register</button>
        <p className="muted">Already have an account? <NavLink to="/login">Login</NavLink></p>
      </form>
    </div>
  );
}

/* ---------- Home ---------- */
function Home({ user }) {
  const credits = user.courses.reduce((sum, c) => sum + Number(c.credits || 0), 0);
  return (
    <div className="page">
      <h1>Welcome, {user.name} 👋</h1>
      <p className="muted">Manage your courses and student information in one place.</p>
      <div className="stats">
        <div className="stat"><h3>{user.courses.length}</h3><p>Courses</p></div>
        <div className="stat"><h3>{credits}</h3><p>Total Credits</p></div>
        <div className="stat"><h3>{user.year || "—"}</h3><p>Current Year</p></div>
      </div>
    </div>
  );
}

/* ---------- Courses (list + add + delete) ---------- */
function Courses({ user, updateUser }) {
  const emptyForm = { name: "", instructor: "", duration: "", credits: "" };
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const addCourse = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.instructor.trim()) {
      setError("Course name and instructor are required.");
      return;
    }
    const credits = Number(form.credits);
    if (form.credits !== "" && (isNaN(credits) || credits < 0)) {
      setError("Credits must be a valid number.");
      return;
    }
    updateUser({
      courses: [
        ...user.courses,
        {
          id: Date.now(),
          name: form.name.trim(),
          instructor: form.instructor.trim(),
          duration: form.duration.trim() || "—",
          credits: credits || 0,
        },
      ],
    });
    setForm(emptyForm);
    setError("");
  };

  const deleteCourse = (id) => updateUser({ courses: user.courses.filter((c) => c.id !== id) });

  return (
    <div className="page">
      <h1>Courses</h1>

      <form className="card form" onSubmit={addCourse}>
        <h3>Add a New Course</h3>
        <input name="name" placeholder="Course name" value={form.name} onChange={handleChange} />
        <input name="instructor" placeholder="Instructor" value={form.instructor} onChange={handleChange} />
        <input name="duration" placeholder="Duration (e.g. 10 weeks)" value={form.duration} onChange={handleChange} />
        <input name="credits" type="number" min="0" placeholder="Credits" value={form.credits} onChange={handleChange} />
        {error && <p className="error">{error}</p>}
        <button type="submit">+ Add Course</button>
      </form>

      {user.courses.length === 0 ? (
        <p className="muted">No courses yet. Add one above.</p>
      ) : (
        <div className="grid">
          {user.courses.map((c) => (
            <div className="card" key={c.id}>
              <h3>{c.name}</h3>
              <p><strong>Instructor:</strong> {c.instructor}</p>
              <p><strong>Duration:</strong> {c.duration}</p>
              <p><strong>Credits:</strong> {c.credits}</p>
              <button className="danger" onClick={() => deleteCourse(c.id)}>Delete</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Dashboard (student information, editable) ---------- */
function Dashboard({ user, updateUser }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(user);

  const handleChange = (e) => setDraft({ ...draft, [e.target.name]: e.target.value });

  const save = (e) => {
    e.preventDefault();
    updateUser({ name: draft.name, course: draft.course, year: draft.year });
    setEditing(false);
  };

  return (
    <div className="page">
      <h1>Dashboard</h1>

      <div className="card profile">
        <h3>Student Information</h3>
        {editing ? (
          <form className="form" onSubmit={save}>
            <input name="name" value={draft.name} onChange={handleChange} placeholder="Name" />
            <input value={user.email} disabled title="Email cannot be changed" />
            <input name="course" value={draft.course} onChange={handleChange} placeholder="Course" />
            <input name="year" value={draft.year} onChange={handleChange} placeholder="Year" />
            <div className="row">
              <button type="submit">Save</button>
              <button type="button" className="secondary" onClick={() => { setDraft(user); setEditing(false); }}>
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <>
            <p><strong>Name:</strong> {user.name}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Course:</strong> {user.course || "—"}</p>
            <p><strong>Year:</strong> {user.year || "—"}</p>
            <button onClick={() => { setDraft(user); setEditing(true); }}>Edit Information</button>
          </>
        )}
      </div>

      <div className="card">
        <h3>My Courses ({user.courses.length})</h3>
        {user.courses.length === 0 ? (
          <p className="muted">No courses added yet.</p>
        ) : (
          <ul>
            {user.courses.map((c) => (
              <li key={c.id}>{c.name} — {c.instructor} ({c.credits} credits)</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ---------- App ---------- */
export default function App() {
  // every student's account + their own courses, keyed by email
  const [users, setUsers] = useLocalStorage("portal-users", {});
  // who is logged in right now
  const [session, setSession] = useLocalStorage("portal-session", null);

  const user = session ? users[session] : null;

  const updateUser = (changes) =>
    setUsers({ ...users, [session]: { ...users[session], ...changes } });

  const logout = () => setSession(null);

  return (
    <BrowserRouter>
      <Navbar user={user} onLogout={logout} />
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login users={users} onLogin={setSession} />} />
        <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register users={users} setUsers={setUsers} onLogin={setSession} />} />
        <Route path="/" element={user ? <Home user={user} /> : <Navigate to="/login" />} />
        <Route path="/courses" element={user ? <Courses user={user} updateUser={updateUser} /> : <Navigate to="/login" />} />
        <Route path="/dashboard" element={user ? <Dashboard user={user} updateUser={updateUser} /> : <Navigate to="/login" />} />
        <Route path="*" element={<Navigate to={user ? "/" : "/login"} />} />
      </Routes>
    </BrowserRouter>
  );
}