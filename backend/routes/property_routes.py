from fastapi import APIRouter, HTTPException, status, Depends, Query, UploadFile, File, Form
from typing import List, Optional
from models import PropertyCreate, PropertyUpdate, Property, PropertyWithOwner
from auth import get_current_user_email
from database import properties_collection, users_collection
from datetime import datetime
import uuid
import os
import shutil
from pathlib import Path

router = APIRouter(prefix="/properties", tags=["properties"])

# Upload directory - use relative path for deployment compatibility
UPLOAD_DIR = Path(__file__).parent.parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

async def save_upload_file(upload_file: UploadFile, property_id: str) -> str:
    """Save an uploaded file and return its URL path"""
    # Generate unique filename
    file_extension = Path(upload_file.filename).suffix.lower()
    unique_filename = f"{property_id}_{uuid.uuid4().hex[:8]}{file_extension}"
    file_path = UPLOAD_DIR / unique_filename
    
    # Save file
    with open(file_path, "wb") as buffer:
        content = await upload_file.read()
        buffer.write(content)
    
    # Return relative path for the API
    return f"/api/uploads/{unique_filename}"

@router.post("/", response_model=Property, status_code=status.HTTP_201_CREATED)
async def create_property(property_data: PropertyCreate, email: str = Depends(get_current_user_email)):
    """Create a new property (authenticated users only)"""
    # Get user
    user = await users_collection.find_one({"email": email})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Validação: Usuário "particular" só pode anunciar Aluguel e Aluguel por Temporada
    if user.get('user_type') == 'particular':
        purpose = property_data.purpose.upper() if isinstance(property_data.purpose, str) else property_data.purpose.value
        if purpose == 'VENDA':
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Usuários do tipo 'Particular' não podem anunciar imóveis para Venda. Apenas Aluguel e Aluguel por Temporada são permitidos."
            )
    
    # Create property document
    property_dict = property_data.model_dump()
    property_dict['id'] = str(uuid.uuid4())
    property_dict['owner_id'] = user['id']
    property_dict['created_at'] = datetime.utcnow()
    property_dict['updated_at'] = datetime.utcnow()
    
    # Insert into database
    await properties_collection.insert_one(property_dict)
    
    return Property(**{k: v for k, v in property_dict.items() if k != '_id'})

@router.post("/with-images", response_model=Property, status_code=status.HTTP_201_CREATED)
async def create_property_with_images(
    title: str = Form(...),
    description: str = Form(...),
    property_type: str = Form(...),
    purpose: str = Form(...),
    price: float = Form(...),
    neighborhood: str = Form(...),
    city: str = Form(...),
    state: str = Form(...),
    bedrooms: Optional[int] = Form(None),
    bathrooms: Optional[int] = Form(None),
    area: Optional[float] = Form(None),
    garage: Optional[int] = Form(None),
    year_built: Optional[int] = Form(None),
    condominio: Optional[float] = Form(None),
    iptu: Optional[float] = Form(None),
    features: Optional[str] = Form(None),
    is_launch: bool = Form(False),
    images: List[UploadFile] = File(default=[]),
    email: str = Depends(get_current_user_email)
):
    """Create a new property with image uploads (authenticated users only)"""
    # Get user
    user = await users_collection.find_one({"email": email})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Validação: Usuário "particular" só pode anunciar Aluguel e Aluguel por Temporada
    if user.get('user_type') == 'particular':
        if purpose.upper() == 'VENDA':
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Usuários do tipo 'Particular' não podem anunciar imóveis para Venda. Apenas Aluguel e Aluguel por Temporada são permitidos."
            )
    
    property_id = str(uuid.uuid4())
    
    # Save uploaded images
    image_urls = []
    for image in images:
        if image.filename:  # Only process if file was actually uploaded
            try:
                image_url = await save_upload_file(image, property_id)
                image_urls.append(image_url)
            except Exception as e:
                print(f"Error saving image: {e}")
    
    # Parse features from comma-separated string
    features_list = []
    if features:
        features_list = [f.strip() for f in features.split(',') if f.strip()]
    
    # Create property document
    property_dict = {
        'id': property_id,
        'title': title,
        'description': description,
        'property_type': property_type,
        'purpose': purpose.upper(),
        'price': price,
        'neighborhood': neighborhood,
        'city': city,
        'state': state.upper(),
        'bedrooms': bedrooms,
        'bathrooms': bathrooms,
        'area': area,
        'garage': garage,
        'year_built': year_built,
        'condominio': condominio,
        'iptu': iptu,
        'features': features_list,
        'images': image_urls,
        'is_launch': is_launch,
        'owner_id': user['id'],
        'created_at': datetime.utcnow(),
        'updated_at': datetime.utcnow()
    }
    
    # Insert into database
    await properties_collection.insert_one(property_dict)
    
    return Property(**{k: v for k, v in property_dict.items() if k != '_id'})

