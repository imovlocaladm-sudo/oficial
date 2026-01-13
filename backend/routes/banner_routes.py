"""
Routes for Banner Management System
Sistema de Gerenciamento de Banners Publicitários
"""
from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File, Form
from typing import List, Optional
from models import Banner, BannerCreate, BannerUpdate, BannerPosition, BannerStatus
from middlewares.admin_middleware import get_current_admin
from database import db
from datetime import datetime
import uuid
import os
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/banners", tags=["banners"])

# Collections
banners_collection = db.banners

# Upload directory for banner images
UPLOAD_DIR = Path(__file__).parent.parent / "uploads" / "banners"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


async def save_banner_image(upload_file: UploadFile, banner_id: str) -> str:
    """Save a banner image and return its URL path"""
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if upload_file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tipo de arquivo não permitido. Use JPEG, PNG, WebP ou GIF."
        )
    
    # Generate unique filename
    file_extension = Path(upload_file.filename).suffix.lower()
    unique_filename = f"banner_{banner_id}{file_extension}"
    file_path = UPLOAD_DIR / unique_filename
    
    # Save file
    with open(file_path, "wb") as buffer:
        content = await upload_file.read()
        
        # Validate file size (max 5MB)
        if len(content) > 5 * 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Arquivo muito grande. O tamanho máximo é 5MB."
            )
        
        buffer.write(content)
    
    # Return relative path for the API
    return f"/api/uploads/banners/{unique_filename}"


# ==========================================
# PUBLIC ROUTES (Exibição de banners)
# ==========================================

@router.get("/active", response_model=List[Banner])
async def get_active_banners(position: Optional[str] = None):
    """
    Obter banners ativos para exibição pública
    Pode filtrar por posição específica
    """
    query = {"status": BannerStatus.active.value}
    
    if position:
        query["position"] = position
    
    # Buscar banners ativos ordenados por 'order'
    banners = await banners_collection.find(query).sort("order", 1).to_list(100)
    
    return [Banner(**{k: v for k, v in banner.items() if k != '_id'}) for banner in banners]


