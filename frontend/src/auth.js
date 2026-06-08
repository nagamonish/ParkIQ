// Front-end-only operator session (demo). Swap for a real auth backend later
// by replacing these four functions with token calls.
const KEY = "parkiq_operator_session";

export function getSession() {
  try {
    return JSON.parse(localStorage.getItem(KEY));
  } catch {
    return null;
  }
}

export function isAuthed() {
  return !!getSession();
}

export function signIn(email, name) {
  const session = { email, name: name || email.split("@")[0], at: Date.now() };
  localStorage.setItem(KEY, JSON.stringify(session));
  return session;
}

export function signOut() {
  localStorage.removeItem(KEY);
}
