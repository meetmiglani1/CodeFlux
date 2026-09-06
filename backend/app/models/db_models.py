from datetime import datetime, timezone
from typing import Optional
from uuid import UUID, uuid4

from sqlalchemy import JSON, Column
from sqlmodel import Field, SQLModel


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    email: str = Field(unique=True, index=True)
    hashed_password: str
    role: str = Field(default="seller")  # "seller" | "inspector" | "admin"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Category(SQLModel, table=True):
    __tablename__ = "categories"

    category_id: Optional[int] = Field(default=None, primary_key=True)
    category_name: str
    description: Optional[str] = None


class Rule(SQLModel, table=True):
    __tablename__ = "rules"

    rule_id: Optional[int] = Field(default=None, primary_key=True)
    rule_code: str
    rule_reference: Optional[str] = None
    rule_title: str
    description: Optional[str] = None
    applicability: Optional[str] = None
    rule_config: Optional[dict] = Field(default=None, sa_column=Column(JSON))
    active: bool = Field(default=True)


class CategoryRule(SQLModel, table=True):
    __tablename__ = "category_rules"

    category_rule_id: Optional[int] = Field(default=None, primary_key=True)
    category_id: int = Field(foreign_key="categories.category_id")
    rule_id: int = Field(foreign_key="rules.rule_id")


class Product(SQLModel, table=True):
    __tablename__ = "products"

    product_id: Optional[int] = Field(default=None, primary_key=True)
    category_id: int = Field(foreign_key="categories.category_id")
    product_name: str
    manufacturer_name: Optional[str] = None
    brand_name: Optional[str] = None
    created_at: Optional[datetime] = Field(default_factory=lambda: datetime.now(timezone.utc))


class Scan(SQLModel, table=True):
    __tablename__ = "scans"

    scan_id: Optional[int] = Field(default=None, primary_key=True)
    product_id: int = Field(foreign_key="products.product_id")
    image_path: Optional[str] = None
    scanned_at: Optional[datetime] = Field(default_factory=lambda: datetime.now(timezone.utc))
    ocr_text: Optional[str] = None


class ComplianceResult(SQLModel, table=True):
    __tablename__ = "compliance_results"

    result_id: Optional[int] = Field(default=None, primary_key=True)
    scan_id: int = Field(foreign_key="scans.scan_id")
    overall_status: str
    total_rules: int = Field(default=0)
    passed_rules: int = Field(default=0)
    failed_rules: int = Field(default=0)
    checked_at: Optional[datetime] = Field(default_factory=lambda: datetime.now(timezone.utc))


class ComplianceRuleResult(SQLModel, table=True):
    __tablename__ = "compliance_rule_results"

    rule_result_id: Optional[int] = Field(default=None, primary_key=True)
    result_id: int = Field(foreign_key="compliance_results.result_id")
    rule_id: int = Field(foreign_key="rules.rule_id")
    status: str
    extracted_value: Optional[str] = None
    expected_value: Optional[str] = None
    remarks: Optional[str] = None
