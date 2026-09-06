from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlmodel import Session

from app.deps import get_db
from app.services.report_generator import generate_compliance_report_pdf

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/{scan_id}")
def get_report(scan_id: int, db: Session = Depends(get_db)):
    try:
        pdf_buffer = generate_compliance_report_pdf(scan_id, db)
    except ValueError as error:
        raise HTTPException(status_code=404, detail=str(error))

    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=compliance_report_{scan_id}.pdf"},
    )
