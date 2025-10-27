# 🎓 Evangadi Forum - Q&A Platform

A full-stack question and answer forum built with React, Node.js, Express, and MySQL.
# Front:https://evangadi-forum-temesgenabdissas-projects.vercel.app
# Backend: https://evangadi-backend-temesgenabdissas-projects.vercel.app
---

## ✨ Features

### Core Features
- 🔐 **User Authentication** - Register, login, logout with JWT
- ❓ **Ask Questions** - Post questions with title and description
- 💬 **Answer Questions** - Provide answers to community questions
- 🔍 **Search & Filter** - Find questions easily
- 🌓 **Dark/Light Mode** - Toggle between themes
- 📱 **Responsive Design** - Works on all devices

### Advanced Features
- 🔔 **Notification System** - Get notified when your questions are answered
- 🤖 **AI Chatbot** - Gemini AI-powered assistant with markdown support
- 📊 **Answer Count Display** - See how many answers each question has
- 👁️ **View Counter** - Track question views
- ✂️ **Smart Truncation** - Clean, compact question cards
- 🎨 **Gradient Messages** - Beautiful chat interface
- ⌨️ **Keyboard Shortcuts** - Ctrl+K to open chat, Escape to close

---

## 🚀 Tech Stack

### Frontend
- **React** - UI library
- **Vite** - Build tool
- **React Router** - Navigation
- **Axios** - HTTP client
- **CSS Modules** - Styling

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **MySQL** - Database
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Gemini AI** - Chatbot intelligence

### Deployment
- **Vercel** - Frontend hosting
- **Render** - Backend hosting
- **Aiven** - MySQL database

---

## 📦 Installation

### Prerequisites
- Node.js (v14 or higher)
- MySQL database
- Gemini API key (optional, for chatbot)

### Backend Setup

```bash
cd Backend
npm install

# Create .env file
cp .env.example .env

# Configure .env with your credentials
NODE_ENV=development
PORT=5000
JWT_SECRET=your_jwt_secret_here
GEMINI_API_KEY=your_gemini_api_key_here
DB_HOST=your_database_host
DB_PORT=27384
DB_USER=your_database_user
DB_PASS=your_database_password
DB_DATABASE=your_database_name
SSL_CA=your_ssl_certificate

# Start server
npm start
```

### Frontend Setup

```bash
cd FrontEnd
npm install

# Create .env file
echo "VITE_API_URL=http://localhost:5000" > .env

# Start development server
npm run dev
```

---

## 🗄️ Database Setup

### MySQL Schema

The application uses the following tables:

**users**
- `userid` - Primary key
- `username` - Unique username
- `email` - Unique email
- `password` - Hashed password

**questions**
- `questionid` - Primary key
- `userid` - Foreign key to users
- `title` - Question title
- `description` - Question description
- `createdAt` - Timestamp
- `views` - View count

**answers**
- `answerid` - Primary key
- `questionid` - Foreign key to questions
- `userid` - Foreign key to users
- `answer` - Answer content
- `createdAt` - Timestamp

**notifications**
- `id` - Primary key
- `userid` - Foreign key to users
- `related_id` - Question ID
- `type` - Notification type
- `message` - Notification message
- `is_read` - Read status
- `createdAt` - Timestamp

---

## 🎯 Usage

### Register an Account
1. Click "Sign Up"
2. Enter username, email, and password
3. Submit to create account

### Ask a Question
1. Login to your account
2. Click "Ask Question"
3. Enter title and description
4. Submit your question

### Answer Questions
1. Browse questions
2. Click on a question
3. Type your answer
4. Submit

### Use the Chatbot
1. Click the chat bubble (bottom right)
2. Ask questions about the forum
3. Use keyboard shortcut: `Ctrl+K`
4. Press `Escape` to close

---

## ⌨️ Keyboard Shortcuts

- `Ctrl+K` or `Cmd+K` - Open chatbot
- `Escape` - Close chatbot
- `Enter` - Send message

---

## 🎨 Chatbot Features

### Markdown Support
- **Code blocks**: ` ```code``` `
- **Inline code**: `` `code` ``
- **Bold**: `**text**`
- **Italic**: `*text*`
- **Headings**: `# H1`, `## H2`, `### H3`
- **Links**: `[text](url)`
- **Highlights**: `==text==`
- **Task lists**: `- [ ]` and `- [x]`

### Interactive Features
- 📋 Copy code button on all code blocks
- ⬇️ Scroll to bottom button
- 🔢 Character counter (500 max)
- 🗑️ Clear chat button
- 💬 Toast notifications
- 🎨 Beautiful gradients

