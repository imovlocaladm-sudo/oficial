"""
Script to create master admin user
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

async def create_master_admin():
    print("🔐 Criando usuário MASTER ADMIN...")
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    users_collection = db.users
    
    # Master admin credentials
    email = "admin@imovlocal.com"
    password = "Master@2025"
    
    # Check if already exists
    existing = await users_collection.find_one({"email": email})
    if existing:
        print(f"⚠️  Usuário admin já existe!")
        print(f"📧 Email: {email}")
        print(f"🔑 Senha: {password}")
        client.close()
        return
    
    # Create master admin user
    hashed_password = pwd_context.hash(password)
    
    admin_user = {
        "id": str(uuid.uuid4()),
        "name": "Administrador Master",
        "email": email,
        "phone": "(67) 99999-0000",
        "cpf": "00000000000",
        "city": "Campo Grande",
        "state": "MS",
        "user_type": "admin",
        "status": "active",
        "creci": None,
        "company": "ImovLocal",
        "hashed_password": hashed_password,
        "created_at": datetime.utcnow()
    }
    
    await users_collection.insert_one(admin_user)
    
    print("\n✅ USUÁRIO MASTER CRIADO COM SUCESSO!\n")
    print("=" * 50)
    print("📋 CREDENCIAIS DE ACESSO")
    print("=" * 50)
    print(f"📧 Email:    {email}")
    print(f"🔑 Senha:    {password}")
    print(f"👤 Nome:     {admin_user['name']}")
    print(f"🎯 Tipo:     ADMINISTRADOR MASTER")
    print(f"📍 Status:   ATIVO")
    print("=" * 50)
    print("\n⚠️  IMPORTANTE:")
    print("- Guarde essas credenciais em local seguro")
    print("- Troque a senha após primeiro acesso")
    print("- Este usuário tem acesso total ao sistema")
    print("\n🌐 Acesse: /login")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(create_master_admin())
