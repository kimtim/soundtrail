from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import os
import asyncpg

app = FastAPI(title="SoundTrail API")

DATABASE_URL = os.getenv("DATABASE_URL")
JWT_SECRET = os.getenv("JWT_SECRET", "fallback_secret")

class RegisterRequest(BaseModel):
    nickname: str

class UploadRequest(BaseModel):
    title: str
    audio_url: str

@app.get("/api/v1/health")
async def health():
    return {
        "status": "ok",
        "message": "SoundTrail is ready!",
        "free_upload_quota": 10,
        "price_per_song": 1.00,
        "upload_fee_after_free": 5.00
    }

@app.post("/api/v1/users/register")
async def register(data: RegisterRequest):
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        row = await conn.fetchrow(
            "INSERT INTO users (nickname, free_uploads_remaining) VALUES ($1, $2) RETURNING id, free_uploads_remaining",
            data.nickname, 10
        )
        return {"user_id": row["id"], "free_uploads_left": row["free_uploads_remaining"]}
    finally:
        await conn.close()

@app.post("/api/v1/songs/upload")
async def upload(data: UploadRequest):
    # 简化：固定 user_id=1（实际应从前端传入）
    user_id = 1
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        user = await conn.fetchrow("SELECT free_uploads_remaining FROM users WHERE id = $1", user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        free_left = user["free_uploads_remaining"]
        fee_charged = 0.0

        if free_left > 0:
            await conn.execute(
                "UPDATE users SET free_uploads_remaining = free_uploads_remaining - 1 WHERE id = $1",
                user_id
            )
            free_left -= 1
        else:
            fee_charged = 5.00

        await conn.execute(
            "INSERT INTO songs (title, creator_id, audio_url, status) VALUES ($1, $2, $3, $4)",
            data.title, user_id, data.audio_url, "pending"
        )

        return {
            "success": True,
            "fee_charged": fee_charged,
            "free_uploads_left": free_left
        }
    finally:
        await conn.close()
