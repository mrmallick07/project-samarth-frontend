import React, { useState, useRef, useEffect } from 'react';
import { Send, Database, AlertCircle, CheckCircle, Loader, ExternalLink } from 'lucide-react';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function App() {
  const [messages, setMessages] = useState([
    {
      type: 'system',
      content: 'Welcome to Project Samarth! Ask me questions about India\'s agricultural economy and climate patterns.',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState('checking');
  const messagesEndRef = useRef(null);

  // Check backend health on mount
  useEffect(() => {
    checkBackendHealth();
  }, []);

  const checkBackendHealth = async () => {
    try {
      const response = await fetch(`${API_URL}/health`);
      if (response.ok) {
        setBackendStatus('connected');
      } else {
        setBackendStatus('error');
      }
    } catch (error) {
      setBackendStatus('error');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sampleQuestions = [
    "Compare the average annual rainfall in Punjab and Haryana for the last 5 years",
    "Identify the district in Punjab with the highest production of Wheat in 2023",
    "What are the top 3 crops produced in Maharashtra?"
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = {
      type: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const queryText = input;
    setInput('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: queryText })
      });

      if (!response.ok) {
        throw new Error('Backend request failed');
      }

      const data = await response.json();

      const botMessage = {
        type: 'bot',
        content: data.answer,
        sources: data.sources || [],
        metadata: data.metadata || {},
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error:', error);
      
      // Fallback to demo response if backend fails
      const errorMessage = {
        type: 'bot',
        content: '⚠️ Could not connect to backend. Please ensure the Flask server is running on http://localhost:5000',
        sources: [],
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      setBackendStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const handleSampleClick = (question) => {
    setInput(question);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="header-left">
            <Database className="header-icon" />
            <div>
              <h1 className="header-title">Project Samarth</h1>
              <p className="header-subtitle">Intelligent Q&A over data.gov.in</p>
            </div>
          </div>
          <div className="backend-status">
            {backendStatus === 'connected' && (
              <span className="status-badge status-connected">
                <CheckCircle size={16} /> Backend Connected
              </span>
            )}
            {backendStatus === 'error' && (
              <span className="status-badge status-error">
                <AlertCircle size={16} /> Backend Offline
              </span>
            )}
            {backendStatus === 'checking' && (
              <span className="status-badge status-checking">
                <Loader size={16} className="spin" /> Checking...
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Sample Questions */}
      {messages.length === 1 && (
        <div className="sample-questions-container">
          <div className="sample-questions">
            <h3 className="sample-title">
              <AlertCircle className="sample-icon" />
              Try these sample questions:
            </h3>
            <div className="sample-list">
              {sampleQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSampleClick(q)}
                  className="sample-button"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <main className="messages-container">
        <div className="messages">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`message-wrapper ${msg.type === 'user' ? 'message-user' : 'message-bot'}`}
            >
              <div className={`message ${msg.type}`}>
                {msg.type === 'system' && (
                  <div className="message-system">
                    <CheckCircle className="system-icon" />
                    <div className="message-text">{msg.content}</div>
                  </div>
                )}

                {msg.type === 'user' && (
                  <div className="message-text">{msg.content}</div>
                )}

                {msg.type === 'bot' && (
                  <div className="message-bot-content">
                    <div className="message-text" style={{ whiteSpace: 'pre-wrap' }}>
                      {msg.content}
                    </div>

                    {msg.sources && msg.sources.length > 0 && (
                      <div className="sources">
                        <div className="sources-title">Data Sources:</div>
                        {msg.sources.map((source, sidx) => (
                          <div key={sidx} className="source-card">
                            <div className="source-name">{source.dataset}</div>
                            <div className="source-org">{source.source}</div>
                            {source.url && (
                              <a
                                href={source.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="source-link"
                              >
                                View Dataset <ExternalLink size={14} />
                              </a>
                            )}
                            {source.resource_id && (
                              <div className="source-id">ID: {source.resource_id}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="message-time">
                  {msg.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="message-wrapper message-bot">
              <div className="message bot">
                <div className="loading">
                  <Loader className="loading-icon spin" />
                  <span>Analyzing data from data.gov.in...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input */}
      <footer className="input-container">
        <div className="input-wrapper">
          <form onSubmit={handleSubmit} className="input-form">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask a question about agriculture and climate data..."
              className="input-field"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="send-button"
            >
              <Send size={20} />
              Send
            </button>
          </form>
          <div className="input-footer">
            All responses are sourced from live data.gov.in datasets with full citations
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;