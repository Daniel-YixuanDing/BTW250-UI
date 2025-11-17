const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';


export async function login(username, password) {
    const r = await fetch(`${BASE}/api/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
    if (!r.ok) throw await r.json();
    return r.json();
}
export async function fetchLanes() {
    const r = await fetch(`${BASE}/api/lanes`);
    return r.json();
}
export async function checkAvailability(date, startISO, endISO) {
    const q = new URLSearchParams({ date, startISO, endISO });
    const r = await fetch(`${BASE}/api/availability?${q.toString()}`);
    return r.json();
}
export async function reserve(token, laneId, startISO, endISO) {
    const r = await fetch(`${BASE}/api/reserve`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-auth-token': token }, body: JSON.stringify({ laneId, startISO, endISO }) });
    return r.json();
}
export async function myReservations(token) {
    const r = await fetch(`${BASE}/api/my-reservations`, { headers: { 'x-auth-token': token } });
    return r.json();
}
export async function cancelReservation(token, id) {
    const r = await fetch(`${BASE}/api/reserve/${id}`, { method: 'DELETE', headers: { 'x-auth-token': token } });
    return r.json();
}