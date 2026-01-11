import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path
import bcrypt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

async def test():
    client = AsyncIOMotorClient(os.environ['MONGO_URL'])
    db = client[os.environ['DB_NAME']]
    
    user = await db.users.find_one({'email': 'admin@college.edu'})
    if user:
        print('✓ User found:', user['email'])
        print('✓ User ID:', user['id'])
        print('✓ Has password_hash:', 'password_hash' in user)
        
        # Test password
        test_password = 'demo123'
        result = verify_password(test_password, user['password_hash'])
        print(f'✓ Password verification for "{test_password}":', result)
    else:
        print('✗ User not found!')
    
    client.close()

asyncio.run(test())
