from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime
from enum import Enum

# Enums
class UserType(str, Enum):
    particular = "particular"    # Só pode anunciar Aluguel e Aluguel por Temporada
    corretor = "corretor"        # Pode anunciar todos os tipos (Venda, Aluguel, etc.)
    imobiliaria = "imobiliaria"  # Imobiliária com CRECI, múltiplos anúncios
    admin = "admin"              # Admin Master - acesso total
    admin_senior = "admin_senior"  # Admin Sênior - acesso limitado

class UserStatus(str, Enum):
    active = "active"
    pending = "pending"
    paused = "paused"
    deleted = "deleted"

class PlanType(str, Enum):
    free = "free"                 # Plano gratuito (limitado)
    trimestral = "trimestral"     # Plano trimestral (3 meses)
    anual = "anual"               # Plano anual (12 meses)
    lifetime = "lifetime"         # Acesso vitalício (legado)

class PropertyPurpose(str, Enum):
    venda = "VENDA"
    aluguel = "ALUGUEL"
    aluguel_temporada = "ALUGUEL_TEMPORADA"

class PropertyType(str, Enum):
    apartamento = "Apartamento"
    casa_terrea = "Casa-Térrea"
    casa_terrea_condominio = "Casa-Térrea-Condomínio"
    casa_vila = "Casa de Vila"
    sobrado = "Sobrado"
    sobrado_condominio = "Sobrado-Condomínio"
    kitnet = "Kitnet"
    studio = "Studio"
    flat = "Apart Hotel / Flat / Loft"
    cobertura = "Apto. Cobertura / Duplex"
    terreno = "Terreno"
    terreno_condominio = "Terreno-Condomínio"
    comercial = "Imóvel Comercial"
    sala_loja = "Sala / Salão / Loja"
    galpao = "Galpão / Depósito"
    sitio = "Sítio / Fazenda / Chácara"
    espaco_eventos = "Espaço para Eventos"

# User Models
class UserBase(BaseModel):
    name: str
    email: EmailStr
    phone: str
    cpf: str
    city: str
    state: str
    user_type: UserType
    creci: Optional[str] = None        # CRECI para Corretor ou Imobiliária
    company: Optional[str] = None      # Nome da empresa (Corretor ou Imobiliária)
    cnpj: Optional[str] = None         # CNPJ para Imobiliária
    razao_social: Optional[str] = None # Razão Social para Imobiliária
    status: Optional[UserStatus] = UserStatus.active
    plan_type: Optional[PlanType] = PlanType.free
    plan_expires_at: Optional[datetime] = None  # None para plano vitalício
    profile_photo: Optional[str] = None
    bio: Optional[str] = None  # Descrição do profissional (máx 750 caracteres)

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(UserBase):
    id: str
    created_at: datetime
    
    class Config:
        from_attributes = True


# ==========================================
# SISTEMA DE BANNERS PUBLICITÁRIOS
# ==========================================

class BannerPosition(str, Enum):
    home_topo = "home_topo"                 # Topo da home page
    home_meio = "home_meio"                 # Entre destaques e lançamentos
    busca_lateral = "busca_lateral"         # Lateral da busca detalhada
    busca_topo = "busca_topo"               # Topo da página de busca
    imovel_lateral = "imovel_lateral"       # Lateral da página de detalhes
    rodape = "rodape"                       # Banner no rodapé

class BannerStatus(str, Enum):
    active = "active"
    inactive = "inactive"

class BannerCreate(BaseModel):
    """Dados para criar um banner"""
    title: str = Field(..., min_length=2, max_length=100, description="Título para identificação interna")
    link_url: str = Field(..., description="URL de destino ao clicar no banner")
    position: BannerPosition
    order: int = Field(default=0, description="Ordem de exibição (menor número = maior prioridade)")
    status: BannerStatus = BannerStatus.active

class BannerUpdate(BaseModel):
    """Dados para atualizar um banner"""
    title: Optional[str] = None
    link_url: Optional[str] = None
    position: Optional[BannerPosition] = None
    order: Optional[int] = None
    status: Optional[BannerStatus] = None

class Banner(BaseModel):
    """Modelo completo de banner"""
    id: str
    title: str
    image_url: str
    link_url: str
    position: BannerPosition
    order: int
    status: BannerStatus
    clicks: int = 0  # Contador de cliques
    views: int = 0   # Contador de visualizações
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class UserInDB(User):
    hashed_password: str

