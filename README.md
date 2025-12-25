# 🕊️ Chofetz Chaim Shmiras HaLashon App

A compassionate AI-powered chatbot that provides guidance on Shmiras HaLashon (guarding one's speech) based on the teachings of the Chofetz Chaim.

**In honor of my brother Yosef Yisroel Meyer, who was named after the Chofetz Chaim and exemplifies loving kindness, pure speech, and giving others the benefit of the doubt.**

## ✨ Features

- **User Authentication**: Secure signup/login with Firebase Authentication
- **Interactive Chat**: Ask questions about speech ethics and receive thoughtful, Torah-based guidance
- **Persistent Storage**: All conversations saved to Firebase Firestore
- **Daily Encouragement**: Get inspiring daily messages about the practice of Shmiras HaLashon
- **Personal Dashboard**: 
  - Track your daily streak
  - View conversation history
  - Monitor your progress
- **AI-Powered Responses**: Uses OpenAI's GPT-3.5-Turbo to provide authentic, compassionate Torah guidance
- **RESTful API**: Clean, well-documented endpoints for easy integration

## 🚀 Quick Start

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))

### Installation

1. **Clone or navigate to the repository:**
   ```bash
   cd "Chofetz chaim shmiras halashon app"
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Then edit `.env` and add your OpenAI API key:
   ```
   OPENAI_API_KEY=sk-your-actual-api-key-here
   PORT=3000
   ```

4. **Set up Firebase:**
   
   Follow the detailed instructions in `FIREBASE_SETUP.md` to:
   - Create a Firebase project
   - Enable Authentication (Email/Password)
   - Set up Firestore Database
   - Get your Firebase configuration
   
   Then edit `public/firebase-config.js` and replace the placeholder config with your actual Firebase credentials.

5. **Start the development server:**
   ```bash
   npm run dev
   ```

   The server will start at `http://localhost:3000`

## 📚 API Endpoints

### 1. Chat with Chofetz Chaim Bot

Ask questions about speech ethics and receive guidance.

**Endpoint:** `POST /api/chofetz-chaim/chat`

**Request Body:**
```json
{
  "message": "How can I avoid speaking lashon hara at work?"
}
```

**Response:**
```json
{
  "response": "My dear friend, the workplace can indeed be challenging...",
  "timestamp": "2025-11-26T10:30:00.000Z",
  "type": "chofetz-chaim-guidance"
}
```

**Example using curl:**
```bash
curl -X POST http://localhost:3000/api/chofetz-chaim/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is lashon hara?"}'
```

### 2. Get Daily Encouragement

Receive an inspiring daily message about Shmiras HaLashon.

**Endpoint:** `GET /api/chofetz-chaim/daily-encouragement`

**Response:**
```json
{
  "encouragement": "Today, consider the power of silence...",
  "timestamp": "2025-11-26T10:30:00.000Z",
  "type": "daily-shmiras-halashon-encouragement"
}
```

**Example using curl:**
```bash
curl http://localhost:3000/api/chofetz-chaim/daily-encouragement
```

### 3. Health Check

Check if the server is running properly.

**Endpoint:** `GET /health`

**Response:**
```json
{
  "status": "healthy",
  "service": "Chofetz Chaim Shmiras HaLashon App",
  "dedication": "In memory of Chaya Sara Leah Bas Uri zt\"l",
  "timestamp": "2025-11-26T10:30:00.000Z"
}
```

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start development server with auto-reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Run the production build

### Project Structure

```
├── src/
│   ├── server.ts                 # Main Express server
│   ├── routes/
│   │   └── chofetzChaim.ts      # API route handlers
│   └── services/
│       └── chofetzChaimBot.ts   # OpenAI integration & bot logic
├── dist/                         # Compiled JavaScript (generated)
├── package.json                  # Dependencies and scripts
├── tsconfig.json                # TypeScript configuration
├── .env.example                 # Environment variables template
└── README.md                    # This file
```

## 🔑 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | Your OpenAI API key |
| `PORT` | No | Server port (default: 3000) |

## 🧪 Testing the API

### Using curl:

```bash
# Chat endpoint
curl -X POST http://localhost:3000/api/chofetz-chaim/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is the definition of rechilus?"}'

# Daily encouragement
curl http://localhost:3000/api/chofetz-chaim/daily-encouragement

# Health check
curl http://localhost:3000/health
```

### Using a REST client (like Postman or Insomnia):

1. Create a POST request to `http://localhost:3000/api/chofetz-chaim/chat`
2. Set header: `Content-Type: application/json`
3. Add body: `{"message": "Your question here"}`

## 📖 About the Chofetz Chaim

Rabbi Yisrael Meir Kagan (1839-1933), known as the Chofetz Chaim, authored the definitive work on the laws of proper speech in Jewish law. His teachings emphasize the spiritual power of words and the importance of guarding one's tongue from harmful speech.

## 🤝 Contributing

This project is dedicated to spreading awareness of Shmiras HaLashon. Contributions that enhance the app's educational value are welcome.

## 📝 License

MIT License - Feel free to use this project for educational purposes.

## 💝 Dedication

This application is lovingly dedicated in honor of **my brother Yosef Yisroel Meyer**, who was named after the Chofetz Chaim (Rabbi Yisrael Meir Kagan). Yosef Yisroel Meyer has been a pure example of loving kindness, pure speech, and giving others the benefit of the doubt - living embodiment of the very values this app seeks to teach. May this tool help others learn from his example and bring more kindness and mindfulness into their speech.

---

**Note:** This app provides educational guidance based on AI interpretation of Torah teachings. For specific halachic questions, please consult a qualified rabbi.
