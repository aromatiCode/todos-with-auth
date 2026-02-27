# ✅ Todo App — React + localStorage Auth

A simple, fully client-side React todo application with mock authentication. No backend or database required — all data is persisted in the browser's `localStorage`.

---

## Features

- **Register** a new account (username, email, password)
- **Login** / **Logout**
- **Per-user todos** — each user's todos are stored separately
- **Add** todos
- **Toggle** complete / incomplete
- **Inline edit** — double-click a todo title or click the ✏️ button
- **Delete** individual todos
- **Filter** todos: All / Active / Completed
- **Clear completed** todos in one click
- Fully responsive, CSS Modules styling

---

## Tech Stack

| | |
|---|---|
| Framework | Create React App (JavaScript) |
| Routing | React Router v6 |
| Styling | CSS Modules |
| Persistence | `localStorage` (no backend) |
| Auth | Mock auth — passwords hashed with `btoa` |

---

## Getting Started

### Prerequisites

- Node.js ≥ 16
- npm ≥ 8

### Install & Run

```bash
# From the todo-app directory
npm install
npm start
```

The app will open at [http://localhost:3000](http://localhost:3000).

### Build for Production

```bash
npm run build
```

---

## Project Structure

```
src/
├── context/
│   └── AuthContext.js        # Auth state, login, register, logout
├── components/
│   ├── PrivateRoute.jsx      # Route guard — redirects to /login if not authenticated
│   ├── Navbar/
│   │   ├── Navbar.jsx
│   │   └── Navbar.module.css
│   └── TodoItem/
│       ├── TodoItem.jsx      # Single todo row with toggle, edit, delete
│       └── TodoItem.module.css
├── pages/
│   ├── Login/
│   │   ├── Login.jsx
│   │   └── Login.module.css
│   ├── Register/
│   │   ├── Register.jsx
│   │   └── Register.module.css
│   └── Todos/
│       ├── Todos.jsx         # Main todos page
│       └── Todos.module.css
├── App.js                    # Router setup
└── index.js
```

---

## localStorage Schema

| Key | Value |
|---|---|
| `users` | `[{ id, username, email, password }]` |
| `currentUser` | `{ id, username, email }` |
| `todos_<userId>` | `[{ id, title, completed, createdAt }]` |

---

## Routes

| Path | Page | Auth Required |
|---|---|---|
| `/login` | Login | No |
| `/register` | Register | No |
| `/todos` | Todos | **Yes** |
| `/` | → `/todos` | — |

---

## Notes

- Passwords are encoded with `btoa` for demo purposes only. **Do not use this in production.**
- Each user's todos are isolated under their own `localStorage` key.
- Todos persist across page refreshes and browser sessions (until `localStorage` is cleared).
