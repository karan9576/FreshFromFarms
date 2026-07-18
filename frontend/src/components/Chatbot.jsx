import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'assistant',
      text: "Hi there! 🍿 I am your Fresh Farm AI Assistant. Ask me anything about our premium, preservative-free Makhana (foxnuts), shipping rates, coupon codes, or compliance!"
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
        text: "Sorry, I am facing a connection timeout. Please try asking again shortly!" 
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
          <li key={idx} style={{ marginLeft: '1rem', listStyleType: 'disc', marginBottom: '0.3rem' }} 
              dangerouslySetInnerHTML={{ __html: formattedLine.replace(/^[•-]\s*/, '') }} />
        );
      }
      return <p key={idx} style={{ margin: '0 0 0.5rem 0' }} dangerouslySetInnerHTML={{ __html: formattedLine }} />;
    });
  };

  const suggestionChips = [
    { label: '🎟️ Discount Coupon', query: 'Do you have any discount coupons?' },
    { label: '💰 Makhana Prices', query: 'What are the prices for Raw and Salted Makhana?' },
    { label: '🚚 Shipping Charges', query: 'What are your delivery fees and shipping charges?' },
    { label: '🛡️ Compliance Info', query: 'What are your FSSAI and GST registration details?' }
  ];

  return (
    <div style={{ position: 'fixed', bottom: '25px', right: '25px', zIndex: 9999, fontFamily: "'Inter', sans-serif" }}>
      {/* Floating Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          backgroundColor: 'var(--primary-color, #0c3823)',
          border: 'none',
          boxShadow: '0 8px 24px rgba(12, 56, 35, 0.3)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s ease',
          outline: 'none'
        }}
        onMouseOver={e => e.currentTarget.style.transform = 'scale(1.08)'}
        onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        {isOpen ? (
          <svg style={{ width: '24px', height: '24px', fill: '#fff' }} viewBox="0 0 24 24">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        ) : (
          <svg style={{ width: '26px', height: '26px', fill: '#fff' }} viewBox="0 0 24 24">
            <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/>
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
          height: '520px',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(16px)',
          borderRadius: '16px',
          boxShadow: '0 12px 36px rgba(12, 56, 35, 0.18)',
          border: '1px solid rgba(12, 56, 35, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          animation: 'chatSlideIn 0.3s ease-out'
        }}>
          {/* Header */}
          <div style={{
            padding: '1.2rem',
            background: 'var(--primary-color, #0c3823)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            gap: '0.8rem',
            borderBottom: '1px solid rgba(255,255,255,0.1)'
          }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem'
            }}>🍿</div>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem' }}>Fresh Farm Assistant</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', opacity: 0.8, marginTop: '0.1rem' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#2ecc71', display: 'inline-block' }}></span>
                Online & Ready
              </div>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div style={{
            flex: 1,
            padding: '1rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.8rem',
            background: '#fcfdfc'
          }}>
            {messages.map((msg, i) => (
              <div 
                key={i} 
                style={{
                  alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '82%',
                  padding: '0.75rem 1rem',
                  borderRadius: msg.sender === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                  background: msg.sender === 'user' ? 'var(--primary-color, #0c3823)' : '#f0f4f1',
                  color: msg.sender === 'user' ? '#fff' : 'var(--text-dark, #2c3e50)',
                  fontSize: '0.85rem',
                  lineHeight: '1.45',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                }}
              >
                {formatText(msg.text)}
              </div>
            ))}

            {loading && (
              <div style={{
                alignSelf: 'flex-start',
                padding: '0.75rem 1rem',
                borderRadius: '12px 12px 12px 2px',
                background: '#f0f4f1',
                color: '#555',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}>
                <span className="dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#555', animation: 'chatBounce 1.2s infinite' }}></span>
                <span className="dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#555', animation: 'chatBounce 1.2s infinite 0.2s' }}></span>
                <span className="dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#555', animation: 'chatBounce 1.2s infinite 0.4s' }}></span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions */}
          <div style={{
            padding: '0.5rem 0.8rem',
            background: '#f5f7f5',
            borderTop: '1px solid rgba(12, 56, 35, 0.05)',
            display: 'flex',
            gap: '0.4rem',
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
                  padding: '0.35rem 0.75rem',
                  borderRadius: '50px',
                  border: '1px solid rgba(12, 56, 35, 0.12)',
                  background: '#fff',
                  color: 'var(--primary-color, #0c3823)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={e => {
                  e.currentTarget.style.borderColor = 'var(--primary-color)';
                  e.currentTarget.style.background = 'rgba(12, 56, 35, 0.04)';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.borderColor = 'rgba(12, 56, 35, 0.12)';
                  e.currentTarget.style.background = '#fff';
                }}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Footer Input Bar */}
          <div style={{
            padding: '0.8rem',
            background: '#fff',
            borderTop: '1px solid rgba(12, 56, 35, 0.08)',
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'center'
          }}>
            <input 
              type="text" 
              placeholder="Ask anything..." 
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={loading}
              style={{
                flex: 1,
                padding: '0.65rem 0.9rem',
                borderRadius: '50px',
                border: '1px solid #d0d7d1',
                outline: 'none',
                fontSize: '0.85rem',
                background: '#fff'
              }}
            />
            <button 
              onClick={() => handleSend()}
              disabled={loading || !inputText.trim()}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary-color, #0c3823)',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: (loading || !inputText.trim()) ? 0.5 : 1,
                transition: 'opacity 0.2s ease',
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
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes chatBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  );
}
