"""
Script para criar TODOS os usuários de teste do ImovLocal
Incluindo Admin, Corretores, Imobiliária e Particulares
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

mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'imovlocal_db')

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Lista completa de usuários de teste
ALL_TEST_USERS = [
    # 👑 ADMIN MASTER
    {
        "id": str(uuid.uuid4()),
        "name": "Administrador Master",
        "email": "admin@imovlocal.com",
        "phone": "(67) 99999-0000",
        "cpf": "00000000000",
        "city": "Campo Grande",
        "state": "MS",
        "user_type": "admin",
        "creci": None,
        "company": "ImovLocal",
        "cnpj": None,
        "razao_social": None,
        "status": "active",
        "plan_type": "free",
        "plan_expires_at": None,
        "profile_photo": None,
        "bio": "Administrador Master do sistema ImovLocal",
        "hashed_password": pwd_context.hash("Master@2025"),
        "created_at": datetime.utcnow()
    },
    
    # 👔 CORRETOR TESTE (FREE)
    {
        "id": str(uuid.uuid4()),
        "name": "Carlos Corretor",
        "email": "corretor.teste@imovlocal.com",
        "phone": "(67) 99999-1111",
        "cpf": "11111111111",
        "city": "Campo Grande",
        "state": "MS",
        "user_type": "corretor",
        "creci": "CRECI-MS 12345",
        "company": "Imobiliária Corretor & Cia",
        "cnpj": None,
        "razao_social": None,
        "status": "active",
        "plan_type": "free",
        "plan_expires_at": None,
        "profile_photo": None,
        "bio": "Corretor de imóveis com experiência em vendas e locações na região de Campo Grande",
        "hashed_password": pwd_context.hash("Teste@123"),
        "created_at": datetime.utcnow()
    },
    
    # 👔 CORRETOR VITALÍCIO
    {
        "id": str(uuid.uuid4()),
        "name": "Teste Corretor Vitalício",
        "email": "corretor.vitalicio@imovlocal.com",
        "phone": "(67) 99999-0002",
        "cpf": "22222222222",
        "city": "Campo Grande",
        "state": "MS",
        "user_type": "corretor",
        "creci": "CRECI-TEST-001",
        "company": "Imobiliária Teste Vitalício",
        "cnpj": None,
        "razao_social": None,
        "status": "active",
        "plan_type": "lifetime",  # ⭐ VITALÍCIO
        "plan_expires_at": None,
        "profile_photo": None,
        "bio": "Corretor de imóveis certificado com mais de 10 anos de experiência no mercado imobiliário. Especialista em imóveis residenciais e comerciais na região de Campo Grande/MS.",
        "hashed_password": pwd_context.hash("Vitalicio@2026"),
        "created_at": datetime.utcnow()
    },
    
    # 🏢 IMOBILIÁRIA VITALÍCIA
    {
        "id": str(uuid.uuid4()),
        "name": "ImovLocal Imobiliária Teste",
        "email": "imobiliaria.vitalicia@imovlocal.com",
        "phone": "(67) 3025-9999",
        "cpf": "33333333333",  # Pode ter CPF do responsável
        "city": "Campo Grande",
        "state": "MS",
        "user_type": "imobiliaria",
        "creci": "CRECI 99999-MS",
        "company": "ImovLocal Imobiliária Teste LTDA",
        "cnpj": "12.345.678/0001-99",
        "razao_social": "ImovLocal Imobiliária Teste LTDA",
        "status": "active",
        "plan_type": "lifetime",  # ⭐ VITALÍCIO
        "plan_expires_at": None,
        "profile_photo": None,
        "bio": "Imobiliária com mais de 15 anos de atuação no mercado. Oferecemos soluções completas em compra, venda e locação de imóveis.",
        "hashed_password": pwd_context.hash("Vitalicio@2026"),
        "created_at": datetime.utcnow()
    },
    
    # 👤 PARTICULAR TESTE (FREE)
    {
        "id": str(uuid.uuid4()),
        "name": "Ana Particular",
        "email": "particular.teste@imovlocal.com",
        "phone": "(67) 99999-2222",
        "cpf": "44444444444",
        "city": "Campo Grande",
        "state": "MS",
        "user_type": "particular",
        "creci": None,
        "company": None,
        "cnpj": None,
        "razao_social": None,
        "status": "active",
        "plan_type": "free",
        "plan_expires_at": None,
        "profile_photo": None,
        "bio": None,
        "hashed_password": pwd_context.hash("Teste@456"),
        "created_at": datetime.utcnow()
    },
    
    # 👤 PARTICULAR VITALÍCIO
    {
        "id": str(uuid.uuid4()),
        "name": "Teste Particular Vitalício",
        "email": "particular.vitalicio@imovlocal.com",
        "phone": "(67) 99999-0001",
        "cpf": "55555555555",
        "city": "Campo Grande",
        "state": "MS",
        "user_type": "particular",
        "creci": None,
        "company": None,
        "cnpj": None,
        "razao_social": None,
        "status": "active",
        "plan_type": "lifetime",  # ⭐ VITALÍCIO
        "plan_expires_at": None,
        "profile_photo": None,
        "bio": "Usuário de teste com acesso vitalício - Particular",
        "hashed_password": pwd_context.hash("Vitalicio@2026"),
        "created_at": datetime.utcnow()
    }
]

async def create_all_test_users():
    """Criar todos os usuários de teste"""
    print("\n" + "=" * 70)
    print("🎯 CRIANDO TODOS OS USUÁRIOS DE TESTE - ImovLocal")
    print("=" * 70 + "\n")
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    users_collection = db.users
    
    created_count = 0
    updated_count = 0
    existing_count = 0
    
    for user_data in ALL_TEST_USERS:
        existing = await users_collection.find_one({"email": user_data["email"]})
        
        if existing:
            # Atualizar usuário existente (especialmente importante para vitalícios)
            if user_data["plan_type"] == "lifetime":
                await users_collection.update_one(
                    {"email": user_data["email"]},
                    {"$set": {
                        "plan_type": "lifetime",
                        "plan_expires_at": None,
                        "status": "active",
                        "name": user_data["name"],
                        "creci": user_data.get("creci"),
                        "company": user_data.get("company"),
                        "bio": user_data.get("bio")
                    }}
                )
                print(f"   🔄 Atualizado para VITALÍCIO: {user_data['name']} ({user_data['email']})")
                updated_count += 1
            else:
                print(f"   ℹ️  Já existe: {user_data['name']} ({user_data['email']})")
                existing_count += 1
        else:
            # Criar novo usuário
            await users_collection.insert_one(user_data)
            plan_label = "⭐ VITALÍCIO" if user_data["plan_type"] == "lifetime" else "FREE"
            print(f"   ✅ Criado [{plan_label}]: {user_data['name']} ({user_data['email']})")
            created_count += 1
    
    print("\n" + "=" * 70)
    print("📋 CREDENCIAIS DE ACESSO - TODOS OS USUÁRIOS")
    print("=" * 70)
    
    print("\n👑 ADMINISTRADOR MASTER:")
    print("   📧 Email:  admin@imovlocal.com")
    print("   🔑 Senha:  Master@2025")
    print("   📱 Tel:    (67) 99999-0000")
    print("   📦 Plano:  FREE")
    
    print("\n👔 CORRETOR (FREE):")
    print("   📧 Email:  corretor.teste@imovlocal.com")
    print("   🔑 Senha:  Teste@123")
    print("   📱 Tel:    (67) 99999-1111")
    print("   📝 CRECI:  CRECI-MS 12345")
    print("   📦 Plano:  FREE")
    
    print("\n👔 CORRETOR VITALÍCIO:")
    print("   📧 Email:  corretor.vitalicio@imovlocal.com")
    print("   🔑 Senha:  Vitalicio@2026")
    print("   📱 Tel:    (67) 99999-0002")
    print("   📝 CRECI:  CRECI-TEST-001")
    print("   📦 Plano:  ⭐ VITALÍCIO (nunca expira)")
    
    print("\n🏢 IMOBILIÁRIA VITALÍCIA:")
    print("   📧 Email:  imobiliaria.vitalicia@imovlocal.com")
    print("   🔑 Senha:  Vitalicio@2026")
    print("   📱 Tel:    (67) 3025-9999")
    print("   📝 CRECI:  CRECI 99999-MS")
    print("   🏢 CNPJ:   12.345.678/0001-99")
    print("   📦 Plano:  ⭐ VITALÍCIO (nunca expira)")
    
    print("\n👤 PARTICULAR (FREE):")
    print("   📧 Email:  particular.teste@imovlocal.com")
    print("   🔑 Senha:  Teste@456")
    print("   📱 Tel:    (67) 99999-2222")
    print("   📦 Plano:  FREE")
    
    print("\n👤 PARTICULAR VITALÍCIO:")
    print("   📧 Email:  particular.vitalicio@imovlocal.com")
    print("   🔑 Senha:  Vitalicio@2026")
    print("   📱 Tel:    (67) 99999-0001")
    print("   📦 Plano:  ⭐ VITALÍCIO (nunca expira)")
    
    print("\n" + "=" * 70)
    print(f"📊 RESUMO:")
    print(f"   ✅ Criados:    {created_count}")
    print(f"   🔄 Atualizados: {updated_count}")
    print(f"   ℹ️  Já existiam: {existing_count}")
    print(f"   📦 Total:      {len(ALL_TEST_USERS)} usuários")
    print("=" * 70)
    
    client.close()
    print("\n✅ Processo concluído com sucesso!\n")

if __name__ == "__main__":
    asyncio.run(create_all_test_users())
