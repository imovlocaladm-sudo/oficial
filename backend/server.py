from fastapi import FastAPI, APIRouter
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path

# Import routes
from routes.auth_routes import router as auth_router
from routes.property_routes import router as property_router
from routes.admin_routes import router as admin_router
from routes.visit_routes import router as visit_router, notifications_router as legacy_notifications_router
from routes.banner_routes import router as banner_router
from routes.demand_routes import router as demand_router
from routes.payment_routes import router as payment_router
from routes.password_routes import router as password_router
from routes.cloudinary_routes import router as cloudinary_router
from routes.seo_routes import router as seo_router
from routes.notification_routes import router as notification_router
from routes.stripe_routes import router as stripe_router

# Import scheduler
from scheduler import start_scheduler, stop_scheduler

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'test_database')
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

# Create the main app without a prefix
app = FastAPI(title="ImovLocal API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Add health check route
@api_router.get("/")
async def root():
    return {"message": "ImovLocal API is running", "version": "1.0.0"}

# Include routers
api_router.include_router(auth_router)
api_router.include_router(property_router)
api_router.include_router(admin_router)
api_router.include_router(visit_router)
api_router.include_router(notification_router)  # Novo router refatorado
api_router.include_router(banner_router)
api_router.include_router(demand_router)
api_router.include_router(payment_router)
api_router.include_router(password_router)
api_router.include_router(cloudinary_router)
api_router.include_router(seo_router)

# Include the router in the main app
app.include_router(api_router)

# Create uploads directory if it doesn't exist
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

# Mount static files for uploaded images
app.mount("/api/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

# CORS Configuration - Load allowed origins from environment
cors_origins_str = os.environ.get('CORS_ORIGINS', '*')
if cors_origins_str == '*':
    cors_origins = ["*"]
else:
    cors_origins = [origin.strip() for origin in cors_origins_str.split(',') if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware para desabilitar cache em endpoints de autenticação
@app.middleware("http")
async def add_cache_control_header(request, call_next):
    response = await call_next(request)
    # Desabilitar cache para APIs de autenticação e dados sensíveis
    if "/api/auth" in request.url.path or "/api/password" in request.url.path:
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate, max-age=0"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
    return response

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_event():
    logger.info("Starting ImovLocal API...")
    logger.info(f"Connected to MongoDB: {mongo_url}")
    
    # Criar admin padrão se não existir
    await create_default_admin()
    
    # Iniciar agendador de tarefas
    start_scheduler()
    logger.info("Scheduler started for automatic plan expiration checks")

async def create_default_admin():
    """Cria o admin padrão se não existir no banco"""
    from passlib.context import CryptContext
    import uuid
    from datetime import datetime
    
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    
    admin_email = "imovlocaladm@gmail.com"
    admin_password = "Admin@2025"
    
    # Verificar se admin já existe
    existing_admin = await db.users.find_one({"email": admin_email})
    
    if not existing_admin:
        # Criar admin
        admin_user = {
            "id": str(uuid.uuid4()),
            "name": "Admin Master",
            "email": admin_email,
            "hashed_password": pwd_context.hash(admin_password),
            "phone": "",
            "user_type": "admin",
            "status": "active",
            "city": "Campo Grande",
            "state": "MS",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        await db.users.insert_one(admin_user)
        logger.info(f"✅ Admin padrão criado: {admin_email}")
    else:
        # Garantir que o admin está ativo e com senha correta
        await db.users.update_one(
            {"email": admin_email},
            {
                "$set": {
                    "hashed_password": pwd_context.hash(admin_password),
                    "status": "active",
                    "user_type": "admin"
                }
            }
        )
        logger.info(f"✅ Admin existente atualizado: {admin_email}")

@app.on_event("shutdown")
async def shutdown_db_client():
    stop_scheduler()
    client.close()
    logger.info("Closed MongoDB connection and stopped scheduler")