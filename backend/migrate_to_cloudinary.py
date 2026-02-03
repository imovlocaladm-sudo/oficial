#!/usr/bin/env python3
"""
Script de Migração de Imagens para Cloudinary
Migra todas as imagens locais (/uploads/) para o Cloudinary
e atualiza os URLs no banco de dados.
"""

import os
import sys
import logging
from pathlib import Path
from dotenv import load_dotenv
from pymongo import MongoClient
import cloudinary
import cloudinary.uploader

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv(Path(__file__).parent / '.env')

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'test_database')

# Cloudinary configuration
CLOUDINARY_CLOUD_NAME = os.environ.get('CLOUDINARY_CLOUD_NAME')
CLOUDINARY_API_KEY = os.environ.get('CLOUDINARY_API_KEY')
CLOUDINARY_API_SECRET = os.environ.get('CLOUDINARY_API_SECRET')

# Base path for uploads
UPLOAD_BASE_PATH = Path(__file__).parent / 'uploads'


def setup_cloudinary():
    """Configure Cloudinary SDK"""
    if not all([CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET]):
        logger.error("Cloudinary credentials not configured!")
        return False
    
    cloudinary.config(
        cloud_name=CLOUDINARY_CLOUD_NAME,
        api_key=CLOUDINARY_API_KEY,
        api_secret=CLOUDINARY_API_SECRET,
        secure=True
    )
    logger.info(f"Cloudinary configured with cloud: {CLOUDINARY_CLOUD_NAME}")
    return True


def is_local_url(url: str) -> bool:
    """Check if URL is a local path that needs migration"""
    if not url:
        return False
    return url.startswith('/api/uploads/') or url.startswith('/uploads/')


def get_local_file_path(url: str) -> Path:
    """Convert URL to local file path"""
    # Remove /api prefix if present
    clean_path = url.replace('/api/uploads/', '').replace('/uploads/', '')
    return UPLOAD_BASE_PATH / clean_path


def upload_to_cloudinary(local_path: Path, folder: str) -> str:
    """Upload a local file to Cloudinary and return the secure URL"""
    if not local_path.exists():
        logger.warning(f"File not found: {local_path}")
        return None
    
    try:
        with open(local_path, 'rb') as f:
            result = cloudinary.uploader.upload(
                f,
                folder=f"imovlocal/{folder}",
                resource_type="image",
                transformation=[
                    {"quality": "auto", "fetch_format": "auto"}
                ]
            )
            return result.get('secure_url')
    except Exception as e:
        logger.error(f"Error uploading {local_path}: {e}")
        return None


def migrate_properties(db):
    """Migrate all property images"""
    logger.info("\n=== Migrando imagens de PROPRIEDADES ===")
    
    properties = list(db.properties.find({'images': {'$exists': True, '$ne': []}}))
    total = len(properties)
    migrated = 0
    skipped = 0
    failed = 0
    
    for i, prop in enumerate(properties, 1):
        prop_id = prop.get('id', 'unknown')
        title = prop.get('title', 'Sem título')[:30]
        images = prop.get('images', [])
        
        logger.info(f"[{i}/{total}] Processando: {title}...")
        
        new_images = []
        needs_update = False
        
        for img_url in images:
            if is_local_url(img_url):
                local_path = get_local_file_path(img_url)
                cloudinary_url = upload_to_cloudinary(local_path, f"properties/{prop_id}")
                
                if cloudinary_url:
                    new_images.append(cloudinary_url)
                    needs_update = True
                    logger.info(f"  ✅ Migrado: {local_path.name}")
                else:
                    # Keep original URL if migration fails
                    new_images.append(img_url)
                    failed += 1
                    logger.warning(f"  ❌ Falhou: {img_url}")
            else:
                # Already a Cloudinary URL
                new_images.append(img_url)
                skipped += 1
        
        if needs_update:
            db.properties.update_one(
                {'id': prop_id},
                {'$set': {'images': new_images}}
            )
            migrated += 1
    
    logger.info(f"\nPropriedades: {migrated} migradas, {skipped} já no Cloudinary, {failed} falhas")
    return migrated, failed


