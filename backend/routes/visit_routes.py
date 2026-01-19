"""
Routes for visit scheduling and notifications
Fase 4: Funcionalidade de Agendamento de Visitas
"""
from fastapi import APIRouter, HTTPException, status, Depends, BackgroundTasks
from typing import List, Optional
from models import (
    VisitScheduleCreate, VisitSchedule, VisitStatus,
    NotificationCreate, Notification, NotificationType
)
from auth import get_current_user_email
from database import db
from datetime import datetime
import uuid
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/visits", tags=["visits"])

# Collections
visits_collection = db.visits
notifications_collection = db.notifications
properties_collection = db.properties
users_collection = db.users


# ==========================================
# FUNÇÕES AUXILIARES
# ==========================================

async def create_notification(
    user_id: str,
    notification_type: NotificationType,
    title: str,
    message: str,
    data: dict = None
):
    """Cria uma notificação no banco de dados"""
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


def send_email_notification(
    to_email: str,
    to_name: str,
    subject: str,
    html_content: str
):
    """Envia email de notificação (executado em background)"""
    try:
        # Configurações de email (pode ser configurado via .env)
        smtp_server = os.environ.get('SMTP_SERVER', 'smtp.gmail.com')
        smtp_port = int(os.environ.get('SMTP_PORT', '587'))
        smtp_user = os.environ.get('SMTP_USER', '')
        smtp_password = os.environ.get('SMTP_PASSWORD', '')
        from_email = os.environ.get('FROM_EMAIL', 'noreply@imovlocal.com')
        from_name = os.environ.get('FROM_NAME', 'ImovLocal')
        
        if not smtp_user or not smtp_password:
            logger.warning("SMTP credentials not configured. Email not sent.")
            return False
        
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = f"{from_name} <{from_email}>"
        msg['To'] = f"{to_name} <{to_email}>"
        
        html_part = MIMEText(html_content, 'html')
        msg.attach(html_part)
        
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.sendmail(from_email, to_email, msg.as_string())
        
        logger.info(f"Email sent to {to_email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {str(e)}")
        return False


