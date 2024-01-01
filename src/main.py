# main.py or any other module

from utils.config import DynamicConfig

def main():
    DynamicConfig.logger().info("This is an info log message.")
    config = DynamicConfig.get_instance()
    print(config.api_key)  # Example usage

if __name__ == "__main__":
    main()
