import os
import shutil
import uuid
import logging
from typing import List, Optional, Any
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, PrivateAttr
from dotenv import load_dotenv

import chromadb
from llama_index.core import VectorStoreIndex, SimpleDirectoryReader, StorageContext, Document
from llama_index.core.node_parser import SimpleNodeParser
from llama_index.vector_stores.chroma import ChromaVectorStore
from llama_index.core import Settings

from llama_index.core.llms import CustomLLM, CompletionResponse, LLMMetadata
from llama_index.core.llms.callbacks import llm_completion_callback
from llama_index.core.embeddings import BaseEmbedding
from google import genai

load_dotenv()

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Check for API Key
api_key = os.environ.get("GOOGLE_API_KEY", "").strip().strip('"').strip("'")
if not api_key:
    print("WARNING: GOOGLE_API_KEY environment variable not set or empty. API calls will fail.")

# Custom Google GenAI LLM
class GoogleGenAILLM(CustomLLM):
    model_name: str = "models/gemini-2.5-flash"
    _client: Any = PrivateAttr()

    def __init__(self, api_key: str, model_name: str = "models/gemini-2.5-flash", **kwargs):
        super().__init__(model_name=model_name, **kwargs)
        self._client = genai.Client(api_key=api_key)

    @property
    def metadata(self) -> LLMMetadata:
        return LLMMetadata(model_name=self.model_name)

    @llm_completion_callback()
    def complete(self, prompt: str, **kwargs) -> CompletionResponse:
        try:
            response = self._client.models.generate_content(model=self.model_name, contents=prompt)
            return CompletionResponse(text=response.text)
        except Exception as e:
            print(f"LLM ERROR: {str(e)}")
            raise e
        
    @llm_completion_callback()
    def stream_complete(self, prompt: str, **kwargs):
        raise NotImplementedError()

# Custom Google GenAI Embedding
class GoogleGenAIEmbedding(BaseEmbedding):
    model_name: str = "models/gemini-embedding-001"
    _client: Any = PrivateAttr()

    def __init__(self, api_key: str, model_name: str = "models/gemini-embedding-001", **kwargs):
        super().__init__(model_name=model_name, **kwargs)
        self._client = genai.Client(api_key=api_key)

    def _get_query_embedding(self, query: str) -> List[float]:
        try:
            result = self._client.models.embed_content(model=self.model_name, contents=query)
            return result.embeddings[0].values
        except Exception as e:
            print(f"EMBEDDING ERROR: {str(e)}")
            raise e

    def _get_text_embedding(self, text: str) -> List[float]:
        try:
            result = self._client.models.embed_content(model=self.model_name, contents=text)
            return result.embeddings[0].values
        except Exception as e:
            print(f"EMBEDDING ERROR: {str(e)}")
            raise e

    def _get_text_embeddings(self, texts: List[str]) -> List[List[float]]:
        try:
            result = self._client.models.embed_content(model=self.model_name, contents=texts)
            return [e.values for e in result.embeddings]
        except Exception as e:
            print(f"EMBEDDING ERROR: {str(e)}")
            raise e
    
    async def _aget_query_embedding(self, query: str) -> List[float]:
        return self._get_query_embedding(query)

    async def _aget_text_embedding(self, text: str) -> List[float]:
        return self._get_text_embedding(text)

# FastAPI Setup
app = FastAPI(title="DocuMind API")

# CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# LlamaIndex Global Settings
embed_model = GoogleGenAIEmbedding(api_key=api_key)
llm = GoogleGenAILLM(api_key=api_key)
Settings.llm = llm
Settings.embed_model = embed_model
Settings.chunk_size = 1000
Settings.chunk_overlap = 100

# Initialize ChromaDB
DB_PATH = "./chroma_db"
db = chromadb.PersistentClient(path=DB_PATH)
chroma_collection = db.get_or_create_collection("notebook_sources")
vector_store = ChromaVectorStore(chroma_collection=chroma_collection)
storage_context = StorageContext.from_defaults(vector_store=vector_store)

# Create index variable to hold the index, load if collection is not empty
try:
    if chroma_collection.count() > 0:
        index = VectorStoreIndex.from_vector_store(vector_store, embed_model=embed_model)
    else:
        index = None
except Exception as e:
    print(f"Error initializing index: {e}")
    index = None

# Pydantic Models for requests/responses
class QueryRequest(BaseModel):
    query: str
    source_ids: Optional[List[str]] = None

class SummarizeRequest(BaseModel):
    source_ids: Optional[List[str]] = None

class SummarizeResponse(BaseModel):
    summary: str
    suggested_questions: List[str]

class ToolRequest(BaseModel):
    source_ids: Optional[List[str]] = None

class FAQResponse(BaseModel):
    faqs: List[dict]

class MindMapResponse(BaseModel):
    nodes: List[dict]
    edges: List[dict]

