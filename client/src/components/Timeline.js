import React, { useEffect, useState } from 'react'

const Timeline = () => {
  const [events, setEvents] = useState([])

  useEffect(() => {
    fetch('http://localhost:5000/events')
      .then(res => res.json())
      .then(data => setEvents(data))
      .catch(err => console.error('Fetch error:', err))
  }, [])

  return (
    <div>
      <h2>Tech Timeline</h2>
      <ul>
        {events.map(event => (
          <li key={event.id}>
            <strong>{event.date}</strong>: {event.title} — {event.company}
            <p>{event.summary}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default Timeline