def generate_visit_email_html(visit_data: dict, property_data: dict) -> str:
    """Gera o HTML do email de notificação de visita"""
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #2563eb, #1e40af); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
            .content {{ background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }}
            .info-box {{ background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #2563eb; }}
            .visitor-info {{ background: #ecfdf5; border-left-color: #10b981; }}
            .property-info {{ background: #eff6ff; border-left-color: #3b82f6; }}
            .label {{ font-size: 12px; color: #6b7280; text-transform: uppercase; margin-bottom: 5px; }}
            .value {{ font-size: 16px; font-weight: bold; color: #1f2937; }}
            .button {{ display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px; }}
            .footer {{ text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🏠 Nova Visita Agendada!</h1>
                <p>Um interessado quer conhecer seu imóvel</p>
            </div>
            
            <div class="content">
                <div class="info-box visitor-info">
                    <h3>👤 Dados do Visitante</h3>
                    <p><span class="label">Nome</span><br><span class="value">{visit_data['visitor_name']}</span></p>
                    <p><span class="label">Telefone</span><br><span class="value">{visit_data['visitor_phone']}</span></p>
                    {f'<p><span class="label">Email</span><br><span class="value">{visit_data.get("visitor_email", "Não informado")}</span></p>' if visit_data.get('visitor_email') else ''}
                </div>
                
                <div class="info-box property-info">
                    <h3>🏡 Imóvel</h3>
                    <p><span class="label">Título</span><br><span class="value">{property_data.get('title', 'N/A')}</span></p>
                    <p><span class="label">Localização</span><br><span class="value">{property_data.get('neighborhood', '')} - {property_data.get('city', '')}/{property_data.get('state', '')}</span></p>
                    <p><span class="label">Código</span><br><span class="value">#{property_data.get('id', '')[:8]}</span></p>
                </div>
                
                <div class="info-box">
                    <h3>📅 Data e Hora da Visita</h3>
                    <p><span class="label">Data</span><br><span class="value">{visit_data['visit_date']}</span></p>
                    <p><span class="label">Horário</span><br><span class="value">{visit_data['visit_time']}</span></p>
                    {f'<p><span class="label">Mensagem</span><br><span class="value">{visit_data.get("message", "")}</span></p>' if visit_data.get('message') else ''}
                </div>
                
                <p style="text-align: center;">
                    <a href="https://wa.me/55{visit_data['visitor_phone'].replace('(', '').replace(')', '').replace('-', '').replace(' ', '')}" class="button" style="background: #25D366; color: white;">
                        📱 Responder via WhatsApp
                    </a>
                </p>
            </div>
            
            <div class="footer">
                <p>Este email foi enviado automaticamente pelo ImovLocal.</p>
                <p>© 2026 ImovLocal - Portal Imobiliário</p>
            </div>
        </div>
    </body>
    </html>
    """


# ==========================================
# ROTAS DE AGENDAMENTO
# ==========================================

@router.post("/schedule", response_model=VisitSchedule, status_code=status.HTTP_201_CREATED)
async def schedule_visit(
    visit_data: VisitScheduleCreate,
    background_tasks: BackgroundTasks
):
    """
    Agendar uma visita a um imóvel
    - Campos obrigatórios: nome e telefone do visitante
    - Envia notificação in-app e email para o anunciante
    """
    # Validar campos obrigatórios
    if not visit_data.visitor_name or len(visit_data.visitor_name.strip()) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nome do visitante é obrigatório (mínimo 2 caracteres)"
        )
    
    if not visit_data.visitor_phone or len(visit_data.visitor_phone.strip()) < 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Telefone do visitante é obrigatório (mínimo 10 dígitos)"
        )
    
    # Buscar imóvel
    property_data = await properties_collection.find_one({"id": visit_data.property_id})
    if not property_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Imóvel não encontrado"
        )
    
    # Buscar proprietário
    owner = await users_collection.find_one({"id": property_data['owner_id']})
    if not owner:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Proprietário do imóvel não encontrado"
        )
    
    # Criar agendamento
    visit_id = str(uuid.uuid4())
    visit_doc = {
        "id": visit_id,
        "property_id": visit_data.property_id,
        "property_title": property_data.get('title', ''),
        "property_address": f"{property_data.get('neighborhood', '')} - {property_data.get('city', '')}/{property_data.get('state', '')}",
        "owner_id": owner['id'],
        "owner_name": owner.get('name', ''),
        "owner_email": owner.get('email', ''),
        "visitor_name": visit_data.visitor_name.strip(),
        "visitor_phone": visit_data.visitor_phone.strip(),
        "visitor_email": visit_data.visitor_email,
        "visit_date": visit_data.visit_date,
        "visit_time": visit_data.visit_time,
        "message": visit_data.message,
        "status": VisitStatus.pending.value,
        "created_at": datetime.utcnow(),
        "updated_at": None
    }
    
    await visits_collection.insert_one(visit_doc)
    logger.info(f"Visit scheduled: {visit_id} for property {visit_data.property_id}")
    
    # Criar notificação in-app para o proprietário
    notification_title = "📅 Nova visita agendada!"
    notification_message = f"{visit_data.visitor_name} quer visitar seu imóvel '{property_data.get('title', '')}' em {visit_data.visit_date} às {visit_data.visit_time}. Tel: {visit_data.visitor_phone}"
    
    await create_notification(
        user_id=owner['id'],
        notification_type=NotificationType.visit_scheduled,
        title=notification_title,
        message=notification_message,
        data={
            "visit_id": visit_id,
            "property_id": visit_data.property_id,
            "visitor_phone": visit_data.visitor_phone
        }
    )
    
    # Enviar email em background (não bloqueia a resposta)
    email_html = generate_visit_email_html(visit_doc, property_data)
    background_tasks.add_task(
        send_email_notification,
        to_email=owner.get('email', ''),
        to_name=owner.get('name', ''),
        subject=f"🏠 Nova visita agendada - {property_data.get('title', '')}",
        html_content=email_html
    )
    
    return VisitSchedule(**visit_doc)


@router.get("/my-visits", response_model=List[VisitSchedule])
async def get_my_visits(
    email: str = Depends(get_current_user_email),
    status_filter: Optional[str] = None
):
    """Listar visitas agendadas para os imóveis do usuário logado"""
    user = await users_collection.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    query = {"owner_id": user['id']}
    if status_filter:
        query["status"] = status_filter
    
    visits = await visits_collection.find(query).sort("created_at", -1).to_list(100)
    return [VisitSchedule(**v) for v in visits]


@router.put("/{visit_id}/status")
async def update_visit_status(
    visit_id: str,
    new_status: VisitStatus,
    email: str = Depends(get_current_user_email)
):
    """Atualizar status de uma visita (apenas o proprietário)"""
    user = await users_collection.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    visit = await visits_collection.find_one({"id": visit_id})
    if not visit:
        raise HTTPException(status_code=404, detail="Visita não encontrada")
    
    if visit['owner_id'] != user['id']:
        raise HTTPException(status_code=403, detail="Você não tem permissão para alterar esta visita")
    
    await visits_collection.update_one(
        {"id": visit_id},
        {"$set": {"status": new_status.value, "updated_at": datetime.utcnow()}}
    )
    
    return {"message": f"Status atualizado para {new_status.value}"}


# ==========================================
# ROTAS DE NOTIFICAÇÕES
# ==========================================

notifications_router = APIRouter(prefix="/notifications", tags=["notifications"])


@notifications_router.get("/", response_model=List[Notification])
async def get_notifications(
    email: str = Depends(get_current_user_email),
    unread_only: bool = False,
    limit: int = 50
):
    """Listar notificações do usuário logado"""
    user = await users_collection.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    query = {"user_id": user['id']}
    if unread_only:
        query["read"] = False
    
    notifications = await notifications_collection.find(query).sort("created_at", -1).limit(limit).to_list(limit)
    return [Notification(**n) for n in notifications]


@notifications_router.get("/unread-count")
async def get_unread_count(email: str = Depends(get_current_user_email)):
    """Retorna a quantidade de notificações não lidas"""
    user = await users_collection.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    count = await notifications_collection.count_documents({"user_id": user['id'], "read": False})
    return {"unread_count": count}


@notifications_router.put("/{notification_id}/read")
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
    
    if notification['user_id'] != user['id']:
        raise HTTPException(status_code=403, detail="Você não tem permissão para acessar esta notificação")
    
    await notifications_collection.update_one(
        {"id": notification_id},
        {"$set": {"read": True}}
    )
    
    return {"message": "Notificação marcada como lida"}


@notifications_router.put("/mark-all-read")
async def mark_all_as_read(email: str = Depends(get_current_user_email)):
    """Marcar todas as notificações como lidas"""
    user = await users_collection.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    result = await notifications_collection.update_many(
        {"user_id": user['id'], "read": False},
        {"$set": {"read": True}}
    )
    
    return {"message": f"{result.modified_count} notificações marcadas como lidas"}


@notifications_router.delete("/{notification_id}")
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
        raise HTTPException(status_code=403, detail="Você não tem permissão para excluir esta notificação")
    
    await notifications_collection.delete_one({"id": notification_id})
    
    return {"message": "Notificação excluída"}


# ==========================================
# NOTIFICAÇÕES ADMIN - ENVIO SEGMENTADO
# ==========================================

from pydantic import BaseModel
from typing import List as TypingList

class AdminNotificationCreate(BaseModel):
    """Modelo para criação de notificação pelo admin"""
    title: str
    message: str
    target_user_types: TypingList[str]  # Lista de tipos: ["particular", "corretor", "imobiliaria"]


@notifications_router.post("/admin/send")
async def send_admin_notification(
    notification_data: AdminNotificationCreate,
    email: str = Depends(get_current_user_email)
):
    """
    Enviar notificação segmentada para grupos de usuários
    Apenas Admin Master e Admin Sênior podem usar
    
    target_user_types pode incluir: "particular", "corretor", "imobiliaria", "all"
    """
    # Verificar se é admin
    user = await users_collection.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    if user.get('user_type') not in ['admin', 'admin_senior']:
        raise HTTPException(
            status_code=403, 
            detail="Apenas administradores podem enviar notificações em massa"
        )
    
    # Validar título e mensagem
    if not notification_data.title or len(notification_data.title.strip()) < 3:
        raise HTTPException(status_code=400, detail="Título deve ter pelo menos 3 caracteres")
    
    if not notification_data.message or len(notification_data.message.strip()) < 10:
        raise HTTPException(status_code=400, detail="Mensagem deve ter pelo menos 10 caracteres")
    
    # Determinar os tipos de usuário alvo
    target_types = notification_data.target_user_types
    
    # Se "all" estiver na lista, enviar para todos os tipos
    if "all" in target_types:
        target_types = ["particular", "corretor", "imobiliaria"]
    
    # Validar tipos permitidos
    allowed_types = ["particular", "corretor", "imobiliaria"]
    invalid_types = [t for t in target_types if t not in allowed_types]
    if invalid_types:
        raise HTTPException(
            status_code=400, 
            detail=f"Tipos de usuário inválidos: {invalid_types}. Permitidos: {allowed_types}"
        )
    
    # Buscar usuários dos tipos selecionados (apenas ativos)
    query = {
        "user_type": {"$in": target_types},
        "status": "active"
    }
    
    target_users = await users_collection.find(query, {"id": 1, "user_type": 1}).to_list(10000)
    
    if not target_users:
        return {
            "success": True,
            "message": "Nenhum usuário encontrado para os tipos selecionados",
            "notifications_sent": 0
        }
    
    # Criar notificações para cada usuário
    notifications_to_insert = []
    for target_user in target_users:
        notification = {
            "id": str(uuid.uuid4()),
            "user_id": target_user['id'],
            "type": NotificationType.system.value,
            "title": notification_data.title.strip(),
            "message": notification_data.message.strip(),
            "data": {
                "sent_by": user['id'],
                "sent_by_name": user.get('name', 'Admin'),
                "target_type": target_user.get('user_type'),
                "is_admin_broadcast": True
            },
            "read": False,
            "created_at": datetime.utcnow()
        }
        notifications_to_insert.append(notification)
    
    # Inserir todas as notificações de uma vez
    if notifications_to_insert:
        await notifications_collection.insert_many(notifications_to_insert)
    
    # Contar por tipo
    counts_by_type = {}
    for t in target_types:
        counts_by_type[t] = sum(1 for u in target_users if u.get('user_type') == t)
    
    logger.info(f"Admin {user.get('email')} sent broadcast notification to {len(notifications_to_insert)} users")
    
    return {
        "success": True,
        "message": f"Notificação enviada com sucesso para {len(notifications_to_insert)} usuários",
        "notifications_sent": len(notifications_to_insert),
        "breakdown_by_type": counts_by_type
    }


@notifications_router.get("/admin/stats")
async def get_notification_stats(email: str = Depends(get_current_user_email)):
    """
    Obter estatísticas de notificações para o admin
    """
    # Verificar se é admin
    user = await users_collection.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    if user.get('user_type') not in ['admin', 'admin_senior']:
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    # Contar usuários por tipo
    user_counts = {}
    for user_type in ["particular", "corretor", "imobiliaria"]:
        count = await users_collection.count_documents({
            "user_type": user_type,
            "status": "active"
        })
        user_counts[user_type] = count
    
    # Total de notificações enviadas pelo sistema
    total_notifications = await notifications_collection.count_documents({
        "data.is_admin_broadcast": True
    })
    
    return {
        "active_users_by_type": user_counts,
        "total_active_users": sum(user_counts.values()),
        "total_admin_notifications_sent": total_notifications
    }
