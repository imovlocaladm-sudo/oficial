"""
Sistema de Pagamentos PIX - ImovLocal
Gerencia planos, pedidos de pagamento e aprovações
"""

from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File, Form
from typing import List, Optional
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
from database import db
from auth import get_current_user_email
from middlewares.admin_middleware import get_current_admin_senior
import uuid
import os
import aiofiles
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/payments", tags=["payments"])

# Diretório para comprovantes
RECEIPTS_DIR = "uploads/receipts"
os.makedirs(RECEIPTS_DIR, exist_ok=True)

# ==========================================
# CONFIGURAÇÃO DE PLANOS E PIX
# ==========================================

# Dados do PIX
PIX_INFO = {
    "chave": "8c6a9ecc-e143-47cb-8962-23594d4197fa",
    "beneficiario": "Rogério Alves Pereira Barcelos",
    "cnpj": "61.343.028/0001-16",
    "banco": "Banco Inter"
}

# Limites de anúncios por tipo de usuário/plano
PLAN_LIMITS = {
    "particular": {"max_anuncios": 1, "max_fotos": 20},
    "corretor": {"max_anuncios": 50, "max_fotos": 20},
    "imobiliaria": {"max_anuncios": 150, "max_fotos": 20},
    "free": {"max_anuncios": 0, "max_fotos": 0}  # Usuário sem plano ativo
}

# Planos disponíveis
PLANS = {
    "particular_trimestral": {
        "id": "particular_trimestral",
        "nome": "Particular Trimestral",
        "user_type": "particular",
        "periodo": "trimestral",
        "duracao_dias": 90,
        "valor": 47.90,
        "max_anuncios": 1,
        "max_fotos": 20,
        "descricao": "Plano trimestral para usuários particulares",
        "recursos": [
            "1 anúncio ativo",
            "Até 20 fotos por anúncio",
            "Aluguel e Temporada",
            "Suporte por email",
            "Válido por 90 dias"
        ]
    },
    "corretor_trimestral": {
        "id": "corretor_trimestral",
        "nome": "Corretor Trimestral",
        "user_type": "corretor",
        "periodo": "trimestral",
        "duracao_dias": 90,
        "valor": 197.90,
        "max_anuncios": 50,
        "max_fotos": 20,
        "descricao": "Plano trimestral para corretores",
        "recursos": [
            "Até 50 anúncios ativos",
            "Até 20 fotos por anúncio",
            "Venda, Aluguel e Temporada",
            "Hub de Parcerias",
            "Suporte prioritário",
            "Válido por 90 dias"
        ]
    },
    "imobiliaria_anual": {
        "id": "imobiliaria_anual",
        "nome": "Imobiliária Anual",
        "user_type": "imobiliaria",
        "periodo": "anual",
        "duracao_dias": 365,
        "valor": 497.90,
        "max_anuncios": 150,
        "max_fotos": 20,
        "descricao": "Plano anual para imobiliárias",
        "recursos": [
            "Até 150 anúncios ativos",
            "Até 20 fotos por anúncio",
            "Venda, Aluguel e Temporada",
            "Lançamentos exclusivos",
            "Hub de Parcerias",
            "Suporte VIP",
            "Válido por 12 meses"
        ]
    }
}

# Status de pagamento
class PaymentStatus:
    PENDING = "pending"              # Aguardando pagamento
    AWAITING_APPROVAL = "awaiting"   # Comprovante enviado, aguardando aprovação
    APPROVED = "approved"            # Aprovado
    REJECTED = "rejected"            # Rejeitado
    EXPIRED = "expired"              # Expirado

# ==========================================
# MODELOS
# ==========================================

class PlanResponse(BaseModel):
    id: str
    nome: str
    user_type: str
    periodo: str
    duracao_dias: int
    valor: float
    descricao: str
    recursos: List[str]

class PaymentCreate(BaseModel):
    plan_id: str

class PaymentResponse(BaseModel):
    id: str
    user_id: str
    user_name: str
    user_email: str
    plan_id: str
    plan_nome: str
    valor: float
    status: str
    receipt_url: Optional[str] = None
    created_at: datetime
    approved_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None

class PaymentApproval(BaseModel):
    approved: bool
    rejection_reason: Optional[str] = None

# ==========================================
# ROTAS PÚBLICAS
# ==========================================

@router.get("/plans", response_model=List[PlanResponse])
async def get_plans():
    """Listar todos os planos disponíveis"""
    return [PlanResponse(**plan) for plan in PLANS.values()]

@router.get("/pix-info")
async def get_pix_info():
    """Retornar informações do PIX para pagamento"""
    return PIX_INFO

