"""
Script para criar usuário Admin Sênior de teste
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

async def create_admin_senior():
    """Criar usuário Admin Sênior de teste"""
    print("\n" + "=" * 70)
    print("🎯 CRIANDO USUÁRIO ADMIN SÊNIOR DE TESTE")
    print("=" * 70 + "\n")
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    users_collection = db.users
    
    # Dados do Admin Sênior
    admin_senior_data = {
        "id": str(uuid.uuid4()),
        "name": "Admin Sênior Teste",
        "email": "admin.senior@imovlocal.com",
        "phone": "(67) 99999-9000",
        "cpf": "99999999999",
        "city": "Campo Grande",
        "state": "MS",
        "user_type": "admin_senior",
        "creci": None,
        "company": "ImovLocal - Equipe Admin",
        "cnpj": None,
        "razao_social": None,
        "status": "active",
        "plan_type": "lifetime",
        "plan_expires_at": None,
        "profile_photo": None,
        "bio": "Administrador Sênior com permissões limitadas para gerenciar usuários, imóveis e banners.",
        "hashed_password": pwd_context.hash("AdminSenior@2025"),
        "created_at": datetime.utcnow()
    }
    
    # Verificar se já existe
    existing = await users_collection.find_one({"email": admin_senior_data["email"]})
    
    if existing:
        print(f"   🔄 Atualizando usuário existente...")
        await users_collection.update_one(
            {"email": admin_senior_data["email"]},
            {"$set": admin_senior_data}
        )
        print(f"   ✅ Admin Sênior atualizado!")
    else:
        await users_collection.insert_one(admin_senior_data)
        print(f"   ✅ Admin Sênior criado com sucesso!")
    
    print("\n" + "=" * 70)
    print("📋 CREDENCIAIS DO ADMIN SÊNIOR")
    print("=" * 70)
    print("\n👨‍💼 ADMIN SÊNIOR:")
    print(f"   📧 Email:  admin.senior@imovlocal.com")
    print(f"   🔑 Senha:  AdminSenior@2025")
    print(f"   📱 Tel:    (67) 99999-9000")
    print(f"   👤 Tipo:   Admin Sênior")
    print(f"   📦 Plano:  ⭐ VITALÍCIO (nunca expira)")
    print(f"   📝 Status: Ativo")
    
    print("\n" + "=" * 70)
    print("🔐 PERMISSÕES DO ADMIN SÊNIOR:")
    print("=" * 70)
    print("   ✅ Adicionar novos usuários")
    print("   ✅ Gerenciar usuários (visualizar, editar, pausar, excluir)")
    print("   ✅ Gerenciar imóveis (visualizar, editar, excluir)")
    print("   ✅ Gerenciar banners")
    print("   ❌ Acessar dashboard Admin Master completo")
    print("   ❌ Ver Mural de Oportunidades (exclusivo Admin Master)")
    print("   ❌ Editar outros Admin Sênior ou Admin Master")
    print("=" * 70 + "\n")
    
    client.close()
    print("✅ Processo concluído!\n")

if __name__ == "__main__":
    asyncio.run(create_admin_senior())
