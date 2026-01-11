from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, UploadFile, File, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from contextlib import asynccontextmanager
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import bleach
import re
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict, validator
from typing import List, Optional
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import io
import csv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = None
db = None

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET')
if not JWT_SECRET or JWT_SECRET == 'your-secret-key-change-in-production':
    raise ValueError("JWT_SECRET must be set in .env file")
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = int(os.environ.get('JWT_EXPIRATION_HOURS', 24))

# Password Policy
PASSWORD_MIN_LENGTH = int(os.environ.get('PASSWORD_MIN_LENGTH', 8))

# Rate Limiting
limiter = Limiter(key_func=get_remote_address)

# Security
security = HTTPBearer()

# Input Sanitization
def sanitize_input(text: str) -> str:
    """Sanitize text input to prevent XSS attacks"""
    if not text:
        return text
    return bleach.clean(text, tags=[], strip=True)

def validate_password(password: str) -> None:
    """Validate password strength"""
    if len(password) < PASSWORD_MIN_LENGTH:
        raise HTTPException(
            status_code=400,
            detail=f"Password must be at least {PASSWORD_MIN_LENGTH} characters long"
        )
    if not re.search(r"[A-Z]", password):
        raise HTTPException(
            status_code=400,
            detail="Password must contain at least one uppercase letter"
        )
    if not re.search(r"[a-z]", password):
        raise HTTPException(
            status_code=400,
            detail="Password must contain at least one lowercase letter"
        )
    if not re.search(r"[0-9]", password):
        raise HTTPException(
            status_code=400,
            detail="Password must contain at least one number"
        )

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect to MongoDB
    global client, db
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    print(f"✓ Connected to MongoDB: {os.environ['DB_NAME']}")
    
    # Create database indexes for performance
    await db.users.create_index("email", unique=True)
    await db.users.create_index("id")
    await db.student_profiles.create_index("user_id", unique=True)
    await db.student_profiles.create_index("email")
    await db.placement_drives.create_index("id", unique=True)
    await db.placement_drives.create_index("deadline")
    await db.placement_drives.create_index("status")
    await db.applications.create_index("id", unique=True)
    await db.applications.create_index("student_id")
    await db.applications.create_index("drive_id")
    await db.applications.create_index("status")
    await db.applications.create_index("applied_at")
    await db.notifications.create_index("user_id")
    await db.notifications.create_index("created_at")
    print("✓ Database indexes created")
    
    yield
    # Shutdown: Close MongoDB connection
    client.close()
    print("✓ MongoDB connection closed")

app = FastAPI(lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
api_router = APIRouter(prefix="/api")

# ============ Models ============

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    role: str  # 'admin' or 'student'
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    token: str
    role: str
    user_id: str
    name: str
    refresh_token: Optional[str] = None

class StudentProfile(BaseModel):
    name: str
    email: str
    department: str
    batch: int
    cgpa: float
    skills: List[str]
    resume_url: Optional[str] = None

class StudentProfileUpdate(BaseModel):
    name: Optional[str] = None
    department: Optional[str] = None
    batch: Optional[int] = None
    cgpa: Optional[float] = None
    skills: Optional[List[str]] = None

class EligibilityCriteria(BaseModel):
    min_cgpa: float
    required_skills: List[str]
    departments: List[str]
    batches: List[int]

class PlacementDriveCreate(BaseModel):
    company_name: str
    company_domain: str
    job_role: str
    package: str
    location: str
    job_description: str
    eligibility: EligibilityCriteria
    deadline: str
    status: str = 'active'

class PlacementDriveUpdate(BaseModel):
    company_name: Optional[str] = None
    company_domain: Optional[str] = None
    job_role: Optional[str] = None
    package: Optional[str] = None
    location: Optional[str] = None
    job_description: Optional[str] = None
    eligibility: Optional[EligibilityCriteria] = None
    deadline: Optional[str] = None
    status: Optional[str] = None

class PlacementDriveResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    company_name: str
    company_domain: str
    job_role: str
    package: str
    location: str
    job_description: str
    eligibility: dict
    deadline: str
    status: str
    created_at: str

class ApplicationCreate(BaseModel):
    drive_id: str

class ApplicationStatusUpdate(BaseModel):
    status: str  # 'applied', 'shortlisted', 'interview', 'selected', 'rejected'

class ApplicationResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    student_id: str
    drive_id: str
    status: str
    applied_at: str
    student_name: Optional[str] = None
    student_email: Optional[str] = None
    student_department: Optional[str] = None
    student_cgpa: Optional[float] = None
    company_name: Optional[str] = None
    job_role: Optional[str] = None

class NotificationResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    message: str
    read: bool
    created_at: str

class AnalyticsResponse(BaseModel):
    total_drives: int
    active_drives: int
    total_applications: int
    total_students: int
    department_stats: dict
    status_stats: dict

# ============ Helper Functions ============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, role: str, token_type: str = 'access') -> str:
    """Create JWT token (access or refresh)"""
    if token_type == 'refresh':
        expiration = datetime.now(timezone.utc) + timedelta(days=7)  # Refresh tokens last 7 days
    else:
        expiration = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    
    payload = {
        'user_id': user_id,
        'role': role,
        'type': token_type,
        'exp': expiration
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        
        # Verify token type
        if payload.get('type') != 'access':
            raise HTTPException(status_code=401, detail='Invalid token type')
        
        user_id = payload.get('user_id')
        role = payload.get('role')
        if not user_id:
            raise HTTPException(status_code=401, detail='Invalid token')
        return {'user_id': user_id, 'role': role}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail='Token expired')
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail='Invalid token')

