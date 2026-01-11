import sys
import os

# Add backend directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from backend.server import app

# Export the FastAPI app for Vercel
app = app
