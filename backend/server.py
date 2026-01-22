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
from routes.visit_routes import router as visit_router, notifications_router
from routes.banner_routes import router as banner_router
from routes.demand_routes import router as demand_router
from routes.payment_routes import router as payment_router

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
api_router.include_router(notifications_router)
api_router.include_router(banner_router)
api_router.include_router(demand_router)
api_router.include_router(payment_router)

# Include the router in the main app
app.include_router(api_router)

# Create uploads directory if it doesn't exist
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

# Mount static files for uploaded images
app.mount("/api/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

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
    
    # Iniciar agendador de tarefas
    start_scheduler()
    logger.info("Scheduler started for automatic plan expiration checks")

@app.on_event("shutdown")
async def shutdown_db_client():
    stop_scheduler()
    client.close()
    logger.info("Closed MongoDB connection and stopped scheduler")