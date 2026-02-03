"""
SEO Routes - Sitemap dinâmico e metadados
"""
from fastapi import APIRouter, Response
from fastapi.responses import PlainTextResponse
from database import properties_collection
from datetime import datetime
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/seo", tags=["SEO"])

BASE_URL = "https://www.imovlocal.com.br"


@router.get("/sitemap.xml", response_class=PlainTextResponse)
async def generate_sitemap():
    """
    Gera sitemap dinâmico com todos os imóveis ativos
    """
    # Páginas estáticas
    static_pages = [
        {"loc": "/", "priority": "1.0", "changefreq": "daily"},
        {"loc": "/busca", "priority": "0.9", "changefreq": "daily"},
        {"loc": "/busca-mapa", "priority": "0.8", "changefreq": "daily"},
        {"loc": "/lancamentos", "priority": "0.8", "changefreq": "daily"},
        {"loc": "/destaques", "priority": "0.8", "changefreq": "daily"},
        {"loc": "/planos", "priority": "0.7", "changefreq": "monthly"},
        {"loc": "/solicitar-imovel", "priority": "0.6", "changefreq": "monthly"},
    ]
    
    # Buscar todos os imóveis
    properties = await properties_collection.find(
        {},
        {"_id": 0, "id": 1, "updated_at": 1, "created_at": 1}
    ).to_list(10000)
    
    # Gerar XML
    today = datetime.utcnow().strftime("%Y-%m-%d")
    
    xml_content = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml_content += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    
    # Páginas estáticas
    for page in static_pages:
        xml_content += f'''  <url>
    <loc>{BASE_URL}{page["loc"]}</loc>
    <lastmod>{today}</lastmod>
    <changefreq>{page["changefreq"]}</changefreq>
    <priority>{page["priority"]}</priority>
  </url>\n'''
    
    # Páginas de imóveis
    for prop in properties:
        prop_id = prop.get("id")
        updated = prop.get("updated_at") or prop.get("created_at")
        lastmod = updated.strftime("%Y-%m-%d") if updated else today
        
        xml_content += f'''  <url>
    <loc>{BASE_URL}/imovel/{prop_id}</loc>
    <lastmod>{lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>\n'''
    
    xml_content += '</urlset>'
    
    logger.info(f"Sitemap gerado com {len(static_pages) + len(properties)} URLs")
    
    return Response(
        content=xml_content,
        media_type="application/xml",
        headers={"Cache-Control": "public, max-age=3600"}
    )


@router.get("/robots.txt", response_class=PlainTextResponse)
async def robots_txt():
    """
    Retorna robots.txt otimizado
    """
    content = f"""# Robots.txt para ImovLocal
# {BASE_URL}

User-agent: *
Allow: /

# Bloquear páginas administrativas e de autenticação
Disallow: /admin/
Disallow: /login
Disallow: /cadastro
Disallow: /esqueci-senha
Disallow: /redefinir-senha
Disallow: /checkout/

# Sitemap dinâmico
Sitemap: {BASE_URL}/api/seo/sitemap.xml
"""
    return PlainTextResponse(content=content)


@router.get("/property/{property_id}/schema")
async def get_property_schema(property_id: str):
    """
    Retorna dados estruturados Schema.org para um imóvel
    Usado pelo frontend para SEO
    """
    property_data = await properties_collection.find_one(
        {"id": property_id},
        {"_id": 0}
    )
    
    if not property_data:
        return {"error": "Property not found"}
    
    # Schema.org RealEstateListing
    schema = {
        "@context": "https://schema.org",
        "@type": "RealEstateListing",
        "name": property_data.get("title", ""),
        "description": property_data.get("description", ""),
        "url": f"{BASE_URL}/imovel/{property_id}",
        "datePosted": property_data.get("created_at", "").isoformat() if property_data.get("created_at") else None,
        "image": property_data.get("images", [])[:5],  # Primeiras 5 imagens
        "offers": {
            "@type": "Offer",
            "price": property_data.get("price", 0),
            "priceCurrency": "BRL",
            "availability": "https://schema.org/InStock"
        },
        "address": {
            "@type": "PostalAddress",
            "addressLocality": property_data.get("city", ""),
            "addressRegion": property_data.get("state", ""),
            "addressCountry": "BR",
            "streetAddress": property_data.get("neighborhood", "")
        }
    }
    
    # Adicionar detalhes do imóvel se disponíveis
    if property_data.get("bedrooms"):
        schema["numberOfRooms"] = property_data["bedrooms"]
    
    if property_data.get("bathrooms"):
        schema["numberOfBathroomsTotal"] = property_data["bathrooms"]
    
    if property_data.get("area"):
        schema["floorSize"] = {
            "@type": "QuantitativeValue",
            "value": property_data["area"],
            "unitCode": "MTK"  # Square meters
        }
    
    # Tipo de oferta
    purpose = property_data.get("purpose", "VENDA")
    if purpose == "ALUGUEL":
        schema["offers"]["@type"] = "Offer"
        schema["offers"]["priceSpecification"] = {
            "@type": "UnitPriceSpecification",
            "price": property_data.get("price", 0),
            "priceCurrency": "BRL",
            "unitText": "mês"
        }
    
    return schema
