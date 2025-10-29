DATABASE_URL = "mysql+pymysql://root:syngucii@127.0.0.1:3306/post_new"
SECRET_KEY = "___"

from sqlalchemy import create_engine  #
from sqlalchemy.orm import sessionmaker, declarative_base #


engine = create_engine(DATABASE_URL, echo=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()