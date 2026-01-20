from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File, Form
from models import UserCreate, UserLogin, User, Token, UserInDB, PlanType
from auth import get_password_hash, verify_password, create_access_token, get_current_user_email
from database import users_collection, properties_collection
from datetime import datetime
from pydantic import BaseModel
from typing import Optional
import uuid
import logging
import os
import aiofiles

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["authentication"])

# Directory for profile photos
UPLOAD_DIR = "uploads/profiles"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Pydantic models for profile updates
class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    creci: Optional[str] = None
    company: Optional[str] = None
    cnpj: Optional[str] = None
    razao_social: Optional[str] = None
    bio: Optional[str] = None  # Descrição do profissional (máx 750 caracteres)

class PasswordChange(BaseModel):
    current_password: str
    new_password: str
    confirm_password: str

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(user: UserCreate):
    """Register a new user"""
    # Check if user already exists
    existing_user = await users_collection.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Check if CPF already exists
    existing_cpf = await users_collection.find_one({"cpf": user.cpf})
    if existing_cpf:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="CPF already registered"
        )
    
    # Validação para Corretor (CRECI obrigatório)
    if user.user_type == "corretor":
        if not user.creci:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="CRECI é obrigatório para Corretores"
            )
    
    # Validação para Imobiliária (CRECI obrigatório)
    if user.user_type == "imobiliaria":
        if not user.creci:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="CRECI é obrigatório para Imobiliárias"
            )
        # Se informar CNPJ, verificar se já existe
        if user.cnpj:
            existing_cnpj = await users_collection.find_one({"cnpj": user.cnpj})
            if existing_cnpj:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="CNPJ already registered"
                )
    
    # Create user document
    user_dict = user.model_dump(exclude={'password'})
    user_dict['id'] = str(uuid.uuid4())
    user_dict['hashed_password'] = get_password_hash(user.password)
    user_dict['created_at'] = datetime.utcnow()
    
    # Set default plan (free for new users)
    if 'plan_type' not in user_dict or user_dict['plan_type'] is None:
        user_dict['plan_type'] = PlanType.free.value
    
    # IMPORTANTE: Novos usuários ficam com status 'pending' aguardando aprovação do admin
    # O admin deve aprovar o pagamento antes de liberar o acesso
    user_dict['status'] = 'pending'
    
    # Insert into database
    await users_collection.insert_one(user_dict)
    
    # Retornar mensagem informando que precisa aguardar aprovação
    # NÃO criar token nem logar automaticamente
    return {
        "message": "Cadastro realizado com sucesso! Aguarde a aprovação do administrador para acessar sua conta.",
        "status": "pending",
        "user_email": user.email
    }

@router.post("/login", response_model=Token)
async def login(credentials: UserLogin):
    """Login user"""
    logger.info(f"Login attempt for: {credentials.email}")
    
    # Find user by email
    user = await users_collection.find_one({"email": credentials.email})
    if not user:
        logger.warning(f"User not found: {credentials.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    logger.info(f"User found: {user.get('name')}")
    
    # Check if user is paused
    if user.get('status') == 'paused':
        logger.warning(f"User account is paused: {credentials.email}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Conta pausada. Entre em contato com o administrador."
        )
    
    # Check if user is pending approval
    if user.get('status') == 'pending':
        logger.warning(f"User account is pending: {credentials.email}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Conta aguardando aprovação. Por favor, aguarde."
        )
    
    # Verify password
    password_valid = verify_password(credentials.password, user['hashed_password'])
    logger.info(f"Password verification result: {password_valid}")
    
    if not password_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Create access token
    access_token = create_access_token(data={"sub": credentials.email})
    
    # Return user and token
    user_response = User(**{k: v for k, v in user.items() if k != 'hashed_password' and k != '_id'})
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=user_response
    )

@router.get("/me", response_model=User)
async def get_current_user(email: str = Depends(get_current_user_email)):
    """Get current user information"""
    user = await users_collection.find_one({"email": email})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return User(**{k: v for k, v in user.items() if k != 'hashed_password' and k != '_id'})



@router.put("/profile", response_model=User)
async def update_profile(profile_data: ProfileUpdate, email: str = Depends(get_current_user_email)):
    """Update user profile information"""
    user = await users_collection.find_one({"email": email})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Build update document
    update_fields = {}
    
    if profile_data.name is not None:
        update_fields['name'] = profile_data.name
    if profile_data.phone is not None:
        update_fields['phone'] = profile_data.phone
    if profile_data.city is not None:
        update_fields['city'] = profile_data.city
    if profile_data.state is not None:
        update_fields['state'] = profile_data.state
    if profile_data.creci is not None:
        update_fields['creci'] = profile_data.creci
    if profile_data.company is not None:
        update_fields['company'] = profile_data.company
    if profile_data.bio is not None:
        # Validar limite de 750 caracteres
        if len(profile_data.bio) > 750:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A descrição do profissional não pode ter mais de 750 caracteres."
            )
        update_fields['bio'] = profile_data.bio
    
    if update_fields:
        update_fields['updated_at'] = datetime.utcnow()
        await users_collection.update_one(
            {"email": email},
            {"$set": update_fields}
        )
    
    # Return updated user
    updated_user = await users_collection.find_one({"email": email})
    return User(**{k: v for k, v in updated_user.items() if k != 'hashed_password' and k != '_id'})


