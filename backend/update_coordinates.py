"""
Script para atualizar coordenadas dos imóveis existentes
Usa Nominatim (OpenStreetMap) para geocodificação - GRATUITO
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import httpx
import os
from dotenv import load_dotenv
from pathlib import Path
import time

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'imovlocal_db')

# Coordenadas aproximadas por bairro de Campo Grande
BAIRRO_COORDS = {
    # Região Central
    "Centro": (-20.4697, -54.6201),
    "Cabreúva": (-20.4650, -54.6150),
    "Amambaí": (-20.4750, -54.6100),
    "Monte Castelo": (-20.4600, -54.6050),
    
    # Região Norte
    "Coronel Antonino": (-20.4300, -54.5900),
    "Vila Progresso": (-20.4200, -54.5800),
    "Cophavila": (-20.4100, -54.5700),
    
    # Região Sul
    "Jardim dos Estados": (-20.4850, -54.6100),
    "Chácara Cachoeira": (-20.4950, -54.6000),
    "São Bento": (-20.5000, -54.5900),
    "Guanandi": (-20.5100, -54.5800),
    "Aero Rancho": (-20.5200, -54.5700),
    
    # Região Leste
    "Rita Vieira": (-20.4500, -54.5500),
    "Jardim Autonomista": (-20.4400, -54.5400),
    "Tiradentes": (-20.4350, -54.5300),
    
    # Região Oeste
    "Alphaville": (-20.4800, -54.6500),
    "Portal do Panamá": (-20.4900, -54.6600),
    "Indubrasil": (-20.4700, -54.6400),
    
    # Default
    "default": (-20.4697, -54.6201)
}

# Coordenadas por cidade
CITY_COORDS = {
    "Campo Grande": (-20.4697, -54.6201),
    "Dourados": (-22.2231, -54.8118),
    "Três Lagoas": (-20.7849, -51.7014),
    "Corumbá": (-19.0078, -57.6547),
    "Ponta Porã": (-22.5362, -55.7256),
    "Naviraí": (-23.0631, -54.1914),
    "Nova Andradina": (-22.2328, -53.3433),
    "Aquidauana": (-20.4666, -55.7871),
    "Sidrolândia": (-20.9314, -54.9614),
    "Paranaíba": (-19.6761, -51.1908),
}

async def geocode_nominatim(query: str) -> tuple:
    """Geocodifica usando Nominatim"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://nominatim.openstreetmap.org/search",
                params={
                    "q": query,
                    "format": "json",
                    "limit": 1,
                    "countrycodes": "br"
                },
                headers={
                    "User-Agent": "ImovLocal/1.0 (contato@imovlocal.com)"
                },
                timeout=10.0
            )
            
            if response.status_code == 200:
                data = response.json()
                if data and len(data) > 0:
                    return (float(data[0]["lat"]), float(data[0]["lon"]))
    except Exception as e:
        print(f"   ⚠️  Erro Nominatim: {e}")
    
    return None

async def update_property_coordinates():
    print("=" * 60)
    print("🗺️  ATUALIZANDO COORDENADAS DOS IMÓVEIS")
    print("=" * 60)
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    # Buscar imóveis sem coordenadas ou com coordenadas padrão
    properties = await db.properties.find({
        "$or": [
            {"latitude": None},
            {"longitude": None},
            {"latitude": {"$exists": False}},
            {"longitude": {"$exists": False}}
        ]
    }).to_list(1000)
    
    print(f"\n📊 Encontrados {len(properties)} imóveis para atualizar\n")
    
    updated = 0
    for i, prop in enumerate(properties):
        neighborhood = prop.get("neighborhood", "Centro")
        city = prop.get("city", "Campo Grande")
        state = prop.get("state", "MS")
        
        print(f"[{i+1}/{len(properties)}] {prop['title'][:40]}...")
        print(f"   📍 {neighborhood}, {city}/{state}")
        
        # Primeiro tentar Nominatim
        query = f"{neighborhood}, {city}, {state}, Brasil"
        coords = await geocode_nominatim(query)
        
        if coords:
            lat, lon = coords
            print(f"   ✅ Nominatim: ({lat:.4f}, {lon:.4f})")
        else:
            # Fallback: usar coordenadas do bairro
            if neighborhood in BAIRRO_COORDS:
                lat, lon = BAIRRO_COORDS[neighborhood]
                print(f"   📌 Bairro conhecido: ({lat:.4f}, {lon:.4f})")
            elif city in CITY_COORDS:
                lat, lon = CITY_COORDS[city]
                print(f"   📌 Cidade conhecida: ({lat:.4f}, {lon:.4f})")
            else:
                lat, lon = BAIRRO_COORDS["default"]
                print(f"   📌 Usando default: ({lat:.4f}, {lon:.4f})")
        
        # Adicionar pequena variação para não sobrepor markers
        import random
        lat += random.uniform(-0.002, 0.002)
        lon += random.uniform(-0.002, 0.002)
        
        # Atualizar no banco
        await db.properties.update_one(
            {"id": prop["id"]},
            {"$set": {"latitude": lat, "longitude": lon}}
        )
        updated += 1
        
        # Respeitar rate limit do Nominatim (1 req/sec)
        await asyncio.sleep(1.1)
    
    print("\n" + "=" * 60)
    print(f"✅ {updated} imóveis atualizados com coordenadas!")
    print("=" * 60)
    
    client.close()

if __name__ == "__main__":
    asyncio.run(update_property_coordinates())
