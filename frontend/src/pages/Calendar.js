import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CreateEventModal from '../components/CreateEventModal';
import './Calendar.css';

function Calendar() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [viewMode, setViewMode] = useState('month'); // 'month' or 'week'

  useEffect(() => {
    fetchEvents();
  }, [selectedDate]);

  const fetchEvents = async () => {
    try {
      const response = await axios.get('http://localhost:4000/api/calendar/events', {
        params: {
          startDate: new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1).toISOString(),
          endDate: new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).toISOString()
        },
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('gmailAccessToken')}`
        }
      });
      setEvents(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching calendar events:', err);
      setError('Failed to load calendar events. Please try again later.');
      setLoading(false);
    }
  };

  const handleEventCreated = (newEvent) => {
    setEvents([...events, newEvent]);
  };

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const formatEventTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);
  };

  const renderEventDetails = () => {
    if (!selectedEvent) return null;

    return (
      <div className="event-details-overlay" onClick={() => setSelectedEvent(null)}>
        <div className="event-details" onClick={(e) => e.stopPropagation()}>
          <button className="close-button" onClick={() => setSelectedEvent(null)}>
            <span className="material-icons">close</span>
          </button>
          <h3>{selectedEvent.summary}</h3>
          <div className="event-time">
            <span className="material-icons">schedule</span>
            {formatEventTime(selectedEvent.start.dateTime)} - {formatEventTime(selectedEvent.end.dateTime)}
          </div>
          {selectedEvent.description && (
            <div className="event-description">
              <span className="material-icons">description</span>
              {selectedEvent.description}
            </div>
          )}
          {selectedEvent.location && (
            <div className="event-location">
              <span className="material-icons">location_on</span>
              {selectedEvent.location}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(selectedDate);
    const firstDay = getFirstDayOfMonth(selectedDate);
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day);
      const dayEvents = events.filter(event => {
        const eventDate = new Date(event.start.dateTime || event.start.date);
        return eventDate.toDateString() === date.toDateString();
      });

      const isCurrentDay = isToday(date);

      days.push(
        <div key={day} className={`calendar-day ${isCurrentDay ? 'today' : ''}`}>
          <div className="day-number">{day}</div>
          <div className="day-events">
            {dayEvents.map((event, index) => (
              <div
                key={index}
                className="event-pill"
                onClick={() => handleEventClick(event)}
                title={event.summary}
              >
                <span className="event-time">
                  {formatEventTime(event.start.dateTime)}
                </span>
                <span className="event-title">{event.summary}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return days;
  };

  const changeMonth = (increment) => {
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + increment, 1));
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  if (loading) {
    return <div className="calendar-loading">Loading calendar...</div>;
  }

  if (error) {
    return (
      <div className="calendar-error">
        <span className="material-icons">error_outline</span>
        {error}
      </div>
    );
  }

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <div className="calendar-nav">
          <button onClick={() => changeMonth(-1)}>
            <span className="material-icons">chevron_left</span>
            Previous
          </button>
          <h2>
            {selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h2>
          <button onClick={() => changeMonth(1)}>
            Next
            <span className="material-icons">chevron_right</span>
          </button>
          <button onClick={goToToday} className="today-button">
            <span className="material-icons">today</span>
            Today
          </button>
        </div>
        <button className="add-event-button" onClick={() => setIsModalOpen(true)}>
          <span className="material-icons">add</span>
          Add Event
        </button>
      </div>
      
      <div className="calendar-weekdays">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="weekday">{day}</div>
        ))}
      </div>
      
      <div className="calendar-grid">
        {renderCalendarDays()}
      </div>

      <CreateEventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onEventCreated={handleEventCreated}
      />

      {renderEventDetails()}
    </div>
  );
}

export default Calendar; 