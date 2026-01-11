import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone, timedelta
import bcrypt
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
db_name = os.environ['DB_NAME']

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

async def seed_database():
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print("🌱 Starting database seeding...")
    
    # Clear existing data
    await db.users.delete_many({})
    await db.student_profiles.delete_many({})
    await db.placement_drives.delete_many({})
    await db.applications.delete_many({})
    await db.notifications.delete_many({})
    print("✓ Cleared existing data")
    
    # Create admin user
    admin_id = "user_admin_1"
    admin_user = {
        'id': admin_id,
        'email': 'admin@college.edu',
        'password_hash': hash_password('demo123'),
        'role': 'admin',
        'name': 'Admin User',
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(admin_user)
    print("✓ Created admin user (admin@college.edu / demo123)")
    
    # Create student users and profiles
    students_data = [
        {
            'email': 'student@college.edu',
            'name': 'John Doe',
            'department': 'Computer Science',
            'batch': 2025,
            'cgpa': 8.5,
            'skills': ['Python', 'JavaScript', 'React', 'FastAPI']
        },
        {
            'email': 'alice@college.edu',
            'name': 'Alice Smith',
            'department': 'Information Technology',
            'batch': 2025,
            'cgpa': 9.0,
            'skills': ['Java', 'Spring Boot', 'MongoDB', 'AWS']
        },
        {
            'email': 'bob@college.edu',
            'name': 'Bob Johnson',
            'department': 'Computer Science',
            'batch': 2024,
            'cgpa': 7.8,
            'skills': ['C++', 'Python', 'Machine Learning', 'TensorFlow']
        },
        {
            'email': 'carol@college.edu',
            'name': 'Carol Williams',
            'department': 'Electronics',
            'batch': 2025,
            'cgpa': 8.2,
            'skills': ['C', 'Embedded Systems', 'IoT', 'Python']
        },
        {
            'email': 'david@college.edu',
            'name': 'David Brown',
            'department': 'Information Technology',
            'batch': 2024,
            'cgpa': 8.7,
            'skills': ['React', 'Node.js', 'TypeScript', 'Docker']
        }
    ]
    
    student_ids = []
    for i, student_data in enumerate(students_data):
        student_id = f"user_student_{i+1}"
        student_ids.append(student_id)
        
        # Create user
        user = {
            'id': student_id,
            'email': student_data['email'],
            'password_hash': hash_password('demo123'),
            'role': 'student',
            'name': student_data['name'],
            'created_at': datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(user)
        
        # Create profile
        profile = {
            'id': f"profile_{student_id}",
            'user_id': student_id,
            'name': student_data['name'],
            'email': student_data['email'],
            'department': student_data['department'],
            'batch': student_data['batch'],
            'cgpa': student_data['cgpa'],
            'skills': student_data['skills'],
            'resume_url': None
        }
        await db.student_profiles.insert_one(profile)
    
    print(f"✓ Created {len(students_data)} student users (all with password: demo123)")
    
    # Create placement drives
    drives_data = [
        {
            'company_name': 'Google',
            'company_domain': 'google.com',
            'job_role': 'Software Engineer',
            'package': '25-30 LPA',
            'location': 'Bangalore',
            'job_description': 'Seeking talented software engineers to join our team. Work on cutting-edge technology and solve complex problems at scale.',
            'deadline': (datetime.now() + timedelta(days=15)).strftime('%Y-%m-%d'),
            'status': 'active',
            'eligibility': {
                'min_cgpa': 8.0,
                'required_skills': ['Python', 'JavaScript', 'Java'],
                'departments': ['Computer Science', 'Information Technology'],
                'batches': [2024, 2025]
            }
        },
        {
            'company_name': 'Microsoft',
            'company_domain': 'microsoft.com',
            'job_role': 'Full Stack Developer',
            'package': '22-28 LPA',
            'location': 'Hyderabad',
            'job_description': 'Looking for full-stack developers with strong problem-solving skills. Experience with cloud technologies is a plus.',
            'deadline': (datetime.now() + timedelta(days=20)).strftime('%Y-%m-%d'),
            'status': 'active',
            'eligibility': {
                'min_cgpa': 7.5,
                'required_skills': ['React', 'Node.js', 'TypeScript'],
                'departments': ['Computer Science', 'Information Technology'],
                'batches': [2024, 2025]
            }
        },
        {
            'company_name': 'Amazon',
            'company_domain': 'amazon.com',
            'job_role': 'SDE-1',
            'package': '20-25 LPA',
            'location': 'Mumbai',
            'job_description': 'Join Amazon Web Services team. Build scalable cloud solutions and work with cutting-edge AWS technologies.',
            'deadline': (datetime.now() + timedelta(days=10)).strftime('%Y-%m-%d'),
            'status': 'active',
            'eligibility': {
                'min_cgpa': 7.0,
                'required_skills': ['Java', 'AWS', 'Python'],
                'departments': ['Computer Science', 'Information Technology', 'Electronics'],
                'batches': [2024, 2025]
            }
        },
        {
            'company_name': 'Goldman Sachs',
            'company_domain': 'goldmansachs.com',
            'job_role': 'Technology Analyst',
            'package': '18-22 LPA',
            'location': 'Bangalore',
            'job_description': 'Work on financial technology solutions. Strong programming and analytical skills required.',
            'deadline': (datetime.now() + timedelta(days=25)).strftime('%Y-%m-%d'),
            'status': 'active',
            'eligibility': {
                'min_cgpa': 8.5,
                'required_skills': ['Java', 'C++', 'Python'],
                'departments': ['Computer Science', 'Information Technology'],
                'batches': [2025]
            }
        },
        {
            'company_name': 'Flipkart',
            'company_domain': 'flipkart.com',
            'job_role': 'Software Development Engineer',
            'package': '15-18 LPA',
            'location': 'Bangalore',
            'job_description': 'Build e-commerce solutions at scale. Work on high-traffic systems and solve real-world challenges.',
            'deadline': (datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d'),
            'status': 'active',
            'eligibility': {
                'min_cgpa': 7.0,
                'required_skills': ['Python', 'JavaScript', 'React'],
                'departments': ['Computer Science', 'Information Technology'],
                'batches': [2024, 2025]
            }
        }
    ]
    
    drive_ids = []
    for i, drive_data in enumerate(drives_data):
        drive_id = f"drive_{i+1}"
        drive_ids.append(drive_id)
        
        drive = {
            'id': drive_id,
            **drive_data,
            'created_at': datetime.now(timezone.utc).isoformat()
        }
        await db.placement_drives.insert_one(drive)
    
    print(f"✓ Created {len(drives_data)} placement drives")
    
    # Create some sample applications
    applications_data = [
        {'student_idx': 0, 'drive_idx': 0, 'status': 'shortlisted'},  # John -> Google
        {'student_idx': 0, 'drive_idx': 1, 'status': 'applied'},      # John -> Microsoft
        {'student_idx': 1, 'drive_idx': 0, 'status': 'interview'},    # Alice -> Google
        {'student_idx': 1, 'drive_idx': 3, 'status': 'applied'},      # Alice -> Goldman
        {'student_idx': 2, 'drive_idx': 2, 'status': 'applied'},      # Bob -> Amazon
        {'student_idx': 4, 'drive_idx': 1, 'status': 'selected'},     # David -> Microsoft
    ]
    
    for i, app_data in enumerate(applications_data):
        app = {
            'id': f"app_{i+1}",
            'student_id': student_ids[app_data['student_idx']],
            'drive_id': drive_ids[app_data['drive_idx']],
            'status': app_data['status'],
            'applied_at': datetime.now(timezone.utc).isoformat()
        }
        await db.applications.insert_one(app)
    
    print(f"✓ Created {len(applications_data)} sample applications")
    
    # Create sample notifications
    notifications_data = [
        {'student_idx': 0, 'message': 'New placement drive: Google - Software Engineer', 'read': False},
        {'student_idx': 0, 'message': 'Application status updated: Google - shortlisted', 'read': False},
        {'student_idx': 1, 'message': 'New placement drive: Goldman Sachs - Technology Analyst', 'read': True},
        {'student_idx': 4, 'message': 'Application status updated: Microsoft - selected', 'read': False},
    ]
    
    for i, notif_data in enumerate(notifications_data):
        notif = {
            'id': f"notif_{i+1}",
            'user_id': student_ids[notif_data['student_idx']],
            'message': notif_data['message'],
            'read': notif_data['read'],
            'created_at': datetime.now(timezone.utc).isoformat()
        }
        await db.notifications.insert_one(notif)
    
    print(f"✓ Created {len(notifications_data)} sample notifications")
    
    print("\n✅ Database seeding completed successfully!")
    print("\n📝 Test Credentials:")
    print("   Admin: admin@college.edu / demo123")
    print("   Student: student@college.edu / demo123")
    print("   (Also: alice@college.edu, bob@college.edu, carol@college.edu, david@college.edu)")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_database())