@router.get("/", response_model=List[PropertyWithOwner])
async def list_properties(
    purpose: Optional[str] = Query(None, description="Filter by purpose (VENDA, ALUGUEL)"),
    property_type: Optional[str] = Query(None, description="Filter by property type"),
    city: Optional[str] = Query(None, description="Filter by city"),
    state: Optional[str] = Query(None, description="Filter by state"),
    neighborhood: Optional[str] = Query(None, description="Filter by neighborhood"),
    min_price: Optional[float] = Query(None, description="Minimum price"),
    max_price: Optional[float] = Query(None, description="Maximum price"),
    is_launch: Optional[bool] = Query(None, description="Filter launches"),
    is_featured: Optional[bool] = Query(None, description="Filter featured properties"),
    limit: int = Query(50, le=100, description="Number of results"),
    skip: int = Query(0, ge=0, description="Number of results to skip")
):
    """List properties with filters and owner contact info"""
    # Build query
    query = {}
    
    if purpose:
        query['purpose'] = purpose.upper()
    if property_type:
        query['property_type'] = property_type
    if city:
        query['city'] = {"$regex": city, "$options": "i"}
    if state:
        query['state'] = state.upper()
    if neighborhood:
        query['neighborhood'] = {"$regex": neighborhood, "$options": "i"}
    if min_price is not None or max_price is not None:
        query['price'] = {}
        if min_price is not None:
            query['price']['$gte'] = min_price
        if max_price is not None:
            query['price']['$lte'] = max_price
    if is_launch is not None:
        query['is_launch'] = is_launch
    if is_featured is not None:
        query['is_featured'] = is_featured
    
    # Excluir lançamentos exclusivos da listagem pública
    query['$or'] = [
        {'is_exclusive_launch': {'$exists': False}},
        {'is_exclusive_launch': False}
    ]
    
    # Use aggregation to include owner info
    pipeline = [
        {"$match": query},
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
                "owner_name": {"$ifNull": [{"$arrayElemAt": ["$owner.name", 0]}, None]},
                "owner_phone": {"$ifNull": [{"$arrayElemAt": ["$owner.phone", 0]}, None]},
                "owner_photo": {"$ifNull": [{"$arrayElemAt": ["$owner.profile_photo", 0]}, None]},
                "owner_bio": {"$ifNull": [{"$arrayElemAt": ["$owner.bio", 0]}, None]},
                "owner_creci": {"$ifNull": [{"$arrayElemAt": ["$owner.creci", 0]}, None]},
                "owner_company": {"$ifNull": [{"$arrayElemAt": ["$owner.company", 0]}, None]},
                "owner_user_type": {"$ifNull": [{"$arrayElemAt": ["$owner.user_type", 0]}, None]}
            }
        },
        {
            "$project": {
                "owner": 0,
                "_id": 0
            }
        }
    ]
    
    properties = await properties_collection.aggregate(pipeline).to_list(length=limit)
    
    return [PropertyWithOwner(**prop) for prop in properties]

@router.get("/locations/cities", response_model=List[str])
async def get_cities(state: Optional[str] = Query(None, description="Filter by state")):
    """Get list of cities with properties"""
    match_query = {}
    if state:
        match_query['state'] = state.upper()
    
    pipeline = [
        {"$match": match_query},
        {"$group": {"_id": "$city"}},
        {"$sort": {"_id": 1}}
    ]
    
    cities = await properties_collection.aggregate(pipeline).to_list(100)
    return [city['_id'] for city in cities if city['_id']]

@router.get("/locations/neighborhoods", response_model=List[str])
async def get_neighborhoods(
    city: Optional[str] = Query(None, description="Filter by city"),
    state: Optional[str] = Query(None, description="Filter by state")
):
    """Get list of neighborhoods with properties in a city"""
    match_query = {}
    if city:
        match_query['city'] = {"$regex": city, "$options": "i"}
    if state:
        match_query['state'] = state.upper()
    
    pipeline = [
        {"$match": match_query},
        {"$group": {"_id": "$neighborhood"}},
        {"$sort": {"_id": 1}}
    ]
    
    neighborhoods = await properties_collection.aggregate(pipeline).to_list(100)
    return [n['_id'] for n in neighborhoods if n['_id']]

@router.get("/{property_id}", response_model=PropertyWithOwner)
async def get_property(property_id: str):
    """Get property by ID with owner contact info"""
    # Use aggregation to include owner info
    pipeline = [
        {"$match": {"id": property_id}},
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
                "owner_name": {"$ifNull": [{"$arrayElemAt": ["$owner.name", 0]}, None]},
                "owner_phone": {"$ifNull": [{"$arrayElemAt": ["$owner.phone", 0]}, None]},
                "owner_photo": {"$ifNull": [{"$arrayElemAt": ["$owner.profile_photo", 0]}, None]},
                "owner_bio": {"$ifNull": [{"$arrayElemAt": ["$owner.bio", 0]}, None]},
                "owner_creci": {"$ifNull": [{"$arrayElemAt": ["$owner.creci", 0]}, None]},
                "owner_company": {"$ifNull": [{"$arrayElemAt": ["$owner.company", 0]}, None]},
                "owner_user_type": {"$ifNull": [{"$arrayElemAt": ["$owner.user_type", 0]}, None]}
            }
        },
        {
            "$project": {
                "owner": 0,
                "_id": 0
            }
        }
    ]
    
    properties = await properties_collection.aggregate(pipeline).to_list(length=1)
    
    if not properties:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Property not found"
        )
    
    return PropertyWithOwner(**properties[0])

