"""
Script to seed the database with sample banners
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path
import uuid
from datetime import datetime

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
db_name = os.environ['DB_NAME']

# Sample banners data
SAMPLE_BANNERS = [
    {
        "id": str(uuid.uuid4()),
        "title": "Banner Exemplo - Topo da Home",
        "image_url": "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&h=300&fit=crop",
        "link_url": "https://www.exemplo.com.br",
        "position": "home_topo",
        "order": 0,
        "status": "active",
        "clicks": 0,
        "views": 0,
        "created_at": datetime.utcnow(),
        "updated_at": None
    },
    {
        "id": str(uuid.uuid4()),
        "title": "Banner Exemplo - Meio da Home",
        "image_url": "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=800&h=400&fit=crop",
        "link_url": "https://www.exemplo.com.br/ofertas",
        "position": "home_meio",
        "order": 0,
        "status": "active",
        "clicks": 0,
        "views": 0,
        "created_at": datetime.utcnow(),
        "updated_at": None
    },
    {
        "id": str(uuid.uuid4()),
        "title": "Banner Exemplo - Lateral Busca",
        "image_url": "https://images.unsplash.com/photo-1560184897-ae75f418493e?w=400&h=600&fit=crop",
        "link_url": "https://www.exemplo.com.br/contato",
        "position": "busca_lateral",
        "order": 0,
        "status": "active",
        "clicks": 0,
        "views": 0,
        "created_at": datetime.utcnow(),
        "updated_at": None
    }
]

async def seed_banners():
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print("🎨 Starting banners seeding...")
    
    # Delete existing sample banners (com títulos "Banner Exemplo")
    deleted = await db.banners.delete_many({"title": {"$regex": "^Banner Exemplo"}})
    print(f"🗑️  Deleted {deleted.deleted_count} existing sample banners")
    
    # Insert new sample banners
    result = await db.banners.insert_many(SAMPLE_BANNERS)
    print(f"✓ Inserted {len(result.inserted_ids)} sample banners\n")
    
    # Show summary
    total_banners = await db.banners.count_documents({})
    print(f"📊 Database Summary:")
    print(f"   Total banners: {total_banners}\n")
    
    print("=" * 50)
    print("📋 SAMPLE BANNERS CREATED")
    print("=" * 50)
    for banner in SAMPLE_BANNERS:
        print(f"\n📍 {banner['title']}")
        print(f"   Position: {banner['position']}")
        print(f"   Status: {banner['status']}")
        print(f"   Link: {banner['link_url']}")
    print("=" * 50)
    
    print("\n✅ Banners seeding completed!")
    print("\n💡 Dica: Acesse /admin/master/banners para gerenciar os banners")
    print("   ou adicione banners personalizados com suas próprias imagens!\n")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_banners())
