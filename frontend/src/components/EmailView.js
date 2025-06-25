import React, { useState, useEffect } from 'react';
import axios from 'axios';
import InternshipSummaryModal from './InternshipSummaryModal';
import './EmailView.css';

const EmailView = ({ email, onClose }) => {
  const [showSummary, setShowSummary] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const isInternshipEmail = email.category === 'Internship Applications & Correspondence';

  // Debug logs for internship emails
  useEffect(() => {
    if (isInternshipEmail) {
      console.log('EmailView - Internship Email Data:', {
        emailId: email.id,
        subject: email.subject,
        category: email.category,
        hasInternshipAnalysis: !!email.internship_analysis,
        internshipAnalysis: email.internship_analysis,
        content: email.content ? email.content.substring(0, 100) + '...' : 'No content'
      });
    }
  }, [email, isInternshipEmail]);

  const handleAnalyzeEmail = async () => {
    setIsAnalyzing(true);
    setError(null);
    try {
      console.log('Starting email analysis for:', {
        emailId: email.id,
        subject: email.subject
      });

      const response = await axios.post('http://localhost:4000/api/internship/analyze', {
        emailContent: email.content,
        subject: email.subject,
        attachments: email.attachments || []
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('Analysis response:', response.data);

      // Update the email object with the analysis
      email.internship_analysis = response.data;
      setShowSummary(true);
    } catch (err) {
      console.error('Analysis error:', err);
      setError('Failed to analyze email. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="email-view">
      <div className="email-header">
        <h2>{email.subject}</h2>
        <div className="header-actions">
          {isInternshipEmail && (
            email.internship_analysis ? (
              <button 
                className="view-summary-btn"
                onClick={() => setShowSummary(true)}
              >
                <span className="material-icons">description</span>
                View Analysis
              </button>
            ) : (
              <button 
                className="analyze-btn"
                onClick={handleAnalyzeEmail}
                disabled={isAnalyzing}
              >
                <span className="material-icons">analytics</span>
                {isAnalyzing ? 'Analyzing...' : 'Analyze Email'}
              </button>
            )
          )}
          <button onClick={onClose} className="close-btn">
            <span className="material-icons">close</span>
          </button>
        </div>
      </div>
      <div className="email-metadata">
        <div><strong>From:</strong> {email.from}</div>
        <div><strong>To:</strong> {email.to}</div>
        <div><strong>Date:</strong> {new Date(email.date).toLocaleString()}</div>
      </div>
      {error && (
        <div className="error-message">
          <span className="material-icons">error</span>
          {error}
        </div>
      )}
      <div className="email-content">
        {email.content}
      </div>

      {isInternshipEmail && email.internship_analysis && showSummary && (
        <InternshipSummaryModal
          analysis={email.internship_analysis}
          onClose={() => setShowSummary(false)}
        />
      )}
    </div>
  );
};

export default EmailView; 