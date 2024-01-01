# config.py
import os
import toml
from pydantic import BaseModel, Field
import logging
from typing import ClassVar, Optional

class DynamicConfig(BaseModel):
    api_key: str = Field(..., description="OpenAI API key")  # Required field
    api_endpoint: Optional[str] = Field(default="https://api.openai.com", description="API endpoint")
    max_tokens: Optional[int] = Field(default=2000, description="Maximum number of tokens")
    chat_model: Optional[str] = Field(default="gpt-3.5-turbo-1106", description="ChatGPT model")
    data_dir: Optional[str] = Field(default=lambda: os.getenv("XDG_CONFIG_HOME", os.path.expanduser("~/.openai")), description="Data directory")

    _instance: ClassVar[Optional['DynamicConfig']] = None

    @classmethod
    def logger(cls):
        return logging.getLogger('DynamicConfig')

    def __init__(self, **data):
        if DynamicConfig._instance is not None:
            raise Exception("🚫 Singleton violation: Another instance of DynamicConfig already exists.")
        super().__init__(**data)
        for key, value in data.items():
            setattr(self, key, value)
        DynamicConfig._instance = self

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            raise Exception("🔍 DynamicConfig instance not found. Ensure load_from_toml is called first.")
        return cls._instance

    @classmethod
    def load_from_toml(cls, file_path):
        if cls._instance is not None:
            return cls._instance

        try:
            toml_data = toml.load(file_path)
        except FileNotFoundError:
            cls.logger().error("📂 TOML file not found. Please check the file path.")
            raise
        except toml.TomlDecodeError:
            cls.logger().error("📖 Error parsing TOML file. Please check the file's syntax.")
            raise

        try:
            cls.validate_toml(toml_data)
            config_data = toml_data.get("openai", {})
            return cls(**config_data)
        except ValueError as ve:
            cls.logger().error(f"⚠️ Validation error: {ve}")
            raise
        except Exception as e:
            cls.logger().error(f"⚠️ Unexpected error: {e}")
            raise
    @classmethod
    def validate_toml(cls, toml_data):
        openai_config = toml_data.get("openai", {})
    
        # Check for required 'api_key'
        if 'api_key' not in openai_config or not openai_config['api_key']:
            raise ValueError("🔑 Oops! 'api_key' is missing in the 'openai' section of the config.")
    
        # Check types of other fields, if present
        if 'api_endpoint' in openai_config and not isinstance(openai_config['api_endpoint'], str):
            raise ValueError("🌐 'api_endpoint' should be a string.")

        if 'max_tokens' in openai_config and not isinstance(openai_config['max_tokens'], int):
            raise ValueError("🔢 'max_tokens' should be an integer.")

        if 'chat_model' in openai_config and not isinstance(openai_config['chat_model'], str):
            raise ValueError("💬 'chat_model' should be a string.")

        if 'data_dir' in openai_config:
            data_dir_path = os.path.expanduser(openai_config['data_dir'])
            if not isinstance(openai_config['data_dir'], str):
                raise ValueError("📁 'data_dir' should be a string.")
            elif not os.path.exists(data_dir_path):
                raise ValueError(f"🚫 The path for 'data_dir' does not exist: {openai_config['data_dir']}")



# Configure the root logger for global logging
logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

# Load configuration
try:
    config = DynamicConfig.load_from_toml(".config.toml")
except Exception as e:
    logging.error(f"❌ Failed to initialize DynamicConfig: {e}")
    raise SystemExit(1)
