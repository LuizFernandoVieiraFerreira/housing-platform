from fastapi import APIRouter

from housing_platform.admin.router import router as admin_router
from housing_platform.api.health import router as health_router
from housing_platform.bookings.router import router as bookings_router
from housing_platform.hosts.router import router as hosts_router
from housing_platform.notifications.router import router as notifications_router
from housing_platform.payments.router import router as payments_router
from housing_platform.profile.router import router as profile_router
from housing_platform.properties.router import router as properties_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(properties_router)
api_router.include_router(bookings_router)
api_router.include_router(payments_router)
api_router.include_router(hosts_router)
api_router.include_router(admin_router)
api_router.include_router(notifications_router)
api_router.include_router(profile_router)