---

## 🌐 Live Demo

**Frontend**: [Coming Soon - Deploy to Vercel]  
**Backend API**: [Coming Soon - Deploy to Render]

**Note**: Follow the `DEPLOYMENT_GUIDE.md` for complete deployment steps.

---

## 📱 Responsive Design

This application is **fully responsive** and works on all devices:

- ✅ **Mobile Phones** (375px - 480px)
- ✅ **Tablets** (768px - 1024px)  
- ✅ **Laptops** (1024px - 1440px)
- ✅ **Desktops** (1440px+)

**Tested on**:
- iPhone SE, 12, 13 Pro
- iPad Air, Pro
- Various Android devices
- Chrome, Firefox, Safari, Edge

---

## 🚀 Deployment

### ⚠️ Deploy in This Order:
1. **Backend First** → Render
2. **Frontend Second** → Vercel

### Quick Deploy Guide

#### Deploy to Render (Backend)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd FrontEnd
vercel

# Set environment variable
vercel env add VITE_API_URL
```

### Deploy to Render (Backend)

1. Push code to GitHub
2. Connect repository to Render
3. Set environment variables
4. Deploy

### Environment Variables

**Backend (Render)**:
- `NODE_ENV=production`
- `JWT_SECRET`
- `GEMINI_API_KEY`
- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASS`
- `DB_DATABASE`
- `SSL_CA`
- `CORS_ORIGINS`

**Frontend (Vercel)**:
- `VITE_API_URL=https://your-backend.onrender.com`

---

## 📁 Project Structure

```
Evangadi_Forum/
├── Backend/
│   ├── controller/          # Route controllers
│   ├── middleware/          # Auth middleware
│   ├── routes/              # API routes
│   ├── utility/             # Helper functions
│   ├── server.js            # Main server file
│   └── package.json
├── FrontEnd/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── context/         # Context providers
│   │   ├── pages/           # Page components
│   │   ├── utility/         # Axios config
│   │   └── App.jsx          # Main app
│   └── package.json
└── README.md
```

---

## 🔐 Security Features

- ✅ JWT authentication
- ✅ Password hashing with bcrypt
- ✅ SQL injection prevention
- ✅ XSS protection
- ✅ CORS configured
- ✅ Environment variables
- ✅ HTTPS (in production)

---

## 🎨 UI/UX Features

- ✅ Dark/Light mode toggle
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Smooth animations
- ✅ Toast notifications
- ✅ Loading states
- ✅ Error handling
- ✅ Beautiful gradients
- ✅ Accessibility features

---

## 🧪 Testing

### Backend Testing
```bash
cd Backend
npm test
```

### Frontend Testing
```bash
cd FrontEnd
npm test
```

---

## 📝 API Endpoints

### Authentication
- `POST /api/v1/register` - Register user
- `POST /api/v1/login` - Login user
- `GET /api/v1/check` - Check authentication

### Questions
- `GET /api/v1/questions` - Get all questions
- `GET /api/v1/questions/:id` - Get single question
- `POST /api/v1/questions` - Create question
- `PUT /api/v1/questions/:id/view` - Increment view count

### Answers
- `GET /api/v1/answers/:questionId` - Get answers
- `POST /api/v1/answers` - Create answer

### Notifications
- `GET /api/v1/notifications` - Get user notifications
- `PUT /api/v1/notifications/:id/read` - Mark as read
- `PUT /api/v1/notifications/read-all` - Mark all as read
- `DELETE /api/v1/notifications/:id` - Delete notification

### Chatbot
- `POST /api/v1/chatbot` - Send message to chatbot

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

**Temesgen Abdissa**

- GitHub: [@TemesgenAbdissa](https://github.com/TemesgenAbdissa)
- Project: Evangadi Forum Q&A Platform

---

## 🙏 Acknowledgments

- React documentation
- Express documentation
- MySQL documentation
- Google Gemini AI
- Vercel & Render for hosting
- Aiven for database hosting

---

## 📞 Support

For support, email support@evangadi.com or open an issue in the repository.

---

## 🎯 Roadmap

- [ ] Email notifications
- [ ] User profiles
- [ ] Question categories
- [ ] Voting system
- [ ] Best answer selection
- [ ] User reputation system
- [ ] Advanced search filters
- [ ] Image upload support

---

## 🔄 Version

**Current Version**: 1.0.0

---

**⭐ If you like this project, please give it a star on GitHub!**

---

*Built with ❤️ by Evangadi Team*
