# 📘 AI Notebook LLM: Advanced Document Intelligence

> **Transform your static PDFs into interactive conversations.** > This project is a production-ready RAG (Retrieval-Augmented Generation) application built with a modern distributed architecture.

---

## 🌟 Key Features
* **Context-Aware Chat:** Uses Google Gemini to provide accurate answers based *only* on your uploaded data.
* **High-Speed Vector Search:** Powered by Pinecone for sub-second retrieval of relevant document sections.
* **Dockerized Backend:** Fully containerized FastAPI server for reliable cloud deployment.
* **Modern UI:** A clean, responsive dashboard built with Next.js 14 and Tailwind CSS.

---

## 🛠️ Tech Stack & Infrastructure

| Component | Technology | Role |
| :--- | :--- | :--- |
| **Frontend** | [Next.js 14](https://nextjs.org/) | Client-side UI & State Management |
| **API Backend** | [FastAPI](https://fastapi.tiangolo.com/) | Document Processing & LLM Orchestration |
| **Orchestration** | [LangChain](https://www.langchain.com/) | Managing the RAG Pipeline & Prompt Templates |
| **Embeddings** | [Google Gemini](https://ai.google.dev/) | Converting Text to Vector Math |
| **Vector DB** | [Pinecone](https://www.pinecone.io/) | Cloud Storage for High-Dimensional Data |
| **Deployment** | [Vercel](https://vercel.com/) | Frontend Hosting & Edge Functions |
| **Container** | [Hugging Face](https://huggingface.co/) | Hosting the Dockerized Python Environment |

---

## 🧬 System Architecture (RAG Flow)



### 1. The Ingestion Pipeline
When a PDF is uploaded, the following happens:
* **Extraction:** `PyPDF` extracts raw text from the document.
* **Chunking:** The text is split into overlapping segments (e.g., 1000 characters) to preserve context.
* **Embedding:** Each chunk is sent to the Gemini Embedding model, returning a 768-dimensional vector.
* **Upsert:** The vectors + original text metadata are stored in the **Pinecone Index**.

### 2. The Query Pipeline
When you ask a question:
* **Vector Search:** Your question is converted to a vector and compared against Pinecone to find the top 3 most relevant chunks.
* **Augmentation:** Those chunks are injected into a specialized "System Prompt."
* **Generation:** Gemini generates a final answer based strictly on the retrieved context.

---

## ⚙️ Local Configuration

To replicate this environment locally, set up your secrets:

### Backend Setup (`/backend/.env`)
```env
GOOGLE_API_KEY=your_gemini_api_key
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX_NAME=notebook-index
