"""
Stripe Payment Routes - ImovLocal
Integração com Stripe Checkout para pagamentos recorrentes
"""

from fastapi import APIRouter, HTTPException, Request, Depends
from pydantic import BaseModel
from typing import Optional, Dict
from datetime import datetime
from database import db
from auth import get_current_user_email
import os
import uuid
import logging
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/stripe", tags=["stripe"])

# Stripe API Key
STRIPE_API_KEY = os.environ.get("STRIPE_API_KEY")

# Importar biblioteca Stripe da emergentintegrations
try:
    from emergentintegrations.payments.stripe.checkout import (
        StripeCheckout, 
        CheckoutSessionRequest, 
        CheckoutSessionResponse,
        CheckoutStatusResponse
    )
    STRIPE_AVAILABLE = True
except ImportError:
    STRIPE_AVAILABLE = False
    logger.warning("emergentintegrations não disponível. Stripe desabilitado.")

# ==========================================
# PLANOS COM STRIPE PRICE IDs
# ==========================================

# Mapear planos existentes para Stripe Price IDs
# IMPORTANTE: Você deve criar esses Products/Prices no Dashboard da Stripe
# e preencher os IDs aqui
STRIPE_PLANS = {
    "particular_trimestral": {
        "id": "particular_trimestral",
        "nome": "Particular Trimestral",
        "stripe_price_id": "price_particular_trimestral",  # Substituir pelo ID real da Stripe
        "valor": 47.90,
        "periodo": "trimestral",
        "duracao_dias": 90,
        "user_type": "particular"
    },
    "corretor_trimestral": {
        "id": "corretor_trimestral",
        "nome": "Corretor Trimestral",
        "stripe_price_id": "price_corretor_trimestral",  # Substituir pelo ID real da Stripe
        "valor": 197.90,
        "periodo": "trimestral",
        "duracao_dias": 90,
        "user_type": "corretor"
    },
    "imobiliaria_anual": {
        "id": "imobiliaria_anual",
        "nome": "Imobiliária Anual",
        "stripe_price_id": "price_imobiliaria_anual",  # Substituir pelo ID real da Stripe
        "valor": 497.90,
        "periodo": "anual",
        "duracao_dias": 365,
        "user_type": "imobiliaria"
    }
}

# Status de pagamento Stripe
class StripePaymentStatus:
    PENDING = "pending"           # Sessão criada, aguardando pagamento
    PAID = "paid"                 # Pagamento confirmado (webhook)
    AWAITING_APPROVAL = "awaiting_approval"  # Pago, aguardando admin aprovar
    APPROVED = "approved"         # Admin aprovou
    REJECTED = "rejected"         # Admin rejeitou
    FAILED = "failed"             # Pagamento falhou
    EXPIRED = "expired"           # Sessão expirou


# ==========================================
# MODELOS
# ==========================================

class CreateCheckoutRequest(BaseModel):
    plan_id: str
    origin_url: str  # Frontend passa window.location.origin


class CheckoutResponse(BaseModel):
    checkout_url: str
    session_id: str
    payment_id: str


# ==========================================
# ROTAS
# ==========================================

@router.get("/status")
async def stripe_status():
    """Verifica se Stripe está configurado"""
    return {
        "configured": bool(STRIPE_API_KEY and STRIPE_AVAILABLE),
        "available": STRIPE_AVAILABLE
    }


