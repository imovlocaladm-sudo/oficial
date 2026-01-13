from fastapi import APIRouter, HTTPException, status, Depends
from typing import List, Optional
from pydantic import BaseModel, EmailStr
from middlewares.admin_middleware import get_current_admin
from database import db
from datetime import datetime, timedelta
from passlib.context import CryptContext
import uuid

router = APIRouter(prefix="/admin", tags=["admin"])

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Dashboard Stats Model
class DashboardStats(BaseModel):
    total_properties: int
    total_users: int
    total_services: int
    pending_users: int
    active_users: int
    paused_users: int
    properties_by_purpose: dict
    recent_registrations: List[dict]
    properties_by_city: dict

# User Management Models
class UserCreate(BaseModel):
    """Model for admin to create new users"""
    name: str
    email: EmailStr
    password: str
    phone: str
    cpf: str
    city: str
    state: str
    user_type: str  # 'particular' or 'corretor'
    creci: Optional[str] = None
    company: Optional[str] = None

class UserUpdate(BaseModel):
    status: Optional[str] = None
    user_type: Optional[str] = None

class UserFullUpdate(BaseModel):
    """Model for full user edit by admin"""
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    cpf: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    user_type: Optional[str] = None
    creci: Optional[str] = None
    company: Optional[str] = None
    cnpj: Optional[str] = None
    razao_social: Optional[str] = None
    status: Optional[str] = None
    plan_type: Optional[str] = None
    bio: Optional[str] = None
    new_password: Optional[str] = None  # Para alterar senha

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    phone: str
    city: str
    state: str
    user_type: str
    status: str
    created_at: datetime
    properties_count: int = 0

@router.get("/dashboard", response_model=DashboardStats)
async def get_dashboard_stats(admin = Depends(get_current_admin)):
    """Get dashboard statistics (Admin only)"""
    
    # Total counts
    total_properties = await db.properties.count_documents({})
    total_users = await db.users.count_documents({"user_type": {"$ne": "admin"}})
    total_services = await db.service_providers.count_documents({})
    pending_users = await db.users.count_documents({"status": "pending"})
    active_users = await db.users.count_documents({"status": "active", "user_type": {"$ne": "admin"}})
    paused_users = await db.users.count_documents({"status": "paused"})
    
    # Properties by purpose
    properties_venda = await db.properties.count_documents({"purpose": "VENDA"})
    properties_aluguel = await db.properties.count_documents({"purpose": "ALUGUEL"})
    properties_temporada = await db.properties.count_documents({"purpose": "ALUGUEL_TEMPORADA"})
    
    properties_by_purpose = {
        "VENDA": properties_venda,
        "ALUGUEL": properties_aluguel,
        "ALUGUEL_TEMPORADA": properties_temporada
    }
    
    # Recent registrations (last 7 days)
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    recent_users = await db.users.find(
        {"created_at": {"$gte": seven_days_ago}, "user_type": {"$ne": "admin"}}
    ).sort("created_at", -1).limit(5).to_list(5)
    
    recent_registrations = [
        {
            "name": user['name'],
            "email": user['email'],
            "type": user['user_type'],
            "date": user['created_at'].strftime("%d/%m/%Y")
        }
        for user in recent_users
    ]
    
    # Properties by city (top 5)
    pipeline = [
        {"$group": {"_id": "$city", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 5}
    ]
    cities = await db.properties.aggregate(pipeline).to_list(5)
    properties_by_city = {city['_id']: city['count'] for city in cities}
    
    return DashboardStats(
        total_properties=total_properties,
        total_users=total_users,
        total_services=total_services,
        pending_users=pending_users,
        active_users=active_users,
        paused_users=paused_users,
        properties_by_purpose=properties_by_purpose,
        recent_registrations=recent_registrations,
        properties_by_city=properties_by_city
    )

# =============================================
# USER MANAGEMENT ROUTES
# =============================================

@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(user_data: UserCreate, admin = Depends(get_current_admin)):
    """Create a new user (Admin only)"""
    
    # Check if email already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email já cadastrado"
        )
    
    # Validate user_type
    if user_data.user_type not in ['particular', 'corretor']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tipo de usuário inválido. Use 'particular' ou 'corretor'"
        )
    
    # Create user document
    user_id = str(uuid.uuid4())
    new_user = {
        'id': user_id,
        'name': user_data.name,
        'email': user_data.email,
        'phone': user_data.phone,
        'cpf': user_data.cpf,
        'city': user_data.city,
        'state': user_data.state,
        'user_type': user_data.user_type,
        'creci': user_data.creci,
        'company': user_data.company,
        'status': 'active',  # New users created by admin are active by default
        'hashed_password': pwd_context.hash(user_data.password),
        'created_at': datetime.utcnow()
    }
    
    await db.users.insert_one(new_user)
    
    return UserResponse(
        id=user_id,
        name=new_user['name'],
        email=new_user['email'],
        phone=new_user['phone'],
        city=new_user['city'],
        state=new_user['state'],
        user_type=new_user['user_type'],
        status=new_user['status'],
        created_at=new_user['created_at'],
        properties_count=0
    )

