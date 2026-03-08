from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "AgenticQuant"
    debug: bool = True

    database_url: str = "sqlite:///./agenticquant.db"

    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"

    default_market_period: str = "6mo"
    default_market_interval: str = "1d"

    class Config:
        env_file = ".env"


settings = Settings()