# ==========================================
# ROTAS AUTENTICADAS (USUÁRIO)
# ==========================================

@router.post("/create", response_model=PaymentResponse)
async def create_payment(
    payment_data: PaymentCreate,
    email: str = Depends(get_current_user_email)
):
    """Criar um pedido de pagamento"""
    # Buscar usuário
    user = await db.users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    # Verificar se o plano existe
    plan = PLANS.get(payment_data.plan_id)
    if not plan:
        raise HTTPException(status_code=400, detail="Plano não encontrado")
    
    # Verificar se o plano é compatível com o tipo de usuário
    if plan["user_type"] != user.get("user_type"):
        raise HTTPException(
            status_code=400, 
            detail=f"Este plano é apenas para usuários do tipo {plan['user_type']}"
        )
    
    # Verificar se já tem pagamento pendente
    existing_payment = await db.payments.find_one({
        "user_id": user["id"],
        "status": {"$in": [PaymentStatus.PENDING, PaymentStatus.AWAITING_APPROVAL]}
    })
    
    if existing_payment:
        raise HTTPException(
            status_code=400,
            detail="Você já possui um pagamento pendente. Aguarde a aprovação ou cancele-o primeiro."
        )
    
    # Criar pedido de pagamento
    payment_id = str(uuid.uuid4())
    payment = {
        "id": payment_id,
        "user_id": user["id"],
        "user_name": user["name"],
        "user_email": user["email"],
        "plan_id": plan["id"],
        "plan_nome": plan["nome"],
        "valor": plan["valor"],
        "duracao_dias": plan["duracao_dias"],
        "status": PaymentStatus.PENDING,
        "receipt_url": None,
        "created_at": datetime.utcnow(),
        "approved_at": None,
        "expires_at": None,
        "rejection_reason": None
    }
    
    await db.payments.insert_one(payment)
    
    logger.info(f"Pagamento criado: {payment_id} para usuário {user['email']}")
    
    return PaymentResponse(**{k: v for k, v in payment.items() if k != '_id'})