@router.get("/users", response_model=List[UserResponse])
async def get_all_users(
    status: Optional[str] = None,
    user_type: Optional[str] = None,
    limit: int = 100,
    skip: int = 0,
    admin = Depends(get_current_admin)
):
    """Get all users (Admin only) with pagination"""
    match_query = {"user_type": {"$ne": "admin"}}
    
    if status:
        match_query["status"] = status
    if user_type:
        match_query["user_type"] = user_type
    
    # Use aggregation pipeline to avoid N+1 queries
    pipeline = [
        {"$match": match_query},
        {"$sort": {"created_at": -1}},
        {"$skip": skip},
        {"$limit": limit},
        {
            "$lookup": {
                "from": "properties",
                "localField": "id",
                "foreignField": "owner_id",
                "as": "properties"
            }
        },
        {
            "$addFields": {
                "properties_count": {"$size": "$properties"}
            }
        },
        {
            "$project": {
                "properties": 0,
                "hashed_password": 0,
                "_id": 0
            }
        }
    ]
    
    users = await db.users.aggregate(pipeline).to_list(limit)
    
    users_response = [
        UserResponse(
            id=user['id'],
            name=user['name'],
            email=user['email'],
            phone=user['phone'],
            city=user['city'],
            state=user['state'],
            user_type=user['user_type'],
            status=user.get('status', 'active'),
            created_at=user['created_at'],
            properties_count=user.get('properties_count', 0)
        )
        for user in users
    ]
    
    return users_response

@router.put("/users/{user_id}")
async def update_user_status(
    user_id: str,
    user_update: UserUpdate,
    admin = Depends(get_current_admin)
):
    """Update user status or type (Admin only)"""
    user = await db.users.find_one({"id": user_id})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if user.get('user_type') == 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot modify admin users"
        )
    
    update_data = {}
    if user_update.status:
        update_data['status'] = user_update.status
    if user_update.user_type:
        update_data['user_type'] = user_update.user_type
    
    await db.users.update_one({"id": user_id}, {"$set": update_data})
    
    return {"message": "User updated successfully", "user_id": user_id}


@router.put("/users/{user_id}/full-edit")
async def full_edit_user(
    user_id: str,
    user_update: UserFullUpdate,
    admin = Depends(get_current_admin)
):
    """Full user edit - Admin can edit all user fields (Admin only)"""
    user = await db.users.find_one({"id": user_id})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if user.get('user_type') == 'admin' and admin['email'] != user['email']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot modify other admin users"
        )
    
    update_data = {}
    
    # Update basic fields
    if user_update.name:
        update_data['name'] = user_update.name
    if user_update.email:
        # Check if email is already taken by another user
        existing = await db.users.find_one({"email": user_update.email, "id": {"$ne": user_id}})
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email já está em uso por outro usuário"
            )
        update_data['email'] = user_update.email
    if user_update.phone:
        update_data['phone'] = user_update.phone
    if user_update.cpf:
        update_data['cpf'] = user_update.cpf
    if user_update.city:
        update_data['city'] = user_update.city
    if user_update.state:
        update_data['state'] = user_update.state
    if user_update.user_type:
        if user_update.user_type not in ['particular', 'corretor', 'imobiliaria', 'admin', 'admin_senior']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tipo de usuário inválido"
            )
        update_data['user_type'] = user_update.user_type
    if user_update.creci:
        update_data['creci'] = user_update.creci
    if user_update.company:
        update_data['company'] = user_update.company
    if user_update.cnpj:
        update_data['cnpj'] = user_update.cnpj
    if user_update.razao_social:
        update_data['razao_social'] = user_update.razao_social
    if user_update.status:
        if user_update.status not in ['active', 'pending', 'paused']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Status inválido"
            )
        update_data['status'] = user_update.status
    if user_update.plan_type:
        if user_update.plan_type not in ['free', 'mensal', 'trimestral', 'anual', 'lifetime']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Plano inválido"
            )
        update_data['plan_type'] = user_update.plan_type
        # Se mudar para lifetime, remover data de expiração
        if user_update.plan_type == 'lifetime':
            update_data['plan_expires_at'] = None
    if user_update.bio is not None:
        update_data['bio'] = user_update.bio
    
    # Update password if provided
    if user_update.new_password:
        update_data['hashed_password'] = pwd_context.hash(user_update.new_password)
    
    # Add updated_at timestamp
    update_data['updated_at'] = datetime.utcnow()
    
    # Perform update
    await db.users.update_one({"id": user_id}, {"$set": update_data})
    
    # Get updated user
    updated_user = await db.users.find_one({"id": user_id})
    
    return {
        "message": "Usuário atualizado com sucesso",
        "user": {
            "id": updated_user['id'],
            "name": updated_user['name'],
            "email": updated_user['email'],
            "phone": updated_user['phone'],
            "city": updated_user['city'],
            "state": updated_user['state'],
            "user_type": updated_user['user_type'],
            "status": updated_user['status'],
            "plan_type": updated_user.get('plan_type', 'free')
        }
    }


