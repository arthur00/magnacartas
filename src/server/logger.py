import logging.config

config_filepath = 'logging.conf'
logging.config.fileConfig(config_filepath)
logger = logging.getLogger('game')
