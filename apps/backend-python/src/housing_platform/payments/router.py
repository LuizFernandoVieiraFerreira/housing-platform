from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from housing_platform.auth.dependencies import get_current_user
from housing_platform.auth.models import AuthUser
from housing_platform.db.session import get_db
from housing_platform.payments.schemas import (
    ConfirmPaymentRequest,
    ConfirmPaymentResult,
    CreatePaymentOrderRequest,
    CreatePaymentOrderResult,
    TossWebhookPayload,
    WebhookAck,
)
from housing_platform.payments.service import PaymentService

router = APIRouter(prefix="/payments", tags=["Payments"])


def get_payment_service(db: Session = Depends(get_db)) -> PaymentService:
    return PaymentService(db)


@router.post(
    "/orders",
    response_model=CreatePaymentOrderResult,
    status_code=status.HTTP_201_CREATED,
)
def create_payment_order(
    request: CreatePaymentOrderRequest,
    user: Annotated[AuthUser, Depends(get_current_user)],
    service: PaymentService = Depends(get_payment_service),
) -> CreatePaymentOrderResult:
    return service.create_payment_order(user, request)


@router.post("/confirm", response_model=ConfirmPaymentResult)
def confirm_payment(
    request: ConfirmPaymentRequest,
    user: Annotated[AuthUser, Depends(get_current_user)],
    service: PaymentService = Depends(get_payment_service),
) -> ConfirmPaymentResult:
    return service.confirm_payment(user, request)


@router.post("/webhook", response_model=WebhookAck)
def receive_payment_webhook(
    payload: TossWebhookPayload,
    service: PaymentService = Depends(get_payment_service),
) -> WebhookAck:
    return service.receive_webhook(payload)
