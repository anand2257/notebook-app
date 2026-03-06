📘 AI Notebook LLM
A full-stack RAG (Retrieval-Augmented Generation) application that allows users to upload PDFs and have natural language conversations with their documents.

🚀 Tech Stack
Frontend: Next.js 14, Tailwind CSS, Lucide Icons

Backend: FastAPI (Python 3.11), LangChain

Database: Pinecone (Vector Store)

AI Model: Google Gemini (Embeddings & LLM)

Hosting: Vercel (Frontend) & Hugging Face Spaces (Backend)

🛠️ System Architecture
PDF Ingestion: Documents are uploaded via the Next.js frontend to the FastAPI backend.

Processing: Text is extracted using PyPDF and split into chunks using LangChain.

Vectorization: Chunks are converted into high-dimensional vectors via Google Gemini Embeddings.

Storage: Vectors are stored in a Pinecone cloud index for persistent retrieval.

RAG Query: When a user asks a question, the system retrieves relevant context from Pinecone and generates an answer using Gemini.

⚙️ Environment Variables
To run this project locally, you will need to create a .env file in the backend/ folder and a .env.local in the src/ folder.

Backend (/backend/.env)
Plaintext
GOOGLE_API_KEY=your_gemini_api_key
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX_NAME=notebook-index
Frontend (/.env.local)
Plaintext
NEXT_PUBLIC_API_URL=http://localhost:7860  # Or your Hugging Face URL
📦 Installation & Setup
1. Backend Setup
Bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 7860
2. Frontend Setup
Bash
npm install
npm run dev
🚢 Deployment
Backend: Deployed as a Docker container on Hugging Face Spaces.

Frontend: Deployed on Vercel with the NEXT_PUBLIC_API_URL pointing to the Hugging Face Direct URL.

🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the issues page.
