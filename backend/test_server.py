#!/usr/bin/env python3
"""
Simple test server for OTP verification
"""
import os
import sys
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# Set environment variables
os.environ['RESEND_API_KEY'] = 're_jExGU3rX_LbhzgqGHVCd8YuZ9HqS1i7GW'
os.environ['FROM_EMAIL'] = 'onboarding@resend.dev'

# Add the app directory to the path
sys.path.append('/Users/pradeepdyd/referconnect-backend')

from app.api.v1.endpoints.verification_simple import router as verification_router

app = FastAPI(title="ReferConnect Test API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include verification router
app.include_router(verification_router, prefix="/api/v1/verification", tags=["verification"])

@app.get("/")
async def root():
    return {"message": "ReferConnect Test API is running"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)







