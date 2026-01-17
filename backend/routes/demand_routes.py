"""
Routes for Partnership Opportunities Board (Mural de Oportunidades)
Sistema de networking entre corretores - Demandas e Propostas
"""
from fastapi import APIRouter, HTTPException, status, Depends
from typing import List, Optional
from models import (
    Demand, DemandCreate, DemandUpdate, DemandStatus,
    Proposal, ProposalCreate, ProposalStatus,
    PropertyType, NotificationType
)
from auth import get_current_user_email
from database import db
from datetime import datetime
import uuid
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/demands", tags=["demands"])

# Collections
demands_collection = db.demands
proposals_collection = db.proposals
properties_collection = db.properties
users_collection = db.users
notifications_collection = db.notifications


async def create_notification(user_email: str, notification_type: str, title: str, message: str, data: dict = None):
    """Helper function to create notifications"""
    notification = {
        "id": str(uuid.uuid4()),
        "user_email": user_email,
        "type": notification_type,
        "title": title,
        "message": message,
        "data": data or {},
        "read": False,
        "created_at": datetime.utcnow()
    }
    await notifications_collection.insert_one(notification)


async def find_compatible_properties(demand_dict: dict) -> List[dict]:
    """
    Sistema de Matchmaking: Encontra imóveis compatíveis com a demanda
    """
    query = {
        "property_type": demand_dict["tipo_imovel"],
        "price": {
            "$gte": demand_dict["valor_minimo"],
            "$lte": demand_dict["valor_maximo"]
        },
        "neighborhood": {"$in": demand_dict["bairros_interesse"]}
    }
    
    # Adicionar filtro de cidade se disponível
    if demand_dict.get("cidade"):
        query["city"] = demand_dict["cidade"]
    
    # Filtros opcionais
    if demand_dict.get("dormitorios_min"):
        query["bedrooms"] = {"$gte": demand_dict["dormitorios_min"]}
    
    if demand_dict.get("vagas_garagem_min"):
        query["garage"] = {"$gte": demand_dict["vagas_garagem_min"]}
    
    if demand_dict.get("area_util_min"):
        query["area"] = {"$gte": demand_dict["area_util_min"]}
    
    compatible_properties = await properties_collection.find(query).to_list(100)
    return compatible_properties


# ==========================================
# DEMAND ROUTES - Gerenciamento de Demandas
# ==========================================

@router.post("/", response_model=Demand, status_code=status.HTTP_201_CREATED)
async def create_demand(
    demand: DemandCreate,
    current_user_email: str = Depends(get_current_user_email)
):
    """
    Criar uma nova demanda no Mural de Oportunidades
    Apenas corretores e imobiliárias podem criar demandas
    """
    # Get user info
    user = await users_collection.find_one({"email": current_user_email})
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    # Verificar se é corretor ou imobiliária
    if user["user_type"] not in ["corretor", "imobiliaria"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas corretores e imobiliárias podem criar demandas"
        )
    
    # Validar faixa de valor
    if demand.valor_minimo >= demand.valor_maximo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Valor mínimo deve ser menor que valor máximo"
        )
    
    # Create demand document
    demand_id = str(uuid.uuid4())
    demand_dict = demand.dict()
    demand_dict.update({
        "id": demand_id,
        "corretor_id": user["id"],
        "corretor_name": user["name"],
        "corretor_phone": user["phone"],
        "corretor_creci": user.get("creci"),
        "status": DemandStatus.active.value,
        "propostas_count": 0,
        "views": 0,
        "created_at": datetime.utcnow(),
        "updated_at": None
    })
    
    await demands_collection.insert_one(demand_dict)
    logger.info(f"Demand created: {demand_id} by {current_user_email}")
    
    # MATCHMAKING: Buscar imóveis compatíveis e notificar proprietários
    try:
        compatible_properties = await find_compatible_properties(demand_dict)
        
        # Notificar proprietários que têm imóveis compatíveis
        notified_users = set()  # Evitar duplicatas
        for property_doc in compatible_properties:
            owner_id = property_doc.get("owner_id")
            if owner_id and owner_id not in notified_users and owner_id != user["id"]:
                # Buscar dados do proprietário
                owner = await users_collection.find_one({"id": owner_id})
                if owner:
                    await create_notification(
                        user_email=owner["email"],
                        notification_type=NotificationType.opportunity.value,
                        title="🎯 Nova Oportunidade de Parceria!",
                        message=f"Seu imóvel '{property_doc['title']}' é compatível com uma nova demanda no Mural de Oportunidades! Comissão oferecida: {demand_dict['comissao_parceiro']}%",
                        data={
                            "demand_id": demand_id,
                            "property_id": property_doc["id"],
                            "comissao": demand_dict["comissao_parceiro"]
                        }
                    )
                    notified_users.add(owner_id)
        
        logger.info(f"Notified {len(notified_users)} users about new demand {demand_id}")
    except Exception as e:
        logger.error(f"Error in matchmaking: {e}")
        # Não falha a criação da demanda se o matchmaking falhar
    
    return Demand(**{k: v for k, v in demand_dict.items() if k != '_id'})