@router.post("/checkout/session", response_model=CheckoutResponse)
async def create_checkout_session(
    request: CreateCheckoutRequest,
    http_request: Request,
    email: str = Depends(get_current_user_email)
):
    """
    Cria uma sessão de checkout Stripe para o plano selecionado.
    Retorna URL para redirecionar o usuário ao Stripe Checkout.
    """
    if not STRIPE_AVAILABLE or not STRIPE_API_KEY:
        raise HTTPException(status_code=503, detail="Stripe não está configurado")
    
    # Validar plano
    plan = STRIPE_PLANS.get(request.plan_id)
    if not plan:
        raise HTTPException(status_code=400, detail="Plano inválido")
    
    # Buscar usuário
    user = await db.users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    # Validar tipo de usuário vs plano
    if plan["user_type"] != user.get("user_type"):
        raise HTTPException(
            status_code=400, 
            detail=f"Este plano é apenas para usuários do tipo '{plan['user_type']}'"
        )
    
    # Gerar ID único do pagamento
    payment_id = str(uuid.uuid4())
    
    # URLs de retorno (dinâmicas baseadas no origin do frontend)
    success_url = f"{request.origin_url}/pagamento/sucesso?session_id={{CHECKOUT_SESSION_ID}}&payment_id={payment_id}"
    cancel_url = f"{request.origin_url}/pagamento/cancelado?payment_id={payment_id}"
    
    # Inicializar Stripe
    host_url = str(http_request.base_url)
    webhook_url = f"{host_url}api/stripe/webhook"
    
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    # Metadata para identificar o pagamento no webhook
    metadata = {
        "payment_id": payment_id,
        "user_id": user["id"],
        "user_email": email,
        "plan_id": request.plan_id,
        "plan_nome": plan["nome"]
    }
    
    try:
        # Criar sessão de checkout com valor fixo (do backend, não do frontend!)
        checkout_request = CheckoutSessionRequest(
            amount=float(plan["valor"]),
            currency="brl",
            success_url=success_url,
            cancel_url=cancel_url,
            metadata=metadata,
            payment_methods=["card"]  # Pode adicionar "pix" se habilitado na Stripe
        )
        
        session: CheckoutSessionResponse = await stripe_checkout.create_checkout_session(checkout_request)
        
        # Criar registro de pagamento no banco ANTES de redirecionar
        payment_record = {
            "id": payment_id,
            "user_id": user["id"],
            "user_email": email,
            "plan_id": request.plan_id,
            "plan_nome": plan["nome"],
            "valor": plan["valor"],
            "duracao_dias": plan["duracao_dias"],
            "stripe_session_id": session.session_id,
            "status": StripePaymentStatus.PENDING,
            "payment_method": "stripe",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        await db.payments.insert_one(payment_record)
        logger.info(f"Checkout session criada: {session.session_id} para usuário {email}")
        
        return CheckoutResponse(
            checkout_url=session.url,
            session_id=session.session_id,
            payment_id=payment_id
        )
        
    except Exception as e:
        logger.error(f"Erro ao criar checkout session: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao criar sessão de pagamento: {str(e)}")


@router.get("/checkout/status/{session_id}")
async def get_checkout_status(session_id: str):
    """
    Verifica o status de uma sessão de checkout.
    Frontend usa para polling após retorno do Stripe.
    """
    if not STRIPE_AVAILABLE or not STRIPE_API_KEY:
        raise HTTPException(status_code=503, detail="Stripe não está configurado")
    
    # Buscar pagamento pelo session_id
    payment = await db.payments.find_one({"stripe_session_id": session_id})
    if not payment:
        raise HTTPException(status_code=404, detail="Pagamento não encontrado")
    
    try:
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url="")
        status_response: CheckoutStatusResponse = await stripe_checkout.get_checkout_status(session_id)
        
        # Atualizar status no banco se mudou
        new_status = payment["status"]
        
        if status_response.payment_status == "paid" and payment["status"] == StripePaymentStatus.PENDING:
            new_status = StripePaymentStatus.AWAITING_APPROVAL
            
            await db.payments.update_one(
                {"stripe_session_id": session_id},
                {
                    "$set": {
                        "status": new_status,
                        "stripe_payment_status": status_response.payment_status,
                        "paid_at": datetime.utcnow(),
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            
            # Notificar admin
            await notify_admin_new_payment(payment)
            
            logger.info(f"Pagamento {payment['id']} confirmado, aguardando aprovação")
        
        return {
            "payment_id": payment["id"],
            "status": new_status,
            "stripe_status": status_response.status,
            "payment_status": status_response.payment_status,
            "plan_nome": payment.get("plan_nome"),
            "valor": payment.get("valor")
        }
        
    except Exception as e:
        logger.error(f"Erro ao verificar status: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao verificar status: {str(e)}")


@router.post("/webhook")
async def stripe_webhook(request: Request):
    """
    Webhook para receber eventos da Stripe.
    Eventos tratados:
    - checkout.session.completed (cartão)
    - checkout.session.async_payment_succeeded (PIX)
    - checkout.session.async_payment_failed (PIX falhou)
    """
    if not STRIPE_AVAILABLE or not STRIPE_API_KEY:
        raise HTTPException(status_code=503, detail="Stripe não configurado")
    
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")
    
    try:
        host_url = str(request.base_url)
        webhook_url = f"{host_url}api/stripe/webhook"
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
        
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        event_type = webhook_response.event_type
        session_id = webhook_response.session_id
        metadata = webhook_response.metadata
        
        logger.info(f"Webhook recebido: {event_type} - Session: {session_id}")
        
        # Buscar pagamento
        payment = await db.payments.find_one({"stripe_session_id": session_id})
        if not payment:
            logger.warning(f"Pagamento não encontrado para session: {session_id}")
            return {"status": "ignored", "reason": "payment not found"}
        
        # Evitar processamento duplicado
        if payment["status"] in [StripePaymentStatus.APPROVED, StripePaymentStatus.REJECTED]:
            logger.info(f"Pagamento {payment['id']} já processado, ignorando webhook")
            return {"status": "already_processed"}
        
        # Processar evento
        if event_type == "checkout.session.completed":
            # Pagamento por cartão completado
            if payment["status"] == StripePaymentStatus.PENDING:
                await db.payments.update_one(
                    {"id": payment["id"]},
                    {
                        "$set": {
                            "status": StripePaymentStatus.AWAITING_APPROVAL,
                            "stripe_payment_status": "paid",
                            "paid_at": datetime.utcnow(),
                            "updated_at": datetime.utcnow()
                        }
                    }
                )
                await notify_admin_new_payment(payment)
                logger.info(f"Pagamento {payment['id']} marcado como AGUARDANDO_APROVACAO")
        
        elif event_type == "checkout.session.async_payment_succeeded":
            # PIX confirmado
            if payment["status"] == StripePaymentStatus.PENDING:
                await db.payments.update_one(
                    {"id": payment["id"]},
                    {
                        "$set": {
                            "status": StripePaymentStatus.AWAITING_APPROVAL,
                            "stripe_payment_status": "paid",
                            "paid_at": datetime.utcnow(),
                            "updated_at": datetime.utcnow()
                        }
                    }
                )
                await notify_admin_new_payment(payment)
                logger.info(f"Pagamento PIX {payment['id']} confirmado")
        
        elif event_type == "checkout.session.async_payment_failed":
            # PIX falhou/expirou
            await db.payments.update_one(
                {"id": payment["id"]},
                {
                    "$set": {
                        "status": StripePaymentStatus.FAILED,
                        "stripe_payment_status": "failed",
                        "failed_at": datetime.utcnow(),
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            logger.info(f"Pagamento PIX {payment['id']} falhou")
        
        elif event_type == "checkout.session.expired":
            # Sessão expirou
            if payment["status"] == StripePaymentStatus.PENDING:
                await db.payments.update_one(
                    {"id": payment["id"]},
                    {
                        "$set": {
                            "status": StripePaymentStatus.EXPIRED,
                            "stripe_payment_status": "expired",
                            "updated_at": datetime.utcnow()
                        }
                    }
                )
                logger.info(f"Sessão {payment['id']} expirou")
        
        return {"status": "processed", "event": event_type}
        
    except Exception as e:
        logger.error(f"Erro no webhook: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Webhook error: {str(e)}")


# ==========================================
# FUNÇÕES AUXILIARES
# ==========================================

async def notify_admin_new_payment(payment: dict):
    """Cria notificação para admin sobre novo pagamento"""
    notification = {
        "id": str(uuid.uuid4()),
        "user_id": "admin",
        "type": "new_payment",
        "title": "💳 Novo Pagamento Recebido",
        "message": f"Pagamento de {payment.get('plan_nome')} (R$ {payment.get('valor'):.2f}) recebido via Stripe. Aguardando sua aprovação.",
        "data": {
            "payment_id": payment["id"],
            "user_email": payment.get("user_email"),
            "plan_nome": payment.get("plan_nome"),
            "valor": payment.get("valor")
        },
        "read": False,
        "created_at": datetime.utcnow()
    }
    await db.notifications.insert_one(notification)
    logger.info(f"Admin notificado sobre pagamento {payment['id']}")
