"""
HeatPath AI — Vercel Serverless API Handler
Routes all requests to the FastAPI backend
"""

import os
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import backend main app
from main import app

# Export the app for Vercel
application = app
