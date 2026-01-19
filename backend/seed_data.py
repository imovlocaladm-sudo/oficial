"""
Script to seed the database with sample properties and test user
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path
import uuid
from datetime import datetime
from passlib.context import CryptContext

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
db_name = os.environ['DB_NAME']

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Test user data
TEST_USER = {
    "id": "test-corretor-001",
    "name": "João Silva Imóveis",
    "email": "joao@imovlocal.com",
    "phone": "(67) 99999-1234",
    "cpf": "12345678901",
    "city": "Campo Grande",
    "state": "MS",
    "user_type": "corretor",
    "creci": "12345-MS",
    "company": "JS Imóveis",
    "status": "active",
    "hashed_password": pwd_context.hash("Teste@123"),
    "created_at": datetime.utcnow()
}

TEST_USER_2 = {
    "id": "test-particular-001",
    "name": "Maria Santos",
    "email": "maria@email.com",
    "phone": "(67) 98888-5678",
    "cpf": "98765432101",
    "city": "Dourados",
    "state": "MS",
    "user_type": "particular",
    "creci": None,
    "company": None,
    "status": "active",
    "hashed_password": pwd_context.hash("Teste@123"),
    "created_at": datetime.utcnow()
}

# Sample properties data
SAMPLE_PROPERTIES = [
    {
        "id": str(uuid.uuid4()),
        "title": "Edifício Atlanta - 9º andar",
        "description": "Excelente apartamento localizado em São Francisco, uma das regiões mais valorizadas de Campo Grande. Acabamento de primeira qualidade, vista panorâmica da cidade.",
        "property_type": "Apartamento",
        "purpose": "VENDA",
        "price": 540000,
        "neighborhood": "São Francisco",
        "city": "Campo Grande",
        "state": "MS",
        "bedrooms": 3,
        "bathrooms": 2,
        "area": 120,
        "garage": 2,
        "year_built": 2020,
        "iptu": 1200,
        "features": ["Sala de estar ampla", "Cozinha planejada", "Sacada com churrasqueira", "Piscina", "Academia"],
        "images": ["https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=600&fit=crop"],
        "is_launch": False,
        "owner_id": "test-corretor-001",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    },
    {
        "id": str(uuid.uuid4()),
        "title": "Edifício Creta - andar alto - nascente",
        "description": "Apartamento de alto padrão com vista privilegiada. Posição nascente, sol da manhã. Condomínio completo com área de lazer.",
        "property_type": "Apartamento",
        "purpose": "VENDA",
        "price": 995000,
        "neighborhood": "São Francisco",
        "city": "Campo Grande",
        "state": "MS",
        "bedrooms": 4,
        "bathrooms": 3,
        "area": 180,
        "garage": 3,
        "year_built": 2021,
        "iptu": 2500,
        "features": ["Sala de estar ampla", "Cozinha gourmet", "Área de serviço", "Academia", "Salão de festas", "Piscina aquecida"],
        "images": ["https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop"],
        "is_launch": False,
        "owner_id": "test-corretor-001",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    },
    {
        "id": str(uuid.uuid4()),
        "title": "Sobrado com 3 quartos - mobiliado em Bonito/MS",
        "description": "Sobrado completo e mobiliado em condomínio fechado. Perfeito para quem busca tranquilidade na região turística de Bonito.",
        "property_type": "Sobrado",
        "purpose": "ALUGUEL",
        "price": 3400,
        "neighborhood": "Vila Donária",
        "city": "Bonito",
        "state": "MS",
        "bedrooms": 3,
        "bathrooms": 2,
        "area": 150,
        "garage": 2,
        "year_built": 2019,
        "condominio": 450,
        "iptu": 800,
        "features": ["Mobiliado", "Área gourmet", "Quintal", "Portaria 24h", "Segurança"],
        "images": ["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop"],
        "is_launch": False,
        "owner_id": "test-corretor-001",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    },
    {
        "id": str(uuid.uuid4()),
        "title": "Casa moderna - bom gosto",
        "description": "Casa térrea moderna com excelente acabamento em Dourados. Projeto arquitetônico diferenciado.",
        "property_type": "Casa-Térrea",
        "purpose": "VENDA",
        "price": 600000,
        "neighborhood": "Jardim Monte Alegre",
        "city": "Dourados",
        "state": "MS",
        "bedrooms": 3,
        "bathrooms": 2,
        "area": 200,
        "garage": 2,
        "year_built": 2022,
        "iptu": 1500,
        "features": ["Design moderno", "Churrasqueira", "Piscina", "Quintal amplo", "Energia solar"],
        "images": ["https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop"],
        "is_launch": False,
        "owner_id": "test-particular-001",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    },
    {
        "id": str(uuid.uuid4()),
        "title": "Fino com preço de popular",
        "description": "Lançamento: apartamento com acabamento fino e preço acessível. Oportunidade única!",
        "property_type": "Apartamento",
        "purpose": "VENDA",
        "price": 340000,
        "neighborhood": "São Francisco",
        "city": "Campo Grande",
        "state": "MS",
        "bedrooms": 2,
        "bathrooms": 1,
        "area": 65,
        "garage": 1,
        "year_built": 2025,
        "iptu": 800,
        "features": ["Lançamento", "Área de lazer completa", "Localização privilegiada", "Financiamento facilitado"],
        "images": ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop"],
        "is_launch": True,
        "owner_id": "test-corretor-001",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    },
    {
        "id": str(uuid.uuid4()),
        "title": "Vittoria Park Residence",
        "description": "Lançamento exclusivo com infraestrutura completa. Condomínio clube com mais de 15 itens de lazer.",
        "property_type": "Apartamento",
        "purpose": "VENDA",
        "price": 726804,
        "neighborhood": "São Francisco",
        "city": "Campo Grande",
        "state": "MS",
        "bedrooms": 3,
        "bathrooms": 2,
        "area": 95,
        "garage": 2,
        "year_built": 2025,
        "iptu": 1200,
        "features": ["Lançamento", "Academia", "Piscina", "Playground", "Salão de festas", "Espaço pet"],
        "images": ["https://images.unsplash.com/photo-1515263487990-61b07816b324?w=800&h=600&fit=crop"],
        "is_launch": True,
        "owner_id": "test-corretor-001",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    },
    {
        "id": str(uuid.uuid4()),
        "title": "Sala comercial no centro",
        "description": "Sala comercial em localização estratégica no centro de Campo Grande. Ideal para escritório ou consultório.",
        "property_type": "Sala / Salão / Loja",
        "purpose": "ALUGUEL",
        "price": 2500,
        "neighborhood": "Centro",
        "city": "Campo Grande",
        "state": "MS",
        "bedrooms": 0,
        "bathrooms": 1,
        "area": 45,
        "garage": 1,
        "year_built": 2018,
        "condominio": 350,
        "iptu": 600,
        "features": ["Ar condicionado", "Recepção", "Copa", "Estacionamento rotativo"],
        "images": ["https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop"],
        "is_launch": False,
        "owner_id": "test-particular-001",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    },
    {
        "id": str(uuid.uuid4()),
        "title": "Terreno em condomínio fechado",
        "description": "Excelente terreno em condomínio fechado com infraestrutura completa. Pronto para construir.",
        "property_type": "Terreno-Condomínio",
        "purpose": "VENDA",
        "price": 280000,
        "neighborhood": "Jardim Veraneio",
        "city": "Campo Grande",
        "state": "MS",
        "bedrooms": None,
        "bathrooms": None,
        "area": 450,
        "garage": None,
        "year_built": None,
        "condominio": 250,
        "iptu": 500,
        "features": ["Condomínio fechado", "Portaria 24h", "Área verde", "Próximo ao shopping"],
        "images": ["https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&h=600&fit=crop"],
        "is_launch": False,
        "owner_id": "test-corretor-001",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
]

async def seed_database():
    print("🌱 Starting database seeding...")
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    users_collection = db.users
    properties_collection = db.properties
    
    # Create test users
    print("\n👤 Creating test users...")
    
    for user_data in [TEST_USER, TEST_USER_2]:
        existing = await users_collection.find_one({"email": user_data["email"]})
        if existing:
            print(f"   ⚠️  User {user_data['email']} already exists")
        else:
            await users_collection.insert_one(user_data)
            print(f"   ✓ Created user: {user_data['name']} ({user_data['email']})")
    
    # Clear existing sample properties
    result = await properties_collection.delete_many({
        "owner_id": {"$in": ["system", "test-corretor-001", "test-particular-001"]}
    })
    print(f"\n🗑️  Deleted {result.deleted_count} existing sample properties")
    
    # Insert sample properties
    result = await properties_collection.insert_many(SAMPLE_PROPERTIES)
    print(f"✓ Inserted {len(result.inserted_ids)} sample properties")
    
    # Show summary
    total_users = await users_collection.count_documents({})
    total_properties = await properties_collection.count_documents({})
    
    print(f"\n📊 Database Summary:")
    print(f"   Total users: {total_users}")
    print(f"   Total properties: {total_properties}")
    
    print("\n" + "="*50)
    print("📋 TEST CREDENTIALS")
    print("="*50)
    print(f"\n🏢 Corretor:")
    print(f"   Email: joao@imovlocal.com")
    print(f"   Senha: Teste@123")
    print(f"   Tel:   (67) 99999-1234")
    print(f"\n👤 Particular:")
    print(f"   Email: maria@email.com")
    print(f"   Senha: Teste@123")
    print(f"   Tel:   (67) 98888-5678")
    print(f"\n👑 Admin:")
    print(f"   Email: admin@imovlocal.com")
    print(f"   Senha: Master@2025")
    print("="*50)
    
    client.close()
    print("\n✅ Database seeding completed!")

if __name__ == "__main__":
    asyncio.run(seed_database())
