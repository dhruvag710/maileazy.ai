import React from 'react';
import './InternshipSummaryModal.css';

const InternshipSummaryModal = ({ analysis, onClose }) => {
  if (!analysis) {
    console.log('No analysis data provided to modal');
    return null;
  }

  console.log('Rendering InternshipSummaryModal with analysis:', analysis);

  // Ensure candidateInfo exists with default values
  const candidateInfo = analysis.candidateInfo || {
    skills: [],
    education: 'Not specified',
    experience: 'Not specified',
    projects: [],
    achievements: []
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            <span className="material-icons">description</span>
            {analysis.isApplication ? 'Application Analysis' : 'Internship Summary'}
          </h2>
          <button className="close-button" onClick={onClose}>
            <span className="material-icons">close</span>
          </button>
        </div>

        <div className="modal-body">
          {analysis.isApplication ? (
            <>
              <section className="candidate-info">
                <h3>Candidate Profile</h3>
                
                <div className="info-section">
                  <h4>Skills & Technologies</h4>
                  <div className="skills-container">
                    {candidateInfo.skills && candidateInfo.skills.length > 0 ? (
                      candidateInfo.skills.map((skill, index) => (
                        <span key={index} className="skill-tag">{skill}</span>
                      ))
                    ) : (
                      <p className="no-data">No skills specified</p>
                    )}
                  </div>
                </div>

                <div className="info-section">
                  <h4>Education</h4>
                  <p>{candidateInfo.education}</p>
                </div>

                <div className="info-section">
                  <h4>Experience</h4>
                  <p>{candidateInfo.experience}</p>
                </div>

                {candidateInfo.projects && candidateInfo.projects.length > 0 && (
                  <div className="info-section">
                    <h4>Projects</h4>
                    <ul className="project-list">
                      {candidateInfo.projects.map((project, index) => (
                        <li key={index}>{project}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {candidateInfo.achievements && candidateInfo.achievements.length > 0 && (
                  <div className="info-section">
                    <h4>Key Achievements</h4>
                    <ul className="achievement-list">
                      {candidateInfo.achievements.map((achievement, index) => (
                        <li key={index}>{achievement}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>

              <section className="analysis-summary">
                <h3>Overall Assessment</h3>
                <p>{analysis.summary || 'No summary available'}</p>
              </section>
            </>
          ) : (
            <section className="internship-details">
              <h3>Summary</h3>
              <p>{analysis.summary || 'No summary available'}</p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default InternshipSummaryModal; 