class PodcastResponse(BaseModel):
    script: str

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    global index
    print(f"DEBUG: Received upload request for file: {file.filename}")
    try:
        # Save temp file
        temp_dir = "./temp_uploads"
        os.makedirs(temp_dir, exist_ok=True)
        temp_file_path = os.path.join(temp_dir, file.filename)
        print(f"DEBUG: Saving temp file to {temp_file_path}")
        
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Parse Document
        source_id = str(uuid.uuid4())
        print(f"DEBUG: Parsing document with source_id: {source_id}")
        
        # Load data
        reader = SimpleDirectoryReader(input_files=[temp_file_path])
        documents = reader.load_data()
        print(f"DEBUG: Loaded {len(documents)} documents")
        
        # Inject metadata
        for doc in documents:
            doc.metadata["source_id"] = source_id
            doc.metadata["file_name"] = file.filename
        
        # Parse into nodes (chunks)
        print(f"DEBUG: Parsing into nodes...")
        parser = SimpleNodeParser.from_defaults(chunk_size=1000, chunk_overlap=100)
        nodes = parser.get_nodes_from_documents(documents)
        print(f"DEBUG: Generated {len(nodes)} nodes")
        
        # Add to index
        print(f"DEBUG: Adding to index...")
        if index is None:
             print("DEBUG: Creating new VectorStoreIndex")
             index = VectorStoreIndex(nodes, storage_context=storage_context)
        else:
             print("DEBUG: Inserting nodes into existing index")
             index.insert_nodes(nodes)
             
        # Cleanup
        print("DEBUG: Cleaning up temp file")
        os.remove(temp_file_path)
            
        print("DEBUG: Upload successful")
        return {
            "message": "Upload successful",
            "source_id": source_id,
            "filename": file.filename
        }
    except Exception as e:
        print(f"DEBUG ERROR: {str(e)}")
        logger.error(f"Error in upload_file: {str(e)}", exc_info=True)
        if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
            raise HTTPException(status_code=429, detail="Gemini API rate limit exceeded. Please wait a minute and try again.")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/query")
