from datetime import datetime
from io import BytesIO

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)
from sqlmodel import Session, select

from app.models.db_models import (
    Category,
    ComplianceResult,
    ComplianceRuleResult,
    Product,
    Rule,
    Scan,
)


def generate_compliance_report_pdf(scan_id: int, db: Session) -> BytesIO:
    scan = db.get(Scan, scan_id)
    if scan is None:
        raise ValueError(f"Scan {scan_id} not found.")

    product = db.get(Product, scan.product_id)
    category = db.get(Category, product.category_id) if product else None

    compliance_result = db.exec(
        select(ComplianceResult)
        .where(ComplianceResult.scan_id == scan_id)
        .order_by(ComplianceResult.checked_at.desc())
    ).first()
    if compliance_result is None:
        raise ValueError(f"No compliance result found for scan {scan_id}.")

    rule_results = db.exec(
        select(ComplianceRuleResult, Rule)
        .join(Rule, ComplianceRuleResult.rule_id == Rule.rule_id)
        .where(ComplianceRuleResult.result_id == compliance_result.result_id)
    ).all()

    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    styles = getSampleStyleSheet()
    elements = []

    elements.append(Paragraph("Legal Metrology Compliance Report", styles["Title"]))
    elements.append(Spacer(1, 12))
    elements.append(Paragraph(f"Product: {product.product_name if product else 'Unknown'}", styles["Normal"]))
    elements.append(Paragraph(f"Category: {category.category_name if category else 'Unknown'}", styles["Normal"]))
    elements.append(Paragraph(f"Scanned At: {scan.scanned_at}", styles["Normal"]))
    elements.append(Paragraph(f"Overall Status: {compliance_result.overall_status}", styles["Normal"]))
    elements.append(Paragraph(
        f"Score: {compliance_result.passed_rules}/{compliance_result.total_rules} rules passed",
        styles["Normal"],
    ))
    elements.append(Spacer(1, 20))

    table_data = [["Rule", "Status", "Extracted Value", "Expected", "Remarks"]]
    for rule_result, rule in rule_results:
        table_data.append([
            rule.rule_title,
            rule_result.status,
            rule_result.extracted_value or "-",
            rule_result.expected_value or "-",
            rule_result.remarks or "-",
        ])

    table = Table(table_data, repeatRows=1)
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e293b")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    elements.append(table)

    elements.append(Spacer(1, 20))
    elements.append(Paragraph(
        f"Generated on {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}",
        styles["Italic"],
    ))

    doc.build(elements)
    buffer.seek(0)
    return buffer
