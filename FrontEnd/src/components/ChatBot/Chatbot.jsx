import React, { useState, useEffect, useRef } from 'react';
import { FaComment, FaTimes, FaPaperPlane } from 'react-icons/fa';
import { useTheme } from '../../context/ThemeContext';
import axios from 'axios';
import styles from './Chatbot.module.css';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const { isDarkMode } = useTheme();
  const messagesEndRef = useRef(null);
  const [isFirstVisit, setIsFirstVisit] = useState(false);

  // Check if it's user's first visit
  useEffect(() => {
    const hasVisited = localStorage.getItem('hasVisited');
    if (!hasVisited) {
      setIsFirstVisit(true);
      localStorage.setItem('hasVisited', 'true');
    }
  }, []);

  // Auto-open for first-time visitors after 3 seconds
  useEffect(() => {
    if (isFirstVisit) {
      const timer = setTimeout(() => {
        setIsOpen(true);
        // Add welcome message after a short delay
        setTimeout(() => {
          const welcomeMessage = {
            id: Date.now(),
            text: `Hello! I'm your Evangadi Forum assistant. How can I help you today?`,
            sender: 'bot',
            timestamp: new Date().toISOString()
          };
          setMessages(prev => [...prev, welcomeMessage]);
        }, 500);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isFirstVisit]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    // Create a safe message text (sanitize if needed)
    const safeMessage = message.replace(/<[^>]*>?/gm, '').trim(); // Basic HTML sanitization
    if (!safeMessage) return; // Don't send empty messages after sanitization

    // Add user message to chat
    const userMessage = {
      id: Date.now(),
      text: safeMessage,
      sender: 'user',
      timestamp: new Date().toISOString()
    };

    // Store the user's question for reference
    const userQuestion = safeMessage;
    
    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setIsTyping(true);

    // Add a temporary typing indicator
    const tempTypingId = 'typing-' + Date.now();
    setMessages(prev => [
      ...prev, 
      { 
        id: tempTypingId,
        text: '...',
        sender: 'bot',
        isTyping: true,
        timestamp: new Date().toISOString()
      }
    ]);

    try {
      // Get user info for personalization
      const username = localStorage.getItem('username') || 'there';
      
      // Filter out typing indicators and system messages
      const chatHistory = messages
        .filter(m => m && m.text && m.sender && !m.isTyping)
        .map(m => ({
          role: m.sender === 'user' ? 'user' : 'model',
          parts: [{ text: m.text }],
          timestamp: m.timestamp
        }));
      
      // Prepare the request data
      const requestData = {
        message: safeMessage,
        username: username,
        history: chatHistory
      };

      // Add request start time for timeout handling
      const requestStartTime = Date.now();
      const REQUEST_TIMEOUT = 15000; // 15 seconds

      // Make the API request with proper headers and timeout
      const response = await Promise.race([
        axios({
          method: 'post',
          url: process.env.REACT_APP_API_URL || '/api/chat',
          data: requestData,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          withCredentials: true,
          timeout: REQUEST_TIMEOUT
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), REQUEST_TIMEOUT)
        )
      ]);

      // Remove the typing indicator
      setMessages(prev => prev.filter(m => m.id !== tempTypingId));

      // Process the response
      if (response.data && response.data.success) {
        // Create a bot message that includes the user's question
        const botMessage = {
          id: Date.now() + 1,
          text: response.data.response,
          sender: 'bot',
          timestamp: new Date().toISOString(),
          userQuestion: message, // Store the user's question with the bot's response
          showSuggestions: true // Flag to show suggestions after this message
        };
        setMessages(prev => [...prev, botMessage]);
      } else {
        throw new Error(response.data?.error || 'Invalid response from server');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      // More detailed error message
      let errorText = 'Sorry, I encountered an error. Please try again later.';
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        errorText = error.response.data?.response || 
                   error.response.data?.error || 
                   `Server responded with status ${error.response.status}`;
      } else if (error.request) {
        // The request was made but no response was received
        errorText = 'Unable to connect to the server. Please check your internet connection.';
      }
      
      const errorMessage = {
        id: Date.now() + 1,
        text: errorText,
        sender: 'bot',
        timestamp: new Date().toISOString(),
        isError: true
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  // Common questions to suggest
  const commonQuestions = [
    'How do I ask a question?',
    'How do I register an account?',
    'How do I post an answer?',
    'How do I search for questions?'
  ];

  // Function to render suggested questions
  const renderSuggestedQuestions = () => (
    <div className={styles.suggestedQuestions}>
      <p className={styles.suggestedQuestionsTitle}>You might want to ask:</p>
      {commonQuestions.map((question, index) => (
        <button 
          key={index}
          className={styles.suggestedQuestion}
          onClick={() => {
            setMessage(question);
            // Auto-send the selected question
            handleSendMessage({ preventDefault: () => {} });
          }}
        >
          {question}
        </button>
      ))}
      <button 
        className={styles.backToQuestions}
        onClick={() => {
          // Add a message to indicate going back to questions
          const backMessage = {
            id: Date.now(),
            text: 'Taking you back to the questions...',
            sender: 'bot',
            timestamp: new Date().toISOString(),
            isNavigation: true
          };
          setMessages(prev => [...prev, backMessage]);
          
          // After a short delay, show the welcome message with questions
          setTimeout(() => {
            setMessages([{
              id: Date.now() + 1,
              text: 'What would you like to know?',
              sender: 'bot',
              timestamp: new Date().toISOString()
            }]);
          }, 800);
        }}
      >
        ← Back to Questions
      </button>
    </div>
  );

  return (
    <div className={`${styles.chatbotContainer} ${isDarkMode ? styles.dark : ''}`}>
      {isOpen ? (
        <div className={`${styles.chatWindow} ${isDarkMode ? styles.dark : ''}`}>
          <div className={styles.chatHeader}>
            <h3>Evangadi Assistant</h3>
            <button onClick={toggleChat} className={styles.closeButton}>
              <FaTimes />
            </button>
          </div>
          
          <div className={styles.messagesContainer}>
            {messages.length === 0 ? (
              <div className={styles.welcomeMessage}>
                <p>Hello! I'm your Evangadi Forum assistant. How can I help you today?</p>
                <div className={styles.suggestedQuestions}>
                  <p>Try asking me:</p>
                  {commonQuestions.map((question, index) => (
                    <button 
                      key={index} 
                      className={styles.suggestedQuestion}
                      onClick={() => setMessage(question)}
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`${styles.message} ${msg.sender === 'user' ? styles.userMessage : styles.botMessage}`}
                >
                  <div className={styles.messageContent}>
                    {msg.userQuestion && (
                      <div className={styles.userQuestion}>
                        <strong>You asked:</strong>
                        <p>{msg.userQuestion}</p>
                      </div>
                    )}
                    <div className={styles.messageText} dangerouslySetInnerHTML={{ 
                      __html: msg.text
                        .replace(/\n/g, '<br />')
                        .replace(/(\d+)\.\s+/g, '$1. ')
                        .replace(/•\s+/g, '• ')
                    }} />
                    {msg.showSuggestions && (
                      <div className={styles.suggestionsContainer}>
                        {renderSuggestedQuestions()}
                      </div>
                    )}
                    <span className={styles.timestamp}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            )}
            {isTyping && (
              <div className={`${styles.message} ${styles.botMessage}`}>
                <div className={styles.typingIndicator}>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <form onSubmit={handleSendMessage} className={styles.messageForm}>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              className={styles.messageInput}
              disabled={isTyping}
            />
            <button 
              type="submit" 
              className={styles.sendButton}
              disabled={!message.trim() || isTyping}
            >
              <FaPaperPlane />
            </button>
          </form>
        </div>
      ) : (
        <button 
          onClick={toggleChat} 
          className={`${styles.chatButton} ${isDarkMode ? styles.dark : ''}`}
          aria-label="Open chat"
        >
          <FaComment className={styles.chatIcon} />
        </button>
      )}
    </div>
  );
};

export default Chatbot;