@router.post("/{payment_id}/upload-receipt")
async def upload_receipt(
    payment_id: str,
    receipt: UploadFile = File(...),
    email: str = Depends(get_current_user_email)
):
    """Enviar comprovante de pagamento"""
    # Buscar usuário
    user = await db.users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    # Buscar pagamento
    payment = await db.payments.find_one({"id": payment_id})
    if not payment:
        raise HTTPException(status_code=404, detail="Pagamento não encontrado")
    
    # Verificar se o pagamento pertence ao usuário
    if payment["user_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    # Verificar status
    if payment["status"] not in [PaymentStatus.PENDING, PaymentStatus.REJECTED]:
        raise HTTPException(
            status_code=400,
            detail="Não é possível enviar comprovante para este pagamento"
        )
    
    # Validar tipo de arquivo
    allowed_types = ["image/jpeg", "image/png", "image/webp", "application/pdf"]
    if receipt.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Tipo de arquivo não permitido. Use JPEG, PNG, WebP ou PDF."
        )
    
    # Salvar arquivo
    file_ext = receipt.filename.split(".")[-1] if "." in receipt.filename else "jpg"
    filename = f"{payment_id}_{uuid.uuid4().hex[:8]}.{file_ext}"
    filepath = os.path.join(RECEIPTS_DIR, filename)
    
    content = await receipt.read()
    if len(content) > 10 * 1024 * 1024:  # 10MB max
        raise HTTPException(status_code=400, detail="Arquivo muito grande. Máximo 10MB.")
    
    async with aiofiles.open(filepath, 'wb') as f:
        await f.write(content)
    
    receipt_url = f"/api/uploads/receipts/{filename}"
    
    # Atualizar pagamento
    await db.payments.update_one(
        {"id": payment_id},
        {
            "$set": {
                "receipt_url": receipt_url,
                "status": PaymentStatus.AWAITING_APPROVAL,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    # Criar notificação para admins
    admin_notification = {
        "id": str(uuid.uuid4()),
        "user_id": "admin",  # Notificação geral para admins
        "type": "payment_receipt",
        "title": "Novo Comprovante de Pagamento",
        "message": f"{user['name']} enviou um comprovante de pagamento para o plano {payment['plan_nome']}",
        "data": {"payment_id": payment_id},
        "read": False,
        "created_at": datetime.utcnow()
    }
    await db.notifications.insert_one(admin_notification)
    
    logger.info(f"Comprovante enviado para pagamento {payment_id}")
    
    return {
        "message": "Comprovante enviado com sucesso! Aguarde a aprovação.",
        "receipt_url": receipt_url
    }

@router.get("/my-payments", response_model=List[PaymentResponse])
async def get_my_payments(email: str = Depends(get_current_user_email)):
    """Listar meus pagamentos"""
    user = await db.users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    payments = await db.payments.find(
        {"user_id": user["id"]}
    ).sort("created_at", -1).to_list(50)
    
    return [PaymentResponse(**{k: v for k, v in p.items() if k != '_id'}) for p in payments]

@router.get("/my-limits")
async def get_my_limits(email: str = Depends(get_current_user_email)):
    """Retorna os limites do plano do usuário"""
    user = await db.users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    user_type = user.get("user_type", "particular")
    limits = PLAN_LIMITS.get(user_type, PLAN_LIMITS["free"])
    
    # Contar anúncios ativos
    from database import properties_collection
    current_count = await properties_collection.count_documents({"owner_id": user["id"]})
    
    return {
        "user_type": user_type,
        "status": user.get("status", "pending"),
        "plan_type": user.get("plan_type", "free"),
        "plan_expires_at": user.get("plan_expires_at"),
        "max_anuncios": user.get("max_anuncios", limits["max_anuncios"]),
        "max_fotos": limits["max_fotos"],
        "anuncios_ativos": current_count,
        "anuncios_restantes": max(0, user.get("max_anuncios", limits["max_anuncios"]) - current_count)
    }

@router.delete("/{payment_id}")
async def cancel_payment(
    payment_id: str,
    email: str = Depends(get_current_user_email)
):
    """Cancelar um pagamento pendente"""
    user = await db.users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    payment = await db.payments.find_one({"id": payment_id})
    if not payment:
        raise HTTPException(status_code=404, detail="Pagamento não encontrado")
    
    if payment["user_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    if payment["status"] not in [PaymentStatus.PENDING]:
        raise HTTPException(
            status_code=400,
            detail="Não é possível cancelar este pagamento"
        )
    
    await db.payments.delete_one({"id": payment_id})
    
    return {"message": "Pagamento cancelado com sucesso"}

# ==========================================
# ROTAS ADMIN
# ==========================================

@router.get("/admin/list", response_model=List[PaymentResponse])
async def admin_list_payments(
    status_filter: Optional[str] = None,
    limit: int = 100,
    skip: int = 0,
    admin = Depends(get_current_admin_senior)
):
    """Listar todos os pagamentos (Admin)"""
    query = {}
    if status_filter:
        query["status"] = status_filter
    
    payments = await db.payments.find(query).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    return [PaymentResponse(**{k: v for k, v in p.items() if k != '_id'}) for p in payments]

@router.get("/admin/stats")
async def admin_payment_stats(admin = Depends(get_current_admin_senior)):
    """Estatísticas de pagamentos (Admin)"""
    # Contagens por status
    awaiting = await db.payments.count_documents({"status": PaymentStatus.AWAITING_APPROVAL})
    pending = await db.payments.count_documents({"status": PaymentStatus.PENDING})
    approved = await db.payments.count_documents({"status": PaymentStatus.APPROVED})
    rejected = await db.payments.count_documents({"status": PaymentStatus.REJECTED})
    
    # Receita total (aprovados)
    pipeline = [
        {"$match": {"status": PaymentStatus.APPROVED}},
        {"$group": {"_id": None, "total": {"$sum": "$valor"}}}
    ]
    result = await db.payments.aggregate(pipeline).to_list(1)
    total_revenue = result[0]["total"] if result else 0
    
    # Receita deste mês
    first_day_of_month = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    pipeline_month = [
        {
            "$match": {
                "status": PaymentStatus.APPROVED,
                "approved_at": {"$gte": first_day_of_month}
            }
        },
        {"$group": {"_id": None, "total": {"$sum": "$valor"}}}
    ]
    result_month = await db.payments.aggregate(pipeline_month).to_list(1)
    month_revenue = result_month[0]["total"] if result_month else 0
    
    return {
        "awaiting_approval": awaiting,
        "pending": pending,
        "approved": approved,
        "rejected": rejected,
        "total_revenue": total_revenue,
        "month_revenue": month_revenue
    }

@router.post("/admin/payment/{payment_id}/approve")
async def admin_approve_payment(
    payment_id: str,
    approval: PaymentApproval,
    admin = Depends(get_current_admin_senior)
):
    """Aprovar ou rejeitar um pagamento (Admin)"""
    payment = await db.payments.find_one({"id": payment_id})
    if not payment:
        raise HTTPException(status_code=404, detail="Pagamento não encontrado")
    
    if payment["status"] != PaymentStatus.AWAITING_APPROVAL:
        raise HTTPException(
            status_code=400,
            detail="Este pagamento não está aguardando aprovação"
        )
    
    if approval.approved:
        # Aprovar pagamento
        expires_at = datetime.utcnow() + timedelta(days=payment["duracao_dias"])
        
        await db.payments.update_one(
            {"id": payment_id},
            {
                "$set": {
                    "status": PaymentStatus.APPROVED,
                    "approved_at": datetime.utcnow(),
                    "expires_at": expires_at,
                    "approved_by": admin["email"]
                }
            }
        )
        
        # Atualizar usuário - ativar e definir plano com limites
        plan = PLANS.get(payment["plan_id"])
        plan_type = "trimestral" if "trimestral" in payment["plan_id"] else "anual"
        
        # Buscar dados do usuário para a notificação
        user_data = await db.users.find_one({"id": payment["user_id"]})
        user_type = user_data.get("user_type", "particular") if user_data else "particular"
        
        # Definir limites baseado no plano
        limits = PLAN_LIMITS.get(user_type, PLAN_LIMITS["free"])
        
        await db.users.update_one(
            {"id": payment["user_id"]},
            {
                "$set": {
                    "status": "active",
                    "plan_type": plan_type,
                    "plan_expires_at": expires_at,
                    "max_anuncios": limits["max_anuncios"],
                    "max_fotos": limits["max_fotos"],
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        # Notificar usuário com mensagem completa
        user_name = user_data.get("name", "Usuário") if user_data else "Usuário"
        notification = {
            "id": str(uuid.uuid4()),
            "user_id": payment["user_id"],
            "type": "payment_approved",
            "title": "🎉 Pagamento Aprovado - Conta Ativada!",
            "message": f"Olá {user_name}! Seu pagamento do plano {payment['plan_nome']} foi aprovado com sucesso! Sua conta está ativa até {expires_at.strftime('%d/%m/%Y')}. Agora você pode cadastrar até {limits['max_anuncios']} anúncio(s) com até {limits['max_fotos']} fotos cada. Bons negócios!",
            "data": {
                "payment_id": payment_id,
                "plan_nome": payment['plan_nome'],
                "expires_at": expires_at.isoformat(),
                "max_anuncios": limits["max_anuncios"],
                "max_fotos": limits["max_fotos"]
            },
            "read": False,
            "created_at": datetime.utcnow()
        }
        await db.notifications.insert_one(notification)
        
        logger.info(f"Pagamento {payment_id} aprovado por {admin['email']}")
        
        return {
            "message": "Pagamento aprovado com sucesso!",
            "expires_at": expires_at.isoformat()
        }
    else:
        # Rejeitar pagamento
        await db.payments.update_one(
            {"id": payment_id},
            {
                "$set": {
                    "status": PaymentStatus.REJECTED,
                    "rejection_reason": approval.rejection_reason or "Comprovante inválido",
                    "rejected_by": admin["email"],
                    "rejected_at": datetime.utcnow()
                }
            }
        )
        
        # Notificar usuário
        notification = {
            "id": str(uuid.uuid4()),
            "user_id": payment["user_id"],
            "type": "payment_rejected",
            "title": "Pagamento Rejeitado",
            "message": f"Seu pagamento foi rejeitado. Motivo: {approval.rejection_reason or 'Comprovante inválido'}. Por favor, envie um novo comprovante.",
            "data": {"payment_id": payment_id},
            "read": False,
            "created_at": datetime.utcnow()
        }
        await db.notifications.insert_one(notification)
        
        logger.info(f"Pagamento {payment_id} rejeitado por {admin['email']}")
        
        return {"message": "Pagamento rejeitado"}

@router.get("/admin/payment/{payment_id}")
async def admin_get_payment_details(
    payment_id: str,
    admin = Depends(get_current_admin_senior)
):
    """Detalhes de um pagamento específico (Admin)"""
    payment = await db.payments.find_one({"id": payment_id})
    if not payment:
        raise HTTPException(status_code=404, detail="Pagamento não encontrado")
    
    # Buscar dados do usuário
    user = await db.users.find_one({"id": payment["user_id"]})
    
    return {
        **{k: v for k, v in payment.items() if k != '_id'},
        "user_details": {
            "name": user.get("name") if user else "N/A",
            "email": user.get("email") if user else "N/A",
            "phone": user.get("phone") if user else "N/A",
            "user_type": user.get("user_type") if user else "N/A"
        }
    }
