import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'assistant',
      text: "Welcome to FreshFromFarms. I am your Customer Service Assistant. How may I help you with our premium water-cultivated Makhana (Indian Foxnuts), shipping rates, discount coupons, or compliance details today?"
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const apiURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const cleanApiURL = apiURL.endsWith('/') ? apiURL.slice(0, -1) : apiURL;

  // Scroll to bottom whenever messages list changes
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  const handleSend = async (textToSend) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    // User message
    const userMsg = { sender: 'user', text: text.trim() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputText('');
    setLoading(true);

    try {
      const res = await axios.post(`${cleanApiURL}/auth/chat`, {
        messages: updatedMessages
      });
      setMessages(prev => [...prev, { sender: 'assistant', text: res.data.text }]);
    } catch (err) {
      setMessages(prev => [...prev, { 
        sender: 'assistant', 
        text: "I apologize, but I am facing a connection timeout. Please try resubmitting your inquiry shortly." 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  // Convert simple bold/bullet markdown text to formatted HTML safely
  const formatText = (text) => {
    return text.split('\n').map((line, idx) => {
      // Bold formatter **text**
      let formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      // Bullet point formatter
      if (formattedLine.trim().startsWith('•') || formattedLine.trim().startsWith('-')) {
        return (
          <li key={idx} style={{ marginLeft: '1rem', listStyleType: 'disc', marginBottom: '0.4rem', color: '#334e3f' }} 
              dangerouslySetInnerHTML={{ __html: formattedLine.replace(/^[•-]\s*/, '') }} />
        );
      }
      return <p key={idx} style={{ margin: '0 0 0.5rem 0' }} dangerouslySetInnerHTML={{ __html: formattedLine }} />;
    });
  };

  const suggestionChips = [
    { label: 'Discount Coupons', query: 'Do you have any discount coupons?' },
    { label: 'Makhana Pricing', query: 'What are the prices for Raw and Salted Makhana?' },
    { label: 'Delivery & Shipping', query: 'What are your delivery fees and shipping charges?' },
    { label: 'FSSAI & GSTIN Compliance', query: 'What are your FSSAI and GST registration details?' }
  ];

  return (
    <div style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 9999, fontFamily: "'Inter', -apple-system, sans-serif" }}>
      {/* Floating Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          backgroundColor: 'var(--primary-color, #0c3823)',
          border: 'none',
          boxShadow: '0 8px 24px rgba(12, 56, 35, 0.25)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          outline: 'none'
        }}
        onMouseOver={e => e.currentTarget.style.transform = 'scale(1.06)'}
        onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        {isOpen ? (
          <svg style={{ width: '22px', height: '22px', fill: '#fff' }} viewBox="0 0 24 24">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        ) : (
          <svg style={{ width: '24px', height: '24px', fill: '#fff' }} viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12v5c0 1.66 1.34 3 3 3h3v-8H4v-2c0-4.41 3.59-8 8-8s8 3.59 8 8v2h-4v8h4c1.66 0 3-1.34 3-3v-5c0-5.52-4.48-10-10-10z"/>
          </svg>
        )}
      </button>

      {/* Chat Window Panel */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          bottom: '75px',
          right: '0',
          width: '380px',
          height: '540px',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 16px 40px rgba(12, 56, 35, 0.15)',
          border: '1px solid rgba(12, 56, 35, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          animation: 'chatSlideIn 0.3s ease-out'
        }}>
          {/* Header */}
          <div style={{
            padding: '1.25rem 1.5rem',
            background: 'var(--primary-color, #0c3823)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            gap: '0.9rem',
            borderBottom: '1px solid rgba(255,255,255,0.05)'
          }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '800',
              fontSize: '0.85rem',
              letterSpacing: '0.5px',
              color: '#fff'
            }}>FFF</div>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem', letterSpacing: '0.2px' }}>FreshFromFarms Support</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', opacity: 0.85, marginTop: '0.2rem' }}>
                <span className="pulsing-green-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#2ecc71', display: 'inline-block' }}></span>
                Customer Service Agent
              </div>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div style={{
            flex: 1,
            padding: '1.2rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            background: '#fafbfa'
          }}>
            {messages.map((msg, i) => (
              <div 
                key={i} 
                style={{
                  alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '82%',
                  padding: '0.8rem 1.1rem',
                  borderRadius: msg.sender === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                  background: msg.sender === 'user' ? 'var(--primary-color, #0c3823)' : '#ffffff',
                  color: msg.sender === 'user' ? '#fff' : '#243a2e',
                  fontSize: '0.85rem',
                  lineHeight: '1.5',
                  boxShadow: msg.sender === 'user' ? 'none' : '0 2px 6px rgba(12, 56, 35, 0.04)',
                  border: msg.sender === 'user' ? 'none' : '1px solid rgba(12, 56, 35, 0.06)'
                }}
              >
                {formatText(msg.text)}
              </div>
            ))}

            {loading && (
              <div style={{
                alignSelf: 'flex-start',
                padding: '0.8rem 1.1rem',
                borderRadius: '12px 12px 12px 2px',
                background: '#ffffff',
                border: '1px solid rgba(12, 56, 35, 0.06)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}>
                <span className="dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#5a7065', animation: 'chatBounce 1.2s infinite' }}></span>
                <span className="dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#5a7065', animation: 'chatBounce 1.2s infinite 0.2s' }}></span>
                <span className="dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#5a7065', animation: 'chatBounce 1.2s infinite 0.4s' }}></span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions */}
          <div style={{
            padding: '0.6rem 0.9rem',
            background: '#ffffff',
            borderTop: '1px solid rgba(12, 56, 35, 0.06)',
            display: 'flex',
            gap: '0.5rem',
            overflowX: 'auto',
            whiteSpace: 'nowrap',
            scrollbarWidth: 'none'
          }}>
            {suggestionChips.map((chip, idx) => (
              <button 
                key={idx}
                onClick={() => handleSend(chip.query)}
                style={{
                  fontSize: '0.75rem',
                  padding: '0.4rem 0.85rem',
                  borderRadius: '6px',
                  border: '1px solid rgba(12, 56, 35, 0.1)',
                  background: '#fafbfa',
                  color: 'var(--primary-color, #0c3823)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  transition: 'all 0.2s ease',
                  outline: 'none'
                }}
                onMouseOver={e => {
                  e.currentTarget.style.borderColor = 'var(--primary-color)';
                  e.currentTarget.style.background = '#ffffff';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.borderColor = 'rgba(12, 56, 35, 0.1)';
                  e.currentTarget.style.background = '#fafbfa';
                }}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Footer Input Bar */}
          <div style={{
            padding: '1rem',
            background: '#ffffff',
            borderTop: '1px solid rgba(12, 56, 35, 0.08)',
            display: 'flex',
            gap: '0.6rem',
            alignItems: 'center'
          }}>
            <input 
              type="text" 
              placeholder="Ask a question..." 
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={loading}
              style={{
                flex: 1,
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                border: '1px solid #d9e2db',
                outline: 'none',
                fontSize: '0.85rem',
                background: '#fafbfa',
                transition: 'all 0.2s ease',
                color: '#243a2e'
              }}
              onFocus={e => {
                e.currentTarget.style.borderColor = 'var(--primary-color)';
                e.currentTarget.style.backgroundColor = '#ffffff';
              }}
              onBlur={e => {
                e.currentTarget.style.borderColor = '#d9e2db';
                e.currentTarget.style.backgroundColor = '#fafbfa';
              }}
            />
            <button 
              onClick={() => handleSend()}
              disabled={loading || !inputText.trim()}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                backgroundColor: 'var(--primary-color, #0c3823)',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: (loading || !inputText.trim()) ? 0.5 : 1,
                transition: 'all 0.2s ease',
                outline: 'none'
              }}
            >
              <svg style={{ width: '18px', height: '18px', fill: '#fff' }} viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Embedded Animations CSS */}
      <style>{`
        @keyframes chatSlideIn {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes chatBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .pulsing-green-dot {
          box-shadow: 0 0 0 0 rgba(46, 204, 113, 0.7);
          animation: greenPulse 2s infinite;
        }
        @keyframes greenPulse {
          0% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(46, 204, 113, 0.7);
          }
          70% {
            transform: scale(1);
            box-shadow: 0 0 0 5px rgba(46, 204, 113, 0);
          }
          100% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(46, 204, 113, 0);
          }
        }
      `}</style>
    </div>
  );
}