def migrate_banners(db):
    """Migrate all banner images"""
    logger.info("\n=== Migrando imagens de BANNERS ===")
    
    banners = list(db.banners.find({'image_url': {'$exists': True}}))
    total = len(banners)
    migrated = 0
    skipped = 0
    failed = 0
    
    for i, banner in enumerate(banners, 1):
        banner_id = banner.get('id', 'unknown')
        title = banner.get('title', 'Sem título')[:30]
        img_url = banner.get('image_url', '')
        
        logger.info(f"[{i}/{total}] Banner: {title}...")
        
        if is_local_url(img_url):
            local_path = get_local_file_path(img_url)
            cloudinary_url = upload_to_cloudinary(local_path, "banners")
            
            if cloudinary_url:
                db.banners.update_one(
                    {'id': banner_id},
                    {'$set': {'image_url': cloudinary_url}}
                )
                migrated += 1
                logger.info(f"  ✅ Migrado: {local_path.name}")
            else:
                failed += 1
                logger.warning(f"  ❌ Falhou: {img_url}")
        else:
            skipped += 1
            logger.info(f"  ⏭️ Já no Cloudinary")
    
    logger.info(f"\nBanners: {migrated} migrados, {skipped} já no Cloudinary, {failed} falhas")
    return migrated, failed


def migrate_user_photos(db):
    """Migrate user profile photos"""
    logger.info("\n=== Migrando FOTOS DE PERFIL ===")
    
    users = list(db.users.find({'profile_photo': {'$exists': True, '$ne': None}}))
    total = len(users)
    migrated = 0
    skipped = 0
    failed = 0
    
    for i, user in enumerate(users, 1):
        user_id = user.get('id', 'unknown')
        name = user.get('name', 'Sem nome')[:30]
        photo_url = user.get('profile_photo', '')
        
        logger.info(f"[{i}/{total}] Usuário: {name}...")
        
        if is_local_url(photo_url):
            local_path = get_local_file_path(photo_url)
            cloudinary_url = upload_to_cloudinary(local_path, f"profiles/{user_id}")
            
            if cloudinary_url:
                db.users.update_one(
                    {'id': user_id},
                    {'$set': {'profile_photo': cloudinary_url}}
                )
                migrated += 1
                logger.info(f"  ✅ Migrado: {local_path.name}")
            else:
                failed += 1
                logger.warning(f"  ❌ Falhou: {photo_url}")
        else:
            skipped += 1
            logger.info(f"  ⏭️ Já no Cloudinary")
    
    logger.info(f"\nUsuários: {migrated} migrados, {skipped} já no Cloudinary, {failed} falhas")
    return migrated, failed


def main():
    """Main migration function"""
    logger.info("=" * 60)
    logger.info("INICIANDO MIGRAÇÃO DE IMAGENS PARA CLOUDINARY")
    logger.info("=" * 60)
    
    # Setup Cloudinary
    if not setup_cloudinary():
        logger.error("Falha na configuração do Cloudinary. Abortando.")
        sys.exit(1)
    
    # Connect to MongoDB
    logger.info(f"Conectando ao MongoDB: {MONGO_URL}")
    client = MongoClient(MONGO_URL)
    db = client[DB_NAME]
    
    # Test connection
    try:
        db.command('ping')
        logger.info("✅ Conexão com MongoDB OK")
    except Exception as e:
        logger.error(f"❌ Falha na conexão com MongoDB: {e}")
        sys.exit(1)
    
    # Run migrations
    total_migrated = 0
    total_failed = 0
    
    migrated, failed = migrate_properties(db)
    total_migrated += migrated
    total_failed += failed
    
    migrated, failed = migrate_banners(db)
    total_migrated += migrated
    total_failed += failed
    
    migrated, failed = migrate_user_photos(db)
    total_migrated += migrated
    total_failed += failed
    
    # Summary
    logger.info("\n" + "=" * 60)
    logger.info("MIGRAÇÃO CONCLUÍDA")
    logger.info("=" * 60)
    logger.info(f"Total migrado: {total_migrated}")
    logger.info(f"Total de falhas: {total_failed}")
    
    if total_failed > 0:
        logger.warning("⚠️ Algumas imagens não puderam ser migradas (arquivos não encontrados)")
    else:
        logger.info("✅ Todas as imagens foram migradas com sucesso!")
    
    client.close()


if __name__ == "__main__":
    main()
