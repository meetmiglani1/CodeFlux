from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from app.routers import auth
import os
import shutil
import uuid

from app.config import settings
from app.models.schemas import ExtractedFields
from app.services.extraction import extract_product
from app.services.compliance import run_database_compliance
from app.services.chatbot import chat_with_compliance

app = FastAPI(
    title=settings.app_name,
    description="OCR + PostgreSQL + AI based product label compliance checker",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth.router)
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@app.get("/")
def root():
    return {"message": settings.app_name, "status": "running"}


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.post("/check-compliance")
async def check_compliance(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file selected.")

    allowed_extensions = {".jpg", ".jpeg", ".png", ".webp"}
    extension = os.path.splitext(file.filename)[1].lower()
    if extension not in allowed_extensions:
        raise HTTPException(status_code=400, detail="Unsupported file type. Use JPG, JPEG, PNG or WEBP.")

    unique_filename = f"{uuid.uuid4()}{extension}"
    image_path = os.path.join(UPLOAD_DIR, unique_filename)

    try:
        with open(image_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Could not save image: {error}")

    try:
        product_data, ocr_data = extract_product(image_path)
        fields = ExtractedFields(**product_data)
    except Exception as error:
        if os.path.exists(image_path):
            os.remove(image_path)
        raise HTTPException(status_code=500, detail=f"OCR / extraction failed: {error}")

    try:
        compliance_result = run_database_compliance(fields.model_dump(), ocr_data, image_path)
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Compliance checking failed: {error}")

    if compliance_result is None:
        raise HTTPException(status_code=500, detail="Compliance process returned no result.")

    failed_rules = [
        {
            "rule_id": rule.get("rule_id"),
            "rule_code": rule.get("rule_code"),
            "status": rule.get("status"),
            "extracted_value": rule.get("extracted_value"),
            "expected_value": rule.get("expected_value"),
            "remarks": rule.get("remarks"),
        }
        for rule in compliance_result.get("rule_results", [])
        if rule.get("status") == "FAIL"
    ]

    return {
        "success": True,
        "filename": file.filename,
        "product": {
            "product_id": compliance_result.get("product_id"),
            "product_name": compliance_result.get("product_name"),
            "category": compliance_result.get("category"),
        },
        "compliance": {
            "overall_status": compliance_result.get("overall_status"),
            "compliance_score": compliance_result.get("compliance_score"),
            "risk_level": compliance_result.get("risk_level"),
            "total_rules": compliance_result.get("total_rules"),
            "passed_rules": compliance_result.get("passed_rules"),
            "failed_rules": compliance_result.get("failed_rules"),
            "failed_rules_details": failed_rules,
            "rule_results": compliance_result.get("rule_results", []),
        },
        "scan": {
            "scan_id": compliance_result.get("scan_id"),
            "result_id": compliance_result.get("result_id"),
        },
    }


class ChatRequest(BaseModel):
    question: str
    scan_id: int


@app.post("/chat")
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
