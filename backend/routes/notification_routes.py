"""
Notification Routes and Utilities
Gerenciamento centralizado de notificações e emails
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from models import Notification, NotificationType
from auth import get_current_user_email
from database import db
from datetime import datetime
import uuid
import logging
import os

# Resend para envio de emails
try:
    import resend
    RESEND_AVAILABLE = True
except ImportError:
    RESEND_AVAILABLE = False

logger = logging.getLogger(__name__)

# Collections
notifications_collection = db.notifications
users_collection = db.users

# Configuração do Resend
RESEND_API_KEY = os.environ.get('RESEND_API_KEY')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'https://www.imovlocal.com.br')

if RESEND_AVAILABLE and RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY
    logger.info("Resend configurado para envio de emails")


# ==========================================
# FUNÇÕES AUXILIARES - NOTIFICAÇÕES
# ==========================================

async def create_notification(
    user_id: str,
    notification_type: NotificationType,
    title: str,
    message: str,
    data: dict = None
) -> dict:
    """
    Cria uma notificação no banco de dados
    
    Args:
        user_id: ID do usuário destinatário (ou "admin" para notificações gerais)
        notification_type: Tipo da notificação (enum)
        title: Título da notificação
        message: Mensagem detalhada
        data: Dados adicionais (opcional)
    """
    notification = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "type": notification_type.value,
        "title": title,
        "message": message,
        "data": data or {},
        "read": False,
        "created_at": datetime.utcnow()
    }
    
    await notifications_collection.insert_one(notification)
    logger.info(f"Notification created for user {user_id}: {title}")
    return notification


async def notify_admin(
    notification_type: NotificationType,
    title: str,
    message: str,
    data: dict = None
):
    """Cria notificação para todos os admins"""
    return await create_notification(
        user_id="admin",
        notification_type=notification_type,
        title=title,
        message=message,
        data=data
    )


# ==========================================
# FUNÇÕES AUXILIARES - EMAIL (Resend)
# ==========================================

def send_email(
    to_email: str,
    to_name: str,
    subject: str,
    html_content: str
) -> bool:
    """
    Envia email usando Resend
    
    Returns:
        True se enviou com sucesso, False caso contrário
    """
    if not RESEND_AVAILABLE or not RESEND_API_KEY:
        logger.warning("Resend não configurado. Email não enviado.")
        return False
    
    try:
        params = {
            "from": f"ImovLocal <{SENDER_EMAIL}>",
            "to": [to_email],
            "subject": subject,
            "html": html_content
        }
        
        response = resend.Emails.send(params)
        logger.info(f"Email enviado para {to_email}: {response.get('id', 'N/A')}")
        return True
        
    except Exception as e:
        logger.error(f"Falha ao enviar email para {to_email}: {str(e)}")
        return False


def send_welcome_email(user_name: str, user_email: str) -> bool:
    """Envia email de boas-vindas para novo usuário"""
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #dc2626, #b91c1c); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }}
            .content {{ background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }}
            .button {{ display: inline-block; background: #dc2626; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; margin-top: 20px; font-weight: bold; }}
            .footer {{ text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🏠 Bem-vindo ao ImovLocal!</h1>
            </div>
            <div class="content">
                <h2>Olá, {user_name}!</h2>
                <p>Sua conta foi criada com sucesso no <strong>ImovLocal</strong>, o portal imobiliário de Mato Grosso do Sul.</p>
                <p>Para começar a anunciar seus imóveis, você precisa:</p>
                <ol>
                    <li>Escolher um plano que atenda suas necessidades</li>
                    <li>Realizar o pagamento via PIX</li>
                    <li>Aguardar a aprovação (em até 24h)</li>
                </ol>
                <p style="text-align: center;">
                    <a href="{FRONTEND_URL}/planos" class="button">Ver Planos Disponíveis</a>
                </p>
                <p>Qualquer dúvida, entre em contato conosco!</p>
            </div>
            <div class="footer">
                <p>© 2026 ImovLocal - Portal Imobiliário</p>
                <p>Este email foi enviado automaticamente.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    return send_email(
        to_email=user_email,
        to_name=user_name,
        subject="🏠 Bem-vindo ao ImovLocal!",
        html_content=html
    )


def send_payment_approved_email(user_name: str, user_email: str, plan_name: str) -> bool:
    """Envia email quando pagamento é aprovado"""
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #16a34a, #15803d); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }}
            .content {{ background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }}
            .success-box {{ background: #ecfdf5; border: 1px solid #10b981; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }}
            .button {{ display: inline-block; background: #16a34a; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; margin-top: 20px; font-weight: bold; }}
            .footer {{ text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>✅ Pagamento Aprovado!</h1>
            </div>
            <div class="content">
                <h2>Parabéns, {user_name}!</h2>
                <div class="success-box">
                    <h3>🎉 Seu plano <strong>{plan_name}</strong> foi ativado!</h3>
                </div>
                <p>Agora você pode:</p>
                <ul>
                    <li>Cadastrar seus imóveis</li>
                    <li>Gerenciar seus anúncios</li>
                    <li>Receber contatos de interessados</li>
                </ul>
                <p style="text-align: center;">
                    <a href="{FRONTEND_URL}/admin/imoveis/novo" class="button">Cadastrar Primeiro Imóvel</a>
                </p>
            </div>
            <div class="footer">
                <p>© 2026 ImovLocal - Portal Imobiliário</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    return send_email(
        to_email=user_email,
        to_name=user_name,
        subject="✅ Pagamento aprovado - ImovLocal",
        html_content=html
    )


def send_plan_expiring_email(user_name: str, user_email: str, days_remaining: int) -> bool:
    """Envia email quando plano está próximo de expirar"""
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }}
            .content {{ background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }}
            .warning-box {{ background: #fffbeb; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }}
            .button {{ display: inline-block; background: #f59e0b; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; margin-top: 20px; font-weight: bold; }}
            .footer {{ text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>⚠️ Seu Plano Está Expirando</h1>
            </div>
            <div class="content">
                <h2>Olá, {user_name}!</h2>
                <div class="warning-box">
                    <h3>Seu plano expira em <strong>{days_remaining} dias</strong></h3>
                </div>
                <p>Para continuar anunciando seus imóveis sem interrupção, renove seu plano agora.</p>
                <p>Após a expiração, seus anúncios serão desativados até a renovação.</p>
                <p style="text-align: center;">
                    <a href="{FRONTEND_URL}/planos" class="button">Renovar Agora</a>
                </p>
            </div>
            <div class="footer">
                <p>© 2026 ImovLocal - Portal Imobiliário</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    return send_email(
        to_email=user_email,
        to_name=user_name,
        subject=f"⚠️ Seu plano expira em {days_remaining} dias - ImovLocal",
        html_content=html
    )


# ==========================================
# ROTAS DE NOTIFICAÇÕES
# ==========================================

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("/", response_model=List[Notification])
async def get_notifications(
    email: str = Depends(get_current_user_email),
    unread_only: bool = False,
    limit: int = 50
):
    """Listar notificações do usuário logado"""
    user = await users_collection.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    # Admins também veem notificações destinadas a "admin"
    if user.get('user_type') in ['admin', 'admin_senior']:
        query = {"$or": [{"user_id": user['id']}, {"user_id": "admin"}]}
    else:
        query = {"user_id": user['id']}
    
    if unread_only:
        query["read"] = False
    
    notifications = await notifications_collection.find(query).sort("created_at", -1).limit(limit).to_list(limit)
    return [Notification(**n) for n in notifications]


@router.get("/unread-count")
async def get_unread_count(email: str = Depends(get_current_user_email)):
    """Retorna a quantidade de notificações não lidas"""
    user = await users_collection.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    if user.get('user_type') in ['admin', 'admin_senior']:
        query = {"$or": [{"user_id": user['id']}, {"user_id": "admin"}], "read": False}
    else:
        query = {"user_id": user['id'], "read": False}
    
    count = await notifications_collection.count_documents(query)
    return {"unread_count": count}


@router.put("/{notification_id}/read")
async def mark_as_read(
    notification_id: str,
    email: str = Depends(get_current_user_email)
):
    """Marcar notificação como lida"""
    user = await users_collection.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    notification = await notifications_collection.find_one({"id": notification_id})
    if not notification:
        raise HTTPException(status_code=404, detail="Notificação não encontrada")
    
    is_admin = user.get('user_type') in ['admin', 'admin_senior']
    is_own = notification['user_id'] == user['id']
    is_admin_notif = notification['user_id'] == 'admin' and is_admin
    
    if not is_own and not is_admin_notif:
        raise HTTPException(status_code=403, detail="Sem permissão")
    
    await notifications_collection.update_one(
        {"id": notification_id},
        {"$set": {"read": True}}
    )
    
    return {"message": "Notificação marcada como lida"}


@router.put("/mark-all-read")
async def mark_all_as_read(email: str = Depends(get_current_user_email)):
    """Marcar todas as notificações como lidas"""
    user = await users_collection.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    if user.get('user_type') in ['admin', 'admin_senior']:
        query = {"$or": [{"user_id": user['id']}, {"user_id": "admin"}], "read": False}
    else:
        query = {"user_id": user['id'], "read": False}
    
    result = await notifications_collection.update_many(query, {"$set": {"read": True}})
    
    return {"message": f"{result.modified_count} notificações marcadas como lidas"}


@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: str,
    email: str = Depends(get_current_user_email)
):
    """Excluir uma notificação"""
    user = await users_collection.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    notification = await notifications_collection.find_one({"id": notification_id})
    if not notification:
        raise HTTPException(status_code=404, detail="Notificação não encontrada")
    
    if notification['user_id'] != user['id']:
        raise HTTPException(status_code=403, detail="Sem permissão")
    
    await notifications_collection.delete_one({"id": notification_id})
    
    return {"message": "Notificação excluída"}