async def query_index(request: QueryRequest):
    if index is None:
        raise HTTPException(status_code=400, detail="No documents uploaded yet.")
        
    try:
        # Add metadata filters if source_ids are provided
        from llama_index.core.vector_stores import MetadataFilters, ExactMatchFilter
        filters = None
        if request.source_ids and len(request.source_ids) > 0:
            # We construct filters for the sources (ChromaDB supports filtering by metadata)
            # LlamaIndex currently has limitations with OR filters on some stores, but we'll try a basic approach
            # If multiple source_ids, might need a more complex filter or just filter post-retrieval
            # For simplicity in this mock-up, we use the first source id if provided, or could use an "in" filter if supported
            # Here we just use a simple approach: if only 1 source ID, filter by it.
             if len(request.source_ids) == 1:
                filters = MetadataFilters(filters=[ExactMatchFilter(key="source_id", value=request.source_ids[0])])
            
        print(f"DEBUG: Creating query engine with filters: {filters}")
        # Use as_query_engine directly with top_k and filters if possible, 
        # or separate retriever correctly for this version of LlamaIndex
        query_engine = index.as_query_engine(response_mode="compact", similarity_top_k=3, filters=filters)
        
        response = query_engine.query(request.query)
        
        # Extract citations
        citations = []
        for i, node in enumerate(response.source_nodes):
            citations.append({
                "citation_num": i + 1,
                "text_snippet": node.node.text[:100] + "...",
                "source_id": node.node.metadata.get("source_id", "unknown"),
                "page_label": node.node.metadata.get("page_label", "1"),
                "file_name": node.node.metadata.get("file_name", "unknown")
            })
            
        return {
            "answer": str(response),
            "citations": citations
        }
    except Exception as e:
        print(f"QUERY ERROR: {str(e)}")
        logger.error(f"Error in query_index: {str(e)}", exc_info=True)
        if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
            return {
                "answer": "⚠️ Gemini API rate limit exceeded (15 requests/minute). Please wait a few seconds and try again.",
                "citations": []
            }
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/summarize", response_model=SummarizeResponse)
async def summarize(request: SummarizeRequest):
    if index is None:
        return {"summary": "No documents uploaded yet.", "suggested_questions": []}
        
    try:
        from llama_index.core.vector_stores import MetadataFilters, ExactMatchFilter
        filters = None
        if request.source_ids and len(request.source_ids) > 0:
             if len(request.source_ids) == 1:
                filters = MetadataFilters(filters=[ExactMatchFilter(key="source_id", value=request.source_ids[0])])
                
        # A simple query to generate a summary
        query_engine = index.as_query_engine(response_mode="compact", similarity_top_k=3, filters=filters)
        response = query_engine.query(
            "Provide a high-level summary of the main topics covered in all the documents. "
            "Then, suggest 3 questions that I could ask about the documents. Format the questions on separate lines starting with 'Q:'"
        )
        
        text = str(response)
        summary_part = text
        questions = []
        
        # Simple string splitting to separate summary and questions if generated correctly
        if "Q:" in text:
            parts = text.split("Q:")
            summary_part = parts[0].strip()
            for part in parts[1:]:
                q = part.strip().split("\n")[0].strip()
                if q:
                    questions.append(q)
        
        # Fallback questions
        if not questions:
            questions = [
                "What are the key points in the documents?",
                "What is the main conclusion?",
                "Can you elaborate on the details?"
            ]
            
        return {
            "summary": summary_part,
            "suggested_questions": questions[:3]
        }
    except Exception as e:
        print(f"SUMMARIZE ERROR: {str(e)}")
        logger.error(f"Error in summarize: {str(e)}", exc_info=True)
        if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
             return {
                "summary": "⚠️ Gemini API rate limit exceeded. Please wait a minute before requesting a new summary.",
                "suggested_questions": []
            }
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/faq", response_model=FAQResponse)
async def generate_faq(request: ToolRequest):
    if index is None:
        return {"faqs": []}
        
    try:
        from llama_index.core.vector_stores import MetadataFilters, ExactMatchFilter
        import json
        filters = None
        if request.source_ids and len(request.source_ids) > 0:
             if len(request.source_ids) == 1:
                filters = MetadataFilters(filters=[ExactMatchFilter(key="source_id", value=request.source_ids[0])])
                
        query_engine = index.as_query_engine(response_mode="compact", similarity_top_k=3, filters=filters)
        response = query_engine.query(
            "Based on the provided documents, generate a list of 5 Frequently Asked Questions (FAQs) and their answers. "
            "Return the result ONLY as a valid JSON array of objects, where each object has a 'q' key for the question and an 'a' key for the answer. "
            "Example: [{\"q\": \"What is X?\", \"a\": \"X is Y.\"}]"
        )
        
        text = str(response).strip()
        # Clean up potential markdown formatting around JSON
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
            
        faqs = json.loads(text.strip())
        return {"faqs": faqs}
    except Exception as e:
        print(f"FAQ ERROR: {str(e)}")
        logger.error(f"Error in faq: {str(e)}", exc_info=True)
        if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
            return {"faqs": [{"q": "Error", "a": "Gemini API rate limit exceeded. Please wait a moment and try again."}]}
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/mindmap", response_model=MindMapResponse)
async def generate_mindmap(request: ToolRequest):
    if index is None:
        return {"nodes": [], "edges": []}
        
    try:
        from llama_index.core.vector_stores import MetadataFilters, ExactMatchFilter
        import json
        filters = None
        if request.source_ids and len(request.source_ids) > 0:
             if len(request.source_ids) == 1:
                filters = MetadataFilters(filters=[ExactMatchFilter(key="source_id", value=request.source_ids[0])])
                
        query_engine = index.as_query_engine(response_mode="compact", similarity_top_k=4, filters=filters)
        response = query_engine.query(
            "Analyze the provided documents and extract a maximum of 8 key concepts and the relationships between them to form a mind map. "
            "Return the result ONLY as a valid JSON object with two keys: 'nodes' and 'edges'. "
            "'nodes' should be an array of objects with 'id' (string) and 'label' (string). "
            "'edges' should be an array of objects with 'source' (string id), 'target' (string id), and 'label' (string relationship). "
            "Example: {\"nodes\": [{\"id\": \"1\", \"label\": \"Concept A\"}], \"edges\": [{\"source\": \"1\", \"target\": \"2\", \"label\": \"leads to\"}]}"
        )
        
        text = str(response).strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
            
        data = json.loads(text.strip())
        return {"nodes": data.get("nodes", []), "edges": data.get("edges", [])}
    except Exception as e:
        print(f"MINDMAP ERROR: {str(e)}")
        logger.error(f"Error in mindmap: {str(e)}", exc_info=True)
        if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
             return {"nodes": [], "edges": []}
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/podcast", response_model=PodcastResponse)
async def generate_podcast(request: ToolRequest):
    if index is None:
        return {"script": "No documents uploaded yet."}
        
    try:
        from llama_index.core.vector_stores import MetadataFilters, ExactMatchFilter
        filters = None
        if request.source_ids and len(request.source_ids) > 0:
             if len(request.source_ids) == 1:
                filters = MetadataFilters(filters=[ExactMatchFilter(key="source_id", value=request.source_ids[0])])
                
        query_engine = index.as_query_engine(response_mode="compact", similarity_top_k=5, filters=filters)
        response = query_engine.query(
            "Based on the documents, generate a short, engaging 2-person podcast script discussing the main topics. "
            "The hosts are 'Host 1' and 'Host 2'. They should introduce the topic, discuss the key findings, and wrap up. "
            "Format the script clearly with 'Host 1:' and 'Host 2:' prefixes before their dialogue."
        )
        
        return {"script": str(response).strip()}
    except Exception as e:
        print(f"PODCAST ERROR: {str(e)}")
        logger.error(f"Error in podcast: {str(e)}", exc_info=True)
        if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
            return {"script": "⚠️ Gemini API rate limit exceeded. Please wait a minute and try again."}
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
