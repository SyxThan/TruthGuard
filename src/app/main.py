from fastapi import FastAPI
from .routers.User import router as user_router
from .routers.Posts import router as posts_router   

from .routers.FakeNewsDetection import router as fake_news_router
from .routers.PostsCRUD import router as posts_crud_router
from .routers.CheckFakeNews import router as check_fake_news_router
from .routers.UserPosts import router as user_posts_router
from .routers.PostsFilter import router as posts_filter_router
from fastapi.middleware.cors import CORSMiddleware
app = FastAPI()
app.include_router(user_router)
app.include_router(posts_router)
app.include_router(check_fake_news_router)
app.include_router(fake_news_router)
app.include_router(posts_crud_router)

app.include_router(user_posts_router)
app.include_router(posts_filter_router)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5500", "http://localhost:5500"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)