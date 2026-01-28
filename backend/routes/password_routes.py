"""
Rotas de recuperação de senha - ImovLocal
"""

import os
import asyncio
import logging
import secrets
import random
import string
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

class VerifyCodeRequest(BaseModel):
    email: EmailStr
    code: str

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    code: str
    new_password: str


def generate_code():
    """Gera um código de 6 dígitos"""
    return ''.join(random.choices(string.digits, k=6))


@router.post("/forgot")
async def forgot_password(request: ForgotPasswordRequest):
    """
    Envia email com código de 6 dígitos para redefinir senha
    """
    from database import db
    
    # Verificar se usuário existe
    user = await db.users.find_one({"email": request.email}, {"_id": 0})
    
    if not user:
        return {
            "status": "success",
            "message": "Se o email existir em nossa base, você receberá um código para redefinir sua senha."
        }
    
    # Gerar código de 6 dígitos
    code = generate_code()
    expires_at = datetime.utcnow() + timedelta(minutes=30)  # Código válido por 30 minutos
    
    logger.info(f"Gerando código para: {request.email}")
    logger.info(f"Código: {code}")
    
    # Salvar código no banco
    await db.password_resets.delete_many({"email": request.email})
    await db.password_resets.insert_one({
        "email": request.email,
        "code": code,
        "expires_at": expires_at,
        "created_at": datetime.utcnow()
    })
    
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
        
        <h2 style="color: #333;">Código de Redefinição de Senha</h2>
        
        <p style="color: #666; line-height: 1.6;">
            Olá <strong>{user.get('name', 'Usuário')}</strong>,
        </p>
        
        <p style="color: #666; line-height: 1.6;">
            Recebemos uma solicitação para redefinir a senha da sua conta no ImovLocal.
            Use o código abaixo para criar uma nova senha:
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
            <div style="background-color: #f5f5f5; border: 2px dashed #E31E24; 
                        padding: 20px; display: inline-block; border-radius: 10px;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #333;">
                    {code}
                </span>
            </div>
        </div>
        
        <p style="color: #666; line-height: 1.6; text-align: center;">
            <a href="{FRONTEND_URL}/redefinir-senha" 
               style="color: #E31E24; text-decoration: underline;">
                Clique aqui para redefinir sua senha
            </a>
        </p>
        
        <p style="color: #999; font-size: 14px; line-height: 1.6;">
            Este código expira em <strong>30 minutos</strong>.
        </p>
        
        <p style="color: #999; font-size: 14px; line-height: 1.6;">
            Se você não solicitou a redefinição de senha, ignore este email.
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
        logger.warning("RESEND_API_KEY não configurada")
        return {
            "status": "success",
            "message": "Se o email existir em nossa base, você receberá um código para redefinir sua senha."
        }
    
    try:
        params = {
            "from": SENDER_EMAIL,
            "to": [request.email],
            "subject": f"Código de Redefinição: {code} - ImovLocal",
            "html": html_content
        }
        
        await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Email enviado para {request.email}")
        
        return {
            "status": "success",
            "message": "Se o email existir em nossa base, você receberá um código para redefinir sua senha."
        }
        
    except Exception as e:
        logger.error(f"Erro ao enviar email: {str(e)}")
        return {
            "status": "success",
            "message": "Se o email existir em nossa base, você receberá um código para redefinir sua senha."
        }


@router.post("/verify-code")
async def verify_code(request: VerifyCodeRequest):
    """
    Verifica se o código de redefinição é válido
    """
    from database import db
    
    logger.info(f"Verificando código para: {request.email}")
    logger.info(f"Código recebido: {request.code}")
    
    reset_request = await db.password_resets.find_one({
        "email": request.email,
        "code": request.code
    }, {"_id": 0})
    
    if not reset_request:
        logger.warning("Código não encontrado")
        raise HTTPException(status_code=400, detail="Código inválido")
    
    if datetime.utcnow() > reset_request["expires_at"]:
        await db.password_resets.delete_one({"email": request.email})
        logger.warning("Código expirado")
        raise HTTPException(status_code=400, detail="Código expirado. Solicite um novo.")
    
    logger.info("Código válido!")
    return {
        "status": "valid",
        "message": "Código válido"
    }


@router.post("/reset")
async def reset_password(request: ResetPasswordRequest):
    """
    Redefine a senha do usuário usando o código
    """
    from database import db
    
    logger.info(f"Redefinindo senha para: {request.email}")
    
    # Verificar código
    reset_request = await db.password_resets.find_one({
        "email": request.email,
        "code": request.code
    }, {"_id": 0})
    
    if not reset_request:
        raise HTTPException(status_code=400, detail="Código inválido")
    
    if datetime.utcnow() > reset_request["expires_at"]:
        await db.password_resets.delete_one({"email": request.email})
        raise HTTPException(status_code=400, detail="Código expirado. Solicite um novo.")
    
    # Validar senha
    if len(request.new_password) < 6:
        raise HTTPException(status_code=400, detail="A senha deve ter no mínimo 6 caracteres")
    
    # Hash da nova senha
    hashed_password = pwd_context.hash(request.new_password)
    
    # Atualizar senha do usuário
    result = await db.users.update_one(
        {"email": request.email},
        {"$set": {"hashed_password": hashed_password, "updated_at": datetime.utcnow()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    # Remover código usado
    await db.password_resets.delete_one({"email": request.email})
    
    logger.info(f"Senha redefinida com sucesso para {request.email}")
    
    return {
        "status": "success",
        "message": "Senha redefinida com sucesso!"
    }


# Manter endpoints antigos para compatibilidade
class VerifyTokenRequest(BaseModel):
    token: str

class ResetPasswordTokenRequest(BaseModel):
    token: str
    new_password: str

@router.post("/verify-token")
async def verify_token(request: VerifyTokenRequest):
    """Endpoint legado - redireciona para verificação por código"""
    raise HTTPException(status_code=400, detail="Use o código de 6 dígitos enviado por email")
