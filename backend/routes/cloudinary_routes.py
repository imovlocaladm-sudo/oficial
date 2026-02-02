"""
Cloudinary Integration - Upload de Imagens
Armazenamento permanente de imagens para ImovLocal
"""

import os
import time
import logging
import cloudinary
import cloudinary.uploader
import cloudinary.utils
from fastapi import APIRouter, HTTPException, Query, UploadFile, File
from dotenv import load_dotenv
from pathlib import Path

# Carregar variáveis de ambiente
ROOT_DIR = Path(__file__).parent.parent
load_dotenv(ROOT_DIR / '.env')

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/cloudinary", tags=["Cloudinary Upload"])

# Configuração do Cloudinary
CLOUDINARY_CLOUD_NAME = os.environ.get("CLOUDINARY_CLOUD_NAME")
CLOUDINARY_API_KEY = os.environ.get("CLOUDINARY_API_KEY")
CLOUDINARY_API_SECRET = os.environ.get("CLOUDINARY_API_SECRET")

# Inicializar Cloudinary se as credenciais existirem
if CLOUDINARY_CLOUD_NAME and CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET:
    cloudinary.config(
        cloud_name=CLOUDINARY_CLOUD_NAME,
        api_key=CLOUDINARY_API_KEY,
        api_secret=CLOUDINARY_API_SECRET,
        secure=True
    )
    logger.info("Cloudinary configurado com sucesso")
else:
    logger.warning("Cloudinary não configurado - credenciais ausentes")


def is_cloudinary_configured():
    """Verifica se o Cloudinary está configurado"""
    return bool(CLOUDINARY_CLOUD_NAME and CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET)


@router.get("/status")
async def cloudinary_status():
    """Verifica status da configuração do Cloudinary"""
    return {
        "configured": is_cloudinary_configured(),
        "cloud_name": CLOUDINARY_CLOUD_NAME if is_cloudinary_configured() else None
    }


@router.get("/signature")
async def generate_signature(
    resource_type: str = Query("image", enum=["image", "video"]),
    folder: str = Query("uploads")
):
    """
    Gera assinatura para upload direto do frontend para o Cloudinary
    """
    if not is_cloudinary_configured():
        raise HTTPException(status_code=503, detail="Cloudinary não configurado")
    
    # Pastas permitidas
    ALLOWED_FOLDERS = ("properties", "banners", "profiles", "receipts", "uploads")
    
    if not any(folder.startswith(f) for f in ALLOWED_FOLDERS):
        raise HTTPException(status_code=400, detail="Pasta não permitida")
    
    timestamp = int(time.time())
    params = {
        "timestamp": timestamp,
        "folder": f"imovlocal/{folder}",
        "resource_type": resource_type
    }
    
    signature = cloudinary.utils.api_sign_request(
        params,
        CLOUDINARY_API_SECRET
    )
    
    return {
        "signature": signature,
        "timestamp": timestamp,
        "cloud_name": CLOUDINARY_CLOUD_NAME,
        "api_key": CLOUDINARY_API_KEY,
        "folder": f"imovlocal/{folder}",
        "resource_type": resource_type
    }


@router.post("/upload")
async def upload_image(
    file: UploadFile = File(...),
    folder: str = Query("uploads")
):
    """
    Upload de imagem via backend (alternativa ao upload direto)
    """
    if not is_cloudinary_configured():
        raise HTTPException(status_code=503, detail="Cloudinary não configurado")
    
    # Verificar tipo de arquivo
    allowed_types = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Tipo de arquivo não permitido")
    
    # Verificar tamanho (max 10MB)
    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Arquivo muito grande (máx 10MB)")
    
    try:
        # Upload para Cloudinary
        result = cloudinary.uploader.upload(
            contents,
            folder=f"imovlocal/{folder}",
            resource_type="image",
            transformation=[
                {"quality": "auto", "fetch_format": "auto"}
            ]
        )
        
        logger.info(f"Imagem enviada para Cloudinary: {result.get('public_id')}")
        
        return {
            "success": True,
            "url": result.get("secure_url"),
            "public_id": result.get("public_id"),
            "width": result.get("width"),
            "height": result.get("height")
        }
        
    except Exception as e:
        logger.error(f"Erro no upload para Cloudinary: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro no upload: {str(e)}")


@router.delete("/delete")
async def delete_image(public_id: str):
    """
    Deleta uma imagem do Cloudinary
    """
    if not is_cloudinary_configured():
        raise HTTPException(status_code=503, detail="Cloudinary não configurado")
    
    # Verificar se o public_id pertence ao imovlocal
    if not public_id.startswith("imovlocal/"):
        raise HTTPException(status_code=400, detail="ID inválido")
    
    try:
        result = cloudinary.uploader.destroy(public_id, invalidate=True)
        
        if result.get("result") == "ok":
            logger.info(f"Imagem deletada do Cloudinary: {public_id}")
            return {"success": True, "message": "Imagem deletada"}
        else:
            return {"success": False, "message": "Imagem não encontrada"}
            
    except Exception as e:
        logger.error(f"Erro ao deletar do Cloudinary: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao deletar: {str(e)}")
