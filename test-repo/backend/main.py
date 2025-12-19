from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import os
from dotenv import load_dotenv

from conversational_ai import ConversationalAI
from models import ChatRequest, ChatResponse

load_dotenv()

app = FastAPI(title="Zeta Analytics Conversational AI", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8082", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the conversational AI system
conversational_ai = ConversationalAI()

@app.on_event("startup")
async def startup_event():
    """Initialize the RAG system and vector database on startup"""
    await conversational_ai.initialize()

@app.post("/api/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """
    Main chat endpoint for conversational SQL query generation
    """
    try:
        response = await conversational_ai.process_message(
            message=request.message,
            session_id=request.session_id,
            user_id=request.user_id
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "conversational-ai"}

@app.get("/api/chat/sessions/{user_id}")
async def get_user_sessions(user_id: str):
    """Get all chat sessions for a user"""
    sessions = await conversational_ai.get_user_sessions(user_id)
    return {"sessions": sessions}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 