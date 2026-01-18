from .auth import router as auth_router, users_router
from .customers import router as customers_router
from .sites import router as sites_router
from .assets import router as assets_router
from .jobs import router as jobs_router, checklist_router
from .quotes import router as quotes_router
from .invoices import router as invoices_router
from .parts import router as parts_router
from .uploads import router as uploads_router, photos_router
from .reports import router as reports_router
from .pm import router as pm_router
from .portal import router as portal_router

__all__ = [
    "auth_router", "users_router",
    "customers_router",
    "sites_router",
    "assets_router",
    "jobs_router", "checklist_router",
    "quotes_router",
    "invoices_router",
    "parts_router",
    "uploads_router", "photos_router",
    "reports_router",
    "pm_router",
    "portal_router",
]
