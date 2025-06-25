import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Dashboard.css';
import { useNavigate, Link } from 'react-router-dom';
import classifyEmail from './utils/emailClassifier';
import CategoryBadge from './components/CategoryBadge';
import NotificationIcon from './components/NotificationIcon';

const Dashboard = () => {
  const navigate = useNavigate();
  const [emails, setEmails] = useState([]);
  const [allEmails, setAllEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCompose, setShowCompose] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [selectedEmailContent, setSelectedEmailContent] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [activeTab, setActiveTab] = useState('inbox');
  const [activePriority, setActivePriority] = useState(null);
  const [emailSortBy, setEmailSortBy] = useState('none');
  const [priorityCounts, setPriorityCounts] = useState({
    high: 0,
    medium: 0,
    low: 0
  });
  const profileMenuRef = React.useRef(null);
  const profileButtonRef = React.useRef(null);
  const [composeMail, setComposeMail] = useState({
    to: '',
    subject: '',
    message: '',
  });
  const [sendStatus, setSendStatus] = useState({ type: '', message: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredEmails, setFilteredEmails] = useState([]);
  const [emailCache, setEmailCache] = useState({});
  const [contentLoading, setContentLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [categoryCounts, setCategoryCounts] = useState({
    'Meeting Invitations & Scheduling': 0,
    'Internship Applications & Correspondence': 0,
    'Academic & Administrative Notices': 0,
    'Financial Transactions & Billing': 0,
    'Banking & Investments': 0,
    'Orders, Deliveries & Purchases': 0,
    'Research, Collaborations & Grants': 0,
    'Personal, Promotions & Spam': 0
  });
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [statistics, setStatistics] = useState({
    categories: {},
    priorities: {}
  });
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  const categories = [
    'All',
    'Meeting Invitations & Scheduling',
    'Internship Applications & Correspondence',
    'Academic & Administrative Notices',
    'Financial Transactions & Billing',
    'Banking & Investments',
    'Orders, Deliveries & Purchases',
    'Research, Collaborations & Grants',
    'Personal, Promotions & Spam'
  ];

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      setError(null); // Clear any previous errors
      
      try {
        // First check if we have a token
        const token = localStorage.getItem('gmailAccessToken');
        if (!token) {
          navigate('/');
          return;
        }

        // Try to fetch user profile first
        try {
          await fetchUserProfile();
        } catch (error) {
          if (error.response?.status === 401) {
            handleSignOut();
            return;
          }
          throw error;
        }

        // Then fetch emails
        await fetchEmails();
      } catch (error) {
        console.error('Error loading initial data:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
        setError('Unable to load your emails. Please try refreshing the page.');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
    
    // Refresh emails every 30 minutes, but only if we're not viewing an email
    let interval;
    if (!selectedEmailContent) {
      interval = setInterval(() => {
        // Only refresh if we're not in the middle of loading
        if (!loading && !error) {
          fetchEmails(activeTab, false); // Pass false to indicate this is a background refresh
        }
      }, 1800000);
    }
    return () => clearInterval(interval);
  }, []); // Only run on mount

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showProfileMenu &&
        profileMenuRef.current &&
        profileButtonRef.current &&
        !profileMenuRef.current.contains(event.target) &&
        !profileButtonRef.current.contains(event.target)
      ) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileMenu]);

  useEffect(() => {
    if (sendStatus.message) {
      const timer = setTimeout(() => {
        setSendStatus({ type: '', message: '' });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [sendStatus]);

  // Auto-save draft every 5 seconds when compose is open
  useEffect(() => {
    let interval;
    if (showCompose && !composeMail.isDraft && (composeMail.to || composeMail.subject || composeMail.message)) {
      interval = setInterval(saveDraft, 5000);
    }
    return () => clearInterval(interval);
  }, [showCompose, composeMail]);

  useEffect(() => {
    if (!allEmails) return;
    
    const filtered = allEmails.filter(email => {
      const subject = getEmailHeader(email, 'Subject').toLowerCase();
      const from = getEmailHeader(email, 'From').toLowerCase();
      const to = getEmailHeader(email, 'To').toLowerCase();
      const snippet = email.snippet.toLowerCase();
      const query = searchQuery.toLowerCase();

      return subject.includes(query) || 
             from.includes(query) || 
             to.includes(query) || 
             snippet.includes(query);
    });
    
    setFilteredEmails(filtered);
  }, [searchQuery, allEmails]);

  // Separate useEffect for handling tab changes
  useEffect(() => {
    if (activeTab) {
      if (allEmails.length === 0) {
        fetchEmails(activeTab);
      } else {
        const filteredEmails = activePriority
          ? allEmails.filter(email => email.priority?.toLowerCase() === activePriority.toLowerCase())
          : filterEmailsByTab(activeTab, allEmails);
        setEmails(filteredEmails);
      }
    }
  }, [activeTab, activePriority]);

  // Add email content cache cleanup
  useEffect(() => {
    // Clear email cache when it gets too large (more than 50 emails)
    if (Object.keys(emailCache).length > 50) {
      const emailsToKeep = [...emails].slice(0, 30).map(email => email.id);
      setEmailCache(prev => {
        const newCache = {};
        emailsToKeep.forEach(id => {
          if (prev[id]) newCache[id] = prev[id];
        });
        return newCache;
      });
    }
  }, [emailCache, emails]);

  // Sort emails based on priority and time
  const sortEmails = (emailsToSort) => {
    if (emailSortBy === 'none') return emailsToSort;
    
    const priorityOrder = {
      high: 3,
      medium: 2,
      low: 1
    };

    return [...emailsToSort].sort((a, b) => {
      switch (emailSortBy) {
        case 'priority-high':
          return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
        case 'priority-low':
          return (priorityOrder[a.priority] || 0) - (priorityOrder[b.priority] || 0);
        case 'time-newest':
          return parseInt(b.internalDate) - parseInt(a.internalDate);
        case 'time-oldest':
          return parseInt(a.internalDate) - parseInt(b.internalDate);
        default:
          return 0;
      }
    });
  };

  // Apply sorting when emails or sortBy changes
  useEffect(() => {
    if (emails.length > 0) {
      const sortedEmails = sortEmails(emails);
      if (JSON.stringify(sortedEmails) !== JSON.stringify(emails)) {
        setEmails(sortedEmails);
      }
    }
  }, [emailSortBy]);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('gmailAccessToken');
      if (!token) {
        navigate('/');
        return;
      }

      const response = await axios.get('http://localhost:4000/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setUserProfile(response.data);
      // Store userId in localStorage for notifications
      localStorage.setItem('userId', response.data.id);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      if (error.response?.status === 401) {
        handleSignOut();
      }
      throw error;
    }
  };

  const handleSignOut = () => {
    // Clear all tokens and state
    localStorage.removeItem('gmailAccessToken');
    localStorage.removeItem('gmailRefreshToken');
    setEmails([]);
    setAllEmails([]);
    setUserProfile(null);
    setShowProfileMenu(false);
    // Redirect to login page
    navigate('/');
  };

  const fetchEmails = async (type = 'inbox', showLoading = true) => {
    const token = localStorage.getItem('gmailAccessToken');
    if (!token) {
      setError('No access token found');
      return;
    }

    try {
      if (showLoading) setLoading(true);

      const response = await axios.get('http://localhost:4000/api/fetchEmails', {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });

      if (!response.data) {
        throw new Error('Invalid response from server');
      }

      const { emails = [], stats = { categories: {}, priorities: {} } } = response.data;

      if (!emails || emails.length === 0) {
        setAllEmails([]);
        setEmails([]);
        setStatistics(stats);
        updateCounts([]);
        return;
      }

      const sortedEmails = emails.sort((a, b) => 
        parseInt(b.internalDate) - parseInt(a.internalDate)
      );
      
      // Store all emails in allEmails state
      setAllEmails(sortedEmails);
      
      // Update statistics and counts
      setStatistics(stats);
      updateCounts(sortedEmails);
      
      // Filter emails based on current view and priority
      let filteredEmails = sortedEmails;
      
      if (activePriority) {
        filteredEmails = sortedEmails.filter(email => 
          email.priority?.toLowerCase() === activePriority.toLowerCase()
        );
      } else {
        filteredEmails = filterEmailsByTab(type, sortedEmails);
      }
      
      setEmails(filteredEmails);
    } catch (error) {
      console.error('Error fetching emails:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      if (!showLoading) return;
      
      // Set a more descriptive error message
      if (error.response?.status === 401) {
        setError('Session expired. Please sign in again.');
        handleSignOut(); // Redirect to login
      } else {
        setError(error.response?.data?.error || 'Failed to fetch emails. Please try again.');
      }
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const sendEmail = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('gmailAccessToken');
    if (!token) return;

    try {
      setLoading(true);
      setSendStatus({ type: '', message: '' });
      // Create email content in base64 format
      const emailContent = [
        'Content-Type: text/plain; charset="UTF-8"',
        'MIME-Version: 1.0',
        `To: ${composeMail.to}`,
        `Subject: ${composeMail.subject}`,
        '',
        composeMail.message
      ].join('\n');

      const base64EncodedEmail = btoa(emailContent).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

      await axios.post(
        'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
        {
          raw: base64EncodedEmail
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Clear form and refresh emails
      setComposeMail({ to: '', subject: '', message: '' });
      setSendStatus({ type: 'success', message: 'Email sent successfully!' });
      await fetchEmails();
      setTimeout(() => setShowCompose(false), 1500);
    } catch (error) {
      console.error('Error sending email:', error);
      setSendStatus({ 
        type: 'error', 
        message: error.response?.data?.error?.message || 'Failed to send email. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const getEmailHeader = (email, headerName) => {
    return email.payload.headers.find(h => h.name.toLowerCase() === headerName.toLowerCase())?.value || '';
  };

  const formatDate = (timestamp) => {
    const date = new Date(parseInt(timestamp));
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) {
      return 'Just now';
    } else if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: 'long' });
    } else {
      return date.toLocaleDateString([], { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined 
      });
    }
  };

  const getNameFromEmail = (emailStr) => {
    const match = emailStr.match(/^"?([^"<]+)"?\s*<?[^>]*>?$/);
    return match ? match[1].trim() : emailStr;
  };

  const saveDraft = async () => {
    const token = localStorage.getItem('gmailAccessToken');
    if (!token) return;

    try {
      const emailContent = [
        'Content-Type: text/plain; charset="UTF-8"',
        'MIME-Version: 1.0',
        `To: ${composeMail.to}`,
        `Subject: ${composeMail.subject}`,
        '',
        composeMail.message
      ].join('\n');

      const base64EncodedEmail = btoa(emailContent).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

      const response = await axios.post(
        'https://gmail.googleapis.com/gmail/v1/users/me/drafts',
        {
          message: {
            raw: base64EncodedEmail
          }
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setComposeMail(prev => ({
        ...prev,
        isDraft: true,
        draftId: response.data.id
      }));
    } catch (error) {
      console.error('Error saving draft:', error);
    }
  };

  const openDraft = async (draftId) => {
    const token = localStorage.getItem('gmailAccessToken');
    if (!token) return;

    try {
      const response = await axios.get(
        `https://gmail.googleapis.com/gmail/v1/users/me/drafts/${draftId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const message = response.data.message;
      const headers = message.payload.headers;
      const to = headers.find(h => h.name === 'To')?.value || '';
      const subject = headers.find(h => h.name === 'Subject')?.value || '';
      const content = message.snippet || '';

      setComposeMail({
        to,
        subject,
        message: content,
        isDraft: true,
        draftId: response.data.id
      });
      setShowCompose(true);
    } catch (error) {
      console.error('Error opening draft:', error);
    }
  };

  const deleteDraft = async (draftId) => {
    const token = localStorage.getItem('gmailAccessToken');
    if (!token) return;

    try {
      await axios.delete(
        `https://gmail.googleapis.com/gmail/v1/users/me/drafts/${draftId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      fetchEmails('drafts');
    } catch (error) {
      console.error('Error deleting draft:', error);
    }
  };

  const fetchEmailContent = async (emailId) => {
    const token = localStorage.getItem('gmailAccessToken');
    if (!token) return;

    // Return cached content if available
    if (emailCache[emailId]) {
      setSelectedEmailContent(emailCache[emailId]);
      setContentLoading(false);
      return;
    }

    setContentLoading(true);
    let response;
    try {
      response = await axios.get(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${emailId}?format=full`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      let body = '';
      let contentType = '';
      let attachments = [];
      let isInternshipEmail = false;
      
      // Check if this is an internship-related email
      const subject = response.data.payload.headers.find(h => h.name.toLowerCase() === 'subject')?.value || '';
      if (subject.toLowerCase().includes('internship') || 
          subject.toLowerCase().includes('research opportunity') ||
          subject.toLowerCase().includes('research position')) {
        isInternshipEmail = true;
      }
      
      const processMessagePart = (part) => {
        // Handle attachments
        if (part.filename && part.body) {
          attachments.push({
            filename: part.filename,
            mimeType: part.mimeType,
            size: part.body.size,
            attachmentId: part.body.attachmentId
          });
        }
        
        // Handle nested parts
        if (part.parts) {
          part.parts.forEach(processMessagePart);
        }
        
        // Handle content
        if (!body) {
          if (part.mimeType === 'text/html' && part.body.data) {
            body = atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'));
            contentType = 'html';
          } else if (part.mimeType === 'text/plain' && part.body.data) {
            body = atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'));
            contentType = 'text';
          }
        }
      };
      
      // Process the message parts
      if (response.data.payload.parts) {
        response.data.payload.parts.forEach(processMessagePart);
      } else {
        processMessagePart(response.data.payload);
      }

      // If still no content but we have body data in the main payload
      if (!body && response.data.payload.body.data) {
        body = atob(response.data.payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
        contentType = response.data.payload.mimeType === 'text/html' ? 'html' : 'text';
      }

      const emailContent = {
        ...response.data,
        decodedBody: body || "No readable content available.",
        contentType: contentType || 'text',
        attachments,
        isInternshipEmail
      };

      // If it's an internship email, fetch the analysis
      if (isInternshipEmail) {
        try {
          const analysisResponse = await axios.post('http://localhost:4000/api/internship/analyze', {
            emailContent: body,
            subject: subject,
            attachments: attachments
          });
          emailContent.internship_analysis = analysisResponse.data;
        } catch (error) {
          console.error('Error fetching internship analysis:', error);
        }
      }

      // Cache the email content
      setEmailCache(prev => ({
        ...prev,
        [emailId]: emailContent
      }));

      setSelectedEmailContent(emailContent);
    } catch (error) {
      console.error('Error fetching email content:', error);
      setSelectedEmailContent({
        id: emailId,
        decodedBody: "Error loading email content. Please try again.",
        contentType: 'text',
        attachments: []
      });
    } finally {
      setContentLoading(false);
    }
  };

  const downloadAttachment = async (messageId, attachmentId, filename) => {
    const token = localStorage.getItem('gmailAccessToken');
    if (!token) return;

    try {
      const response = await axios.get(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/attachments/${attachmentId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Convert base64 to blob
      const binaryString = atob(response.data.data.replace(/-/g, '+').replace(/_/g, '/'));
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes]);

      // Create download link
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error downloading attachment:', error);
    }
  };

  // Optimize prefetching to only prefetch nearby emails
  const prefetchEmailContent = async (emailId) => {
    if (emailCache[emailId]) return; // Skip if already cached
    
    const token = localStorage.getItem('gmailAccessToken');
    if (!token) return;

    // Find index of current email
    const currentIndex = emails.findIndex(email => email.id === emailId);
    if (currentIndex === -1) return;

    // Only prefetch the next 2 emails
    const emailsToPrefetch = emails
      .slice(currentIndex + 1, currentIndex + 3)
      .filter(email => !emailCache[email.id])
      .map(email => email.id);

    // Prefetch in parallel
    Promise.all(emailsToPrefetch.map(async (id) => {
      try {
        const response = await axios.get(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=full`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        let body = '';
        if (response.data.payload.parts) {
          const textPart = response.data.payload.parts.find(
            part => part.mimeType === 'text/plain' || part.mimeType === 'text/html'
          );
          if (textPart && textPart.body.data) {
            body = atob(textPart.body.data.replace(/-/g, '+').replace(/_/g, '/'));
          }
        } else if (response.data.payload.body.data) {
          body = atob(response.data.payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
        }

        setEmailCache(prev => ({
          ...prev,
          [id]: {
            ...response.data,
            decodedBody: body,
          }
        }));
      } catch (error) {
        console.error('Error prefetching email content:', error);
      }
    }));
  };

  // Add this new function to filter emails by tab
  const filterEmailsByTab = (tab, emailList = allEmails) => {
    if (!emailList.length) return [];
    
    switch (tab) {
      case 'inbox':
        return emailList.filter(email => email.labelIds?.includes('INBOX'));
      case 'sent':
        return emailList.filter(email => email.labelIds?.includes('SENT'));
      default:
        return emailList.filter(email => email.labelIds?.includes('INBOX'));
    }
  };

  // Add this function to get category class name
  const getCategoryClassName = (category) => {
    const baseClass = category.toLowerCase().split(' ')[0];
    return `category-${baseClass}`;
  };

  // Add this function to format deadline
  const formatDeadline = (deadline) => {
    if (!deadline) return null;
    
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const diffDays = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));
    
    let className = 'deadline-indicator';
    if (diffDays <= 3) {
      className += ' urgent';
    } else if (diffDays <= 7) {
      className += ' upcoming';
    } else {
      className += ' far';
    }

    return {
      text: diffDays <= 0 ? 'Due today' : 
            diffDays === 1 ? 'Due tomorrow' :
            `Due in ${diffDays} days`,
      className
    };
  };

  // Update the updateCounts function
  const updateCounts = (emailsList) => {
    const counts = {
      high: 0,
      medium: 0,
      low: 0
    };

    const catCounts = {
      'Meeting Invitations & Scheduling': 0,
      'Internship Applications & Correspondence': 0,
      'Academic & Administrative Notices': 0,
      'Financial Transactions & Billing': 0,
      'Banking & Investments': 0,
      'Orders, Deliveries & Purchases': 0,
      'Research, Collaborations & Grants': 0,
      'Personal, Promotions & Spam': 0
    };

    emailsList.forEach(email => {
      const priority = email.priority?.toLowerCase();
      if (priority && counts.hasOwnProperty(priority)) {
        counts[priority]++;
      }

      const category = email.category;
      if (category && catCounts.hasOwnProperty(category)) {
        catCounts[category]++;
      }
    });

    setPriorityCounts(counts);
    setCategoryCounts(catCounts);
  };

  // Update the existing filterEmailsByCategory function
  const filterEmailsByCategory = (category) => {
    if (category === activeCategory) {
      setActiveCategory(null);
      const sortedFilteredEmails = sortEmails(filterEmailsByTab(activeTab, allEmails));
      setEmails(sortedFilteredEmails);
    } else {
      setActiveCategory(category);
      const sortedCategoryEmails = sortEmails(allEmails.filter(email => email.category === category));
      setEmails(sortedCategoryEmails);
    }
  };

  // Update the email list rendering
  const renderEmailList = React.useMemo(() => {
    // Filter emails based on search query and selected category
    const emailsToShow = searchQuery 
      ? filteredEmails 
      : selectedCategory === 'All'
        ? emails
        : emails.filter(email => email.category === selectedCategory);

    return emailsToShow.map((email) => {
      const isSelected = selectedEmail?.id === email.id;
      
      return (
        <div
          key={email.id} 
          className={`email-item ${isSelected ? 'selected' : ''}`}
          onClick={() => {
            setSelectedEmail(email);
            fetchEmailContent(email.id);
          }}
          onMouseEnter={() => prefetchEmailContent(email.id)}
        >
          <div className="email-content">
            <div className="email-header">
              <span className="email-from">
                {activeTab === 'sent' 
                  ? `To: ${getNameFromEmail(getEmailHeader(email, 'To'))}` 
                  : getNameFromEmail(getEmailHeader(email, 'From'))}
              </span>
              <span className="email-date">{formatDate(email.internalDate)}</span>
            </div>
            <div className="email-subject">{getEmailHeader(email, 'Subject')}</div>
            <div className="email-metadata">
              <CategoryBadge 
                category={email.category} 
                priority={email.priority || 'low'} 
                deadline={email.deadline}
              />
            </div>
            <div className="email-snippet">{email.snippet}</div>
          </div>
        </div>
      );
    });
  }, [emails, selectedEmail, searchQuery, filteredEmails, activeTab, selectedCategory]);

  // Add category filters to sidebar
  const renderCategoryFilters = () => (
    <div className="category-filters">
      <h2>Categories</h2>
      <ul className="category-list">
        {categories.map(category => (
          <li
            key={category}
            className={`category-item ${selectedCategory === category ? 'active' : ''}`}
            onClick={() => setSelectedCategory(category)}
          >
            {category}
            {statistics.categories[category] && category !== 'All' && (
              <span className="category-count">
                {statistics.categories[category]}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );

  const handleEmailAction = async (email, action) => {
    const token = localStorage.getItem('gmailAccessToken');
    if (!token) return;

    try {
      switch (action) {
        case 'delete':
          await axios.post(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${email.id}/trash`,
            {},
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          break;
        default:
          return;
      }

      // Refresh emails after action
      await fetchEmails(activeTab);
    } catch (error) {
      console.error('Error performing email action:', error);
    }
  };

  const goToTodo = () => {
    navigate('/todo');
  };

  const EmailPreview = ({ email }) => {
    const subject = getEmailHeader(email, 'Subject');
    const from = getEmailHeader(email, 'From');
    const date = formatDate(email.internalDate);
    const name = getNameFromEmail(from);

    // Debug log for internship emails
    if (email.category === 'Internship Applications & Correspondence') {
      console.log('Internship email data:', {
        id: email.id,
        subject,
        hasAnalysis: !!email.internship_analysis,
        analysis: email.internship_analysis
      });
    }

    return (
      <div className="email-preview">
        <div className="email-preview-header">
          <div className="sender-info">
            <span className="sender-name">{name}</span>
            <span className="sender-email">({from})</span>
          </div>
          <span className="email-date">{date}</span>
        </div>
        <div className="email-subject">{subject}</div>
        <div className="email-snippet">{email.snippet}</div>
        {email.category === 'Internship Applications & Correspondence' && email.internship_analysis && (
          <div className="internship-summary">
            <div className="summary-header">
              <span className="material-icons">description</span>
              {email.internship_analysis.isApplication ? 'Application Summary' : 'Internship Summary'}
            </div>
            <p>{email.internship_analysis.summary}</p>
            {email.internship_analysis.isApplication && email.internship_analysis.candidateInfo && (
              <div className="skills-preview">
                {email.internship_analysis.candidateInfo.skills && 
                  email.internship_analysis.candidateInfo.skills.slice(0, 3).map((skill, index) => (
                    <span key={index} className="skill-tag">{skill}</span>
                  ))
                }
                {email.internship_analysis.candidateInfo.skills && 
                  email.internship_analysis.candidateInfo.skills.length > 3 && (
                    <span className="more-skills">
                      +{email.internship_analysis.candidateInfo.skills.length - 3} more
                    </span>
                  )
                }
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Add function to handle analysis
  const handleAnalyzeEmail = async (emailContent) => {
    setAnalysisLoading(true);
    try {
      const subject = getEmailHeader(emailContent, 'Subject');
      const body = emailContent.decodedBody;
      const attachments = emailContent.attachments;

      const analysisResponse = await axios.post('http://localhost:4000/api/internship/analyze', 
        {
          emailContent: body,
          subject: subject,
          attachments: attachments
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          withCredentials: true
        }
      );

      if (!analysisResponse.data) {
        throw new Error('No analysis data received from server');
      }

      // Update the cached email content with the analysis
      const updatedEmailContent = {
        ...emailContent,
        internship_analysis: analysisResponse.data  // Note: changed from internshipAnalysis to internship_analysis
      };

      setEmailCache(prev => ({
        ...prev,
        [emailContent.id]: updatedEmailContent
      }));

      setSelectedEmailContent(updatedEmailContent);
      setShowAnalysisModal(true);
    } catch (error) {
      console.error('Error analyzing email:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      // Show error to user
      setError('Failed to analyze email. Please try again later.');
      setTimeout(() => setError(null), 5000); // Clear error after 5 seconds
    } finally {
      setAnalysisLoading(false);
    }
  };

  // Add Analysis Modal Component
  const AnalysisModal = ({ analysis, onClose }) => {
    if (!analysis) return null;

    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="analysis-modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2>
              <span className="material-icons">analytics</span>
              AI Analysis
            </h2>
            <button className="close-button" onClick={onClose}>
              <span className="material-icons">close</span>
            </button>
          </div>
          <div className="modal-content">
            <div className="analysis-summary">
              <h3>Summary</h3>
              <p>{analysis.summary}</p>
            </div>
            {analysis.candidateInfo && (
              <div className="candidate-info">
                <h3>Candidate Information</h3>
                {analysis.candidateInfo.skills && (
                  <div className="skills-section">
                    <label>Skills:</label>
                    <div className="skills-tags">
                      {analysis.candidateInfo.skills.map((skill, index) => (
                        <span key={index} className="skill-tag">{skill}</span>
                      ))}
                    </div>
                  </div>
                )}
                {analysis.candidateInfo.education && (
                  <div className="info-row">
                    <label>Education:</label>
                    <span>{analysis.candidateInfo.education}</span>
                  </div>
                )}
                {analysis.candidateInfo.experience && (
                  <div className="info-row">
                    <label>Experience:</label>
                    <span>{analysis.candidateInfo.experience}</span>
                  </div>
                )}
              </div>
            )}
            {analysis.recommendations && (
              <div className="recommendations">
                <h3>Recommendations</h3>
                <ul>
                  {analysis.recommendations.map((rec, index) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) return (
    <div className="loading">
      <div className="loading-spinner"></div>
      <p>Loading your emails...</p>
    </div>
  );
  
  if (error) return (
    <div className="error">
      <span className="material-icons">error_outline</span>
      <p>{error}</p>
    </div>
  );

  return (
    <div className="dashboard">
      <div className="sidebar">
        <div className="logo-box">
          <span className="material-icons">smart_toy</span>
          <h1>Smart Mail AI</h1>
        </div>

        <button 
          className="compose-btn sidebar-compose"
          onClick={() => {
            setShowCompose(true);
            setComposeMail({
              to: '',
              subject: '',
              message: '',
            });
          }}
        >
          <span className="material-icons">edit</span>
          Compose
        </button>

        <Link to="/calendar" className="nav-button">
          <span className="material-icons">event</span>
          Calendar
        </Link>

        {renderCategoryFilters()}

        <div className="user-profile">
          {userProfile && (
            <>
              <div 
                className="profile-section"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                ref={profileButtonRef}
              >
                <div className="profile-button">
                  {userProfile.picture ? (
                    <img 
                      src={userProfile.picture} 
                      alt={userProfile.name} 
                      className="profile-image"
                    />
                  ) : (
                    <span className="profile-initial">
                      {userProfile.given_name?.[0] || userProfile.email?.[0]}
                    </span>
                  )}
                </div>
                <div className="profile-info-mini">
                  <span className="profile-name-mini">{userProfile.name}</span>
                </div>
              </div>
              {showProfileMenu && (
                <div ref={profileMenuRef} className="profile-menu">
                  <div className="profile-info">
                    {userProfile.picture ? (
                      <img 
                        src={userProfile.picture} 
                        alt={userProfile.name} 
                        className="profile-image-large"
                      />
                    ) : (
                      <div className="profile-avatar">
                        <span className="material-icons">account_circle</span>
                      </div>
                    )}
                    <div className="profile-details">
                      <h3>{userProfile.name}</h3>
                      <p>{userProfile.email}</p>
                    </div>
                  </div>
                  <button className="sign-out-button" onClick={handleSignOut}>
                    <span className="material-icons">logout</span>
                    Sign out
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="main-content">
        <div className="top-nav">
          <div className="nav-section">
            <div className="nav-actions">
              <button 
                className={`nav-btn ${activeTab === 'inbox' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('inbox');
                  setActivePriority(null);  // Clear any active priority filter
                  fetchEmails('inbox');      // Fetch all inbox emails
                }}
              >
                <span className="material-icons">inbox</span>
                Inbox
              </button>
              <button 
                className={`nav-btn ${activeTab === 'sent' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('sent');
                  setActivePriority(null);  // Clear any active priority filter
                  fetchEmails('sent');
                }}
              >
                <span className="material-icons">send</span>
                Sent
              </button>
              <div className="nav-btn-group">
                <button 
                  className="nav-btn"
                  onClick={goToTodo}
                >
                  <span className="material-icons">check_circle</span>
                  Todo
                </button>
                <div className="email-sort-dropdown" style={{ marginLeft: '10px', display: 'inline-block' }}>
                  <select
                    value={emailSortBy}
                    onChange={(e) => setEmailSortBy(e.target.value)}
                    aria-label="Sort emails"
                    style={{
                      padding: '4px 8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="none">Sort by...</option>
                    <optgroup label="Priority">
                      <option value="priority-high">Priority: High to Low</option>
                      <option value="priority-low">Priority: Low to High</option>
                    </optgroup>
                    <optgroup label="Time">
                      <option value="time-newest">Time: Newest First</option>
                      <option value="time-oldest">Time: Oldest First</option>
                    </optgroup>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="search-bar">
            <span className="material-icons">search</span>
            <input 
              type="text" 
              placeholder="Search in mail" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                className="clear-search" 
                onClick={() => setSearchQuery('')}
              >
                <span className="material-icons">close</span>
              </button>
            )}
          </div>
        </div>

        {showCompose && (
          <div className="compose-overlay">
            <div className="compose-window">
              <div className="compose-header">
                <h3>New Message</h3>
                <button className="icon-button" onClick={() => {
                  setShowCompose(false);
                  setComposeMail({ to: '', subject: '', message: '' });
                  setSendStatus({ type: '', message: '' });
                }}>
                  <span className="material-icons">close</span>
                </button>
              </div>
              <form className="compose-form" onSubmit={sendEmail}>
                {sendStatus.message && (
                  <div className={`compose-notification ${sendStatus.type}`}>
                    <span className="material-icons">
                      {sendStatus.type === 'success' ? 'check_circle' : 'error'}
                    </span>
                    <p>{sendStatus.message}</p>
                  </div>
                )}
                <div className="compose-field">
                  <span className="material-icons">person</span>
                  <input
                    type="email"
                    placeholder="To"
                    value={composeMail.to}
                    onChange={(e) => setComposeMail({ ...composeMail, to: e.target.value })}
                    required
                  />
                </div>
                <div className="compose-field">
                  <span className="material-icons">subject</span>
                  <input
                    type="text"
                    placeholder="Subject"
                    value={composeMail.subject}
                    onChange={(e) => setComposeMail({ ...composeMail, subject: e.target.value })}
                    required
                  />
                </div>
                <textarea
                  placeholder="Write your message here..."
                  value={composeMail.message}
                  onChange={(e) => setComposeMail({ ...composeMail, message: e.target.value })}
                  required
                />
                <div className="compose-actions">
                  <button type="submit" className="send-button" disabled={loading}>
                    {loading ? (
                      <>
                        <div className="button-spinner"></div>
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-icons">send</span>
                        <span>Send</span>
                      </>
                    )}
                  </button>
                  <Link to="/calendar" className="calendar-button">
                    <span className="material-icons">event</span>
                    <span>Calendar</span>
                  </Link>
                </div>
              </form>
            </div>
          </div>
        )}

        {selectedEmailContent ? (
          <div className="email-view">
            <div className="email-view-header">
              <button className="icon-button" onClick={() => {
                setSelectedEmail(null);
                setSelectedEmailContent(null);
                setShowAnalysisModal(false);
              }}>
                <span className="material-icons">arrow_back</span>
              </button>
              <div className="email-view-title">
                <h2>{getEmailHeader(selectedEmailContent, 'Subject')}</h2>
                <div className="email-view-meta">
                  <div className="sender-info">
                    <span className="sender-name">
                      {getNameFromEmail(getEmailHeader(selectedEmailContent, activeTab === 'sent' ? 'To' : 'From'))}
                    </span>
                    <span className="sender-email">
                      {`<${getEmailHeader(selectedEmailContent, activeTab === 'sent' ? 'To' : 'From')}>`}
                    </span>
                  </div>
                  <span className="email-date">
                    {new Date(parseInt(selectedEmailContent.internalDate)).toLocaleString()}
                  </span>
                </div>
                {selectedEmailContent.category === 'Internship Applications & Correspondence' && (
                  <button 
                    className="analyze-button"
                    onClick={() => {
                      if (selectedEmailContent.internship_analysis) {
                        setShowAnalysisModal(true);
                      } else {
                        handleAnalyzeEmail(selectedEmailContent);
                      }
                    }}
                    disabled={analysisLoading}
                  >
                    <span className="material-icons">
                      {analysisLoading ? 'hourglass_empty' : 'analytics'}
                    </span>
                    {analysisLoading ? 'Analyzing...' : 
                     selectedEmailContent.internship_analysis ? 'View Analysis' : 'Analyze Email'}
                  </button>
                )}
              </div>
            </div>
            <div className="email-view-body">
              {contentLoading ? (
                <div className="content-loading">
                  <div className="loading-bar"></div>
                </div>
              ) : (
                <>
                  {selectedEmailContent.isInternshipEmail && selectedEmailContent.internship_analysis && (
                    <div className="internship-analysis">
                      <div className="analysis-header">
                        <h3>
                          <span className="material-icons">analytics</span>
                          AI Analysis
                        </h3>
                      </div>
                      <div className="analysis-content">
                        <div className="analysis-summary">
                          <h4>Summary</h4>
                          <p>{selectedEmailContent.internship_analysis.summary}</p>
                        </div>
                        {selectedEmailContent.internship_analysis.candidateInfo && (
                          <div className="candidate-info">
                            <h4>Candidate Information</h4>
                            {selectedEmailContent.internship_analysis.candidateInfo.skills && (
                              <div className="skills-section">
                                <label>Skills:</label>
                                <div className="skills-tags">
                                  {selectedEmailContent.internship_analysis.candidateInfo.skills.map((skill, index) => (
                                    <span key={index} className="skill-tag">{skill}</span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {selectedEmailContent.internship_analysis.candidateInfo.education && (
                              <div className="info-row">
                                <label>Education:</label>
                                <span>{selectedEmailContent.internship_analysis.candidateInfo.education}</span>
                              </div>
                            )}
                            {selectedEmailContent.internship_analysis.candidateInfo.experience && (
                              <div className="info-row">
                                <label>Experience:</label>
                                <span>{selectedEmailContent.internship_analysis.candidateInfo.experience}</span>
                              </div>
                            )}
                          </div>
                        )}
                        {selectedEmailContent.internship_analysis.recommendations && (
                          <div className="recommendations">
                            <h4>Recommendations</h4>
                            <ul>
                              {selectedEmailContent.internship_analysis.recommendations.map((rec, index) => (
                                <li key={index}>{rec}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {selectedEmailContent.contentType === 'html' ? (
                    <div dangerouslySetInnerHTML={{ __html: selectedEmailContent.decodedBody }} />
                  ) : (
                    <pre className="plain-text-content">{selectedEmailContent.decodedBody}</pre>
                  )}
                  
                  {selectedEmailContent.attachments && selectedEmailContent.attachments.length > 0 && (
                    <div className="email-attachments">
                      <h3>Attachments</h3>
                      <div className="attachment-list">
                        {selectedEmailContent.attachments.map((attachment, index) => (
                          <div key={index} className="attachment-item">
                            <span className="material-icons">
                              {attachment.mimeType.includes('pdf') ? 'picture_as_pdf' :
                               attachment.mimeType.includes('image') ? 'image' :
                               'attach_file'}
                            </span>
                            <span className="attachment-name">{attachment.filename}</span>
                            <span className="attachment-size">
                              {Math.round(attachment.size / 1024)}KB
                            </span>
                            <button
                              className="download-button"
                              onClick={() => downloadAttachment(
                                selectedEmailContent.id,
                                attachment.attachmentId,
                                attachment.filename
                              )}
                            >
                              <span className="material-icons">download</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="email-list">
            {(searchQuery ? filteredEmails : emails).length === 0 ? (
              <div className="no-emails">
                {searchQuery ? (
                  <>
                    <span className="material-icons">search_off</span>
                    <p>No emails match your search</p>
                  </>
                ) : (
                  <>
                    <span className="material-icons">
                      {activePriority ? 'filter_list' :
                       activeTab === 'inbox' ? 'inbox' : 
                       activeTab === 'sent' ? 'send' : 
                       'description'}
                    </span>
                    <p>{
                      activePriority ? `No ${
                        activePriority === 'high' ? 'high priority' :
                        activePriority === 'medium' ? 'medium priority' :
                        'low priority'
                      } emails` :
                      activeTab === 'inbox' ? 'No emails in your inbox' : 
                      activeTab === 'sent' ? 'No sent emails' : 
                      'No drafts'
                    }</p>
                  </>
                )}
              </div>
            ) : (
              renderEmailList
            )}
          </div>
        )}
      </div>
      {showAnalysisModal && selectedEmailContent.internship_analysis && (
        <AnalysisModal 
          analysis={selectedEmailContent.internship_analysis} 
          onClose={() => setShowAnalysisModal(false)} 
        />
      )}
    </div>
  );
};

export default Dashboard;
