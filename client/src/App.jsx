import React, { useEffect, useState } from 'react'

export default function App() {
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [durationMins, setDurationMins] = useState(60)
  const [availability, setAvailability] = useState(null)
  const [lanes, setLanes] = useState([])
  const [myRes, setMyRes] = useState([])
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    fetchLanes()
    fetchReservations()
  }, [])

  const fetchLanes = async () => {
    try {
      const res = await fetch('/api/lanes')
      const data = await res.json()
      setLanes(data)
    } catch (err) {
      console.error(err)
    }
  }

  const fetchReservations = async () => {
    try {
      const res = await fetch('/api/reservations')
      const data = await res.json()
      setMyRes(data)
    } catch (err) {
      console.error(err)
    }
  }

  const fetchAvailability = async () => {
    setBusy(true)
    try {
      const startISO = new Date(`${date}T${startTime}`).toISOString()
      const endISO = new Date(new Date(startISO).getTime() + durationMins * 60000).toISOString()
      const res = await fetch(`/api/availability?start=${encodeURIComponent(startISO)}&end=${encodeURIComponent(endISO)}`)
      const data = await res.json()
      setAvailability(data)
    } catch (err) {
      console.error(err)
    } finally {
      setBusy(false)
    }
  }

  const makeReservation = async (laneId) => {
    setBusy(true)
    try {
      const startISO = new Date(`${date}T${startTime}`).toISOString()
      const endISO = new Date(new Date(startISO).getTime() + durationMins * 60000).toISOString()
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ laneId, startISO, endISO })
      })
      if (res.ok) {
        await fetchReservations()
        setAvailability(null)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setBusy(false)
    }
  }

  const doCancel = async (reservationId) => {
    try {
      const res = await fetch(`/api/reservations/${reservationId}`, { method: 'DELETE' })
      if (res.ok) {
        await fetchReservations()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const pretty = (iso) => new Date(iso).toLocaleString()

  return (
    <div>
      <main className="card">
        <h2 style={{margin:0}}>Reserve a lane</h2>
        <div className="small">Rates start at $4 per game for students.</div>

        <div className="form-row" style={{ marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <label className="small">Date</label>
            <input className="input" type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div style={{ width: 130 }}>
            <label className="small">Start time</label>
            <input className="input" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
          </div>
          <div style={{ width: 140 }}>
            <label className="small">Duration</label>
            <select className="input" value={durationMins} onChange={e => setDurationMins(Number(e.target.value))}>
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
              <option value={90}>1.5 hours</option>
              <option value={120}>2 hours</option>
            </select>
          </div>
          <div style={{ width: 120 }}>
            <label className="small">&nbsp;</label>
            <button className="btn" onClick={fetchAvailability} disabled={busy}>Check</button>
          </div>
        </div>

        {availability && (
          <div>
            <div className="small" style={{ marginBottom: 8 }}>Checking availability for <strong>{new Date(availability.startISO).toLocaleString()}</strong> — <strong>{new Date(availability.endISO).toLocaleString()}</strong></div>
            <div className="grid lanes" style={{ gridTemplateColumns: 'repeat(7,1fr)', gap: 10 }}>
              {lanes.map(l => {
                const taken = availability.occupiedLaneIds.includes(l.id)
                return (
                  <div key={l.id} className={`lane ${taken ? 'taken' : 'available'}`}>
                    <div style={{ fontWeight: 700 }}>{l.name}</div>
                    <div className="small" style={{ margin: '6px 0' }}>{taken ? 'Taken' : 'Available'}</div>
                    <button className="btn" disabled={taken || busy} onClick={() => makeReservation(l.id)}>{taken ? 'Unavailable' : 'Reserve'}</button>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>

      <aside className="card" style={{width:320}}>
        <h3 style={{marginTop:0}}>Your reservations</h3>
        <div className="small" style={{marginBottom:8}}>Quickly see and cancel your upcoming bookings.</div>
        <div>
          {myRes.length===0 ? (
            <div className="small">No reservations yet.</div>
          ) : (
            <div className="grid cols-1" style={{gap:8}}>
              {myRes.map(r=> (
                <div key={r.id} className="card" style={{padding:12}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <div>
                      <div style={{fontWeight:700}}>Lane {r.laneId}</div>
                      <div className="small">{pretty(r.startTimeISO)} — {pretty(r.endTimeISO)}</div>
                    </div>
                    <div>
                      <button className="btn secondary" onClick={()=>doCancel(r.id)}>Cancel</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <hr style={{margin:'12px 0'}} />

        <div className="small">Demo credentials: <strong>student / password</strong></div>
      </aside>

      <section className="card">
        <h3 style={{marginTop:0}}>About</h3>
        <p className="small">This prototype models 14 lanes, group rates, and hourly reservations. It's designed to look and feel similar to the Illini Union Rec Room pages while remaining lightweight for integration.</p>
        <ul className="small">
          <li>14 lanes (modeled)</li>
          <li>Rates, hours and group policies are displayed on the official site (see source).</li>
          <li>Prototype uses in-memory store (for demo only).</li>
        </ul>
      </section>
    </div>
  )
}