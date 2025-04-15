# Mock Job Interview Application

A web application that simulates job interviews using AI to help candidates practice their interviewing skills. The AI interviewer asks relevant questions based on the job title and provides personalized feedback.

## Features

- Dynamic interview sessions based on specific job titles
- Conversational AI interviewer that adapts questions based on your responses
- Structured interview process with feedback at the end
- Real-time chat interface with message history
- Responsive design for both desktop and mobile use

## Technologies

Frontend

- React 19
- Vite 6
- Axios for API requests
- CSS for styling

Backend

- Express.js
- Google Generative AI (Gemini 2.5 Pro)
- Environment-based configuration

## Setup

Prerequisites

- Node.js (latest LTS version recommended)
- Google Generative AI API key

Backend Setup

1. Navigate to the backend directory: cd mock_interview_backend

```bash
cd mock_interview_backend
```

2. Install dependencies: npm install

```bash
npm install
```

3. Create a .env file using the template in .env.sample
4. Add your Gemini API key to the .env file
5. Start the server: npm run dev

```bash
npm run dev
```

Frontend Setup

1. Navigate to the frontend directory: cd mock_interview_frontend

```bash
cd mock_interview_frontend
```

2. Install dependencies: npm install

```bash
npm install
```

3. Create a .env file using the template in .env.sample
4. Set VITE_BACKEND_URL to your backend server address (default: http://localhost:3001)
5. Start the development server: npm run dev

```bash
npm run dev
```

## How to Use

1. Enter a job title you want to practice interviewing for
2. The AI will begin the interview by asking you to introduce yourself
3. Answer the questions in the text area and click "Send Answer"
4. Continue the interview through multiple questions
5. Receive personalized feedback at the end of the session
6. Start a new interview session if desired

## Project Structure

The application consists of two main components:

- Backend: Handles API requests and AI integration
- Frontend: Provides the user interface for the interview experience
