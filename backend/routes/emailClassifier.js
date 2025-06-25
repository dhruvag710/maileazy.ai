const express = require('express');
const router = express.Router();
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const Email = require('../models/Email');

const CLASSIFICATION_PROMPT = `You are an intelligent email classifier. For every email, do the following:

1. Classify the email into one of the following categories (based on subject and content):
   - Meeting Invitations & Scheduling:
     * Meeting invitations and calendar events
     * Meeting reminders and updates
     * Requests to schedule meetings
     * Professor office hours and appointments
     * Team meeting coordination
     * Video call links and conference details
     * Meeting cancellations or rescheduling
     * Any communication primarily about scheduling or attending a meeting
   - Internship Applications & Correspondence:
     * Direct internship applications addressed to the professor
     * Responses to internship applications
     * Specific internship opportunities you've expressed interest in
     * Do NOT include mass job board emails or bulk listings here
   - Academic & Administrative Notices:
     * Course-related communications
     * Exam schedules and notifications
     * Assignment deadlines
     * Grades and academic records
     * College announcements and official notices
     * Campus events and academic activities
     * Departmental and institutional administrative matters
   - Financial Transactions & Billing:
     * Bills, invoices, payment confirmations, subscription renewals
     * Any financial transactions or payment-related communications
   - Banking & Investments:
     * Bank statements, transaction alerts, credit card notifications
     * Investment updates or banking-related communications
   - Orders, Deliveries & Purchases:
     * Order confirmations, shipping updates, delivery notifications
     * Product-related communications or purchase receipts
   - Research, Collaborations & Grants:
     * Research project proposals and collaboration invitations
     * Conference invitations, paper submissions, workshop announcements
     * AI lab or alignment lab proposals
     * Grant notifications and funding opportunities
   - Personal, Promotions & Spam:
     * Personal emails and informal communications
     * Newsletters, marketing emails, sales offers, discount notifications
     * Social media notifications, bulk mailings, and spam
     * Mass job board emails (e.g., Unstop, Career Brew), promotional job alerts, and bulk listings

2. Tag the email with a priority level:
   - HIGH:
     * ANY email sent from official academic or department email domains (e.g., addresses ending with @iitb.ac.in, @cse.iitb.ac.in, @dean.*, @admin.*, or other official handles)
     * ANY email mentioning deadlines or meetings for today or tomorrow
     * ANY email containing phrases like "due today", "due tomorrow", "meeting today", or "urgent"
     * Emails requiring immediate action within 24-48 hours
     * Emails with strict deadlines explicitly mentioned
     * Urgent financial or academic matters
     * Official time-sensitive communications
     * Urgent meeting requests or last-minute schedule changes
   - MEDIUM:
     * Deadlines or meetings scheduled beyond tomorrow but within a week
     * Important but not urgent communications
     * Status updates requiring attention
     * Responses to your applications or inquiries
     * Regular meeting schedules and non-urgent appointments
   - LOW:
     * Deadlines or meetings scheduled more than a week away
     * No immediate action required
     * FYI communications, general updates or information
     * Meeting cancellations or notifications of past events

3. Extract the deadline date using these rules:
   - Only extract a deadline if the email explicitly mentions a due date, a meeting, or a fixed time-related action.
   - For "today": Use today's date in YYYY-MM-DD format
   - For "tomorrow": Use tomorrow's date in YYYY-MM-DD format
   - For "next week": Use the date 7 days from today
   - For specific dates like "June 5": Convert to YYYY-MM-DD format using the nearest future date
   - For relative days like "Monday", "Tuesday": Use the next occurrence of that day
   - If multiple dates are mentioned, use the earliest one
   - If no explicit deadline or meeting date is present, return null

   Examples:
   - "meeting tomorrow" → tomorrow's date
   - "due today" → today's date
   - "next Monday" → date of next Monday
   - "June 5" → nearest future June 5
   - "meeting next week" → date 7 days from today

4. Extract todo items using these rules:
   - Look for actionable items that need to be completed
   - Look for explicit tasks or requests
   - Look for deadlines or due dates associated with tasks
   - Only extract todos from high or medium priority emails
   - Do NOT create todos for internship-related emails
   - Do NOT create todos for low priority or spam emails
   - Do NOT create todos for simple FYI messages
   - Maximum 3 todos per email

5. For Internship Applications & Correspondence category ONLY:
   - Analyze the email content to extract:
     * Candidate's key skills and technologies
     * Years of experience (if mentioned)
     * Education background
     * Previous internships/projects (if mentioned)
     * Key achievements (if mentioned)
   - Provide a brief summary of the candidate's fit
   - If the email is not an internship application (e.g. internship opportunity or response), provide a brief summary of the key points

Respond in valid JSON format as shown below:
{
  "category": "Meeting Invitations & Scheduling",
  "priority": "HIGH",
  "deadline": "2024-03-07",
  "todos": [
    {
      "task": "Prepare presentation for team meeting",
      "priority": "high",
      "deadline": "2024-03-07"
    }
  ],
  "internshipAnalysis": {
    "isApplication": true,
    "candidateInfo": {
      "skills": ["Python", "Machine Learning", "React"],
      "education": "B.Tech Computer Science, 3rd year",
      "experience": "2 previous internships",
      "projects": ["Built an AI chatbot", "Developed a web app"],
      "achievements": ["Won hackathon", "Published paper"]
    },
    "summary": "Strong candidate with relevant technical skills and experience in AI/ML. Previous internships and projects demonstrate practical experience."
  }
}`;

