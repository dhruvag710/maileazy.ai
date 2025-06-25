import React, { useState } from 'react';
import axios from 'axios';
import './CreateEventModal.css';

function CreateEventModal({ isOpen, onClose, onEventCreated }) {
  const [eventData, setEventData] = useState({
    summary: '',
    description: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const start = new Date(`${eventData.startDate}T${eventData.startTime}`);
      const end = new Date(`${eventData.endDate}T${eventData.endTime}`);

      const response = await axios.post('http://localhost:4000/api/calendar/events', {
        summary: eventData.summary,
        description: eventData.description,
        start: start.toISOString(),
        end: end.toISOString(),
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('gmailAccessToken')}`
        }
      });

      onEventCreated(response.data);
      onClose();
      setEventData({
        summary: '',
        description: '',
        startDate: '',
        startTime: '',
        endDate: '',
        endTime: '',
      });
    } catch (err) {
      setError('Failed to create event. Please try again.');
      console.error('Error creating event:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Create New Event</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Event Title</label>
            <input
              type="text"
              value={eventData.summary}
              onChange={(e) => setEventData({ ...eventData, summary: e.target.value })}
              required
              placeholder="Enter event title"
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={eventData.description}
              onChange={(e) => setEventData({ ...eventData, description: e.target.value })}
              placeholder="Enter event description"
              rows="3"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Start Date</label>
              <input
                type="date"
                value={eventData.startDate}
                onChange={(e) => setEventData({ ...eventData, startDate: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Start Time</label>
              <input
                type="time"
                value={eventData.startTime}
                onChange={(e) => setEventData({ ...eventData, startTime: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>End Date</label>
              <input
                type="date"
                value={eventData.endDate}
                onChange={(e) => setEventData({ ...eventData, endDate: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>End Time</label>
              <input
                type="time"
                value={eventData.endTime}
                onChange={(e) => setEventData({ ...eventData, endTime: e.target.value })}
                required
              />
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="cancel-button">
              Cancel
            </button>
            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? 'Creating...' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateEventModal; 