async def require_admin(current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail='Admin access required')
    return current_user

async def require_student(current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'student':
        raise HTTPException(status_code=403, detail='Student access required')
    return current_user

def check_eligibility(profile: dict, criteria: dict) -> bool:
    # Check CGPA
    if profile['cgpa'] < criteria['min_cgpa']:
        return False
    
    # Check department
    if profile['department'] not in criteria['departments']:
        return False
    
    # Check batch
    if profile['batch'] not in criteria['batches']:
        return False
    
    # Check skills (at least one match)
    if criteria['required_skills']:
        student_skills = [s.lower() for s in profile['skills']]
        required_skills = [s.lower() for s in criteria['required_skills']]
        if not any(skill in student_skills for skill in required_skills):
            return False
    
    return True

# ============ Auth Routes ============

@api_router.post('/auth/register', response_model=TokenResponse)
@limiter.limit("5/hour")
async def register(request: Request, user: UserRegister):
    # Validate password strength
    validate_password(user.password)
    
    # Sanitize inputs
    user.name = sanitize_input(user.name)
    user.email = user.email.lower().strip()
    
    # Check if user exists
    existing = await db.users.find_one({'email': user.email}, {'_id': 0})
    if existing:
        raise HTTPException(status_code=400, detail='Email already registered')
    
    # Create user
    user_id = f"user_{datetime.now(timezone.utc).timestamp()}"
    user_doc = {
        'id': user_id,
        'email': user.email,
        'password_hash': hash_password(user.password),
        'role': user.role,
        'name': user.name,
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    
    # Create student profile if role is student
    if user.role == 'student':
        profile_doc = {
            'id': f"profile_{user_id}",
            'user_id': user_id,
            'name': user.name,
            'email': user.email,
            'department': '',
            'batch': 0,
            'cgpa': 0.0,
            'skills': [],
            'resume_url': None
        }
        await db.student_profiles.insert_one(profile_doc)
    
    token = create_token(user_id, user.role)
    refresh_token = create_token(user_id, user.role, 'refresh')
    return TokenResponse(token=token, role=user.role, user_id=user_id, name=user.name, refresh_token=refresh_token)

@api_router.post('/auth/login', response_model=TokenResponse)
@limiter.limit("10/minute")
async def login(request: Request, credentials: UserLogin):
    credentials.email = credentials.email.lower().strip()
    user = await db.users.find_one({'email': credentials.email}, {'_id': 0})
    if not user or not verify_password(credentials.password, user['password_hash']):
        raise HTTPException(status_code=401, detail='Invalid credentials')
    
    token = create_token(user['id'], user['role'])
    refresh_token = create_token(user['id'], user['role'], 'refresh')
    return TokenResponse(token=token, role=user['role'], user_id=user['id'], name=user['name'], refresh_token=refresh_token)

class RefreshTokenRequest(BaseModel):
    refresh_token: str

@api_router.post('/auth/refresh', response_model=TokenResponse)
@limiter.limit("20/minute")
async def refresh_token(request: Request, data: RefreshTokenRequest):
    """Refresh access token using refresh token"""
    try:
        payload = jwt.decode(data.refresh_token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        
        # Verify it's a refresh token
        if payload.get('type') != 'refresh':
            raise HTTPException(status_code=401, detail='Invalid token type')
        
        user_id = payload.get('user_id')
        role = payload.get('role')
        
        if not user_id or not role:
            raise HTTPException(status_code=401, detail='Invalid token')
        
        # Verify user still exists
        user = await db.users.find_one({'id': user_id}, {'_id': 0})
        if not user:
            raise HTTPException(status_code=401, detail='User not found')
        
        # Create new tokens
        new_access_token = create_token(user_id, role)
        new_refresh_token = create_token(user_id, role, 'refresh')
        
        return TokenResponse(
            token=new_access_token,
            role=role,
            user_id=user_id,
            name=user['name'],
            refresh_token=new_refresh_token
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail='Refresh token expired')
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail='Invalid refresh token')

# ============ Student Profile Routes ============

@api_router.get('/profile', response_model=StudentProfile)
async def get_profile(current_user: dict = Depends(require_student)):
    profile = await db.student_profiles.find_one({'user_id': current_user['user_id']}, {'_id': 0})
    if not profile:
        raise HTTPException(status_code=404, detail='Profile not found')
    return StudentProfile(**profile)

@api_router.put('/profile', response_model=StudentProfile)
async def update_profile(updates: StudentProfileUpdate, current_user: dict = Depends(require_student)):
    update_data = {k: v for k, v in updates.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail='No updates provided')
    
    await db.student_profiles.update_one(
        {'user_id': current_user['user_id']},
        {'$set': update_data}
    )
    
    profile = await db.student_profiles.find_one({'user_id': current_user['user_id']}, {'_id': 0})
    return StudentProfile(**profile)

# ============ Placement Drive Routes ============

@api_router.post('/drives', response_model=PlacementDriveResponse)
async def create_drive(drive: PlacementDriveCreate, current_user: dict = Depends(require_admin)):
    drive_id = f"drive_{datetime.now(timezone.utc).timestamp()}"
    drive_doc = {
        'id': drive_id,
        **drive.model_dump(),
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    await db.placement_drives.insert_one(drive_doc)
    
    # Create notifications for eligible students
    students = await db.student_profiles.find({}, {'_id': 0}).to_list(None)
    eligible_students = [s for s in students if check_eligibility(s, drive.eligibility.model_dump())]
    
    notifications = []
    for student in eligible_students:
        notif_id = f"notif_{datetime.now(timezone.utc).timestamp()}_{student['user_id']}"
        notifications.append({
            'id': notif_id,
            'user_id': student['user_id'],
            'message': f"New placement drive: {drive.company_name} - {drive.job_role}",
            'read': False,
            'created_at': datetime.now(timezone.utc).isoformat()
        })
    
    if notifications:
        await db.notifications.insert_many(notifications)
    
    return PlacementDriveResponse(**drive_doc)

@api_router.get('/drives', response_model=List[PlacementDriveResponse])
async def get_drives(current_user: dict = Depends(get_current_user)):
    drives = await db.placement_drives.find({}, {'_id': 0}).to_list(None)
    
    # Filter by eligibility for students
    if current_user['role'] == 'student':
        profile = await db.student_profiles.find_one({'user_id': current_user['user_id']}, {'_id': 0})
        if profile:
            drives = [d for d in drives if check_eligibility(profile, d['eligibility'])]
    
    return [PlacementDriveResponse(**d) for d in drives]

@api_router.get('/drives/{drive_id}', response_model=PlacementDriveResponse)
async def get_drive(drive_id: str, current_user: dict = Depends(get_current_user)):
    drive = await db.placement_drives.find_one({'id': drive_id}, {'_id': 0})
    if not drive:
        raise HTTPException(status_code=404, detail='Drive not found')
    return PlacementDriveResponse(**drive)

@api_router.put('/drives/{drive_id}', response_model=PlacementDriveResponse)
async def update_drive(drive_id: str, updates: PlacementDriveUpdate, current_user: dict = Depends(require_admin)):
    update_data = {k: v for k, v in updates.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail='No updates provided')
    
    result = await db.placement_drives.update_one(
        {'id': drive_id},
        {'$set': update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail='Drive not found')
    
    drive = await db.placement_drives.find_one({'id': drive_id}, {'_id': 0})
    return PlacementDriveResponse(**drive)

@api_router.delete('/drives/{drive_id}')
async def delete_drive(drive_id: str, current_user: dict = Depends(require_admin)):
    result = await db.placement_drives.delete_one({'id': drive_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail='Drive not found')
    
    # Delete associated applications
    await db.applications.delete_many({'drive_id': drive_id})
    
    return {'message': 'Drive deleted successfully'}

# ============ Application Routes ============

@api_router.post('/applications', response_model=ApplicationResponse)
async def apply_to_drive(application: ApplicationCreate, current_user: dict = Depends(require_student)):
    # Check if already applied
    existing = await db.applications.find_one({
        'student_id': current_user['user_id'],
        'drive_id': application.drive_id
    }, {'_id': 0})
    
    if existing:
        raise HTTPException(status_code=400, detail='Already applied to this drive')
    
    # Check if drive exists
    drive = await db.placement_drives.find_one({'id': application.drive_id}, {'_id': 0})
    if not drive:
        raise HTTPException(status_code=404, detail='Drive not found')
    
    app_id = f"app_{datetime.now(timezone.utc).timestamp()}"
    app_doc = {
        'id': app_id,
        'student_id': current_user['user_id'],
        'drive_id': application.drive_id,
        'status': 'applied',
        'applied_at': datetime.now(timezone.utc).isoformat()
    }
    await db.applications.insert_one(app_doc)
    
    return ApplicationResponse(**app_doc)

@api_router.get('/applications', response_model=List[ApplicationResponse])
async def get_applications(current_user: dict = Depends(get_current_user)):
    if current_user['role'] == 'student':
        apps = await db.applications.find({'student_id': current_user['user_id']}, {'_id': 0}).to_list(None)
    else:
        apps = await db.applications.find({}, {'_id': 0}).to_list(None)
    
    # Enrich with drive and student details
    for app in apps:
        drive = await db.placement_drives.find_one({'id': app['drive_id']}, {'_id': 0})
        if drive:
            app['company_name'] = drive['company_name']
            app['job_role'] = drive['job_role']
        
        profile = await db.student_profiles.find_one({'user_id': app['student_id']}, {'_id': 0})
        if profile:
            app['student_name'] = profile['name']
            app['student_email'] = profile['email']
            app['student_department'] = profile['department']
            app['student_cgpa'] = profile['cgpa']
    
    return [ApplicationResponse(**a) for a in apps]

@api_router.get('/applications/drive/{drive_id}', response_model=List[ApplicationResponse])
async def get_drive_applications(drive_id: str, current_user: dict = Depends(require_admin)):
    apps = await db.applications.find({'drive_id': drive_id}, {'_id': 0}).to_list(None)
    
    # Enrich with student details
    for app in apps:
        profile = await db.student_profiles.find_one({'user_id': app['student_id']}, {'_id': 0})
        if profile:
            app['student_name'] = profile['name']
            app['student_email'] = profile['email']
            app['student_department'] = profile['department']
            app['student_cgpa'] = profile['cgpa']
    
    return [ApplicationResponse(**a) for a in apps]

@api_router.put('/applications/{app_id}/status', response_model=ApplicationResponse)
async def update_application_status(app_id: str, update: ApplicationStatusUpdate, current_user: dict = Depends(require_admin)):
    result = await db.applications.update_one(
        {'id': app_id},
        {'$set': {'status': update.status}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail='Application not found')
    
    # Create notification for student
    app = await db.applications.find_one({'id': app_id}, {'_id': 0})
    drive = await db.placement_drives.find_one({'id': app['drive_id']}, {'_id': 0})
    
    notif_id = f"notif_{datetime.now(timezone.utc).timestamp()}"
    notif_doc = {
        'id': notif_id,
        'user_id': app['student_id'],
        'message': f"Application status updated: {drive['company_name']} - {update.status}",
        'read': False,
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    await db.notifications.insert_one(notif_doc)
    
    app = await db.applications.find_one({'id': app_id}, {'_id': 0})
    return ApplicationResponse(**app)

@api_router.delete('/applications/{app_id}')
async def withdraw_application(app_id: str, current_user: dict = Depends(require_student)):
    result = await db.applications.delete_one({
        'id': app_id,
        'student_id': current_user['user_id']
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail='Application not found')
    
    return {'message': 'Application withdrawn successfully'}

# ============ Notification Routes ============

@api_router.get('/notifications', response_model=List[NotificationResponse])
async def get_notifications(current_user: dict = Depends(get_current_user)):
    notifs = await db.notifications.find(
        {'user_id': current_user['user_id']},
        {'_id': 0}
    ).sort('created_at', -1).to_list(50)
    
    return [NotificationResponse(**n) for n in notifs]

@api_router.put('/notifications/{notif_id}/read')
async def mark_notification_read(notif_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.notifications.update_one(
        {'id': notif_id, 'user_id': current_user['user_id']},
        {'$set': {'read': True}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail='Notification not found')
    
    return {'message': 'Notification marked as read'}

@api_router.put('/notifications/read-all')
async def mark_all_notifications_read(current_user: dict = Depends(get_current_user)):
    await db.notifications.update_many(
        {'user_id': current_user['user_id']},
        {'$set': {'read': True}}
    )
    return {'message': 'All notifications marked as read'}

# ============ Analytics Routes ============

@api_router.get('/analytics', response_model=AnalyticsResponse)
async def get_analytics(current_user: dict = Depends(require_admin)):
    total_drives = await db.placement_drives.count_documents({})
    active_drives = await db.placement_drives.count_documents({'status': 'active'})
    total_applications = await db.applications.count_documents({})
    total_students = await db.student_profiles.count_documents({})
    
    # Department stats
    students = await db.student_profiles.find({}, {'_id': 0}).to_list(None)
    dept_stats = {}
    for student in students:
        dept = student.get('department', 'Unknown')
        dept_stats[dept] = dept_stats.get(dept, 0) + 1
    
    # Status stats
    apps = await db.applications.find({}, {'_id': 0}).to_list(None)
    status_stats = {}
    for app in apps:
        status = app.get('status', 'unknown')
        status_stats[status] = status_stats.get(status, 0) + 1
    
    return AnalyticsResponse(
        total_drives=total_drives,
        active_drives=active_drives,
        total_applications=total_applications,
        total_students=total_students,
        department_stats=dept_stats,
        status_stats=status_stats
    )

# ============ CSV Export Route ============

@api_router.get('/export/applications/{drive_id}')
async def export_applications(drive_id: str, current_user: dict = Depends(require_admin)):
    apps = await db.applications.find({'drive_id': drive_id}, {'_id': 0}).to_list(None)
    
    # Enrich with student details
    for app in apps:
        profile = await db.student_profiles.find_one({'user_id': app['student_id']}, {'_id': 0})
        if profile:
            app['student_name'] = profile['name']
            app['student_email'] = profile['email']
            app['student_department'] = profile['department']
            app['student_cgpa'] = profile['cgpa']
            app['student_skills'] = ', '.join(profile['skills'])
    
    # Create CSV
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=[
        'student_name', 'student_email', 'student_department', 
        'student_cgpa', 'student_skills', 'status', 'applied_at'
    ])
    writer.writeheader()
    for app in apps:
        writer.writerow({
            'student_name': app.get('student_name', ''),
            'student_email': app.get('student_email', ''),
            'student_department': app.get('student_department', ''),
            'student_cgpa': app.get('student_cgpa', ''),
            'student_skills': app.get('student_skills', ''),
            'status': app.get('status', ''),
            'applied_at': app.get('applied_at', '')
        })
    
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type='text/csv',
        headers={'Content-Disposition': f'attachment; filename=applications_{drive_id}.csv'}
    )

# ============ Health Check Route ============

@app.get('/health')
async def health_check():
    """Health check endpoint for container orchestration"""
    try:
        # Check database connection
        await db.command('ping')
        return {
            'status': 'healthy',
            'database': 'connected',
            'timestamp': datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=503, detail=f'Service unavailable: {str(e)}')

# ============ Root Endpoint ============


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)