@router.put("/{property_id}", response_model=Property)
async def update_property(
    property_id: str,
    property_update: PropertyUpdate,
    email: str = Depends(get_current_user_email)
):
    """Update property (only owner can update)"""
    # Get property
    property_data = await properties_collection.find_one({"id": property_id})
    if not property_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Property not found"
        )
    
    # Get user
    user = await users_collection.find_one({"email": email})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check ownership
    if property_data['owner_id'] != user['id']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this property"
        )
    
    # Update property
    update_data = property_update.model_dump(exclude_unset=True)
    update_data['updated_at'] = datetime.utcnow()
    
    await properties_collection.update_one(
        {"id": property_id},
        {"$set": update_data}
    )
    
    # Get updated property
    updated_property = await properties_collection.find_one({"id": property_id})
    return Property(**{k: v for k, v in updated_property.items() if k != '_id'})

@router.put("/{property_id}/with-images", response_model=Property)
async def update_property_with_images(
    property_id: str,
    title: str = Form(...),
    description: str = Form(...),
    property_type: str = Form(...),
    purpose: str = Form(...),
    price: float = Form(...),
    neighborhood: str = Form(...),
    city: str = Form(...),
    state: str = Form(...),
    bedrooms: Optional[int] = Form(None),
    bathrooms: Optional[int] = Form(None),
    area: Optional[float] = Form(None),
    garage: Optional[int] = Form(None),
    year_built: Optional[int] = Form(None),
    condominio: Optional[float] = Form(None),
    iptu: Optional[float] = Form(None),
    features: Optional[str] = Form(None),
    is_launch: bool = Form(False),
    existing_images: Optional[str] = Form(None),  # JSON array of existing image URLs
    new_images: List[UploadFile] = File(default=[]),
    email: str = Depends(get_current_user_email)
):
    """Update property with new image uploads (only owner can update)"""
    import json
    
    # Get property
    property_data = await properties_collection.find_one({"id": property_id})
    if not property_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Property not found"
        )
    
    # Get user
    user = await users_collection.find_one({"email": email})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check ownership
    if property_data['owner_id'] != user['id']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this property"
        )
    
    # Parse existing images from JSON string
    image_urls = []
    if existing_images:
        try:
            image_urls = json.loads(existing_images)
        except:
            image_urls = []
    
    # Save new uploaded images
    for image in new_images:
        if image.filename:
            try:
                image_url = await save_upload_file(image, property_id)
                image_urls.append(image_url)
            except Exception as e:
                print(f"Error saving image: {e}")
    
    # Parse features from comma-separated string
    features_list = []
    if features:
        features_list = [f.strip() for f in features.split(',') if f.strip()]
    
    # Update property document
    update_data = {
        'title': title,
        'description': description,
        'property_type': property_type,
        'purpose': purpose.upper(),
        'price': price,
        'neighborhood': neighborhood,
        'city': city,
        'state': state.upper(),
        'bedrooms': bedrooms,
        'bathrooms': bathrooms,
        'area': area,
        'garage': garage,
        'year_built': year_built,
        'condominio': condominio,
        'iptu': iptu,
        'features': features_list,
        'images': image_urls,
        'is_launch': is_launch,
        'updated_at': datetime.utcnow()
    }
    
    await properties_collection.update_one(
        {"id": property_id},
        {"$set": update_data}
    )
    
    # Get updated property
    updated_property = await properties_collection.find_one({"id": property_id})
    return Property(**{k: v for k, v in updated_property.items() if k != '_id'})

@router.delete("/{property_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_property(property_id: str, email: str = Depends(get_current_user_email)):
    """Delete property (only owner can delete)"""
    # Get property
    property_data = await properties_collection.find_one({"id": property_id})
    if not property_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Property not found"
        )
    
    # Get user
    user = await users_collection.find_one({"email": email})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check ownership
    if property_data['owner_id'] != user['id']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this property"
        )
    
    # Delete property
    await properties_collection.delete_one({"id": property_id})
    
    return None

@router.get("/user/my-properties", response_model=List[Property])
async def get_my_properties(
    limit: int = 100,
    skip: int = 0,
    email: str = Depends(get_current_user_email)
):
    """Get all properties of current user with pagination"""
    # Get user
    user = await users_collection.find_one({"email": email})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Get user's properties with pagination
    cursor = properties_collection.find({"owner_id": user['id']}).sort("created_at", -1).skip(skip).limit(limit)
    properties = await cursor.to_list(length=limit)
    
    return [Property(**{k: v for k, v in prop.items() if k != '_id'}) for prop in properties]
