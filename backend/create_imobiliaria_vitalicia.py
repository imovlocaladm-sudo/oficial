"""
Script para criar usuário de teste do tipo IMOBILIÁRIA com acesso VITALÍCIO
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path
import bcrypt
from datetime import datetime

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
db_name = os.environ['DB_NAME']

def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

async def create_imobiliaria_vitalicia():
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print("🏢 Criando usuário de teste: IMOBILIÁRIA com Acesso VITALÍCIO")
    print("=" * 70)
    
    # Dados do usuário Imobiliária
    user_data = {
        "name": "ImovLocal Imobiliária Teste",
        "email": "imobiliaria.vitalicia@imovlocal.com",
        "phone": "(67) 99999-0003",
        "cpf": "111.222.333-44",
        "city": "Campo Grande",
        "state": "MS",
        "user_type": "imobiliaria",
        "creci": "CRECI 99999-MS",
        "company": "ImovLocal Imobiliária Premium",
        "cnpj": "12.345.678/0001-90",
        "razao_social": "ImovLocal Negócios Imobiliários Ltda",
        "status": "active",
        "plan_type": "lifetime",
        "plan_expires_at": None,  # Vitalício nunca expira
        "profile_photo": None,
        "bio": "Imobiliária de teste com acesso vitalício completo ao ImovLocal",
        "hashed_password": hash_password("Vitalicio@2026"),
        "created_at": datetime.utcnow()
    }
    
    # Verificar se já existe
    existing = await db.users.find_one({"email": user_data["email"]})
    if existing:
        print("⚠️  Usuário já existe. Atualizando...")
        await db.users.update_one(
            {"email": user_data["email"]},
            {"$set": user_data}
        )
        print("✓ Usuário atualizado com sucesso!\n")
    else:
        await db.users.insert_one(user_data)
        print("✓ Novo usuário criado com sucesso!\n")
    
    # Mostrar informações
    print("=" * 70)
    print("📋 CREDENCIAIS DO USUÁRIO IMOBILIÁRIA VITALÍCIA")
    print("=" * 70)
    print(f"\n🏢 Tipo: IMOBILIÁRIA")
    print(f"📧 Email: {user_data['email']}")
    print(f"🔑 Senha: Vitalicio@2026")
    print(f"📱 Telefone: {user_data['phone']}")
    print(f"🆔 CPF: {user_data['cpf']}")
    print(f"🏢 CNPJ: {user_data['cnpj']}")
    print(f"📝 Razão Social: {user_data['razao_social']}")
    print(f"🏪 Nome Fantasia: {user_data['company']}")
    print(f"📋 CRECI: {user_data['creci']}")
    print(f"📍 Localização: {user_data['city']}/{user_data['state']}")
    print(f"\n⭐ Plano: VITALÍCIO (Acesso Ilimitado)")
    print(f"📅 Validade: NUNCA EXPIRA\n")
    
    print("=" * 70)
    print("✅ RECURSOS DISPONÍVEIS:")
    print("=" * 70)
    print("  ✓ Anunciar imóveis ILIMITADOS")
    print("  ✓ Todos os tipos: Venda, Aluguel, Aluguel por Temporada")
    print("  ✓ Imóveis em DESTAQUE")
    print("  ✓ Imóveis em LANÇAMENTOS")
    print("  ✓ Prioridade nas buscas")
    print("  ✓ Sem limite de fotos por imóvel")
    print("  ✓ Área administrativa completa")
    print("  ✓ Gerenciamento de visitas")
    print("  ✓ Notificações prioritárias")
    print("  ✓ ACESSO VITALÍCIO - Nunca expira!\n")
    
    print("=" * 70)
    print("💡 DICAS DE USO:")
    print("=" * 70)
    print("  1. Acesse: /login")
    print("  2. Use o email e senha acima")
    print("  3. Vá para Dashboard → Gerenciar Imóveis")
    print("  4. Adicione quantos imóveis quiser!")
    print("  5. Marque como destaque ou lançamento")
    print("\n🎉 Usuário Imobiliária Vitalícia criado com sucesso!\n")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(create_imobiliaria_vitalicia())