@router.get("/users/{user_id}/details")
async def get_user_details(
    user_id: str,
    admin = Depends(get_current_admin)
):
    """Get complete user details for editing (Admin only)"""
    user = await db.users.find_one({"id": user_id})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Count user's properties
    properties_count = await db.properties.count_documents({"owner_id": user_id})
    
    # Remove sensitive data
    user_data = {k: v for k, v in user.items() if k not in ['_id', 'hashed_password']}


@router.get("/opportunities-board")
async def get_opportunities_board(admin = Depends(get_current_admin)):
    """
    Mural de Oportunidades - Relatório completo de demandas e propostas
    Exibe dados sobre parcerias realizadas e não realizadas
    """
    # Estatísticas de Demandas
    total_demands = await db.demands.count_documents({})
    active_demands = await db.demands.count_documents({"status": "active"})
    fulfilled_demands = await db.demands.count_documents({"status": "fulfilled"})
    cancelled_demands = await db.demands.count_documents({"status": "cancelled"})
    
    # Estatísticas de Propostas
    total_proposals = await db.proposals.count_documents({})
    pending_proposals = await db.proposals.count_documents({"status": "pending"})
    accepted_proposals = await db.proposals.count_documents({"status": "accepted"})
    rejected_proposals = await db.proposals.count_documents({"status": "rejected"})
    
    # Taxa de Conversão
    conversion_rate = (accepted_proposals / total_proposals * 100) if total_proposals > 0 else 0
    
    # Demandas mais recentes (últimas 10)
    recent_demands = await db.demands.find({}).sort("created_at", -1).limit(10).to_list(10)
    
    # Propostas mais recentes (últimas 10)
    recent_proposals = await db.proposals.find({}).sort("created_at", -1).limit(10).to_list(10)
    
    # Usuários mais ativos (com mais demandas)
    active_users_pipeline = [
        {"$group": {"_id": "$corretor_email", "demand_count": {"$sum": 1}}},
        {"$sort": {"demand_count": -1}},
        {"$limit": 5},
        {
            "$lookup": {
                "from": "users",
                "localField": "_id",
                "foreignField": "email",
                "as": "user_info"
            }
        },
        {"$unwind": "$user_info"},
        {
            "$project": {
                "email": "$_id",
                "name": "$user_info.name",
                "demand_count": 1,
                "_id": 0
            }
        }
    ]
    active_users = await db.demands.aggregate(active_users_pipeline).to_list(5)
    
    # Parcerias realizadas (demandas + propostas aceitas)
    partnerships_pipeline = [
        {
            "$match": {"status": "accepted"}
        },
        {
            "$lookup": {
                "from": "demands",
                "localField": "demand_id",
                "foreignField": "id",
                "as": "demand"
            }
        },
        {"$unwind": "$demand"},
        {
            "$lookup": {
                "from": "users",
                "localField": "corretor_email",
                "foreignField": "email",
                "as": "proposer"
            }
        },
        {"$unwind": "$proposer"},
        {
            "$lookup": {
                "from": "users",
                "localField": "demand.corretor_email",
                "foreignField": "email",
                "as": "demander"
            }
        },
        {"$unwind": "$demander"},
        {"$sort": {"created_at": -1}},
        {"$limit": 10},
        {
            "$project": {
                "_id": 0,
                "proposal_id": "$id",
                "demand_title": "$demand.titulo",
                "property_type": "$demand.tipo_imovel",
                "proposer_name": "$proposer.name",
                "proposer_email": "$proposer.email",
                "demander_name": "$demander.name",
                "demander_email": "$demander.email",
                "created_at": 1,
                "message": 1
            }
        }
    ]
    partnerships = await db.proposals.aggregate(partnerships_pipeline).to_list(10)
    
    # Demandas por tipo de imóvel
    demands_by_type_pipeline = [
        {"$group": {"_id": "$tipo_imovel", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    demands_by_type = await db.demands.aggregate(demands_by_type_pipeline).to_list(20)
    
    # Demandas por cidade
    demands_by_city_pipeline = [
        {"$group": {"_id": "$cidade", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 5}
    ]
    demands_by_city = await db.demands.aggregate(demands_by_city_pipeline).to_list(5)
    
    return {
        "statistics": {
            "demands": {
                "total": total_demands,
                "active": active_demands,
                "fulfilled": fulfilled_demands,
                "cancelled": cancelled_demands
            },
            "proposals": {
                "total": total_proposals,
                "pending": pending_proposals,
                "accepted": accepted_proposals,
                "rejected": rejected_proposals
            },
            "conversion_rate": round(conversion_rate, 2)
        },
        "recent_demands": [
            {
                "id": d.get("id"),
                "title": d.get("titulo"),
                "property_type": d.get("tipo_imovel"),
                "city": d.get("cidade"),
                "status": d.get("status"),
                "created_at": d.get("created_at").isoformat() if d.get("created_at") else None,
                "corretor_email": d.get("corretor_email")
            }
            for d in recent_demands
        ],
        "recent_proposals": [
            {
                "id": p.get("id"),
                "demand_id": p.get("demand_id"),
                "status": p.get("status"),
                "created_at": p.get("created_at").isoformat() if p.get("created_at") else None,
                "corretor_email": p.get("corretor_email")
            }
            for p in recent_proposals
        ],
        "active_users": active_users,
        "partnerships": partnerships,
        "demands_by_type": [
            {"type": item["_id"], "count": item["count"]}
            for item in demands_by_type
        ],
        "demands_by_city": [
            {"city": item["_id"], "count": item["count"]}
            for item in demands_by_city
        ]
    }

@router.get("/users/{user_id}/details")
async def get_user_details(
    user_id: str,
    admin = Depends(get_current_admin)
):
    """Get complete user details for editing (Admin only)"""
    user = await db.users.find_one({"id": user_id})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Count user's properties
    properties_count = await db.properties.count_documents({"owner_id": user_id})
    
    # Remove sensitive data
    user_data = {k: v for k, v in user.items() if k not in ['_id', 'hashed_password']}
    user_data['properties_count'] = properties_count
    
    return user_data

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    admin = Depends(get_current_admin)
):
    """Delete user and all their data (Admin only)"""
    user = await db.users.find_one({"id": user_id})

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    admin = Depends(get_current_admin)
):
    """Delete user and all their data (Admin only)"""
    user = await db.users.find_one({"id": user_id})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if user.get('user_type') == 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot delete admin users"
        )
    
    # Delete user's properties
    await db.properties.delete_many({"owner_id": user_id})
    
    # Delete user's service providers
    await db.service_providers.delete_many({"owner_id": user_id})
    
    # Delete user
    await db.users.delete_one({"id": user_id})
    
    return {"message": "User and all associated data deleted successfully", "user_id": user_id}

@router.get("/properties")
async def get_all_properties(
    limit: int = 100,
    skip: int = 0,
    admin = Depends(get_current_admin)
):
    """Get all properties with owner info (Admin only) using aggregation"""
    pipeline = [
        {"$sort": {"created_at": -1}},
        {"$skip": skip},
        {"$limit": limit},
        {
            "$lookup": {
                "from": "users",
                "localField": "owner_id",
                "foreignField": "id",
                "as": "owner"
            }
        },
        {
            "$addFields": {
                "owner_name": {"$ifNull": [{"$arrayElemAt": ["$owner.name", 0]}, "Unknown"]},
                "owner_email": {"$ifNull": [{"$arrayElemAt": ["$owner.email", 0]}, "Unknown"]}
            }
        },
        {
            "$project": {
                "owner": 0,
                "_id": 0
            }
        }
    ]
    
    properties = await db.properties.aggregate(pipeline).to_list(limit)
    return properties

@router.delete("/properties/{property_id}")
async def delete_property_admin(
    property_id: str,
    admin = Depends(get_current_admin)
):
    """Delete any property (Admin only)"""
    result = await db.properties.delete_one({"id": property_id})
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Property not found"
        )
    
    return {"message": "Property deleted successfully", "property_id": property_id}

@router.delete("/services/{service_id}")
async def delete_service_admin(
    service_id: str,
    admin = Depends(get_current_admin)
):
    """Delete any service provider (Admin only)"""
    result = await db.service_providers.delete_one({"id": service_id})
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service provider not found"
        )
    
    return {"message": "Service provider deleted successfully", "service_id": service_id}
