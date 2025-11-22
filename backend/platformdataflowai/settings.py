from pathlib import Path
from decouple import config, Csv
import dj_database_url
import os

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = config("SECRET_KEY")
DEBUG = config("DEBUG", cast=bool)
ALLOWED_HOSTS = config("ALLOWED_HOSTS", cast=Csv())

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'appdataflowai',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',

    'whitenoise.middleware.WhiteNoiseMiddleware',  # importante para servir archivos estáticos

    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'platformdataflowai.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'platformdataflowai.wsgi.application'

DATABASES = {
    'default': dj_database_url.config(
        default=f"postgresql://{config('DB_USER')}:{config('DB_PASSWORD')}@{config('DB_HOST')}:{config('DB_PORT')}/{config('DB_NAME')}",
        conn_max_age=600,
        ssl_require=not DEBUG  # usa SSL solo en producción
    )
}

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# CORS dinámico
if DEBUG:
    CORS_ALLOWED_ORIGINS = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]
else:
    CORS_ALLOWED_ORIGINS = [config("FRONTEND_URL")]

CORS_ALLOW_CREDENTIALS = True

# CSRF para cookies en frontend externo
CSRF_TRUSTED_ORIGINS = [
    "https://dataflowai-platform-new.onrender.com",
]



# Stripe Settings
STRIPE_SECRET_KEY = config("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = config("STRIPE_WEBHOOK_SECRET")

import stripe
stripe.api_key = STRIPE_SECRET_KEY

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'appdataflowai.authentication.JWTAuthentication',
        # 'rest_framework.authentication.SessionAuthentication',  # si quieres dejar sesiones también
    ),
}


SHOPIFY_SHOP_DOMAIN = config("SHOPIFY_SHOP_DOMAIN", default="e7i1zh-xs.myshopify.com")
SHOPIFY_ACCESS_TOKEN = config("SHOPIFY_ACCESS_TOKEN", default=None)
SHOPIFY_API_VERSION = config("SHOPIFY_API_VERSION", default="2025-10")



# ODOO settings (leer desde .env)
ODOO_URL = config("ODOO_URL", default="https://coltradeco.odoo.com")
ODOO_DB = config("ODOO_DB", default="coltradeco")
ODOO_USERNAME = config("ODOO_USERNAME", default=None)
ODOO_API_KEY = config("ODOO_API_KEY", default=None)
# Año por defecto para filtrar ventas (puedes sobreescribir en .env)
ODOO_SALES_YEAR = config("ODOO_SALES_YEAR", cast=int, default=2025)





OPENAI_API_KEY = config("OPENAI_API_KEY", default=None)
OPENAI_API_BASE = config("OPENAI_API_BASE", default="https://api.openai.com/v1")
OPENAI_DEFAULT_MODEL = config("OPENAI_DEFAULT_MODEL", default="gpt-4o-mini")









# CHATN8N
from decouple import config

CHAT_TARGET_WEBHOOK_URL = config("CHAT_TARGET_WEBHOOK_URL", default=None)

WEBHOOK_JWT_SECRET = config("WEBHOOK_JWT_SECRET", default="mi-clave-super-secreta-jwt-2024-palacios-webhook")
WEBHOOK_JWT_ALGORITHM = config("WEBHOOK_JWT_ALGORITHM", default="HS256")
WEBHOOK_JWT_EXP_SECONDS = config("WEBHOOK_JWT_EXP_SECONDS", cast=int, default=3600)

# Si quieres que, cuando el cliente mande Authorization, el proxy lo reenvíe tal cual:
WEBHOOK_FORWARD_INCOMING_AUTH = config("WEBHOOK_FORWARD_INCOMING_AUTH", default="false").lower() in ("1","true","yes")
