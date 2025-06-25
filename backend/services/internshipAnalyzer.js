const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const pdf = require('pdf-parse');

const ANALYSIS_PROMPT = `You are an expert at analyzing internship applications and resumes. Given an internship-related email and its attachments, provide a comprehensive analysis in the following format:

1. Analyze the email content and resume to extract:
   - Candidate's key skills and technologies
   - Years of experience (if mentioned)
   - Education background
   - Previous internships/projects
   - Key achievements

2. Provide a brief summary of the candidate's fit for the position

Return ONLY the JSON data without any markdown formatting or code blocks. Format exactly as shown:
{
  "candidateInfo": {
    "skills": ["skill1", "skill2", ...],
    "education": "Brief education summary",
    "experience": "Years of experience or N/A",
    "projects": ["project1", "project2", ...],
    "achievements": ["achievement1", "achievement2", ...]
  },
  "summary": "2-3 sentence summary of the candidate's fit"
}`;

async function analyzeInternshipEmail(emailContent, attachments) {
  try {
    console.log('Starting internship email analysis');

    // Validate API key
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key is not configured');
    }

    // Extract text from PDF attachments
    let resumeText = '';
    if (attachments && attachments.length > 0) {
      console.log(`Processing ${attachments.length} attachments`);
      for (const attachment of attachments) {
        if (attachment.mimeType === 'application/pdf') {
          try {
            // Convert attachment data to Buffer if it's not already
            const buffer = Buffer.isBuffer(attachment.data) 
              ? attachment.data 
              : Buffer.from(attachment.data);
            
            const pdfData = await pdf(buffer);
            resumeText += '\n' + pdfData.text;
            console.log('Successfully extracted text from PDF attachment');
          } catch (error) {
            console.error('Error extracting PDF text:', error);
            // Continue with analysis even if PDF extraction fails
          }
        }
      }
    }

    // Combine email content and resume text
    const fullContent = `Email Content: ${emailContent}\nResume Content: ${resumeText}`;
    console.log('Prepared content for analysis, length:', fullContent.length);

    // Make request to OpenRouter for analysis
    console.log('Sending request to OpenRouter');
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
            content: ANALYSIS_PROMPT
          },
          {
            role: "user",
            content: fullContent
          }
        ],
        temperature: 0.2,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenRouter API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      throw new Error(`Analysis service request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Received response from OpenRouter');

    if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
      console.error('Invalid response format from OpenRouter:', data);
      throw new Error('Invalid response format from analysis service');
    }

    // Clean and parse the response
    let content = data.choices[0].message.content;
    
    // Remove any markdown code blocks or formatting
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    try {
      const analysis = JSON.parse(content);
      console.log('Successfully parsed analysis response');
      return analysis;
    } catch (parseError) {
      console.error('JSON parsing error:', {
        error: parseError.message,
        content: content
      });
      throw new Error('Failed to parse analysis response: ' + parseError.message);
    }
  } catch (error) {
    console.error('Error in internship email analysis:', {
      error: error.message,
      stack: error.stack,
      phase: error.phase || 'unknown'
    });
    throw error;
  }
}

module.exports = { analyzeInternshipEmail }; 