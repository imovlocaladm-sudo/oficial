"""
Routes for Pix Payment System - ImovLocal
"""
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from typing import List, Optional
from datetime import datetime, timedelta
import uuid
import os
import logging
import aiofiles

from models import (
    Payment, PaymentCreate, PaymentApproval, PaymentStatus,
    PlanInfo, NotificationType
)
from auth import get_current_user_email
from database import db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/payments", tags=["payments"])

# Collections
users_collection = db["users"]
payments_collection = db["payments"]
notifications_collection = db["notifications"]

# ==========================================
# CONFIGURAÇÃO PIX - ImovLocal
# ==========================================

PIX_CONFIG = {
    "key": "8c6a9ecc-e143-47cb-8962-23594d4197fa",
    "key_type": "Chave Aleatória",
    "beneficiary_name": "Rogério Alves Pereira Barcelos",
    "cnpj": "61.343.028/0001-16",
    "email": "imovlocaladm@gmail.com",
    "phone": "67982288883"
}

# ==========================================
# PLANOS DISPONÍVEIS
# ==========================================

PLANS = {
    "particular_trimestral": {
        "name": "Plano Particular Trimestral",
        "price": 47.90,
        "duration_days": 90,
        "user_type": "particular",
        "description": "Acesso completo por 3 meses para usuários particulares"
    },
    "corretor_trimestral": {
        "name": "Plano Corretor Trimestral", 
        "price": 197.90,
        "duration_days": 90,
        "user_type": "corretor",
        "description": "Acesso completo por 3 meses para corretores"
    },
    "imobiliaria_anual": {
        "name": "Plano Imobiliária Anual",
        "price": 497.90,
        "duration_days": 365,
        "user_type": "imobiliaria",
        "description": "Acesso completo por 1 ano para imobiliárias"
    }
}

# Upload directory for receipts
UPLOAD_DIR = "/app/backend/uploads/receipts"
os.makedirs(UPLOAD_DIR, exist_ok=True)


# ==========================================
# ROTAS PÚBLICAS - Informações de Planos
# ==========================================

@router.get("/plans")
async def get_plans():
    """Retorna todos os planos disponíveis"""
    plans_list = []
    for plan_id, plan_info in PLANS.items():
        plans_list.append({
            "id": plan_id,
            **plan_info
        })
    return plans_list


@router.get("/plans/{plan_type}")
async def get_plan(plan_type: str):
    """Retorna informações de um plano específico"""
    if plan_type not in PLANS:
        raise HTTPException(status_code=404, detail="Plano não encontrado")
    
    return {
        "id": plan_type,
        **PLANS[plan_type]
    }


@router.get("/pix-info")
async def get_pix_info():
    """Retorna informações do Pix para pagamento"""
    return {
        "key": PIX_CONFIG["key"],
        "key_type": PIX_CONFIG["key_type"],
        "beneficiary_name": PIX_CONFIG["beneficiary_name"]
    }


# ==========================================
# ROTAS DO USUÁRIO - Criar e Gerenciar Pagamentos
# ==========================================

@router.post("/create", response_model=Payment)
async def create_payment(
    payment_data: PaymentCreate,
    email: str = Depends(get_current_user_email)
):
    """Criar um novo pedido de pagamento"""
    # Verificar usuário
    user = await users_collection.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    # Verificar se o plano existe
    if payment_data.plan_type not in PLANS:
        raise HTTPException(status_code=400, detail="Plano inválido")
    
    plan = PLANS[payment_data.plan_type]
    
    # Verificar se o tipo de usuário corresponde ao plano
    # Usuário pode fazer upgrade, mas não pode comprar plano de tipo diferente
    user_type = user.get("user_type")
    plan_user_type = plan["user_type"]
    
    if user_type not in ["admin", "admin_senior"]:
        if user_type != plan_user_type:
            raise HTTPException(
                status_code=400, 
                detail=f"Este plano é exclusivo para {plan_user_type}. Seu tipo de conta é {user_type}."
            )
    
    # Verificar se já tem pagamento pendente
    existing_payment = await payments_collection.find_one({
        "user_id": user["id"],
        "status": {"$in": ["pending", "awaiting_approval"]}
    })
    
    if existing_payment:
        raise HTTPException(
            status_code=400, 
            detail="Você já possui um pagamento pendente. Aguarde a aprovação ou cancele o anterior."
        )
    
    # Criar pagamento
    now = datetime.utcnow()
    payment = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "user_email": user["email"],
        "user_name": user.get("name", ""),
        "user_type": user_type,
        "plan_type": payment_data.plan_type,
        "plan_name": plan["name"],
        "amount": plan["price"],
        "duration_days": plan["duration_days"],
        "status": PaymentStatus.pending.value,
        "pix_key": PIX_CONFIG["key"],
        "pix_key_type": PIX_CONFIG["key_type"],
        "beneficiary_name": PIX_CONFIG["beneficiary_name"],
        "receipt_url": None,
        "admin_notes": None,
        "approved_by": None,
        "approved_at": None,
        "expires_at": now + timedelta(hours=48),  # Expira em 48h
        "plan_expires_at": None,
        "created_at": now,
        "updated_at": now
    }
    
    await payments_collection.insert_one(payment)
    
    logger.info(f"Payment created: {payment['id']} for user {user['email']}")
    
    return Payment(**payment)


