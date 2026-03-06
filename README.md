# 📘 AI Notebook LLM

> **A professional Full-Stack RAG (Retrieval-Augmented Generation) application.** > Upload PDFs and chat with them using the power of Google Gemini and Pinecone.

---

## 🚀 Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | Next.js 14, Tailwind CSS, Lucide Icons |
| **Backend** | FastAPI (Python 3.11), LangChain |
| **Vector Database** | Pinecone |
| **AI Model** | Google Gemini (Pro & Embeddings) |
| **Hosting** | Vercel & Hugging Face Spaces |

---

## 🛠️ System Architecture



1. **PDF Ingestion**: Documents are uploaded via the Next.js frontend to the FastAPI backend.
2. **Processing**: Text is extracted using `PyPDF` and split into chunks using LangChain.
3. **Vectorization**: Chunks are converted into high-dimensional vectors via Google Gemini Embeddings.
4. **Storage**: Vectors are stored in a **Pinecone** cloud index for persistent retrieval.
5. **RAG Query**: When a user asks a question, the system retrieves relevant context from Pinecone and generates an answer using Gemini.

---

## ⚙️ Environment Variables

To run this project, you need to configure the following environment variables:

### Backend (`/backend/.env`)
```env
GOOGLE_API_KEY=your_gemini_api_key
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX_NAME=notebook-index
