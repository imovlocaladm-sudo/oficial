"""
Agendador de Tarefas - ImovLocal
Executa tarefas periódicas como verificação de planos vencidos
"""

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime, timedelta
import logging
import uuid

logger = logging.getLogger(__name__)

# Instância global do scheduler
scheduler = AsyncIOScheduler()


async def check_plan_expirations():
    """
    Verifica planos vencidos e prestes a vencer.
    - Planos vencidos: muda status do usuário para 'pending'
    - Planos vencendo em 5 dias: envia notificação de renovação
    
    Executado automaticamente todos os dias às 6:00 AM
    """
    from database import db
    
    logger.info("Iniciando verificação automática de vencimento de planos...")
    
    now = datetime.utcnow()
    five_days_from_now = now + timedelta(days=5)
    
    results = {
        "expired": 0,
        "expiring_soon": 0,
        "notifications_sent": 0
    }
    
    try:
        # 1. Buscar usuários com plano vencido
        expired_users = await db.users.find({
            "status": "active",
            "plan_expires_at": {"$lt": now, "$ne": None}
        }).to_list(1000)
        
        for user in expired_users:
            # Suspender usuário
            await db.users.update_one(
                {"id": user["id"]},
                {
                    "$set": {
                        "status": "pending",
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            
            # Criar notificação
            notification = {
                "id": str(uuid.uuid4()),
                "user_id": user["id"],
                "type": "system",
                "title": "⚠️ Seu Plano Expirou",
                "message": f"Olá {user.get('name', 'Usuário')}! Seu plano expirou e seus anúncios foram ocultados. Renove agora para continuar anunciando seus imóveis.",
                "data": {"action": "renew_plan"},
                "read": False,
                "created_at": datetime.utcnow()
            }
            await db.notifications.insert_one(notification)
            results["expired"] += 1
            results["notifications_sent"] += 1
        
        # 2. Buscar usuários com plano vencendo em 5 dias (que ainda não foram notificados)
        expiring_users = await db.users.find({
            "status": "active",
            "plan_expires_at": {
                "$gte": now,
                "$lte": five_days_from_now
            },
            "expiration_notified": {"$ne": True}
        }).to_list(1000)
        
        for user in expiring_users:
            expires_at = user.get("plan_expires_at")
            if expires_at:
                days_left = (expires_at - now).days
                
                # Criar notificação de renovação
                notification = {
                    "id": str(uuid.uuid4()),
                    "user_id": user["id"],
                    "type": "system",
                    "title": "⏰ Seu Plano Está Vencendo!",
                    "message": f"Olá {user.get('name', 'Usuário')}! Seu plano vence em {days_left} dia(s) ({expires_at.strftime('%d/%m/%Y')}). Renove agora para não perder seus anúncios!",
                    "data": {"action": "renew_plan", "expires_at": expires_at.isoformat()},
                    "read": False,
                    "created_at": datetime.utcnow()
                }
                await db.notifications.insert_one(notification)
                
                # Marcar como notificado
                await db.users.update_one(
                    {"id": user["id"]},
                    {"$set": {"expiration_notified": True}}
                )
                
                results["expiring_soon"] += 1
                results["notifications_sent"] += 1
        
        logger.info(f"Verificação de vencimentos concluída: {results}")
        
    except Exception as e:
        logger.error(f"Erro na verificação de vencimentos: {str(e)}")


def start_scheduler():
    """Inicializa o agendador com as tarefas programadas"""
    
    # Verificar vencimentos todos os dias às 6:00 AM (horário do servidor)
    scheduler.add_job(
        check_plan_expirations,
        CronTrigger(hour=6, minute=0),
        id="check_plan_expirations",
        name="Verificação de Vencimento de Planos",
        replace_existing=True
    )
    
    # Também executar uma vez na inicialização (após 60 segundos)
    scheduler.add_job(
        check_plan_expirations,
        'date',
        run_date=datetime.now() + timedelta(seconds=60),
        id="initial_check_plan_expirations",
        name="Verificação Inicial de Vencimentos"
    )
    
    scheduler.start()
    logger.info("Agendador iniciado - Verificação de planos: diariamente às 6:00 AM")


def stop_scheduler():
    """Para o agendador"""
    if scheduler.running:
        scheduler.shutdown()
        logger.info("Agendador parado")
