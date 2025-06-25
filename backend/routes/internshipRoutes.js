const express = require('express');
const router = express.Router();
const { analyzeInternshipEmail } = require('../services/internshipAnalyzer');

// Test route to verify API key and configuration
router.get('/test-config', (req, res) => {
  const config = {
    hasApiKey: !!process.env.OPENAI_API_KEY,
    apiKeyLength: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0,
    nodeEnv: process.env.NODE_ENV || 'not set'
  };
  res.json(config);
});

router.post('/analyze', async (req, res) => {
  try {
    // Log the incoming request
    console.log('Received analyze request:', {
      hasContent: !!req.body.emailContent,
      contentLength: req.body.emailContent ? req.body.emailContent.length : 0,
      hasAttachments: !!req.body.attachments,
      attachmentsCount: req.body.attachments ? req.body.attachments.length : 0
    });

    const { emailContent, attachments } = req.body;

    // Validate request
    if (!emailContent) {
      console.error('Missing email content in request');
      return res.status(400).json({ 
        error: 'Email content is required',
        receivedData: {
          hasEmailContent: !!emailContent,
          hasAttachments: !!attachments
        }
      });
    }

    // Verify API key
    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key not configured');
      return res.status(500).json({
        error: 'Server configuration error',
        message: 'API key not configured'
      });
    }

    // Analyze the internship email
    const analysis = await analyzeInternshipEmail(emailContent, attachments);

    // Log successful analysis
    console.log('Analysis completed successfully:', {
      hasAnalysis: !!analysis,
      analysisKeys: Object.keys(analysis)
    });

    res.json(analysis);
  } catch (error) {
    console.error('Error in /analyze route:', {
      message: error.message,
      stack: error.stack,
      type: error.constructor.name
    });

    // Send appropriate error response
    res.status(500).json({ 
      error: 'Analysis failed', 
      message: error.message,
      type: error.constructor.name
    });
  }
});

module.exports = router; 