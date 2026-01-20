"""
Script to create lifetime test users for ImovLocal
Fase 1: Preparação e Configuração
- Tarefa 1.1: Criação dos usuários de teste (Particular e Corretor) no banco de dados
- Tarefa 1.2: Atribuição do status "Acesso Vitalício" a esses usuários
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path
from passlib.context import CryptContext
import uuid
from datetime import datetime

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
db_name = os.environ['DB_NAME']

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Usuários de teste com acesso vitalício
LIFETIME_TEST_USERS = [
    {
        "id": "lifetime-particular-001",
        "name": "Teste Particular Vitalício",
        "email": "particular.vitalicio@imovlocal.com",
        "phone": "(67) 99999-0001",
        "cpf": "11111111111",
        "city": "Campo Grande",
        "state": "MS",
        "user_type": "particular",
        "creci": None,
        "company": None,
        "status": "active",
        "plan_type": "lifetime",  # Acesso vitalício
        "plan_expires_at": None,  # Nunca expira
        "profile_photo": None,
        "bio": "Usuário de teste com acesso vitalício - Particular",
        "hashed_password": pwd_context.hash("Vitalicio@2026"),
        "created_at": datetime.utcnow()
    },
    {
        "id": "lifetime-corretor-001",
        "name": "Teste Corretor Vitalício",
        "email": "corretor.vitalicio@imovlocal.com",
        "phone": "(67) 99999-0002",
        "cpf": "22222222222",
        "city": "Campo Grande",
        "state": "MS",
        "user_type": "corretor",
        "creci": "CRECI-TEST-001",
        "company": "Imobiliária Teste Vitalício",
        "status": "active",
        "plan_type": "lifetime",  # Acesso vitalício
        "plan_expires_at": None,  # Nunca expira
        "profile_photo": None,
        "bio": "Corretor de imóveis certificado com mais de 10 anos de experiência no mercado imobiliário. Especialista em imóveis residenciais e comerciais na região de Campo Grande/MS.",
        "hashed_password": pwd_context.hash("Vitalicio@2026"),
        "created_at": datetime.utcnow()
    }
]

async def create_lifetime_users():
    print("🎯 Criando usuários de teste com Acesso Vitalício...")
    print("=" * 60)
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    users_collection = db.users
    
    created_count = 0
    updated_count = 0
    
    for user_data in LIFETIME_TEST_USERS:
        existing = await users_collection.find_one({"email": user_data["email"]})
        
        if existing:
            # Atualizar para vitalício se já existe
            await users_collection.update_one(
                {"email": user_data["email"]},
                {"$set": {
                    "plan_type": "lifetime",
                    "plan_expires_at": None,
                    "status": "active"
                }}
            )
            print(f"   🔄 Atualizado para VITALÍCIO: {user_data['name']} ({user_data['email']})")
            updated_count += 1
        else:
            # Criar novo usuário
            await users_collection.insert_one(user_data)
            print(f"   ✅ Criado: {user_data['name']} ({user_data['email']})")
            created_count += 1
    
    print("\n" + "=" * 60)
    print("📋 CREDENCIAIS DOS USUÁRIOS DE TESTE VITALÍCIOS")
    print("=" * 60)
    
    print("\n👤 USUÁRIO PARTICULAR VITALÍCIO:")
    print(f"   📧 Email:  particular.vitalicio@imovlocal.com")
    print(f"   🔑 Senha:  Vitalicio@2026")
    print(f"   📱 Tel:    (67) 99999-0001")
    print(f"   ⭐ Plano:  VITALÍCIO (nunca expira)")
    
    print("\n🏢 USUÁRIO CORRETOR VITALÍCIO:")
    print(f"   📧 Email:  corretor.vitalicio@imovlocal.com")
    print(f"   🔑 Senha:  Vitalicio@2026")
    print(f"   📱 Tel:    (67) 99999-0002")
    print(f"   📝 CRECI:  CRECI-TEST-001")
    print(f"   ⭐ Plano:  VITALÍCIO (nunca expira)")
    
    print("\n" + "=" * 60)
    print(f"📊 Resumo: {created_count} criado(s), {updated_count} atualizado(s)")
    print("=" * 60)
    
    client.close()
    print("\n✅ Usuários de teste vitalícios configurados com sucesso!")

if __name__ == "__main__":
    asyncio.run(create_lifetime_users())
