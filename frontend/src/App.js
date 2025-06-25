import './App.css';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

function App() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Create animated particles
  useEffect(() => {
    const createParticle = () => {
      const particles = document.querySelector('.particles');
      if (!particles) return;

      const particle = document.createElement('div');
      particle.className = 'particle';
      
      // Random position
      particle.style.left = Math.random() * 100 + '%';
      particle.style.top = '100%';
      
      // Random size
      const size = Math.random() * 4 + 2;
      particle.style.width = size + 'px';
      particle.style.height = size + 'px';
      
      // Animation
      particle.style.animation = `float ${Math.random() * 3 + 2}s linear`;
      
      particles.appendChild(particle);
      
      // Remove particle after animation
      setTimeout(() => {
        particle.remove();
      }, 5000);
    };

    // Create neural network nodes
    const createNeuralNetwork = () => {
      const network = document.querySelector('.neural-network');
      if (!network) return;

      // Create nodes
      for (let i = 0; i < 5; i++) {
        const node = document.createElement('div');
        node.className = 'node';
        node.style.left = 20 + (i * 15) + '%';
        node.style.top = 30 + (Math.random() * 40) + '%';
        node.style.animationDelay = `${Math.random() * 2}s`;
        network.appendChild(node);
      }

      // Create connections
      for (let i = 0; i < 8; i++) {
        const connection = document.createElement('div');
        connection.className = 'connection';
        connection.style.width = '15%';
        connection.style.left = 20 + (Math.random() * 60) + '%';
        connection.style.top = 40 + (Math.random() * 20) + '%';
        connection.style.transform = `rotate(${Math.random() * 60 - 30}deg)`;
        connection.style.animationDelay = `${Math.random() * 2}s`;
        network.appendChild(connection);
      }
    };

    // Initialize neural network
    createNeuralNetwork();

    // Create particles periodically
    const particleInterval = setInterval(createParticle, 300);

    return () => {
      clearInterval(particleInterval);
    };
  }, []);

  // Add AI elements
  useEffect(() => {
    // Position the AI elements around the page
    const aiElements = [
      { type: 'circuit', top: '15%', left: '10%' },
      { type: 'brain', top: '70%', right: '15%' },
      { type: 'data', top: '25%', right: '20%' },
      { type: 'neural', bottom: '20%', left: '15%' },
      { type: 'mind', top: '40%', left: '25%' },
      { type: 'network', top: '20%', left: '60%' },
      { type: 'brain', bottom: '30%', right: '25%', scale: '0.7' },
      { type: 'data', top: '60%', right: '30%', scale: '0.8' },
      { type: 'neural', top: '10%', right: '40%', scale: '0.6' }
    ];

    const container = document.querySelector('.login-container');
    
    aiElements.forEach(({ type, scale, ...position }) => {
      const element = document.createElement('div');
      element.className = `ai-element ${type}`;
      
      if (type === 'brain' || type === 'mind') {
        element.className += ' material-icons';
        element.textContent = type === 'brain' ? 'psychology' : 'bubble_chart';
      }
      
      Object.entries(position).forEach(([key, value]) => {
        element.style[key] = value;
      });

      if (scale) {
        element.style.transform = `scale(${scale})`;
      }
      
      container.appendChild(element);
    });

    // Cleanup
    return () => {
      const elements = document.querySelectorAll('.ai-element');
      elements.forEach(element => element.remove());
    };
  }, []);

  const login = useGoogleLogin({
    flow: 'auth-code',
    scope:
      'openid email profile https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events',
    access_type: 'offline',
    prompt: 'consent',
    onSuccess: async (response) => {
      setIsLoading(true);
      setError(null);

      try {
        const res = await axios.post('http://localhost:4000/api/auth/google', {
          code: response.code,
        });

        const { access_token, refresh_token, userId } = res.data;

        // Store tokens and userId in localStorage
        localStorage.setItem('gmailAccessToken', access_token);
        localStorage.setItem('gmailRefreshToken', refresh_token);
        localStorage.setItem('userId', userId);

        navigate('/dashboard');
      } catch (err) {
        console.error('Backend error:', err);
        setError('Failed to authenticate. Please try again.');
      } finally {
        setIsLoading(false);
      }
    },
    onError: (error) => {
      console.error('Login failed:', error);
      setError('Login failed. Please try again.');
    },
  });

  return (
    <div className="login-container">
      <div className="particles"></div>
      <div className="login-card">
        <div className="neural-network"></div>
        <div className="logo-section">
          <span className="material-icons logo-icon">smart_toy</span>
          <h1>Smart Mail AI</h1>
        </div>
        
        <div className="welcome-section">
          <h2>Welcome to Smart Mail AI Assistant</h2>
          <p>Your intelligent email assistant powered by AI</p>
        </div>

        {error && (
          <div className="error-message">
            <span className="material-icons">error_outline</span>
            <p>{error}</p>
          </div>
        )}

        <button 
          className={`google-sign-in-button ${isLoading ? 'loading' : ''}`} 
          onClick={() => login()}
          disabled={isLoading}
        >
          {!isLoading && (
            <>
              <img 
                src="https://fonts.gstatic.com/s/i/productlogos/googleg/v6/24px.svg" 
                alt="Google logo" 
                className="google-icon" 
              />
              <span>Sign in with Google</span>
            </>
          )}
          {isLoading && (
            <>
              <div className="button-spinner"></div>
              <span>Signing in...</span>
            </>
          )}
        </button>

        <div className="features-section">
          <div className="feature">
            <span className="material-icons">inbox</span>
            <p>Smart Email Management</p>
          </div>
          <div className="feature">
            <span className="material-icons">psychology</span>
            <p>AI-Powered Classification</p>
          </div>
          <div className="feature">
            <span className="material-icons">security</span>
            <p>Secure & Private</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
