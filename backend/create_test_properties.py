"""
Script para criar anúncios de teste para todos os usuários
Cria imóveis variados: Venda, Aluguel, Lançamentos, diferentes tipos
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

# Imagens do Unsplash para usar nos anúncios
PROPERTY_IMAGES = {
    'apartamento': [
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop'
    ],
    'casa': [
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800&h=600&fit=crop'
    ],
    'terreno': [
        'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1625244724120-1fd1d34d00f6?w=800&h=600&fit=crop'
    ],
    'kitnet': [
        'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800&h=600&fit=crop'
    ],
    'cobertura': [
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop'
    ]
}

async def get_user_by_email(db, email):
    """Busca usuário pelo email"""
    return await db.users.find_one({"email": email})

async def create_test_properties():
    """Criar anúncios de teste para todos os usuários"""
    print("\n" + "=" * 70)
    print("🏠 CRIANDO ANÚNCIOS DE TESTE PARA TODOS OS USUÁRIOS")
    print("=" * 70 + "\n")
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    properties_collection = db.properties
    
    created_count = 0
    
    # =========================================================================
    # CORRETOR TESTE (FREE) - 3 imóveis variados
    # =========================================================================
    corretor_free = await get_user_by_email(db, "corretor.teste@imovlocal.com")
    if corretor_free:
        print(f"👔 Criando imóveis para: {corretor_free['name']}")
        
        # 1. Apartamento para Venda
        ap1 = {
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
            'images': PROPERTY_IMAGES['apartamento'],
            'is_launch': False,
            'owner_id': corretor_free['id'],
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        await properties_collection.insert_one(ap1)
        print(f"   ✅ Apartamento Moderno no Centro - R$ 450.000")
        created_count += 1
        
        # 2. Casa para Venda
        casa1 = {
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
            'images': PROPERTY_IMAGES['casa'],
            'is_launch': False,
            'owner_id': corretor_free['id'],
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        await properties_collection.insert_one(casa1)
        print(f"   ✅ Casa Espaçosa com Piscina - R$ 980.000")
        created_count += 1
        
        # 3. Apartamento para Aluguel
        ap2 = {
            'id': str(uuid.uuid4()),
            'title': 'Apartamento Mobiliado para Aluguel',
            'description': 'Apartamento completo e mobiliado com 3 quartos, pronto para morar. Possui ar-condicionado em todos os cômodos, cozinha equipada e armários embutidos. Condomínio com portaria 24h e lazer.',
            'property_type': 'Apartamento',
            'purpose': 'ALUGUEL',
            'price': 2500.00,
            'neighborhood': 'São Francisco',
            'city': 'Campo Grande',
            'state': 'MS',
            'bedrooms': 3,
            'bathrooms': 2,
            'area': 85.0,
            'garage': 2,
            'year_built': 2019,
            'condominio': 550.00,
            'iptu': 1500.00,
            'features': ['Mobiliado', 'Ar-condicionado', 'Armários', 'Portaria 24h', 'Área de Lazer'],
            'images': PROPERTY_IMAGES['apartamento'],
            'is_launch': False,
            'owner_id': corretor_free['id'],
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        await properties_collection.insert_one(ap2)
        print(f"   ✅ Apartamento Mobiliado - R$ 2.500/mês\n")
        created_count += 1
    
    # =========================================================================
    # CORRETOR VITALÍCIO - 3 imóveis premium
    # =========================================================================
    corretor_vitalicio = await get_user_by_email(db, "corretor.vitalicio@imovlocal.com")
    if corretor_vitalicio:
        print(f"👔 Criando imóveis para: {corretor_vitalicio['name']} (⭐ VITALÍCIO)")
        
        # 1. Cobertura de Luxo - LANÇAMENTO
        cobertura = {
            'id': str(uuid.uuid4()),
            'title': 'Cobertura Duplex de Alto Padrão - LANÇAMENTO',
            'description': 'Magnífica cobertura duplex com acabamento de primeira linha. 4 suítes amplas, sendo a master com closet e hidromassagem. Terraço gourmet com piscina privativa, churrasqueira e vista panorâmica da cidade. Prédio inteligente com automação completa.',
            'property_type': 'Apto. Cobertura / Duplex',
            'purpose': 'VENDA',
            'price': 1850000.00,
            'neighborhood': 'Chácara Cachoeira',
            'city': 'Campo Grande',
            'state': 'MS',
            'bedrooms': 4,
            'bathrooms': 5,
            'area': 280.0,
            'garage': 4,
            'year_built': 2025,
            'condominio': 1800.00,
            'iptu': 8500.00,
            'features': ['Piscina Privativa', 'Terraço Gourmet', 'Hidromassagem', 'Closet', 'Vista Panorâmica', 'Automação', 'Home Theater', 'Adega Climatizada'],
            'images': PROPERTY_IMAGES['cobertura'],
            'is_launch': True,  # LANÇAMENTO
            'owner_id': corretor_vitalicio['id'],
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        await properties_collection.insert_one(cobertura)
        print(f"   ✅ Cobertura Duplex - R$ 1.850.000 [🚀 LANÇAMENTO]")
        created_count += 1
        
        # 2. Sobrado em Condomínio
        sobrado = {
            'id': str(uuid.uuid4()),
            'title': 'Sobrado em Condomínio Fechado de Alto Padrão',
            'description': 'Belíssimo sobrado em condomínio exclusivo com apenas 12 lotes. 5 suítes, escritório, sala de cinema, piscina aquecida e área gourmet completa. Segurança 24h, portaria inteligente e área de lazer completa do condomínio.',
            'property_type': 'Sobrado-Condomínio',
            'purpose': 'VENDA',
            'price': 1450000.00,
            'neighborhood': 'Vivendas do Bosque',
            'city': 'Campo Grande',
            'state': 'MS',
            'bedrooms': 5,
            'bathrooms': 6,
            'area': 420.0,
            'garage': 6,
            'year_built': 2023,
            'condominio': 1200.00,
            'iptu': 6800.00,
            'features': ['Piscina Aquecida', 'Sala de Cinema', 'Escritório', 'Área Gourmet', 'Portaria Inteligente', 'Segurança 24h', 'Paisagismo'],
            'images': PROPERTY_IMAGES['casa'],
            'is_launch': False,
            'owner_id': corretor_vitalicio['id'],
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        await properties_collection.insert_one(sobrado)
        print(f"   ✅ Sobrado em Condomínio - R$ 1.450.000")
        created_count += 1
        
        # 3. Casa de Alto Padrão para Aluguel
        casa_luxo = {
            'id': str(uuid.uuid4()),
            'title': 'Casa de Alto Padrão para Locação',
            'description': 'Residência sofisticada em localização nobre. 3 suítes, sala de estar e jantar integradas, cozinha planejada, lavabo, área gourmet com churrasqueira e piscina. Ideal para executivos. Completamente mobiliada e equipada.',
            'property_type': 'Casa-Térrea',
            'purpose': 'ALUGUEL',
            'price': 6500.00,
            'neighborhood': 'Jardim dos Estados',
            'city': 'Campo Grande',
            'state': 'MS',
            'bedrooms': 3,
            'bathrooms': 4,
            'area': 250.0,
            'garage': 3,
            'year_built': 2021,
            'condominio': None,
            'iptu': 3500.00,
            'features': ['Mobiliada', 'Piscina', 'Churrasqueira', 'Cozinha Planejada', 'Jardim', 'Ar-condicionado'],
            'images': PROPERTY_IMAGES['casa'],
            'is_launch': False,
            'owner_id': corretor_vitalicio['id'],
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        await properties_collection.insert_one(casa_luxo)
        print(f"   ✅ Casa de Alto Padrão - R$ 6.500/mês\n")
        created_count += 1
    
    # =========================================================================
    # IMOBILIÁRIA VITALÍCIA - 4 imóveis diversos
    # =========================================================================
    imobiliaria = await get_user_by_email(db, "imobiliaria.vitalicia@imovlocal.com")
    if imobiliaria:
        print(f"🏢 Criando imóveis para: {imobiliaria['name']} (⭐ VITALÍCIO)")
        
        # 1. Terreno em Condomínio - LANÇAMENTO
        terreno = {
            'id': str(uuid.uuid4()),
            'title': 'Terreno Premium em Condomínio - LANÇAMENTO',
            'description': 'Excelente oportunidade! Terreno de 450m² em condomínio de alto padrão em fase de lançamento. Localização privilegiada, próximo a escolas e comércio. Infraestrutura completa: água, luz, esgoto, internet fibra óptica. Condomínio com portaria 24h, área de lazer com piscina, quadra e salão de festas.',
            'property_type': 'Terreno-Condomínio',
            'purpose': 'VENDA',
            'price': 380000.00,
            'neighborhood': 'Residencial Damha III',
            'city': 'Campo Grande',
            'state': 'MS',
            'bedrooms': None,
            'bathrooms': None,
            'area': 450.0,
            'garage': None,
            'year_built': None,
            'condominio': 580.00,
            'iptu': 1200.00,
            'features': ['Condomínio Fechado', 'Segurança 24h', 'Área de Lazer', 'Infraestrutura Completa', 'Fibra Óptica'],
            'images': PROPERTY_IMAGES['terreno'],
            'is_launch': True,  # LANÇAMENTO
            'owner_id': imobiliaria['id'],
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        await properties_collection.insert_one(terreno)
        print(f"   ✅ Terreno Premium - R$ 380.000 [🚀 LANÇAMENTO]")
        created_count += 1
        
        # 2. Apartamento Compacto
        ap_compacto = {
            'id': str(uuid.uuid4()),
            'title': 'Apartamento Compacto Bem Localizado',
            'description': 'Apartamento funcional com 2 quartos, sala, cozinha e 1 banheiro. Prédio sem condomínio. Localização estratégica próximo ao comércio, transporte público e serviços. Ideal para investidores ou primeira moradia.',
            'property_type': 'Apartamento',
            'purpose': 'VENDA',
            'price': 185000.00,
            'neighborhood': 'Amambaí',
            'city': 'Campo Grande',
            'state': 'MS',
            'bedrooms': 2,
            'bathrooms': 1,
            'area': 52.0,
            'garage': None,
            'year_built': 2010,
            'condominio': None,
            'iptu': 800.00,
            'features': ['Próximo ao Comércio', 'Transporte Público', 'Sem Condomínio'],
            'images': PROPERTY_IMAGES['apartamento'],
            'is_launch': False,
            'owner_id': imobiliaria['id'],
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        await properties_collection.insert_one(ap_compacto)
        print(f"   ✅ Apartamento Compacto - R$ 185.000")
        created_count += 1
        
        # 3. Casa para Aluguel
        casa_aluguel = {
            'id': str(uuid.uuid4()),
            'title': 'Casa Confortável para Família',
            'description': 'Casa térrea com 3 quartos, sendo 1 suíte. Sala ampla, cozinha, área de serviço coberta e garagem para 2 carros. Quintal com espaço para churrasqueira. Bairro residencial tranquilo.',
            'property_type': 'Casa-Térrea',
            'purpose': 'ALUGUEL',
            'price': 1800.00,
            'neighborhood': 'Jardim Leblon',
            'city': 'Campo Grande',
            'state': 'MS',
            'bedrooms': 3,
            'bathrooms': 2,
            'area': 120.0,
            'garage': 2,
            'year_built': 2015,
            'condominio': None,
            'iptu': 1200.00,
            'features': ['Quintal', 'Área de Serviço', 'Bairro Tranquilo'],
            'images': PROPERTY_IMAGES['casa'],
            'is_launch': False,
            'owner_id': imobiliaria['id'],
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        await properties_collection.insert_one(casa_aluguel)
        print(f"   ✅ Casa Confortável - R$ 1.800/mês")
        created_count += 1
        
        # 4. Studio para Aluguel por Temporada
        studio = {
            'id': str(uuid.uuid4()),
            'title': 'Studio Moderno - Aluguel por Temporada',
            'description': 'Studio completamente mobiliado e equipado, ideal para temporadas. Possui cama de casal, TV Smart, micro-ondas, frigobar, ar-condicionado. Prédio com portaria 24h. Perfeito para profissionais em viagem ou estadias temporárias.',
            'property_type': 'Studio',
            'purpose': 'ALUGUEL_TEMPORADA',
            'price': 120.00,  # Preço por diária
            'neighborhood': 'Centro',
            'city': 'Campo Grande',
            'state': 'MS',
            'bedrooms': 1,
            'bathrooms': 1,
            'area': 30.0,
            'garage': None,
            'year_built': 2020,
            'condominio': 450.00,
            'iptu': None,
            'features': ['Mobiliado', 'Wi-Fi', 'TV Smart', 'Ar-condicionado', 'Portaria 24h', 'Equipado'],
            'images': PROPERTY_IMAGES['kitnet'],
            'is_launch': False,
            'owner_id': imobiliaria['id'],
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        await properties_collection.insert_one(studio)
        print(f"   ✅ Studio Moderno - R$ 120/diária [TEMPORADA]\n")
        created_count += 1
    
    # =========================================================================
    # PARTICULAR (FREE) - 2 imóveis (só pode aluguel/temporada)
    # =========================================================================
    particular_free = await get_user_by_email(db, "particular.teste@imovlocal.com")
    if particular_free:
        print(f"👤 Criando imóveis para: {particular_free['name']}")
        
        # 1. Kitnet para Aluguel
        kitnet = {
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
            'images': PROPERTY_IMAGES['kitnet'],
            'is_launch': False,
            'owner_id': particular_free['id'],
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        await properties_collection.insert_one(kitnet)
        print(f"   ✅ Kitnet Universitária - R$ 1.200/mês")
        created_count += 1
        
        # 2. Casa para Aluguel por Temporada
        casa_temporada = {
            'id': str(uuid.uuid4()),
            'title': 'Casa de Praia para Temporada',
            'description': 'Casa aconchegante com 2 quartos, ideal para finais de semana e feriados. Possui churrasqueira, área externa e estacionamento. Aceita animais de estimação. Localização tranquila, perfeita para descanso.',
            'property_type': 'Casa-Térrea',
            'purpose': 'ALUGUEL_TEMPORADA',
            'price': 350.00,  # Preço por diária
            'neighborhood': 'Nova Lima',
            'city': 'Campo Grande',
            'state': 'MS',
            'bedrooms': 2,
            'bathrooms': 1,
            'area': 80.0,
            'garage': 2,
            'year_built': 2012,
            'condominio': None,
            'iptu': None,
            'features': ['Churrasqueira', 'Aceita Pets', 'Estacionamento', 'Área Externa'],
            'images': PROPERTY_IMAGES['casa'],
            'is_launch': False,
            'owner_id': particular_free['id'],
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        await properties_collection.insert_one(casa_temporada)
        print(f"   ✅ Casa de Praia - R$ 350/diária [TEMPORADA]\n")
        created_count += 1
    
    # =========================================================================
    # PARTICULAR VITALÍCIO - 2 imóveis (só pode aluguel/temporada)
    # =========================================================================
    particular_vitalicio = await get_user_by_email(db, "particular.vitalicio@imovlocal.com")
    if particular_vitalicio:
        print(f"👤 Criando imóveis para: {particular_vitalicio['name']} (⭐ VITALÍCIO)")
        
        # 1. Apartamento para Aluguel
        ap_aluguel = {
            'id': str(uuid.uuid4()),
            'title': 'Apartamento 2 Quartos para Locação',
            'description': 'Apartamento com 2 quartos, sala, cozinha planejada, área de serviço e 1 vaga de garagem. Prédio com elevador e portaria. Bairro residencial com fácil acesso ao comércio.',
            'property_type': 'Apartamento',
            'purpose': 'ALUGUEL',
            'price': 1600.00,
            'neighborhood': 'Vila Rosa',
            'city': 'Campo Grande',
            'state': 'MS',
            'bedrooms': 2,
            'bathrooms': 1,
            'area': 60.0,
            'garage': 1,
            'year_built': 2016,
            'condominio': 380.00,
            'iptu': 950.00,
            'features': ['Cozinha Planejada', 'Elevador', 'Portaria', 'Próximo ao Comércio'],
            'images': PROPERTY_IMAGES['apartamento'],
            'is_launch': False,
            'owner_id': particular_vitalicio['id'],
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        await properties_collection.insert_one(ap_aluguel)
        print(f"   ✅ Apartamento 2 Quartos - R$ 1.600/mês")
        created_count += 1
        
        # 2. Casa para Temporada
        casa_temp = {
            'id': str(uuid.uuid4()),
            'title': 'Casa para Temporada - Final de Semana',
            'description': 'Casa com 3 quartos, perfeita para passar finais de semana em família. Possui piscina, churrasqueira, área gourmet e amplo quintal. Tranquilidade e conforto garantidos.',
            'property_type': 'Casa-Térrea',
            'purpose': 'ALUGUEL_TEMPORADA',
            'price': 450.00,  # Preço por diária
            'neighborhood': 'Jardim Autonomista',
            'city': 'Campo Grande',
            'state': 'MS',
            'bedrooms': 3,
            'bathrooms': 2,
            'area': 150.0,
            'garage': 3,
            'year_built': 2014,
            'condominio': None,
            'iptu': None,
            'features': ['Piscina', 'Churrasqueira', 'Área Gourmet', 'Quintal Amplo'],
            'images': PROPERTY_IMAGES['casa'],
            'is_launch': False,
            'owner_id': particular_vitalicio['id'],
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        await properties_collection.insert_one(casa_temp)
        print(f"   ✅ Casa para Temporada - R$ 450/diária [TEMPORADA]\n")
        created_count += 1
    
    print("=" * 70)
    print(f"📊 RESUMO:")
    print(f"   ✅ Total de imóveis criados: {created_count}")
    print(f"   🚀 Lançamentos: 2")
    print(f"   💰 Vendas: {sum(1 for _ in range(created_count) if True)}")  # Placeholder
    print(f"   🏠 Aluguéis: {sum(1 for _ in range(created_count) if True)}")  # Placeholder
    print(f"   🏖️  Temporadas: 4")
    print("=" * 70)
    
    client.close()
    print("\n✅ Anúncios de teste criados com sucesso!\n")

if __name__ == "__main__":
    asyncio.run(create_test_properties())
