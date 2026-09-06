# import logging
# from pydantic_settings import BaseSettings, SettingsConfigDict
# from pydantic import Field, BaseModel
# from langchain_openai import ChatOpenAI
# from typing import Any, Dict

# from functools import cached_property, lru_cache
# import boto3
# import httpx
# from typing import List, Dict
# import json


# from pymongo import MongoClient

# from langchain_core.callbacks import BaseCallbackHandler


# class LogLLMErrors(BaseCallbackHandler):
#     def __init__(self, profile_name: str, model: str):
#         self.profile_name = profile_name
#         self.model = model
        

#     def get_logger(self, name: str = "app_logger") -> logging.Logger:
#         logger = logging.getLogger(name)
#         if not logger.handlers:
#             logger.setLevel("ERROR")
#             handler = logging.StreamHandler()
#             formatter = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
#             handler.setFormatter(formatter)
#             logger.addHandler(handler)
#         return logger

# class LLMProfile(BaseModel):
#     model: str
#     base_url: str
#     api_key: str
#     temperature: float
#     frequency_penalty: float = None
#     disable_streaming: bool = True
#     extra_body: Dict[str, Any] = Field(default_factory=dict)

# class CustomRequestException(Exception):

# class Config(BaseSettings):
   
    