@router.get("/", response_model=List[Demand])
async def list_demands(
    tipo_imovel: Optional[str] = None,
    bairro: Optional[str] = None,
    valor_min: Optional[float] = None,
    valor_max: Optional[float] = None,
    status: Optional[str] = "active",
    skip: int = 0,
    limit: int = 50,
    current_user_email: str = Depends(get_current_user_email)
):
    """
    Listar demandas do Mural de Oportunidades com filtros
    Apenas corretores e imobiliárias podem ver
    """
    # Verificar permissão
    user = await users_collection.find_one({"email": current_user_email})
    if user["user_type"] not in ["corretor", "imobiliaria"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas corretores e imobiliárias podem acessar o Mural"
        )
    
    # Build query
    query = {}
    if status:
        query["status"] = status
    if tipo_imovel:
        query["tipo_imovel"] = tipo_imovel
    if bairro:
        query["bairros_interesse"] = bairro
    if valor_min is not None:
        query["valor_minimo"] = {"$lte": valor_min}
    if valor_max is not None:
        query["valor_maximo"] = {"$gte": valor_max}
    
    demands = await demands_collection.find(query).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    return [Demand(**{k: v for k, v in demand.items() if k != '_id'}) for demand in demands]


@router.get("/my-demands", response_model=List[Demand])
async def get_my_demands(
    current_user_email: str = Depends(get_current_user_email)
):
    """Listar minhas próprias demandas"""
    user = await users_collection.find_one({"email": current_user_email})
    
    demands = await demands_collection.find({"corretor_id": user["id"]}).sort("created_at", -1).to_list(100)
    return [Demand(**{k: v for k, v in demand.items() if k != '_id'}) for demand in demands]


@router.get("/{demand_id}", response_model=Demand)
async def get_demand(
    demand_id: str,
    current_user_email: str = Depends(get_current_user_email)
):
    """Obter detalhes de uma demanda específica"""
    demand = await demands_collection.find_one({"id": demand_id})
    if not demand:
        raise HTTPException(status_code=404, detail="Demanda não encontrada")
    
    # Incrementar contador de visualizações
    await demands_collection.update_one(
        {"id": demand_id},
        {"$inc": {"views": 1}}
    )
    demand["views"] += 1
    
    return Demand(**{k: v for k, v in demand.items() if k != '_id'})


@router.put("/{demand_id}", response_model=Demand)
async def update_demand(
    demand_id: str,
    demand_update: DemandUpdate,
    current_user_email: str = Depends(get_current_user_email)
):
    """Atualizar uma demanda (apenas o criador pode atualizar)"""
    demand = await demands_collection.find_one({"id": demand_id})
    if not demand:
        raise HTTPException(status_code=404, detail="Demanda não encontrada")
    
    # Verificar se é o criador
    user = await users_collection.find_one({"email": current_user_email})
    if demand["corretor_id"] != user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas o criador pode atualizar a demanda"
        )
    
    # Build update dict
    update_dict = {k: v for k, v in demand_update.dict(exclude_unset=True).items() if v is not None}
    if update_dict:
        update_dict["updated_at"] = datetime.utcnow()
        
        await demands_collection.update_one(
            {"id": demand_id},
            {"$set": update_dict}
        )
        logger.info(f"Demand updated: {demand_id}")
    
    updated_demand = await demands_collection.find_one({"id": demand_id})
    return Demand(**{k: v for k, v in updated_demand.items() if k != '_id'})


