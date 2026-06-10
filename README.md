# 🚀 MoneyNowWealth - Central Management Dashboard

A comprehensive wealth management platform featuring a multi-layered architecture and a premium AI assistant.

---

## 🏗️ Project Architecture

The project is split into three main modules:

1.  **`moneynow-frontend/`**: The main user interface built with **Next.js**, Tailwind CSS, and Framer Motion.
2.  **`api/`**: The secure gateway and business logic layer built with **Express.js** and Node.js.
3.  **`fastapi-chatbot/`**: A high-performance AI microservice built with **FastAPI** (Python), handling all Nova AI logic.

---

## 🤖 Nova AI Chatbot

Nova is a premium AI assistant integrated into the platform. 
- **Phase 1 (Completed):** Infrastructure setup, Express proxying, and a glassmorphic frontend widget.
- **Phase 2 (In Progress):** RAG (Retrieval-Augmented Generation) using MongoDB Atlas Vector Search / Qdrant.

### AI Tech Stack:
- **FastAPI** (Python)
- **GPT-4o mini** (OpenAI)
- **LangChain**
- **MongoDB Atlas Vector Search**

---

## 🛠️ Getting Started

### 1. Prerequisites
- Node.js (v18+)
- Python (3.10+)
- MongoDB Atlas account (for Vector Search)

### 2. Setup FastAPI AI Service
```bash
cd fastapi-chatbot
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
# Configure .env with OPENAI_API_KEY
uvicorn app.main:app --reload
```

### 3. Setup Express API
```bash
cd api
npm install
# Configure .env
npm run dev
```

### 4. Setup Frontend
```bash
cd moneynow-frontend
npm install
npm run dev
```

---

## 📊 Deployment
The application is designed to be containerized using Docker and deployed on a VM (e.g., Hostinger) or cloud providers like AWS/GCP.
