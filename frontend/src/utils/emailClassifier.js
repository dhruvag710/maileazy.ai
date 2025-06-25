// AI-based email classification
const classifyEmail = async (email) => {
  const subject = email.payload.headers.find(h => h.name === 'Subject')?.value || '';
  const content = email.snippet || '';
  const from = email.payload.headers.find(h => h.name === 'From')?.value || '';

  try {
    const response = await fetch('http://localhost:4000/api/classify-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subject,
        content,
        from,
        hasAttachments: email.payload.parts && email.payload.parts.some(part => part.filename)
      })
    });

    if (!response.ok) {
      throw new Error('Classification request failed');
    }

    const { priority } = await response.json();
    return priority; // Should return 'HIGH', 'MEDIUM', 'LOW', or 'REJECT'
  } catch (error) {
    console.error('Error classifying email:', error);
    return 'LOW'; // Default classification if API call fails
  }
};

export default classifyEmail; 