@router.post("/{payment_id}/upload-receipt")
async def upload_receipt(
    payment_id: str,
    receipt: UploadFile = File(...),
    email: str = Depends(get_current_user_email)
):
    """Upload do comprovante de pagamento"""
    # Verificar usuário
    user = await users_collection.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    # Buscar pagamento
    payment = await payments_collection.find_one({"id": payment_id})
    if not payment:
        raise HTTPException(status_code=404, detail="Pagamento não encontrado")
    
    # Verificar se o pagamento pertence ao usuário
    if payment["user_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    # Verificar status
    if payment["status"] not in ["pending"]:
        raise HTTPException(
            status_code=400, 
            detail="Não é possível enviar comprovante para este pagamento"
        )
    
    # Verificar se não expirou
    if datetime.utcnow() > payment["expires_at"]:
        await payments_collection.update_one(
            {"id": payment_id},
            {"$set": {"status": PaymentStatus.expired.value}}
        )
        raise HTTPException(status_code=400, detail="Este pagamento expirou")
    
    # Validar arquivo
    allowed_types = ["image/jpeg", "image/png", "image/webp", "application/pdf"]
    if receipt.content_type not in allowed_types:
        raise HTTPException(
            status_code=400, 
            detail="Tipo de arquivo não permitido. Use JPEG, PNG, WebP ou PDF."
        )
    
    # Salvar arquivo
    file_ext = receipt.filename.split(".")[-1] if "." in receipt.filename else "jpg"
    filename = f"{payment_id}_{uuid.uuid4().hex[:8]}.{file_ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    
    async with aiofiles.open(filepath, 'wb') as f:
        content = await receipt.read()
        await f.write(content)
    
    # Atualizar pagamento
    receipt_url = f"/api/uploads/receipts/{filename}"
    await payments_collection.update_one(
        {"id": payment_id},
        {
            "$set": {
                "receipt_url": receipt_url,
                "status": PaymentStatus.awaiting_approval.value,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    # Notificar admins
    admins = await users_collection.find(
        {"user_type": {"$in": ["admin", "admin_senior"]}}
    ).to_list(100)
    
    for admin in admins:
        notification = {
            "id": str(uuid.uuid4()),
            "user_id": admin["id"],
            "type": NotificationType.system.value,
            "title": "💳 Novo Comprovante de Pagamento",
            "message": f"{user.get('name', 'Usuário')} enviou comprovante para o plano {payment['plan_name']}. Valor: R$ {payment['amount']:.2f}",
            "data": {
                "payment_id": payment_id,
                "user_name": user.get("name"),
                "plan_name": payment["plan_name"],
                "amount": payment["amount"]
            },
            "read": False,
            "created_at": datetime.utcnow()
        }
        await notifications_collection.insert_one(notification)
    
    logger.info(f"Receipt uploaded for payment {payment_id}")
    
    return {
        "success": True,
        "message": "Comprovante enviado com sucesso! Aguarde a aprovação.",
        "receipt_url": receipt_url
    }


@router.get("/my-payments", response_model=List[Payment])
async def get_my_payments(
    email: str = Depends(get_current_user_email),
    status: Optional[str] = None
):
    """Listar pagamentos do usuário"""
    user = await users_collection.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    query = {"user_id": user["id"]}
    if status:
        query["status"] = status
    
    payments = await payments_collection.find(query).sort("created_at", -1).to_list(100)
    return [Payment(**p) for p in payments]


@router.get("/my-current-plan")
async def get_my_current_plan(email: str = Depends(get_current_user_email)):
    """Retorna informações do plano atual do usuário"""
    user = await users_collection.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    # Buscar último pagamento aprovado
    last_payment = await payments_collection.find_one(
        {"user_id": user["id"], "status": "approved"},
        sort=[("approved_at", -1)]
    )
    
    plan_type = user.get("plan_type", "free")
    plan_expires_at = user.get("plan_expires_at")
    
    # Verificar se o plano expirou
    is_active = True
    if plan_expires_at and datetime.utcnow() > plan_expires_at:
        is_active = False
        # Atualizar para free se expirou
        await users_collection.update_one(
            {"id": user["id"]},
            {"$set": {"plan_type": "free", "plan_expires_at": None}}
        )
        plan_type = "free"
    
    return {
        "plan_type": plan_type,
        "plan_expires_at": plan_expires_at,
        "is_active": is_active,
        "user_type": user.get("user_type"),
        "last_payment": Payment(**last_payment) if last_payment else None
    }


@router.delete("/{payment_id}/cancel")
async def cancel_payment(
    payment_id: str,
    email: str = Depends(get_current_user_email)
):
    """Cancelar um pagamento pendente"""
    user = await users_collection.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    payment = await payments_collection.find_one({"id": payment_id})
    if not payment:
        raise HTTPException(status_code=404, detail="Pagamento não encontrado")
    
    if payment["user_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    if payment["status"] not in ["pending", "awaiting_approval"]:
        raise HTTPException(status_code=400, detail="Este pagamento não pode ser cancelado")
    
    await payments_collection.update_one(
        {"id": payment_id},
        {
            "$set": {
                "status": PaymentStatus.cancelled.value,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    return {"success": True, "message": "Pagamento cancelado"}


# ==========================================
# ROTAS ADMIN - Gerenciar Pagamentos
# ==========================================

@router.get("/admin/list", response_model=List[Payment])
async def admin_list_payments(
    email: str = Depends(get_current_user_email),
    status: Optional[str] = None,
    limit: int = 50
):
    """[ADMIN] Listar todos os pagamentos"""
    user = await users_collection.find_one({"email": email})
    if not user or user.get("user_type") not in ["admin", "admin_senior"]:
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    query = {}
    if status:
        query["status"] = status
    
    payments = await payments_collection.find(query).sort("created_at", -1).limit(limit).to_list(limit)
    return [Payment(**p) for p in payments]


@router.get("/admin/pending-count")
async def admin_pending_count(email: str = Depends(get_current_user_email)):
    """[ADMIN] Contar pagamentos aguardando aprovação"""
    user = await users_collection.find_one({"email": email})
    if not user or user.get("user_type") not in ["admin", "admin_senior"]:
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    count = await payments_collection.count_documents({"status": "awaiting_approval"})
    return {"pending_count": count}


@router.get("/admin/stats")
async def admin_payment_stats(email: str = Depends(get_current_user_email)):
    """[ADMIN] Estatísticas de pagamentos"""
    user = await users_collection.find_one({"email": email})
    if not user or user.get("user_type") not in ["admin", "admin_senior"]:
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    # Contar por status
    stats = {
        "pending": await payments_collection.count_documents({"status": "pending"}),
        "awaiting_approval": await payments_collection.count_documents({"status": "awaiting_approval"}),
        "approved": await payments_collection.count_documents({"status": "approved"}),
        "rejected": await payments_collection.count_documents({"status": "rejected"}),
        "expired": await payments_collection.count_documents({"status": "expired"}),
        "cancelled": await payments_collection.count_documents({"status": "cancelled"})
    }
    
    # Total arrecadado
    approved_payments = await payments_collection.find({"status": "approved"}).to_list(1000)
    total_revenue = sum(p.get("amount", 0) for p in approved_payments)
    
    # Últimos 30 dias
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    recent_approved = await payments_collection.find({
        "status": "approved",
        "approved_at": {"$gte": thirty_days_ago}
    }).to_list(1000)
    monthly_revenue = sum(p.get("amount", 0) for p in recent_approved)
    
    return {
        "by_status": stats,
        "total_revenue": total_revenue,
        "monthly_revenue": monthly_revenue,
        "total_payments": sum(stats.values())
    }


@router.get("/admin/payment/{payment_id}", response_model=Payment)
async def admin_get_payment(
    payment_id: str,
    email: str = Depends(get_current_user_email)
):
    """[ADMIN] Detalhes de um pagamento"""
    user = await users_collection.find_one({"email": email})
    if not user or user.get("user_type") not in ["admin", "admin_senior"]:
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    payment = await payments_collection.find_one({"id": payment_id})
    if not payment:
        raise HTTPException(status_code=404, detail="Pagamento não encontrado")
    
    return Payment(**payment)


@router.post("/admin/payment/{payment_id}/approve")
async def admin_approve_payment(
    payment_id: str,
    approval: PaymentApproval,
    email: str = Depends(get_current_user_email)
):
    """[ADMIN] Aprovar ou rejeitar um pagamento"""
    admin = await users_collection.find_one({"email": email})
    if not admin or admin.get("user_type") not in ["admin", "admin_senior"]:
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    payment = await payments_collection.find_one({"id": payment_id})
    if not payment:
        raise HTTPException(status_code=404, detail="Pagamento não encontrado")
    
    if payment["status"] != "awaiting_approval":
        raise HTTPException(
            status_code=400, 
            detail="Este pagamento não está aguardando aprovação"
        )
    
    now = datetime.utcnow()
    
    if approval.approved:
        # Aprovar pagamento
        plan_expires_at = now + timedelta(days=payment["duration_days"])
        
        # Atualizar pagamento
        await payments_collection.update_one(
            {"id": payment_id},
            {
                "$set": {
                    "status": PaymentStatus.approved.value,
                    "approved_by": admin["id"],
                    "approved_at": now,
                    "admin_notes": approval.admin_notes,
                    "plan_expires_at": plan_expires_at,
                    "updated_at": now
                }
            }
        )
        
        # Atualizar plano do usuário
        plan_type = "trimestral" if "trimestral" in payment["plan_type"] else "anual"
        await users_collection.update_one(
            {"id": payment["user_id"]},
            {
                "$set": {
                    "plan_type": plan_type,
                    "plan_expires_at": plan_expires_at,
                    "updated_at": now
                }
            }
        )
        
        # Notificar usuário
        notification = {
            "id": str(uuid.uuid4()),
            "user_id": payment["user_id"],
            "type": NotificationType.system.value,
            "title": "✅ Pagamento Aprovado!",
            "message": f"Seu pagamento do {payment['plan_name']} foi aprovado! Seu plano está ativo até {plan_expires_at.strftime('%d/%m/%Y')}.",
            "data": {
                "payment_id": payment_id,
                "plan_expires_at": plan_expires_at.isoformat()
            },
            "read": False,
            "created_at": now
        }
        await notifications_collection.insert_one(notification)
        
        logger.info(f"Payment {payment_id} approved by {admin['email']}")
        
        return {
            "success": True,
            "message": "Pagamento aprovado com sucesso!",
            "plan_expires_at": plan_expires_at
        }
    
    else:
        # Rejeitar pagamento
        await payments_collection.update_one(
            {"id": payment_id},
            {
                "$set": {
                    "status": PaymentStatus.rejected.value,
                    "approved_by": admin["id"],
                    "approved_at": now,
                    "admin_notes": approval.admin_notes,
                    "updated_at": now
                }
            }
        )
        
        # Notificar usuário
        reason = approval.admin_notes or "Comprovante inválido ou não identificado."
        notification = {
            "id": str(uuid.uuid4()),
            "user_id": payment["user_id"],
            "type": NotificationType.system.value,
            "title": "❌ Pagamento Não Aprovado",
            "message": f"Seu pagamento do {payment['plan_name']} não foi aprovado. Motivo: {reason}",
            "data": {
                "payment_id": payment_id,
                "reason": reason
            },
            "read": False,
            "created_at": now
        }
        await notifications_collection.insert_one(notification)
        
        logger.info(f"Payment {payment_id} rejected by {admin['email']}")
        
        return {
            "success": True,
            "message": "Pagamento rejeitado"
        }