@router.delete("/{demand_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_demand(
    demand_id: str,
    current_user_email: str = Depends(get_current_user_email)
):
    """Deletar uma demanda (apenas o criador pode deletar)"""
    demand = await demands_collection.find_one({"id": demand_id})
    if not demand:
        raise HTTPException(status_code=404, detail="Demanda não encontrada")
    
    user = await users_collection.find_one({"email": current_user_email})
    if demand["corretor_id"] != user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas o criador pode deletar a demanda"
        )
    
    await demands_collection.delete_one({"id": demand_id})
    
    # Deletar também todas as propostas relacionadas
    await proposals_collection.delete_many({"demand_id": demand_id})
    
    logger.info(f"Demand deleted: {demand_id}")
    return None


# ==========================================
# PROPOSAL ROUTES - Sistema de Propostas
# ==========================================

@router.post("/{demand_id}/proposals", response_model=Proposal, status_code=status.HTTP_201_CREATED)
async def create_proposal(
    demand_id: str,
    proposal: ProposalCreate,
    current_user_email: str = Depends(get_current_user_email)
):
    """
    Criar uma proposta para uma demanda
    Ofertante pode enviar com ou sem imóvel vinculado
    """
    # Verificar se demanda existe
    demand = await demands_collection.find_one({"id": demand_id})
    if not demand:
        raise HTTPException(status_code=404, detail="Demanda não encontrada")
    
    if demand["status"] != DemandStatus.active.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Esta demanda não está mais ativa"
        )
    
    # Get ofertante info
    user = await users_collection.find_one({"email": current_user_email})
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    # Verificar se é corretor/imobiliária
    if user["user_type"] not in ["corretor", "imobiliaria"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas corretores e imobiliárias podem fazer propostas"
        )
    
    # Não pode fazer proposta para sua própria demanda
    if demand["corretor_id"] == user["id"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Você não pode fazer propostas para suas próprias demandas"
        )
    
    # Verificar se já fez proposta para esta demanda
    existing = await proposals_collection.find_one({
        "demand_id": demand_id,
        "ofertante_id": user["id"]
    })
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Você já fez uma proposta para esta demanda"
        )
    
    # Buscar imóvel se fornecido
    property_doc = None
    property_title = None
    property_price = None
    
    if proposal.imovel_id:
        property_doc = await properties_collection.find_one({"id": proposal.imovel_id})
        if property_doc:
            property_title = property_doc.get("title")
            property_price = property_doc.get("price")
    
    # Create proposal
    proposal_id = str(uuid.uuid4())
    proposal_dict = {
        "id": proposal_id,
        "demand_id": demand_id,
        "property_id": proposal.imovel_id,
        "property_title": property_title,
        "property_price": property_price,
        "ofertante_id": user["id"],
        "ofertante_name": user["name"],
        "ofertante_phone": user["phone"],
        "ofertante_creci": user.get("creci"),
        "message": proposal.mensagem,
        "status": ProposalStatus.pending.value,
        "created_at": datetime.utcnow(),
        "updated_at": None
    }
    
    await proposals_collection.insert_one(proposal_dict)
    
    # Incrementar contador de propostas na demanda
    await demands_collection.update_one(
        {"id": demand_id},
        {"$inc": {"propostas_count": 1}}
    )
    
    # Notificar o demandante - buscar email do corretor
    demandante = await users_collection.find_one({"id": demand["corretor_id"]})
    if demandante:
        await create_notification(
            user_email=demandante["email"],
            notification_type=NotificationType.proposal.value,
            title="📩 Nova Proposta Recebida!",
            message=f"{user['name']} enviou uma proposta para sua demanda no Mural de Oportunidades",
            data={
                "demand_id": demand_id,
                "proposal_id": proposal_id,
                "property_title": property_title
            }
        )
    
    logger.info(f"Proposal created: {proposal_id} for demand {demand_id}")
    
    return Proposal(**{k: v for k, v in proposal_dict.items() if k != '_id'})


