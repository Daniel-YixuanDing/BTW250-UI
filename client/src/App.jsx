import React, { useEffect, useState } from 'react'
import * as api from './api'
import illiniBlueLogo from './logo/Block-I-orange-white-background.png'

export default function App() {
  const [authState, setAuthState] = useState(null) // null | { token, user: { id, displayName } }
  const [loginUsername, setLoginUsername] = useState('student')
  const [loginPassword, setLoginPassword] = useState('password')
  const [loginError, setLoginError] = useState('')
  const [loginBusy, setLoginBusy] = useState(false)

  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [durationMins, setDurationMins] = useState(60)
  const [availability, setAvailability] = useState(null)
  const [lanes, setLanes] = useState([])
  const [myRes, setMyRes] = useState([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    const stored = localStorage.getItem('authToken')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setAuthState(parsed)
      } catch {
        localStorage.removeItem('authToken')
      }
    }
  }, [])

  useEffect(() => {
    if (authState) {
      fetchLanes()
      fetchReservations()
    }
  }, [authState])

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoginError('')
    setLoginBusy(true)
    try {
      const result = await api.login(loginUsername, loginPassword)
      const state = { token: result.token, user: result.user }
      setAuthState(state)
      localStorage.setItem('authToken', JSON.stringify(state))
      setLoginUsername('student')
      setLoginPassword('password')
    } catch (err) {
      setLoginError(err.error || 'Login failed')
    } finally {
      setLoginBusy(false)
    }
  }

  const handleLogout = () => {
    setAuthState(null)
    localStorage.removeItem('authToken')
    setMyRes([])
    setAvailability(null)
  }

  const fetchLanes = async () => {
    try {
      const data = await api.fetchLanes()
      setLanes(data.lanes || [])
    } catch (err) {
      setError('Failed to load lanes')
    }
  }

  const fetchReservations = async () => {
    if (!authState) return
    try {
      const data = await api.myReservations(authState.token)
      setMyRes(data.reservations || [])
    } catch (err) {
      console.error(err)
    }
  }

  const fetchAvailability = async () => {
    if (!date || !startTime) {
      setError('Please select date and time')
      return
    }
    setBusy(true)
    setError('')
    try {
      const startISO = new Date(`${date}T${startTime}:00`).toISOString()
      const endISO = new Date(new Date(startISO).getTime() + durationMins * 60000).toISOString()
      const data = await api.checkAvailability(date, startISO, endISO)
      setAvailability({ startISO, endISO, occupiedLaneIds: data.occupiedLaneIds || [] })
    } catch (err) {
      setError('Failed to check availability')
      console.error(err)
    } finally {
      setBusy(false)
    }
  }

  const makeReservation = async (laneId) => {
    if (!authState) return
    setBusy(true)
    setError('')
    setSuccessMsg('')
    try {
      const startISO = new Date(`${date}T${startTime}:00`).toISOString()
      const endISO = new Date(new Date(startISO).getTime() + durationMins * 60000).toISOString()
      await api.reserve(authState.token, laneId, startISO, endISO)
      setSuccessMsg(`Reserved Lane ${laneId}!`)
      await fetchReservations()
      setAvailability(null)
      setDate('')
      setStartTime('')
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch (err) {
      setError(err.error || 'Failed to make reservation')
    } finally {
      setBusy(false)
    }
  }

  const doCancel = async (reservationId) => {
    if (!authState) return
    try {
      await api.cancelReservation(authState.token, reservationId)
      await fetchReservations()
      setSuccessMsg('Reservation cancelled')
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch (err) {
      setError('Failed to cancel reservation')
    }
  }

  const pretty = (iso) => new Date(iso).toLocaleString()

  if (!authState) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'repeating-linear-gradient(to right, #002e8b 0%, #002e8b 50% , #ff5f15 50%, #ff5f15 100%)'}}>
        <div className="card" style={{ width: '100%', maxWidth: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <img src={illiniBlueLogo} alt="Illini" style={{ height: 60, marginBottom: 16, objectFit: 'contain' }} />
            <h1 style={{ margin: '0 0 4px 0', fontSize: 28, color: '#002e8b' }}>Bowling Lane Booking</h1>
            <p className="small" style={{ margin: 0, color: '#ff5f15', fontWeight: 500 }}>Illini Union Rec Room</p>
          </div>

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>Username</label>
              <input
                type="text"
                className="input"
                value={loginUsername}
                onChange={e => setLoginUsername(e.target.value)}
                placeholder="student"
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>Password</label>
              <input
                type="password"
                className="input"
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            {loginError && <div style={{ color: '#dc2626', fontSize: 13, marginBottom: 12, background: '#fff3f2', padding: 10, borderRadius: 6 }}>{loginError}</div>}
            <button type="submit" className="btn" style={{ width: '100%', padding: '10px 12px', background: '#ff5f15', fontSize: 14, fontWeight: 600 }} disabled={loginBusy}>
              {loginBusy ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div style={{ marginTop: 20, paddingTop: 20, borderTop: '2px solid #002e8b' }}>
            <p className="small" style={{ margin: 0, textAlign: 'center' }}>Demo account:</p>
            <p className="small" style={{ margin: '4px 0', textAlign: 'center', fontWeight: 500 }}>
              student <span style={{ color: '#9ca3af' }}>/</span> password
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <header style={{ background: '#002e8b', padding: '16px 20px', marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <img src={illiniBlueLogo} alt="Illini" style={{ height: 48, objectFit: 'contain' }} />
            <div>
              <h1 style={{ margin: 0, fontSize: 24, color: 'white' }}>Bowling Lane Booking</h1>
              <p style={{ margin: '2px 0 0 0', fontSize: 13, color: '#e6eefc' }}>Welcome, <strong>{authState.user.displayName}</strong></p>
            </div>
          </div>
          <button className="btn secondary" onClick={handleLogout} style={{ background: '#ff5f15', color: 'white', border: 'none' }}>Sign Out</button>
        </div>
      </header>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px' }}>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, marginBottom: 20 }}>
        <main className="card" style={{ borderTop: '4px solid #ff5f15' }}>
          <h2 style={{margin: '0 0 8px 0', color: '#002e8b'}}>Reserve a lane</h2>
          <div className="small" style={{marginBottom: 20, color: '#666'}}>Rates start at $4 per game for students.</div>

          {error && <div style={{ color: '#dc2626', background: '#fff3f2', padding: 12, borderRadius: 8, marginBottom: 16 }}>{error}</div>}
          {successMsg && <div style={{ color: '#059669', background: '#f3fff2', padding: 12, borderRadius: 8, marginBottom: 16 }}>{successMsg}</div>}

          <div style={{ marginBottom: 20 }}>
            <div className="form-row" style={{ marginBottom: 12, alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ flex: 1, minWidth: 150 }}>
                <label className="small" style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>Date</label>
                <input className="input" type="date" value={date} onChange={e => setDate(e.target.value)} />
              </div>
              <div style={{ minWidth: 130 }}>
                <label className="small" style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>Start time</label>
                <input className="input" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
              </div>
              <div style={{ minWidth: 140 }}>
                <label className="small" style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>Duration</label>
                <select className="input" value={durationMins} onChange={e => setDurationMins(Number(e.target.value))}>
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>1.5 hours</option>
                  <option value={120}>2 hours</option>
                </select>
              </div>
              <button className="btn" onClick={fetchAvailability} disabled={busy} style={{ padding: '8px 16px', background: '#ff5f15' }}>
                {busy ? 'Checking...' : 'Check Availability'}
              </button>
            </div>
          </div>

          {availability && (
            <div style={{ background: '#ff5f15ff', padding: 16, borderRadius: 8 }}>
              <div className="small" style={{ marginBottom: 12, color: '#0f172a' }}>
                Checking availability for <strong>{new Date(availability.startISO).toLocaleString()}</strong> — <strong>{new Date(availability.endISO).toLocaleString()}</strong>
              </div>
              <div className="grid lanes" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 10 }}>
                {lanes.map(l => {
                  const taken = availability.occupiedLaneIds.includes(l.id)
                  return (
                    <div key={l.id} className={`lane ${taken ? 'taken' : 'available'}`}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{l.name}</div>
                      <div className="small" style={{ margin: '6px 0' }}>{taken ? 'Taken' : 'Available'}</div>
                      <button
                        className="btn"
                        style={{ fontSize: 12, padding: '6px 8px', width: '100%', background: taken ? '#ccc' : '#002e8b' }}
                        disabled={taken || busy}
                        onClick={() => makeReservation(l.id)}
                      >
                        {taken ? 'Taken' : 'Reserve'}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </main>

        <aside className="card" style={{ borderTop: '4px solid #002e8b' }}>
          <h3 style={{marginTop: 0, marginBottom: 12, color: '#002e8b'}}>Your Reservations</h3>
          <div className="small" style={{marginBottom: 12, color: '#666'}}>Active bookings</div>
          <div>
            {myRes.length === 0 ? (
              <div className="small" style={{textAlign: 'center', padding: '20px 0', color: '#9ca3af'}}>No reservations yet.</div>
            ) : (
              <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
                {myRes.map(r => (
                  <div key={r.id} style={{background: '#f8fafc', padding: 12, borderRadius: 8}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8}}>
                      <div style={{flex: 1}}>
                        <div style={{fontWeight: 700, fontSize: 14}}>Lane {r.laneId}</div>
                        <div className="small" style={{margin: '4px 0'}}>{pretty(r.startTimeISO)}</div>
                        <div className="small">{((new Date(r.endTimeISO) - new Date(r.startTimeISO)) / 60000).toFixed(0)} mins</div>
                      </div>
                      <button className="btn secondary" onClick={() => doCancel(r.id)} style={{fontSize: 12, padding: '6px 8px', whiteSpace: 'nowrap', background: '#ff5f15', color: 'white', border: 'none'}}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>

      <section className="card" style={{ borderTop: '4px solid #ff5f15' }}>
        <h3 style={{marginTop: 0, color: '#002e8b'}}>About</h3>
        <p className="small">This prototype models 14 lanes, group rates, and hourly reservations. It's designed to look and feel similar to the Illini Union Rec Room pages while remaining lightweight for integration.</p>
        <ul className="small">
          <li>14 lanes available</li>
          <li>Reserve in 30-minute to 2-hour slots</li>
          <li>Rates start at $4 per game for students</li>
          <li>Prototype uses in-memory store (demo only)</li>
        </ul>
      </section>
    </div>
    </div>
  )
}