@router.post("/profile/photo", response_model=User)
async def upload_profile_photo(
    photo: UploadFile = File(...),
    email: str = Depends(get_current_user_email)
):
    """Upload or update profile photo"""
    user = await users_collection.find_one({"email": email})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if photo.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tipo de arquivo não permitido. Use JPEG, PNG, WebP ou GIF."
        )
    
    # Validate file size (max 5MB)
    contents = await photo.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Arquivo muito grande. O tamanho máximo é 5MB."
        )
    
    # Generate unique filename
    file_extension = photo.filename.split('.')[-1] if '.' in photo.filename else 'jpg'
    filename = f"{user['id']}_{uuid.uuid4().hex[:8]}.{file_extension}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    
    # Delete old photo if exists
    old_photo = user.get('profile_photo')
    if old_photo:
        old_path = old_photo.replace('/api/', '')
        if os.path.exists(old_path):
            try:
                os.remove(old_path)
            except Exception as e:
                logger.warning(f"Could not delete old profile photo: {e}")
    
    # Save new photo
    async with aiofiles.open(filepath, 'wb') as f:
        await f.write(contents)
    
    # Update user with new photo URL
    photo_url = f"/api/{filepath}"
    await users_collection.update_one(
        {"email": email},
        {"$set": {
            "profile_photo": photo_url,
            "updated_at": datetime.utcnow()
        }}
    )
    
    # Return updated user
    updated_user = await users_collection.find_one({"email": email})
    return User(**{k: v for k, v in updated_user.items() if k != 'hashed_password' and k != '_id'})


@router.delete("/profile/photo", response_model=User)
async def delete_profile_photo(email: str = Depends(get_current_user_email)):
    """Delete profile photo"""
    user = await users_collection.find_one({"email": email})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Delete photo file if exists
    old_photo = user.get('profile_photo')
    if old_photo:
        old_path = old_photo.replace('/api/', '')
        if os.path.exists(old_path):
            try:
                os.remove(old_path)
            except Exception as e:
                logger.warning(f"Could not delete profile photo: {e}")
    
    # Update user to remove photo
    await users_collection.update_one(
        {"email": email},
        {"$set": {
            "profile_photo": None,
            "updated_at": datetime.utcnow()
        }}
    )
    
    # Return updated user
    updated_user = await users_collection.find_one({"email": email})
    return User(**{k: v for k, v in updated_user.items() if k != 'hashed_password' and k != '_id'})


@router.post("/change-password")
async def change_password(
    password_data: PasswordChange,
    email: str = Depends(get_current_user_email)
):
    """Change user password"""
    user = await users_collection.find_one({"email": email})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Verify current password
    if not verify_password(password_data.current_password, user['hashed_password']):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Senha atual incorreta."
        )
    
    # Validate new password
    if len(password_data.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A nova senha deve ter pelo menos 6 caracteres."
        )
    
    # Confirm passwords match
    if password_data.new_password != password_data.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A nova senha e a confirmação não coincidem."
        )
    
    # Check if new password is different from current
    if verify_password(password_data.new_password, user['hashed_password']):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A nova senha deve ser diferente da senha atual."
        )
    
    # Update password
    new_hashed_password = get_password_hash(password_data.new_password)
    await users_collection.update_one(
        {"email": email},
        {"$set": {
            "hashed_password": new_hashed_password,
            "updated_at": datetime.utcnow()
        }}
    )
    
    logger.info(f"Password changed successfully for user: {email}")
    
    return {"message": "Senha alterada com sucesso!"}



# Modelo para perfil público do anunciante
class PublicProfile(BaseModel):
    id: str
    name: str
    phone: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    user_type: str
    creci: Optional[str] = None
    company: Optional[str] = None
    profile_photo: Optional[str] = None
    bio: Optional[str] = None
    created_at: Optional[datetime] = None
    total_properties: int = 0


@router.get("/profile/{user_id}", response_model=PublicProfile)
async def get_public_profile(user_id: str):
    """Get public profile of an advertiser by user ID"""
    user = await users_collection.find_one({"id": user_id})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado"
        )
    
    # Contar propriedades do usuário
    properties_count = await properties_collection.count_documents({"owner_id": user_id})
    
    # Retornar apenas dados públicos (sem email, cpf, senha, etc.)
    return PublicProfile(
        id=user['id'],
        name=user.get('name', ''),
        phone=user.get('phone'),
        city=user.get('city'),
        state=user.get('state'),
        user_type=user.get('user_type', 'particular'),
        creci=user.get('creci'),
        company=user.get('company'),
        profile_photo=user.get('profile_photo'),
        bio=user.get('bio'),
        created_at=user.get('created_at'),
        total_properties=properties_count
    )