@router.get("/{demand_id}/proposals", response_model=List[Proposal])
async def list_proposals(
    demand_id: str,
    current_user_email: str = Depends(get_current_user_email)
):
    """Listar todas as propostas de uma demanda (apenas o demandante pode ver)"""
    demand = await demands_collection.find_one({"id": demand_id})
    if not demand:
        raise HTTPException(status_code=404, detail="Demanda não encontrada")
    
    user = await users_collection.find_one({"email": current_user_email})
    
    # Apenas o criador da demanda pode ver as propostas
    if demand["corretor_id"] != user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas o criador da demanda pode ver as propostas"
        )
    
    proposals = await proposals_collection.find({"demand_id": demand_id}).sort("created_at", -1).to_list(100)
    return [Proposal(**{k: v for k, v in proposal.items() if k != '_id'}) for proposal in proposals]


@router.put("/proposals/{proposal_id}/accept")
async def accept_proposal(
    proposal_id: str,
    current_user_email: str = Depends(get_current_user_email)
):
    """Aceitar uma proposta (apenas o demandante pode aceitar)"""
    proposal = await proposals_collection.find_one({"id": proposal_id})
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposta não encontrada")
    
    demand = await demands_collection.find_one({"id": proposal["demand_id"]})
    user = await users_collection.find_one({"email": current_user_email})
    
    if demand["corretor_id"] != user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas o criador da demanda pode aceitar propostas"
        )
    
    # Atualizar proposta
    await proposals_collection.update_one(
        {"id": proposal_id},
        {"$set": {"status": ProposalStatus.accepted.value, "updated_at": datetime.utcnow()}}
    )
    
    # Atualizar demanda para "em negociação"
    await demands_collection.update_one(
        {"id": proposal["demand_id"]},
        {"$set": {"status": DemandStatus.in_negotiation.value, "updated_at": datetime.utcnow()}}
    )
    
    # Notificar ofertante
    ofertante_user = await users_collection.find_one({"id": proposal["ofertante_id"]})
    if ofertante_user:
        await create_notification(
            user_email=ofertante_user["email"],
            notification_type=NotificationType.proposal_accepted.value,
            title="🎉 Proposta Aceita!",
            message=f"Sua proposta foi aceita por {user['name']}! Entre em contato: {user['phone']}",
            data={
                "demand_id": proposal["demand_id"],
                "proposal_id": proposal_id
            }
        )
    
    return {"message": "Proposta aceita com sucesso"}


@router.put("/proposals/{proposal_id}/reject")
async def reject_proposal(
    proposal_id: str,
    current_user_email: str = Depends(get_current_user_email)
):
    """Rejeitar uma proposta"""
    proposal = await proposals_collection.find_one({"id": proposal_id})
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposta não encontrada")
    
    demand = await demands_collection.find_one({"id": proposal["demand_id"]})
    user = await users_collection.find_one({"email": current_user_email})
    
    if demand["corretor_id"] != user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas o criador da demanda pode rejeitar propostas"
        )
    
    await proposals_collection.update_one(
        {"id": proposal_id},
        {"$set": {"status": ProposalStatus.rejected.value, "updated_at": datetime.utcnow()}}
    )
    
    return {"message": "Proposta rejeitada"}


@router.get("/stats/summary")
async def get_demand_stats(
    current_user_email: str = Depends(get_current_user_email)
):
    """Obter estatísticas do Mural para o corretor"""
    user = await users_collection.find_one({"email": current_user_email})
    
    # Minhas demandas
    my_demands_count = await demands_collection.count_documents({"corretor_id": user["id"]})
    my_active_demands = await demands_collection.count_documents({
        "corretor_id": user["id"],
        "status": DemandStatus.active.value
    })
    
    # Minhas propostas
    my_proposals_count = await proposals_collection.count_documents({"ofertante_id": user["id"]})
    my_accepted_proposals = await proposals_collection.count_documents({
        "ofertante_id": user["id"],
        "status": ProposalStatus.accepted.value
    })
    
    # Propostas recebidas
    my_demands = await demands_collection.find({"corretor_id": user["id"]}).to_list(1000)
    demand_ids = [d["id"] for d in my_demands]
    
    received_proposals_count = await proposals_collection.count_documents({
        "demand_id": {"$in": demand_ids}
    })
    
    return {
        "my_demands": my_demands_count,
        "my_active_demands": my_active_demands,
        "my_proposals": my_proposals_count,
        "my_accepted_proposals": my_accepted_proposals,
        "received_proposals": received_proposals_count
    }
