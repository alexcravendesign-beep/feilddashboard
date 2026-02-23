from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from pydantic import BaseModel
import uuid
from datetime import datetime, timezone, timedelta

from database import supabase
from services.auth import get_current_user

router = APIRouter(prefix="/locations", tags=["locations"])


class LocationPoint(BaseModel):
    latitude: float
    longitude: float
    accuracy: Optional[float] = None
    job_id: Optional[str] = None
    status: Optional[str] = "travelling"
    recorded_at: Optional[str] = None


class LocationBatch(BaseModel):
    locations: List[LocationPoint]


@router.post("/track")
async def track_location(data: LocationBatch, user: dict = Depends(get_current_user)):
    """Store a batch of location points for the authenticated engineer."""
    if not data.locations:
        return {"message": "No locations to store", "count": 0}

    now = datetime.now(timezone.utc).isoformat()
    docs = []
    for loc in data.locations:
        docs.append({
            "id": str(uuid.uuid4()),
            "engineer_id": user["id"],
            "latitude": loc.latitude,
            "longitude": loc.longitude,
            "accuracy": loc.accuracy,
            "job_id": loc.job_id,
            "status": loc.status or "travelling",
            "recorded_at": loc.recorded_at or now,
            "synced_at": now,
        })

    supabase.table("engineer_locations").insert(docs).execute()
    return {"message": "Locations stored", "count": len(docs)}


@router.post("/track/single")
async def track_single_location(data: LocationPoint, user: dict = Depends(get_current_user)):
    """Store a single location point for the authenticated engineer."""
    now = datetime.now(timezone.utc).isoformat()
    doc = {
        "id": str(uuid.uuid4()),
        "engineer_id": user["id"],
        "latitude": data.latitude,
        "longitude": data.longitude,
        "accuracy": data.accuracy,
        "job_id": data.job_id,
        "status": data.status or "travelling",
        "recorded_at": data.recorded_at or now,
        "synced_at": now,
    }
    supabase.table("engineer_locations").insert(doc).execute()
    return {"message": "Location stored", "id": doc["id"]}


@router.get("/engineers")
async def get_active_engineer_locations(user: dict = Depends(get_current_user)):
    """Get the latest location for all engineers who have reported in the last 2 hours."""
    cutoff = (datetime.now(timezone.utc) - timedelta(hours=2)).isoformat()

    # Get all engineers with recent locations
    response = (
        supabase.table("engineer_locations")
        .select("*")
        .gte("recorded_at", cutoff)
        .order("recorded_at", desc=True)
        .limit(500)
        .execute()
    )

    # Group by engineer_id and pick the latest for each
    latest_by_engineer = {}
    for loc in response.data:
        eid = loc["engineer_id"]
        if eid not in latest_by_engineer:
            latest_by_engineer[eid] = loc

    # Enrich with engineer names
    engineer_ids = list(latest_by_engineer.keys())
    engineers = {}
    if engineer_ids:
        users_response = (
            supabase.table("users")
            .select("id, name, email, role")
            .in_("id", engineer_ids)
            .execute()
        )
        for u in users_response.data:
            engineers[u["id"]] = u

    result = []
    for eid, loc in latest_by_engineer.items():
        engineer_info = engineers.get(eid, {})
        result.append({
            "id": loc["id"],
            "engineer_id": eid,
            "engineer_name": engineer_info.get("name", "Unknown"),
            "latitude": loc["latitude"],
            "longitude": loc["longitude"],
            "accuracy": loc["accuracy"],
            "status": loc["status"],
            "job_id": loc.get("job_id"),
            "recorded_at": loc["recorded_at"],
        })

    return result


@router.get("/engineer/{engineer_id}")
async def get_engineer_location_history(
    engineer_id: str,
    hours: int = 8,
    user: dict = Depends(get_current_user),
):
    """Get location history for a specific engineer within the given time range."""
    cutoff = (datetime.now(timezone.utc) - timedelta(hours=hours)).isoformat()

    response = (
        supabase.table("engineer_locations")
        .select("*")
        .eq("engineer_id", engineer_id)
        .gte("recorded_at", cutoff)
        .order("recorded_at", desc=False)
        .limit(1000)
        .execute()
    )

    return response.data


@router.get("/engineer/{engineer_id}/latest")
async def get_engineer_latest_location(
    engineer_id: str,
    user: dict = Depends(get_current_user),
):
    """Get the most recent location for a specific engineer."""
    response = (
        supabase.table("engineer_locations")
        .select("*")
        .eq("engineer_id", engineer_id)
        .order("recorded_at", desc=True)
        .limit(1)
        .execute()
    )

    if not response.data:
        raise HTTPException(status_code=404, detail="No location data found")

    return response.data[0]
