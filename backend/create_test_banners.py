"""
Script para criar banners de teste completos e variados
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

mongo_url = os.environ['MONGO_URL']
db_name = os.environ['DB_NAME']

# Banners de teste variados e atraentes
TEST_BANNERS = [
    # HOME - TOPO
    {
        "id": str(uuid.uuid4()),
        "title": "Construtora Premium - Lançamento Exclusive",
        "image_url": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&h=300&fit=crop&q=80",
        "link_url": "https://www.construtora-exemplo.com.br/lancamentos",
        "position": "home_topo",
        "order": 0,
        "status": "active",
        "clicks": 15,
        "views": 450,
        "created_at": datetime.utcnow(),
        "updated_at": None
    },
    {
        "id": str(uuid.uuid4()),
        "title": "Financiamento Facilitado - Taxas Especiais",
        "image_url": "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&h=300&fit=crop&q=80",
        "link_url": "https://www.banco-exemplo.com.br/financiamento",
        "position": "home_topo",
        "order": 1,
        "status": "active",
        "clicks": 8,
        "views": 320,
        "created_at": datetime.utcnow(),
        "updated_at": None
    },
    
    # HOME - MEIO
    {
        "id": str(uuid.uuid4()),
        "title": "Resort Paradisíaco - Venda Antecipada",
        "image_url": "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=900&h=400&fit=crop&q=80",
        "link_url": "https://www.resort-exemplo.com.br",
        "position": "home_meio",
        "order": 0,
        "status": "active",
        "clicks": 22,
        "views": 580,
        "created_at": datetime.utcnow(),
        "updated_at": None
    },
    {
        "id": str(uuid.uuid4()),
        "title": "Condomínio Fechado - Alto Padrão",
        "image_url": "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=900&h=400&fit=crop&q=80",
        "link_url": "https://www.condominio-exemplo.com.br",
        "position": "home_meio",
        "order": 1,
        "status": "active",
        "clicks": 18,
        "views": 495,
        "created_at": datetime.utcnow(),
        "updated_at": None
    },
    
    # BUSCA - LATERAL
    {
        "id": str(uuid.uuid4()),
        "title": "Imobiliária Express - Mais de 1000 imóveis",
        "image_url": "https://images.unsplash.com/photo-1560184897-ae75f418493e?w=400&h=600&fit=crop&q=80",
        "link_url": "https://www.imobiliaria-exemplo.com.br",
        "position": "busca_lateral",
        "order": 0,
        "status": "active",
        "clicks": 12,
        "views": 380,
        "created_at": datetime.utcnow(),
        "updated_at": None
    },
    {
        "id": str(uuid.uuid4()),
        "title": "Avaliação Gratuita do seu Imóvel",
        "image_url": "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=600&fit=crop&q=80",
        "link_url": "https://www.avaliacao-imovel.com.br",
        "position": "busca_lateral",
        "order": 1,
        "status": "active",
        "clicks": 9,
        "views": 290,
        "created_at": datetime.utcnow(),
        "updated_at": None
    },
    
    # BUSCA - TOPO
    {
        "id": str(uuid.uuid4()),
        "title": "Mês da Casa Própria - Condições Especiais",
        "image_url": "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200&h=250&fit=crop&q=80",
        "link_url": "https://www.promocao-exemplo.com.br",
        "position": "busca_topo",
        "order": 0,
        "status": "active",
        "clicks": 25,
        "views": 670,
        "created_at": datetime.utcnow(),
        "updated_at": None
    },
    
    # IMÓVEL - LATERAL
    {
        "id": str(uuid.uuid4()),
        "title": "Seguro Residencial com 30% OFF",
        "image_url": "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=500&fit=crop&q=80",
        "link_url": "https://www.seguradora-exemplo.com.br",
        "position": "imovel_lateral",
        "order": 0,
        "status": "active",
        "clicks": 7,
        "views": 215,
        "created_at": datetime.utcnow(),
        "updated_at": None
    },
    {
        "id": str(uuid.uuid4()),
        "title": "Reforma Completa - Parcelamento em 24x",
        "image_url": "https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?w=400&h=500&fit=crop&q=80",
        "link_url": "https://www.reforma-exemplo.com.br",
        "position": "imovel_lateral",
        "order": 1,
        "status": "active",
        "clicks": 11,
        "views": 325,
        "created_at": datetime.utcnow(),
        "updated_at": None
    },
    
    # RODAPÉ
    {
        "id": str(uuid.uuid4()),
        "title": "Simulador de Financiamento - Grátis",
        "image_url": "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=1200&h=200&fit=crop&q=80",
        "link_url": "https://www.simulador-exemplo.com.br",
        "position": "rodape",
        "order": 0,
        "status": "active",
        "clicks": 31,
        "views": 820,
        "created_at": datetime.utcnow(),
        "updated_at": None
    },
    
    # BANNERS INATIVOS (para teste)
    {
        "id": str(uuid.uuid4()),
        "title": "Banner Inativo - Black Friday",
        "image_url": "https://images.unsplash.com/photo-1607827448387-a67db1383b59?w=1200&h=300&fit=crop&q=80",
        "link_url": "https://www.blackfriday-exemplo.com.br",
        "position": "home_topo",
        "order": 10,
        "status": "inactive",
        "clicks": 0,
        "views": 0,
        "created_at": datetime.utcnow(),
        "updated_at": None
    },
]

async def create_test_banners():
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print("🎨 Criando banners de teste completos...\n")
    
    # Delete all existing banners
    deleted = await db.banners.delete_many({})
    print(f"🗑️  Removidos {deleted.deleted_count} banners existentes")
    
    # Insert new test banners
    result = await db.banners.insert_many(TEST_BANNERS)
    print(f"✨ Criados {len(result.inserted_ids)} novos banners de teste\n")
    
    # Show summary by position
    print("=" * 60)
    print("📊 RESUMO DOS BANNERS CRIADOS")
    print("=" * 60)
    
    positions = {}
    for banner in TEST_BANNERS:
        pos = banner['position']
        if pos not in positions:
            positions[pos] = {'active': 0, 'inactive': 0}
        
        if banner['status'] == 'active':
            positions[pos]['active'] += 1
        else:
            positions[pos]['inactive'] += 1
    
    position_names = {
        'home_topo': '🏠 Home - Topo',
        'home_meio': '🏠 Home - Meio',
        'busca_lateral': '🔍 Busca - Lateral',
        'busca_topo': '🔍 Busca - Topo',
        'imovel_lateral': '🏘️  Imóvel - Lateral',
        'rodape': '⬇️  Rodapé'
    }
    
    for pos, counts in positions.items():
        print(f"\n{position_names.get(pos, pos)}:")
        print(f"  ✅ Ativos: {counts['active']}")
        if counts['inactive'] > 0:
            print(f"  ⏸️  Inativos: {counts['inactive']}")
    
    # Show statistics
    total_views = sum(b['views'] for b in TEST_BANNERS)
    total_clicks = sum(b['clicks'] for b in TEST_BANNERS)
    avg_ctr = (total_clicks / total_views * 100) if total_views > 0 else 0
    
    print(f"\n{'=' * 60}")
    print("📈 ESTATÍSTICAS SIMULADAS")
    print("=" * 60)
    print(f"   Total de Visualizações: {total_views:,}")
    print(f"   Total de Cliques: {total_clicks}")
    print(f"   CTR Médio: {avg_ctr:.2f}%")
    
    print(f"\n{'=' * 60}")
    print("🎯 EXEMPLOS DE BANNERS CRIADOS")
    print("=" * 60)
    
    # Show some examples
    examples = [b for b in TEST_BANNERS if b['status'] == 'active'][:5]
    for banner in examples:
        print(f"\n📍 {banner['title']}")
        print(f"   Posição: {position_names.get(banner['position'], banner['position'])}")
        print(f"   Link: {banner['link_url']}")
        print(f"   Views: {banner['views']} | Clicks: {banner['clicks']} | CTR: {(banner['clicks']/banner['views']*100) if banner['views'] > 0 else 0:.2f}%")
    
    print(f"\n{'=' * 60}")
    print("✅ BANNERS DE TESTE CRIADOS COM SUCESSO!")
    print("=" * 60)
    print("\n💡 PRÓXIMOS PASSOS:")
    print("   1. Acesse o Preview e veja os banners na home page")
    print("   2. Login como admin: admin@imovlocal.com / Master@2025")
    print("   3. Vá para Dashboard Master → Gerenciar Banners")
    print("   4. Explore as estatísticas e funcionalidades de edição")
    print("\n🎨 Dica: Os banners têm estatísticas simuladas para você")
    print("         visualizar como funcionaria em produção!\n")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(create_test_banners())