router.post('/classify-email', async (req, res) => {
  try {
    const { subject, content, from, hasAttachments, emailId } = req.body;

    // Add current date to help with relative date processing
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    // Enhanced debug logs
    console.log('\n=== Email Classification Debug ===');
    console.log('1. Request received:', { subject, content, from, hasAttachments });
    console.log('2. API Key present:', !!process.env.OPENAI_API_KEY);
    console.log('3. Current date context:', { today, tomorrow });

    // Make request to AI service
    console.log('4. Making API request to OpenRouter...');
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'OpenRouter-Referrer': 'http://localhost:3000',
      },
      body: JSON.stringify({
        model: "anthropic/claude-3-sonnet",
        messages: [
          {
            role: "system",
            content: CLASSIFICATION_PROMPT
          },
          {
            role: "user",
            content: `Current date: ${today}\nFrom: "${from}"\nSubject: "${subject}"\nContent: "${content}"\nHas Attachments: ${hasAttachments}`
          }
        ],
        temperature: 0.2,
        max_tokens: 500
      })
    });

    console.log('5. API Response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('6. API Error:', errorData);
      throw new Error('AI service request failed: ' + errorData);
    }

    const data = await response.json();
    console.log('7. API Response data:', JSON.stringify(data, null, 2));
    
    // Parse the classification response
    const classification = JSON.parse(data.choices[0].message.content);
    console.log('8. Parsed classification:', classification);

    // Validate the response
    if (!classification.category || !classification.priority) {
      console.error('9. Invalid classification format:', classification);
      throw new Error('Invalid classification format');
    }

    // Normalize priority to lowercase
    classification.priority = classification.priority.toLowerCase();

    // If this is an internship email and we have analysis, save it to the database
    if (emailId && classification.category === 'Internship Applications & Correspondence' && classification.internshipAnalysis) {
      try {
        console.log('Saving internship analysis:', {
          emailId,
          category: classification.category,
          internshipAnalysis: classification.internshipAnalysis
        });

        await Email.update(
          { internship_analysis: classification.internshipAnalysis },
          { where: { gmail_id: emailId } }
        );
        
        // Verify the save by fetching the updated record
        const updatedEmail = await Email.findOne({ where: { gmail_id: emailId } });
        console.log('Verified saved internship analysis:', {
          emailId,
          hasAnalysis: !!updatedEmail.internship_analysis,
          savedAnalysis: updatedEmail.internship_analysis
        });

      } catch (error) {
        console.error('Error saving internship analysis:', {
          error: error.message,
          stack: error.stack,
          emailId
        });
        // Don't throw here, we still want to return the classification
      }
    }

    console.log('11. Classification successful:', classification);
    res.json(classification);
  } catch (error) {
    console.error('Error in email classification:', error.message);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      error: 'Classification failed', 
      message: error.message,
      category: 'Personal, Promotions & Spam',
      priority: 'low',
      deadline: null,
      todos: [],
      internshipAnalysis: null
    });
  }
});

module.exports = router; 