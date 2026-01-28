"""
Rotas de recuperação de senha - ImovLocal
"""

import os
import asyncio
import logging
import secrets
import resend
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from dotenv import load_dotenv
from pathlib import Path
from passlib.context import CryptContext

# Carregar variáveis de ambiente
ROOT_DIR = Path(__file__).parent.parent
load_dotenv(ROOT_DIR / '.env')

# Configuração do Resend
RESEND_API_KEY = os.environ.get("RESEND_API_KEY")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")
FRONTEND_URL = os.environ.get("FRONTEND_URL", "https://www.imovlocal.com.br")

if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/password", tags=["Password Recovery"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Models
class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class VerifyTokenRequest(BaseModel):
    token: str


@router.post("/forgot")
async def forgot_password(request: ForgotPasswordRequest):
    """
    Envia email com link para redefinir senha
    """
    from database import db
    
    # Verificar se usuário existe
    user = await db.users.find_one({"email": request.email}, {"_id": 0})
    
    if not user:
        # Por segurança, não revelamos se o email existe ou não
        return {
            "status": "success",
            "message": "Se o email existir em nossa base, você receberá um link para redefinir sua senha."
        }
    
    # Gerar token único
    token = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(hours=1)  # Token válido por 1 hora
    
    logger.info(f"=== GERANDO TOKEN ===")
    logger.info(f"Token gerado: {token}")
    logger.info(f"Token length: {len(token)}")
    logger.info(f"Email: {request.email}")
    
    # Salvar token no banco
    await db.password_resets.delete_many({"email": request.email})  # Remover tokens antigos
    result = await db.password_resets.insert_one({
        "email": request.email,
        "token": token,
        "expires_at": expires_at,
        "created_at": datetime.utcnow()
    })
    
    logger.info(f"Token salvo no banco com sucesso!")
    
    # Link de redefinição
    reset_link = f"{FRONTEND_URL}/redefinir-senha?token={token}"
    logger.info(f"Link gerado: {reset_link}")
    
    # HTML do email
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #E31E24;">ImovLocal</h1>
        </div>
        
        <h2 style="color: #333;">Redefinição de Senha</h2>
        
        <p style="color: #666; line-height: 1.6;">
            Olá <strong>{user.get('name', 'Usuário')}</strong>,
        </p>
        
        <p style="color: #666; line-height: 1.6;">
            Recebemos uma solicitação para redefinir a senha da sua conta no ImovLocal.
            Clique no botão abaixo para criar uma nova senha:
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{reset_link}" 
               style="background-color: #E31E24; color: white; padding: 15px 30px; 
                      text-decoration: none; border-radius: 5px; font-weight: bold;">
                Redefinir Minha Senha
            </a>
        </div>
        
        <p style="color: #999; font-size: 14px; line-height: 1.6;">
            Este link expira em <strong>1 hora</strong>.
        </p>
        
        <p style="color: #999; font-size: 14px; line-height: 1.6;">
            Se você não solicitou a redefinição de senha, ignore este email.
            Sua senha permanecerá a mesma.
        </p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="color: #999; font-size: 12px; text-align: center;">
            © 2025 ImovLocal - Portal Imobiliário<br>
            Este é um email automático, não responda.
        </p>
    </body>
    </html>
    """
    
    # Enviar email
    if not RESEND_API_KEY:
        logger.warning("RESEND_API_KEY não configurada - email não enviado")
        # Em produção sem API key, ainda retornamos sucesso por segurança
        # mas logamos o problema
        return {
            "status": "success",
            "message": "Se o email existir em nossa base, você receberá um link para redefinir sua senha."
        }
    
    try:
        params = {
            "from": SENDER_EMAIL,
            "to": [request.email],
            "subject": "Redefinição de Senha - ImovLocal",
            "html": html_content
        }
        
        email_result = await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Email de recuperação enviado para {request.email}")
        
        return {
            "status": "success",
            "message": "Se o email existir em nossa base, você receberá um link para redefinir sua senha."
        }
        
    except Exception as e:
        logger.error(f"Erro ao enviar email: {str(e)}")
        # Não revelar detalhes do erro ao usuário
        return {
            "status": "success",
            "message": "Se o email existir em nossa base, você receberá um link para redefinir sua senha."
        }


@router.post("/verify-token")
async def verify_token(request: VerifyTokenRequest):
    """
    Verifica se o token de redefinição é válido
    """
    from database import db
    
    logger.info(f"=== VERIFICANDO TOKEN ===")
    logger.info(f"Token recebido: {request.token}")
    logger.info(f"Token length: {len(request.token)}")
    
    # Listar todos os tokens existentes
    all_tokens = await db.password_resets.find({}, {"_id": 0}).to_list(100)
    logger.info(f"Total de tokens no banco: {len(all_tokens)}")
    for t in all_tokens:
        logger.info(f"  - Token salvo: {t.get('token')}")
        logger.info(f"  - Email: {t.get('email')}")
    
    reset_request = await db.password_resets.find_one({"token": request.token}, {"_id": 0})
    
    if not reset_request:
        logger.warning(f"Token NÃO encontrado no banco de dados!")
        raise HTTPException(status_code=400, detail="Token inválido ou expirado")
    
    logger.info(f"Token ENCONTRADO para: {reset_request.get('email')}")
    
    if datetime.utcnow() > reset_request["expires_at"]:
        await db.password_resets.delete_one({"token": request.token})
        logger.warning(f"Token expirado")
        raise HTTPException(status_code=400, detail="Token expirado. Solicite uma nova redefinição.")
    
    logger.info(f"Token VÁLIDO!")
    return {
        "status": "valid",
        "email": reset_request["email"]
    }


@router.post("/reset")
async def reset_password(request: ResetPasswordRequest):
    """
    Redefine a senha do usuário
    """
    from database import db
    
    # Verificar token
    reset_request = await db.password_resets.find_one({"token": request.token}, {"_id": 0})
    
    if not reset_request:
        raise HTTPException(status_code=400, detail="Token inválido ou expirado")
    
    if datetime.utcnow() > reset_request["expires_at"]:
        await db.password_resets.delete_one({"token": request.token})
        raise HTTPException(status_code=400, detail="Token expirado. Solicite uma nova redefinição.")
    
    # Validar senha
    if len(request.new_password) < 6:
        raise HTTPException(status_code=400, detail="A senha deve ter no mínimo 6 caracteres")
    
    # Hash da nova senha
    hashed_password = pwd_context.hash(request.new_password)
    
    # Atualizar senha do usuário
    result = await db.users.update_one(
        {"email": reset_request["email"]},
        {"$set": {"hashed_password": hashed_password, "updated_at": datetime.utcnow()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    # Remover token usado
    await db.password_resets.delete_one({"token": request.token})
    
    logger.info(f"Senha redefinida com sucesso para {reset_request['email']}")
    
    return {
        "status": "success",
        "message": "Senha redefinida com sucesso! Você já pode fazer login."
    }
