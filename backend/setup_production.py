"""
Script para limpar banco de dados e criar Admin Master para produção
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from datetime import datetime
import uuid
import os

# Configuração
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DATABASE_NAME = "imovlocal"

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def clean_and_setup():
    print("=" * 60)
    print("🧹 LIMPEZA DO BANCO DE DADOS - IMOVLOCAL")
    print("=" * 60)
    
    # Conectar ao MongoDB
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DATABASE_NAME]
    
    # 1. Excluir todos os usuários
    print("\n📋 Excluindo todos os usuários...")
    result = await db.users.delete_many({})
    print(f"   ✅ {result.deleted_count} usuários excluídos")
    
    # 2. Excluir todos os imóveis
    print("\n🏠 Excluindo todos os imóveis...")
    result = await db.properties.delete_many({})
    print(f"   ✅ {result.deleted_count} imóveis excluídos")
    
    # 3. Excluir todas as notificações
    print("\n🔔 Excluindo todas as notificações...")
    result = await db.notifications.delete_many({})
    print(f"   ✅ {result.deleted_count} notificações excluídas")
    
    # 4. Excluir todos os pagamentos
    print("\n💰 Excluindo todos os pagamentos...")
    result = await db.payments.delete_many({})
    print(f"   ✅ {result.deleted_count} pagamentos excluídos")
    
    # 5. Excluir todas as visitas
    print("\n📅 Excluindo todas as visitas...")
    result = await db.visits.delete_many({})
    print(f"   ✅ {result.deleted_count} visitas excluídas")
    
    # 6. Excluir todas as demandas/oportunidades
    print("\n📝 Excluindo todas as demandas...")
    result = await db.demands.delete_many({})
    print(f"   ✅ {result.deleted_count} demandas excluídas")
    
    # 7. Excluir todos os banners
    print("\n🖼️ Excluindo todos os banners...")
    result = await db.banners.delete_many({})
    print(f"   ✅ {result.deleted_count} banners excluídos")
    
    # 8. Excluir prestadores de serviços
    print("\n🔧 Excluindo prestadores de serviços...")
    result = await db.service_providers.delete_many({})
    print(f"   ✅ {result.deleted_count} prestadores excluídos")
    
    print("\n" + "=" * 60)
    print("👤 CRIANDO ADMIN MASTER")
    print("=" * 60)
    
    # Criar Admin Master
    admin_data = {
        "id": str(uuid.uuid4()),
        "name": "Admin Master",
        "email": "imovlocaladm@gmail.com",
        "phone": "(67) 99999-9999",
        "cpf": "00000000000",
        "city": "Campo Grande",
        "state": "MS",
        "user_type": "admin",
        "hashed_password": pwd_context.hash("96113045Ro@"),
        "status": "active",
        "plan_type": "free",
        "created_at": datetime.utcnow(),
        "max_anuncios": 999999,
        "max_fotos": 20
    }
    
    await db.users.insert_one(admin_data)
    
    print(f"\n   ✅ Admin Master criado com sucesso!")
    print(f"   📧 Email: imovlocaladm@gmail.com")
    print(f"   🔑 Senha: 96113045Ro@")
    print(f"   👤 Tipo: admin (Master)")
    
    print("\n" + "=" * 60)
    print("✅ LIMPEZA CONCLUÍDA COM SUCESSO!")
    print("=" * 60)
    print("\n⚠️  IMPORTANTE:")
    print("   - Todos os dados de teste foram removidos")
    print("   - Apenas o Admin Master foi criado")
    print("   - O sistema está pronto para produção")
    print("\n")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(clean_and_setup())