# Property Models
class PropertyBase(BaseModel):
    title: str
    description: str
    property_type: PropertyType
    purpose: PropertyPurpose
    price: float
    address: Optional[str] = None  # Endereço completo (rua, número)
    neighborhood: str
    city: str
    state: str
    latitude: Optional[float] = None  # Coordenada latitude
    longitude: Optional[float] = None  # Coordenada longitude
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    area: Optional[float] = None
    garage: Optional[int] = None
    year_built: Optional[int] = None
    condominio: Optional[float] = None
    iptu: Optional[float] = None
    features: Optional[List[str]] = []
    images: Optional[List[str]] = []
    is_launch: bool = False
    is_featured: bool = False  # Imóvel em destaque (Corretor)
    is_exclusive_launch: bool = False  # Lançamento exclusivo (Imobiliária)

class PropertyCreate(PropertyBase):
    pass

class PropertyUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    property_type: Optional[PropertyType] = None
    purpose: Optional[PropertyPurpose] = None
    price: Optional[float] = None
    address: Optional[str] = None
    neighborhood: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    area: Optional[float] = None
    garage: Optional[int] = None
    year_built: Optional[int] = None
    condominio: Optional[float] = None
    iptu: Optional[float] = None
    features: Optional[List[str]] = None
    images: Optional[List[str]] = None
    is_launch: Optional[bool] = None
    is_featured: Optional[bool] = None
    is_exclusive_launch: Optional[bool] = None

class Property(PropertyBase):
    id: str
    owner_id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class PropertyWithOwner(PropertyBase):
    """Property model with owner information for public listing"""
    id: str
    owner_id: str
    owner_name: Optional[str] = None
    owner_phone: Optional[str] = None
    owner_photo: Optional[str] = None
    owner_bio: Optional[str] = None
    owner_creci: Optional[str] = None
    owner_company: Optional[str] = None
    owner_user_type: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Token Models
class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class TokenData(BaseModel):
    email: Optional[str] = None



# ==========================================
# AGENDAMENTO DE VISITAS
# ==========================================

class VisitStatus(str, Enum):
    pending = "pending"       # Aguardando confirmação
    confirmed = "confirmed"   # Confirmada
    completed = "completed"   # Realizada
    cancelled = "cancelled"   # Cancelada

class VisitScheduleCreate(BaseModel):
    """Dados para criar um agendamento de visita"""
    property_id: str
    visitor_name: str = Field(..., min_length=2, max_length=100)
    visitor_phone: str = Field(..., min_length=10, max_length=20)
    visitor_email: Optional[EmailStr] = None
    visit_date: str  # Data no formato YYYY-MM-DD
    visit_time: str  # Hora no formato HH:MM
    message: Optional[str] = Field(None, max_length=500)

class VisitSchedule(BaseModel):
    """Modelo completo de agendamento"""
    id: str
    property_id: str
    property_title: str
    property_address: str
    owner_id: str
    owner_name: str
    owner_email: str
    visitor_name: str
    visitor_phone: str
    visitor_email: Optional[str] = None
    visit_date: str
    visit_time: str
    message: Optional[str] = None
    status: VisitStatus = VisitStatus.pending
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# ==========================================
# SISTEMA DE NOTIFICAÇÕES
# ==========================================

class NotificationType(str, Enum):
    visit_scheduled = "visit_scheduled"     # Nova visita agendada
    visit_confirmed = "visit_confirmed"     # Visita confirmada
    visit_cancelled = "visit_cancelled"     # Visita cancelada
    new_message = "new_message"             # Nova mensagem
    system = "system"                       # Notificação do sistema
    opportunity = "opportunity"             # Nova oportunidade no mural
    proposal = "proposal"                   # Nova proposta recebida
    proposal_accepted = "proposal_accepted" # Proposta aceita
    proposal_rejected = "proposal_rejected" # Proposta rejeitada
    new_user_registration = "new_user_registration"  # Novo cadastro de usuário
    payment_receipt = "payment_receipt"     # Comprovante de pagamento enviado
    payment_approved = "payment_approved"   # Pagamento aprovado
    payment_rejected = "payment_rejected"   # Pagamento rejeitado

class NotificationCreate(BaseModel):
    """Dados para criar uma notificação"""
    user_id: str
    type: NotificationType
    title: str
    message: str
    data: Optional[dict] = None  # Dados adicionais (ex: ID do agendamento)

