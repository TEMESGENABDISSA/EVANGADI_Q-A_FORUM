import React, { useState, useEffect, useRef } from 'react';
import { FaComment, FaTimes, FaPaperPlane, FaRobot } from 'react-icons/fa';
import { useTheme } from '../../context/ThemeContext';
import { axiosInstance } from '../../utility/axios';
import styles from './Chatbot.module.css';

// Enhanced markdown parser
// Enhanced markdown parser with code highlighting
const parseMarkdown = (text) => {
  if (!text) return '';
  
  let html = text;
  let codeBlockId = 0;
  
  // Code blocks with language detection and copy button
  html = html.replace(/```(\w+)?\n?([\s\S]*?)```/g, (match, lang, code) => {
    codeBlockId++;
    const language = lang || 'javascript';
    const trimmedCode = code.trim();
    return `<div class="code-block-wrapper">
      <div class="code-header">
        <span class="code-language">${language}</span>
        <button class="copy-code-btn" data-code-id="${codeBlockId}" onclick="window.copyCode('${codeBlockId}', this)" title="Copy code">
          📋 Copy
        </button>
      </div>
      <pre><code id="code-${codeBlockId}" class="language-${language}">${trimmedCode}</code></pre>
    </div>`;
  });
  
  // Inline code (`code`)
  html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
  
  // Headings with icons
  html = html.replace(/^### (.+)$/gm, '<h3>📌 $1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>📚 $1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>✨ $1</h1>');
  
  // Bold (**text** or __text__)
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
  
  // Italic (*text* or _text_) - fixed to not conflict with bold
  html = html.replace(/(?<!\*)\*([^*]+?)\*(?!\*)/g, '<em>$1</em>');
  html = html.replace(/(?<!_)_([^_]+?)_(?!_)/g, '<em>$1</em>');
  
  // Links with icon [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">🔗 $1</a>');
  
  // Blockquotes with icon (> text)
  html = html.replace(/^> (.+)$/gm, '<blockquote>💡 $1</blockquote>');
  
  // Horizontal rule (---)
  html = html.replace(/^---$/gm, '<hr class="styled-hr" />');
  
  // Task lists (- [ ] or - [x])
  html = html.replace(/^- \[ \] (.+)$/gm, '<div class="task-item">☐ $1</div>');
  html = html.replace(/^- \[x\] (.+)$/gm, '<div class="task-item completed">☑ $1</div>');
  
  // Highlights ==text==
  html = html.replace(/==(.+?)==/g, '<mark>$1</mark>');
  
  // Line breaks
  html = html.replace(/\n/g, '<br />');
  
  // Numbered lists
  html = html.replace(/(\d+)\. /g, '$1. ');
  
  // Bullet points
  html = html.replace(/• /g, '• ');
  
  return html;
};

// Copy code to clipboard function - moved inside component
const copyCode = (codeId, button) => {
  const codeElement = document.getElementById(`code-${codeId}`);
  if (codeElement) {
    const code = codeElement.textContent;
    navigator.clipboard.writeText(code).then(() => {
      button.textContent = '✅ Copied!';
      button.style.backgroundColor = '#28a745';
      setTimeout(() => {
        button.textContent = '📋 Copy';
        button.style.backgroundColor = '';
      }, 2000);
    }).catch(err => {
      console.error('Failed to copy:', err);
      button.textContent = '❌ Failed';
      setTimeout(() => {
        button.textContent = '📋 Copy';
      }, 2000);
    });
  }
};

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const { isDarkMode } = useTheme();
  const messagesEndRef = useRef(null);
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [toast, setToast] = useState(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);

  // Show toast notification
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Check if it's user's first visit
  useEffect(() => {
    const hasVisited = localStorage.getItem('hasVisited');
    if (!hasVisited) {
      setIsFirstVisit(true);
      localStorage.setItem('hasVisited', 'true');
    }
  }, []);

  // Add copyCode function to window object
  useEffect(() => {
    window.copyCode = copyCode;
    return () => {
      delete window.copyCode;
    };
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

  // Handle scroll to show/hide scroll button
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const isScrolledUp = container.scrollHeight - container.scrollTop - container.clientHeight > 100;
      setShowScrollButton(isScrolledUp);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Ctrl/Cmd + K to focus input
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          inputRef.current?.focus();
        } else {
          setIsOpen(true);
          setTimeout(() => inputRef.current?.focus(), 100);
        }
      }
      // Escape to close
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isOpen]);

  // Scroll to bottom function
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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
        axiosInstance.post('/chat', requestData, {
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
          userQuestion: safeMessage, // Store the user's question with the bot's response
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
    if (!isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  // Clear chat function - instant clear with notification
  const clearChat = () => {
    setMessages([]);
    showToast('💬 Chat cleared!', 'info');
    setTimeout(() => {
      const welcomeMessage = {
        id: Date.now(),
        text: 'How can I help you today?',
        sender: 'bot',
        timestamp: new Date().toISOString()
      };
      setMessages([welcomeMessage]);
    }, 300);
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
            <div className={styles.headerLeft}>
              <FaRobot className={styles.robotIcon} />
              <div>
                <h3>Evangadi Assistant</h3>
                <span className={styles.statusText}>🟢 Online</span>
              </div>
            </div>
            <div className={styles.headerActions}>
              <button 
                onClick={clearChat} 
                className={styles.clearButton} 
                title="Clear chat"
                aria-label="Clear chat history"
              >
                🗑️
              </button>
              <button 
                onClick={toggleChat} 
                className={styles.closeButton} 
                title="Close chat"
                aria-label="Close chat window"
              >
                <FaTimes />
              </button>
            </div>
          </div>
          
          <div className={styles.messagesContainer} ref={messagesContainerRef}>
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
                      __html: parseMarkdown(msg.text)
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
            {showScrollButton && (
              <button 
                className={styles.scrollToBottomBtn}
                onClick={scrollToBottom}
                title="Scroll to bottom"
                aria-label="Scroll to latest message"
              >
                ⬇️
              </button>
            )}
          </div>
          
          {/* Toast Notification */}
          {toast && (
            <div className={`${styles.toast} ${styles[toast.type]}`}>
              {toast.message}
            </div>
          )}
          
          <div>
          </div>
          
          <form onSubmit={handleSendMessage} className={styles.messageForm}>
            <input
              ref={inputRef}
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message... (Ctrl+K to focus)"
              className={styles.messageInput}
              disabled={isTyping}
              maxLength={500}
            />
            <span className={styles.charCounter}>{message.length}/500</span>
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