@router.post("/{banner_id}/view")
async def increment_banner_view(banner_id: str):
    """Incrementar contador de visualizações (chamado quando banner é exibido)"""
    result = await banners_collection.update_one(
        {"id": banner_id},
        {"$inc": {"views": 1}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Banner não encontrado")
    
    return {"message": "View registrada"}


@router.post("/{banner_id}/click")
async def increment_banner_click(banner_id: str):
    """Incrementar contador de cliques (chamado quando usuário clica no banner)"""
    result = await banners_collection.update_one(
        {"id": banner_id},
        {"$inc": {"clicks": 1}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Banner não encontrado")
    
    return {"message": "Click registrado"}


# ==========================================
# ADMIN ROUTES (Gerenciamento de banners)
# ==========================================

@router.get("/admin/all", response_model=List[Banner])
async def get_all_banners_admin(
    position: Optional[str] = None,
    admin=Depends(get_current_admin)
):
    """Listar todos os banners (Admin only)"""
    query = {}
    if position:
        query["position"] = position
    
    banners = await banners_collection.find(query).sort("position", 1).sort("order", 1).to_list(100)
    return [Banner(**{k: v for k, v in banner.items() if k != '_id'}) for banner in banners]


@router.post("/admin/create", response_model=Banner, status_code=status.HTTP_201_CREATED)
async def create_banner(
    title: str = Form(...),
    link_url: str = Form(...),
    position: str = Form(...),
    order: int = Form(0),
    status: str = Form("active"),
    image: UploadFile = File(...),
    admin=Depends(get_current_admin)
):
    """
    Criar um novo banner (Admin only)
    Requer upload de imagem
    """
    # Validate position
    try:
        banner_position = BannerPosition(position)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Posição inválida. Use: {', '.join([p.value for p in BannerPosition])}"
        )
    
    # Validate status
    try:
        banner_status = BannerStatus(status)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Status inválido. Use: active ou inactive"
        )
    
    # Generate banner ID
    banner_id = str(uuid.uuid4())
    
    # Save image
    try:
        image_url = await save_banner_image(image, banner_id)
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error saving banner image: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao salvar imagem do banner"
        )
    
    # Create banner document
    banner_doc = {
        "id": banner_id,
        "title": title,
        "image_url": image_url,
        "link_url": link_url,
        "position": banner_position.value,
        "order": order,
        "status": banner_status.value,
        "clicks": 0,
        "views": 0,
        "created_at": datetime.utcnow(),
        "updated_at": None
    }
    
    await banners_collection.insert_one(banner_doc)
    logger.info(f"Banner created: {banner_id} - {title}")
    
    return Banner(**{k: v for k, v in banner_doc.items() if k != '_id'})


@router.put("/admin/{banner_id}", response_model=Banner)
async def update_banner(
    banner_id: str,
    title: Optional[str] = Form(None),
    link_url: Optional[str] = Form(None),
    position: Optional[str] = Form(None),
    order: Optional[int] = Form(None),
    status: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    admin=Depends(get_current_admin)
):
    """
    Atualizar um banner existente (Admin only)
    Todos os campos são opcionais
    """
    # Check if banner exists
    banner = await banners_collection.find_one({"id": banner_id})
    if not banner:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Banner não encontrado"
        )
    
    # Build update document
    update_data = {}
    
    if title is not None:
        update_data["title"] = title
    
    if link_url is not None:
        update_data["link_url"] = link_url
    
    if position is not None:
        try:
            banner_position = BannerPosition(position)
            update_data["position"] = banner_position.value
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Posição inválida. Use: {', '.join([p.value for p in BannerPosition])}"
            )
    
    if order is not None:
        update_data["order"] = order
    
    if status is not None:
        try:
            banner_status = BannerStatus(status)
            update_data["status"] = banner_status.value
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Status inválido. Use: active ou inactive"
            )
    
    # Update image if provided
    if image and image.filename:
        try:
            # Delete old image
            old_image_path = banner["image_url"].replace("/api/", "")
            old_file = Path(__file__).parent.parent / old_image_path
            if old_file.exists():
                old_file.unlink()
            
            # Save new image
            image_url = await save_banner_image(image, banner_id)
            update_data["image_url"] = image_url
        except Exception as e:
            logger.error(f"Error updating banner image: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Erro ao atualizar imagem do banner"
            )
    
    if update_data:
        update_data["updated_at"] = datetime.utcnow()
        
        await banners_collection.update_one(
            {"id": banner_id},
            {"$set": update_data}
        )
        
        logger.info(f"Banner updated: {banner_id}")
    
    # Get updated banner
    updated_banner = await banners_collection.find_one({"id": banner_id})
    return Banner(**{k: v for k, v in updated_banner.items() if k != '_id'})


@router.delete("/admin/{banner_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_banner(banner_id: str, admin=Depends(get_current_admin)):
    """Deletar um banner (Admin only)"""
    # Get banner to delete image file
    banner = await banners_collection.find_one({"id": banner_id})
    if not banner:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Banner não encontrado"
        )
    
    # Delete image file
    try:
        image_path = banner["image_url"].replace("/api/", "")
        file_path = Path(__file__).parent.parent / image_path
        if file_path.exists():
            file_path.unlink()
    except Exception as e:
        logger.warning(f"Could not delete banner image: {e}")
    
    # Delete banner from database
    await banners_collection.delete_one({"id": banner_id})
    logger.info(f"Banner deleted: {banner_id}")
    
    return None


@router.get("/admin/{banner_id}/stats")
async def get_banner_stats(banner_id: str, admin=Depends(get_current_admin)):
    """Obter estatísticas de um banner (Admin only)"""
    banner = await banners_collection.find_one({"id": banner_id})
    if not banner:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Banner não encontrado"
        )
    
    # Calculate CTR (Click-Through Rate)
    ctr = 0
    if banner["views"] > 0:
        ctr = (banner["clicks"] / banner["views"]) * 100
    
    return {
        "banner_id": banner_id,
        "title": banner["title"],
        "views": banner["views"],
        "clicks": banner["clicks"],
        "ctr": round(ctr, 2),
        "status": banner["status"],
        "position": banner["position"],
        "created_at": banner["created_at"]
    }