class Notification(BaseModel):
    """Modelo completo de notificação"""
    id: str
    user_id: str
    type: NotificationType
    title: str
    message: str
    data: Optional[dict] = None
    read: bool = False
    created_at: datetime

    class Config:
        from_attributes = True


# ==========================================
# MURAL DE OPORTUNIDADES - PARCERIAS
# ==========================================

class DemandStatus(str, Enum):
    active = "active"           # Demanda ativa no mural
    in_negotiation = "in_negotiation"  # Em negociação
    closed = "closed"           # Fechada/Atendida
    cancelled = "cancelled"     # Cancelada pelo demandante

class DemandCreate(BaseModel):
    """Dados para criar uma demanda"""
    tipo_imovel: PropertyType
    estado: Optional[str] = Field(None, min_length=2, max_length=2, description="Sigla do estado (UF)")
    cidade: str = Field(..., min_length=2, max_length=100, description="Cidade de interesse")
    bairros_interesse: List[str] = Field(..., min_items=1, description="Lista de bairros de interesse")
    valor_minimo: float = Field(..., gt=0, description="Valor mínimo em reais")
    valor_maximo: float = Field(..., gt=0, description="Valor máximo em reais")
    comissao_parceiro: float = Field(..., ge=0, le=100, description="Percentual de comissão para o parceiro")
    dormitorios_min: Optional[int] = Field(None, ge=0)
    vagas_garagem_min: Optional[int] = Field(None, ge=0)
    area_util_min: Optional[float] = Field(None, gt=0, description="Área útil mínima em m²")
    caracteristicas_essenciais: Optional[str] = Field(None, max_length=500, description="Características desejadas")

class DemandUpdate(BaseModel):
    """Dados para atualizar uma demanda"""
    estado: Optional[str] = None
    cidade: Optional[str] = None
    bairros_interesse: Optional[List[str]] = None
    valor_minimo: Optional[float] = None
    valor_maximo: Optional[float] = None
    comissao_parceiro: Optional[float] = None
    dormitorios_min: Optional[int] = None
    vagas_garagem_min: Optional[int] = None
    area_util_min: Optional[float] = None
    caracteristicas_essenciais: Optional[str] = None
    status: Optional[DemandStatus] = None

class Demand(BaseModel):
    """Modelo completo de demanda no mural"""
    id: str
    corretor_id: str  # ID do corretor que criou a demanda
    corretor_name: str  # Nome do corretor (para exibição)
    corretor_phone: str  # Telefone do corretor
    corretor_creci: Optional[str] = None  # CRECI do corretor
    tipo_imovel: PropertyType
    estado: Optional[str] = None  # Sigla do estado
    cidade: Optional[str] = None  # Cidade de interesse (opcional para compatibilidade)
    bairros_interesse: List[str]
    valor_minimo: float
    valor_maximo: float
    comissao_parceiro: float
    dormitorios_min: Optional[int] = None
    vagas_garagem_min: Optional[int] = None
    area_util_min: Optional[float] = None
    caracteristicas_essenciais: Optional[str] = None
    status: DemandStatus = DemandStatus.active
    propostas_count: int = 0  # Contador de propostas recebidas
    views: int = 0  # Contador de visualizações
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ProposalStatus(str, Enum):
    pending = "pending"         # Aguardando resposta
    accepted = "accepted"       # Aceita pelo demandante
    rejected = "rejected"       # Rejeitada
    expired = "expired"         # Expirada

class ProposalCreate(BaseModel):
    """Dados para criar uma proposta"""
    mensagem: Optional[str] = Field(None, max_length=1000, description="Mensagem para o demandante")
    imovel_id: Optional[str] = Field(None, description="ID do imóvel oferecido (opcional)")

class Proposal(BaseModel):
    """Modelo completo de proposta"""
    id: str
    demand_id: str
    property_id: Optional[str] = None
    property_title: Optional[str] = None  # Título do imóvel (cache)
    property_price: Optional[float] = None  # Preço do imóvel (cache)
    ofertante_id: str  # ID do corretor que fez a proposta
    ofertante_name: str  # Nome do corretor ofertante
    ofertante_phone: str  # Telefone do ofertante
    ofertante_creci: Optional[str] = None
    message: Optional[str] = None
    status: ProposalStatus = ProposalStatus.pending
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
