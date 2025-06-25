import React from 'react';
import './CategoryBadge.css';

const categoryColors = {
  'Meeting Invitations & Scheduling': '#4A90E2',  // Professional blue
  'Internship Applications & Correspondence': '#FF6B6B',  // Coral red
  'Academic & Administrative Notices': '#845EC2',  // Purple
  'Financial Transactions & Billing': '#50B2C0',  // Teal
  'Banking & Investments': '#00C9A7',  // Mint
  'Orders, Deliveries & Purchases': '#FFC75F',  // Orange
  'Research, Collaborations & Grants': '#008080',  // Dark teal
  'Personal, Promotions & Spam': '#808080'  // Gray
};

const priorityColors = {
  'high': '#DC3545',    // Bootstrap danger red
  'medium': '#FFC107',  // Bootstrap warning yellow
  'low': '#28A745'      // Bootstrap success green
};

const CategoryBadge = ({ category, priority, deadline }) => {
  const getDeadlineStatus = (deadline) => {
    if (!deadline) return null;
    
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffDays = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 3) return { className: 'deadline-urgent', text: 'Urgent' };
    if (diffDays <= 7) return { className: 'deadline-upcoming', text: 'Upcoming' };
    return { className: 'deadline-far', text: 'Far' };
  };

  const deadlineStatus = getDeadlineStatus(deadline);

  // Get the background color for the category, with a fallback
  const backgroundColor = categoryColors[category] || '#808080';
  
  // Determine if we should use white or black text based on background color brightness
  const getBrightness = (hexColor) => {
    const rgb = parseInt(hexColor.slice(1), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;
    return (r * 299 + g * 587 + b * 114) / 1000;
  };
  
  const textColor = getBrightness(backgroundColor) > 128 ? '#000000' : '#FFFFFF';

  return (
    <div className="badge-container">
      <span 
        className="category-badge"
        style={{ 
          backgroundColor,
          color: textColor,
          border: getBrightness(backgroundColor) > 200 ? '1px solid #E0E0E0' : 'none'
        }}
      >
        {category}
      </span>
      <span 
        className="priority-badge"
        style={{ 
          backgroundColor: priorityColors[priority.toLowerCase()] || priorityColors['low'],
          color: '#FFFFFF'
        }}
      >
        {priority.toUpperCase()}
      </span>
      {deadlineStatus && (
        <span className={`deadline-badge ${deadlineStatus.className}`}>
          <i className="material-icons" style={{ fontSize: '14px', marginRight: '4px' }}>event</i>
          {deadline}
        </span>
      )}
    </div>
  );
};

export default CategoryBadge; 