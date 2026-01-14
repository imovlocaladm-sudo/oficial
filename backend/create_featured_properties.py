"""
Script para criar imóveis em DESTAQUE para teste
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

mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'imovlocal_db')

PROPERTY_IMAGES = {
    'apartamento': [
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop',
    ],
    'casa': [
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop',
    ],
    'cobertura': [
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop'
    ]
}

async def create_featured_properties():
    print('🌟 CRIANDO IMÓVEIS EM DESTAQUE')
    print('=' * 50)
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    # Buscar corretor vitalício para criar os destaques
    corretor = await db.users.find_one({'email': 'corretor.vitalicio@imovlocal.com'})
    imobiliaria = await db.users.find_one({'email': 'imobiliaria.vitalicia@imovlocal.com'})
    
    if not corretor or not imobiliaria:
        print('❌ Usuários não encontrados!')
        return
    
    # DESTAQUE 1 - Apartamento de Luxo
    destaque1 = {
        'id': str(uuid.uuid4()),
        'title': '⭐ Apartamento de Luxo com Vista Panorâmica',
        'description': 'Apartamento exclusivo de alto padrão com 3 suítes, living amplo com pé direito duplo, varanda gourmet com vista panorâmica da cidade. Acabamento premium, piso em mármore, automação residencial completa.',
        'property_type': 'Apartamento',
        'purpose': 'VENDA',
        'price': 1250000.00,
        'neighborhood': 'Chácara Cachoeira',
        'city': 'Campo Grande',
        'state': 'MS',
        'bedrooms': 3,
        'bathrooms': 4,
        'area': 180.0,
        'garage': 3,
        'year_built': 2024,
        'condominio': 1500.00,
        'iptu': 5500.00,
        'features': ['Vista Panorâmica', 'Automação', 'Piso Mármore', 'Varanda Gourmet', 'Academia', 'Piscina'],
        'images': PROPERTY_IMAGES['cobertura'],
        'is_launch': False,
        'is_featured': True,  # ⭐ DESTAQUE
        'owner_id': corretor['id'],
        'created_at': datetime.utcnow(),
        'updated_at': datetime.utcnow()
    }
    await db.properties.insert_one(destaque1)
    print('   ✅ Apartamento de Luxo - R$ 1.250.000 [⭐ DESTAQUE]')
    
    # DESTAQUE 2 - Casa em Condomínio
    destaque2 = {
        'id': str(uuid.uuid4()),
        'title': '⭐ Casa Térrea em Condomínio Fechado',
        'description': 'Excelente casa térrea em condomínio de alto padrão. 4 quartos sendo 2 suítes, escritório, churrasqueira, piscina com prainha. Condomínio com segurança 24h, campo de futebol e quadra de tênis.',
        'property_type': 'Casa-Térrea-Condomínio',
        'purpose': 'VENDA',
        'price': 890000.00,
        'neighborhood': 'Alphaville',
        'city': 'Campo Grande',
        'state': 'MS',
        'bedrooms': 4,
        'bathrooms': 3,
        'area': 280.0,
        'garage': 3,
        'year_built': 2021,
        'condominio': 850.00,
        'iptu': 3200.00,
        'features': ['Piscina', 'Churrasqueira', 'Condomínio Fechado', 'Segurança 24h', 'Quadra Tênis'],
        'images': PROPERTY_IMAGES['casa'],
        'is_launch': False,
        'is_featured': True,  # ⭐ DESTAQUE
        'owner_id': corretor['id'],
        'created_at': datetime.utcnow(),
        'updated_at': datetime.utcnow()
    }
    await db.properties.insert_one(destaque2)
    print('   ✅ Casa Térrea Condomínio - R$ 890.000 [⭐ DESTAQUE]')
    
    # DESTAQUE 3 - Apartamento para Aluguel
    destaque3 = {
        'id': str(uuid.uuid4()),
        'title': '⭐ Apartamento Premium para Locação',
        'description': 'Apartamento de alto padrão mobiliado e decorado. 2 suítes com closet, sala ampla, cozinha gourmet, lavabo. Prédio com rooftop, piscina aquecida, spa e coworking.',
        'property_type': 'Apartamento',
        'purpose': 'ALUGUEL',
        'price': 4500.00,
        'neighborhood': 'Jardim dos Estados',
        'city': 'Campo Grande',
        'state': 'MS',
        'bedrooms': 2,
        'bathrooms': 3,
        'area': 95.0,
        'garage': 2,
        'year_built': 2023,
        'condominio': 1200.00,
        'iptu': 2800.00,
        'features': ['Mobiliado', 'Decorado', 'Rooftop', 'Spa', 'Coworking', 'Piscina Aquecida'],
        'images': PROPERTY_IMAGES['apartamento'],
        'is_launch': False,
        'is_featured': True,  # ⭐ DESTAQUE
        'owner_id': imobiliaria['id'],
        'created_at': datetime.utcnow(),
        'updated_at': datetime.utcnow()
    }
    await db.properties.insert_one(destaque3)
    print('   ✅ Apartamento Premium Aluguel - R$ 4.500/mês [⭐ DESTAQUE]')
    
    # DESTAQUE 4 - Cobertura Exclusiva
    destaque4 = {
        'id': str(uuid.uuid4()),
        'title': '⭐ Cobertura Triplex Exclusiva',
        'description': 'Cobertura triplex única no empreendimento. 5 suítes, sala de cinema, spa privativo, piscina aquecida com borda infinita, elevador privativo. O ápice do luxo em Campo Grande.',
        'property_type': 'Apto. Cobertura / Duplex',
        'purpose': 'VENDA',
        'price': 2800000.00,
        'neighborhood': 'Jardim dos Estados',
        'city': 'Campo Grande',
        'state': 'MS',
        'bedrooms': 5,
        'bathrooms': 7,
        'area': 450.0,
        'garage': 6,
        'year_built': 2024,
        'condominio': 2500.00,
        'iptu': 12000.00,
        'features': ['Triplex', 'Cinema', 'Spa Privativo', 'Piscina Borda Infinita', 'Elevador Privativo', 'Adega'],
        'images': PROPERTY_IMAGES['cobertura'],
        'is_launch': False,
        'is_featured': True,  # ⭐ DESTAQUE
        'owner_id': imobiliaria['id'],
        'created_at': datetime.utcnow(),
        'updated_at': datetime.utcnow()
    }
    await db.properties.insert_one(destaque4)
    print('   ✅ Cobertura Triplex - R$ 2.800.000 [⭐ DESTAQUE]')
    
    print('=' * 50)
    print('✅ 4 Imóveis em DESTAQUE criados com sucesso!')
    client.close()

if __name__ == "__main__":
    asyncio.run(create_featured_properties())
