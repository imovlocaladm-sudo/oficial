"""
Script para criar dados de teste (seed) para o ImovLocal
Cria usuários Corretor e Particular com seus respectivos anúncios de imóveis
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from datetime import datetime
from dotenv import load_dotenv
from pathlib import Path
import os
import uuid

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'test_database')


async def seed_test_data():
    """Cria dados de teste: 2 usuários e 4 imóveis"""
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print("🌱 Iniciando seed de dados de teste...")
    print(f"📦 Banco de dados: {db_name}")
    print("-" * 50)
    
    # =============================================
    # USUÁRIO 1: CORRETOR
    # =============================================
    corretor_email = "corretor.teste@imovlocal.com"
    corretor_id = str(uuid.uuid4())
    
    # Verificar se já existe
    existing_corretor = await db.users.find_one({"email": corretor_email})
    
    if existing_corretor:
        print(f"⚠️  Corretor já existe: {corretor_email}")
        corretor_id = existing_corretor['id']
    else:
        corretor_user = {
            'id': corretor_id,
            'name': 'Carlos Corretor',
            'email': corretor_email,
            'phone': '(67) 99999-1111',
            'cpf': '11111111111',
            'city': 'Campo Grande',
            'state': 'MS',
            'user_type': 'corretor',
            'creci': 'CRECI-MS 12345',
            'company': 'Imobiliária Corretor & Cia',
            'status': 'active',
            'hashed_password': pwd_context.hash('Teste@123'),
            'created_at': datetime.utcnow()
        }
        await db.users.insert_one(corretor_user)
        print(f"✅ Corretor criado: {corretor_email}")
        print(f"   🔑 Senha: Teste@123")
    
    # Imóveis do Corretor
    # Imóvel 1: Apartamento Moderno
    ap_corretor = await db.properties.find_one({
        "title": "Apartamento Moderno no Centro",
        "owner_id": corretor_id
    })
    
    if not ap_corretor:
        ap_corretor_data = {
            'id': str(uuid.uuid4()),
            'title': 'Apartamento Moderno no Centro',
            'description': 'Lindo apartamento com 2 quartos, varanda gourmet e 1 vaga de garagem. Prédio com lazer completo incluindo piscina, academia, salão de festas e churrasqueira. Localização privilegiada no coração da cidade, próximo a shoppings, escolas e transporte público.',
            'property_type': 'Apartamento',
            'purpose': 'VENDA',
            'price': 450000.00,
            'neighborhood': 'Centro',
            'city': 'Campo Grande',
            'state': 'MS',
            'bedrooms': 2,
            'bathrooms': 2,
            'area': 75.0,
            'garage': 1,
            'year_built': 2022,
            'condominio': 650.00,
            'iptu': 1800.00,
            'features': ['Varanda Gourmet', 'Piscina', 'Academia', 'Salão de Festas', 'Portaria 24h', 'Elevador'],
            'images': [
                'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop',
                'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop',
                'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop'
            ],
            'is_launch': False,
            'owner_id': corretor_id,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        await db.properties.insert_one(ap_corretor_data)
        print(f"   🏠 Imóvel criado: Apartamento Moderno no Centro - R$ 450.000")
    else:
        print(f"   ⚠️  Imóvel já existe: Apartamento Moderno no Centro")
    
    # Imóvel 2: Casa com Piscina
    casa_corretor = await db.properties.find_one({
        "title": "Casa Espaçosa com Piscina",
        "owner_id": corretor_id
    })
    
    if not casa_corretor:
        casa_corretor_data = {
            'id': str(uuid.uuid4()),
            'title': 'Casa Espaçosa com Piscina',
            'description': 'Casa ampla com 4 suítes, área de churrasqueira e piscina. Ideal para famílias grandes que buscam conforto e lazer. Terreno de 500m² com jardim paisagístico, garagem para 4 carros e cozinha gourmet completa.',
            'property_type': 'Casa-Térrea',
            'purpose': 'VENDA',
            'price': 980000.00,
            'neighborhood': 'Jardim dos Estados',
            'city': 'Campo Grande',
            'state': 'MS',
            'bedrooms': 4,
            'bathrooms': 5,
            'area': 320.0,
            'garage': 4,
            'year_built': 2020,
            'condominio': None,
            'iptu': 4500.00,
            'features': ['Piscina', 'Churrasqueira', 'Cozinha Gourmet', 'Jardim', 'Suíte Master', 'Closet'],
            'images': [
                'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop',
                'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop',
                'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800&h=600&fit=crop'
            ],
            'is_launch': False,
            'owner_id': corretor_id,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        await db.properties.insert_one(casa_corretor_data)
        print(f"   🏠 Imóvel criado: Casa Espaçosa com Piscina - R$ 980.000")
    else:
        print(f"   ⚠️  Imóvel já existe: Casa Espaçosa com Piscina")
    
    print()
    
    # =============================================
    # USUÁRIO 2: PARTICULAR
    # =============================================
    particular_email = "particular.teste@imovlocal.com"
    particular_id = str(uuid.uuid4())
    
    # Verificar se já existe
    existing_particular = await db.users.find_one({"email": particular_email})
    
    if existing_particular:
        print(f"⚠️  Particular já existe: {particular_email}")
        particular_id = existing_particular['id']
    else:
        particular_user = {
            'id': particular_id,
            'name': 'Ana Particular',
            'email': particular_email,
            'phone': '(67) 99999-2222',
            'cpf': '22222222222',
            'city': 'Campo Grande',
            'state': 'MS',
            'user_type': 'particular',
            'creci': None,
            'company': None,
            'status': 'active',
            'hashed_password': pwd_context.hash('Teste@456'),
            'created_at': datetime.utcnow()
        }
        await db.users.insert_one(particular_user)
        print(f"✅ Particular criado: {particular_email}")
        print(f"   🔑 Senha: Teste@456")
    
    # Imóveis do Particular
    # Imóvel 1: Terreno
    terreno = await db.properties.find_one({
        "title": "Terreno Plano em Condomínio Fechado",
        "owner_id": particular_id
    })
    
    if not terreno:
        terreno_data = {
            'id': str(uuid.uuid4()),
            'title': 'Terreno Plano em Condomínio Fechado',
            'description': 'Excelente terreno de 300m² em condomínio com segurança 24h. Terreno totalmente plano, pronto para construir. Condomínio com infraestrutura completa: água, luz, esgoto e asfalto. Área de lazer com piscina e churrasqueira.',
            'property_type': 'Terreno',
            'purpose': 'VENDA',
            'price': 250000.00,
            'neighborhood': 'Condomínio Jardim Europa',
            'city': 'Campo Grande',
            'state': 'MS',
            'bedrooms': None,
            'bathrooms': None,
            'area': 300.0,
            'garage': None,
            'year_built': None,
            'condominio': 450.00,
            'iptu': 800.00,
            'features': ['Condomínio Fechado', 'Segurança 24h', 'Terreno Plano', 'Infraestrutura Completa'],
            'images': [
                'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&h=600&fit=crop',
                'https://images.unsplash.com/photo-1625244724120-1fd1d34d00f6?w=800&h=600&fit=crop'
            ],
            'is_launch': False,
            'owner_id': particular_id,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        await db.properties.insert_one(terreno_data)
        print(f"   🏠 Imóvel criado: Terreno Plano em Condomínio Fechado - R$ 250.000")
    else:
        print(f"   ⚠️  Imóvel já existe: Terreno Plano em Condomínio Fechado")
    
    # Imóvel 2: Kitnet para Aluguel
    kitnet = await db.properties.find_one({
        "title": "Kitnet Mobiliada Perto da Universidade",
        "owner_id": particular_id
    })
    
    if not kitnet:
        kitnet_data = {
            'id': str(uuid.uuid4()),
            'title': 'Kitnet Mobiliada Perto da Universidade',
            'description': 'Kitnet funcional e mobiliada, ideal para estudantes. Contas de água e luz inclusas no valor do aluguel. Localização estratégica a 5 minutos da UFMS. Inclui cama, armário, geladeira, fogão e ar-condicionado.',
            'property_type': 'Kitnet',
            'purpose': 'ALUGUEL',
            'price': 1200.00,
            'neighborhood': 'Universitário',
            'city': 'Campo Grande',
            'state': 'MS',
            'bedrooms': 1,
            'bathrooms': 1,
            'area': 28.0,
            'garage': None,
            'year_built': 2018,
            'condominio': None,
            'iptu': None,
            'features': ['Mobiliada', 'Água Inclusa', 'Luz Inclusa', 'Ar-condicionado', 'Próximo à UFMS'],
            'images': [
                'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&h=600&fit=crop',
                'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800&h=600&fit=crop'
            ],
            'is_launch': False,
            'owner_id': particular_id,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        await db.properties.insert_one(kitnet_data)
        print(f"   🏠 Imóvel criado: Kitnet Mobiliada Perto da Universidade - R$ 1.200/mês")
    else:
        print(f"   ⚠️  Imóvel já existe: Kitnet Mobiliada Perto da Universidade")
    
    print()
    print("-" * 50)
    print("🎉 Seed concluído com sucesso!")
    print()
    print("📋 CREDENCIAIS DE TESTE:")
    print()
    print("👔 CORRETOR:")
    print(f"   Email: corretor.teste@imovlocal.com")
    print(f"   Senha: Teste@123")
    print(f"   Imóveis: 2 (Apartamento e Casa)")
    print()
    print("👤 PARTICULAR:")
    print(f"   Email: particular.teste@imovlocal.com")
    print(f"   Senha: Teste@456")
    print(f"   Imóveis: 2 (Terreno e Kitnet)")
    print()
    print("🔑 ADMIN MASTER (existente):")
    print(f"   Email: admin@imovlocal.com")
    print(f"   Senha: Master@2025")
    print("-" * 50)
    
    client.close()


if __name__ == "__main__":
    asyncio.run(seed_test_data())
