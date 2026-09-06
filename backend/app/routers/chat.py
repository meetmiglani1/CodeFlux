from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.chatbot import chat_with_compliance

router = APIRouter(tags=["chat"])


class ChatRequest(BaseModel):
    question: str
    scan_id: int


@router.post("/chat")
def compliance_chat(request: ChatRequest):
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    try:
        result = chat_with_compliance(request.question, request.scan_id)
        return {
            "success": True,
            "scan_id": result.get("scan_id"),
            "product_name": result.get("product_name"),
            "category": result.get("category"),
            "compliance_score": result.get("compliance_score"),
            "risk_level": result.get("risk_level"),
            "overall_status": result.get("overall_status"),
            "answer": result.get("answer"),
        }
    except ValueError as error:
        raise HTTPException(status_code=404, detail=str(error))
    except RuntimeError as error:
        raise HTTPException(status_code=500, detail=str(error))
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Chatbot error: {error}")
