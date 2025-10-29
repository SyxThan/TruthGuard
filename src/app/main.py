from fastapi import FastAPI
from .routers.User import router as user_router
from .routers.Posts import router as posts_router   
from fastapi.middleware.cors import CORSMiddleware
app = FastAPI()
app.include_router(user_router)
app.include_router(posts_router)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5500", "http://localhost:5500"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)