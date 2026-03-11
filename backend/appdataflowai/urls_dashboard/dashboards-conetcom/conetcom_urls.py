import importlib.util
import os

from django.urls import path
from rest_framework.routers import DefaultRouter


def _load_module(module_name, file_path):
    spec = importlib.util.spec_from_file_location(module_name, file_path)
    module = importlib.util.module_from_spec(spec)
    if spec is None or spec.loader is None:
        raise ImportError(f"No se pudo cargar modulo: {file_path}")
    spec.loader.exec_module(module)
    return module


APPDATAFLOW_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
VIEWS_FILE = os.path.join(
    APPDATAFLOW_DIR,
    "views_dashboard",
    "dashboards-conetcom",
    "conetcom_views.py",
)
views_module = _load_module(
    "appdataflowai.views_dashboard.dashboards_conetcom.conetcom_views",
    VIEWS_FILE,
)


router = DefaultRouter()
router.register(r"obtener/conetcom_clientes", views_module.conetcom_clientes_views, basename="conetcom_clientes")
router.register(r"obtener/conetcom_planes", views_module.conetcom_planes_views, basename="conetcom_planes")
router.register(r"obtener/conetcom_facturacion", views_module.conetcom_facturacion_views, basename="conetcom_facturacion")
router.register(r"obtener/conetcom_pagos", views_module.conetcom_pagos_views, basename="conetcom_pagos")
router.register(r"obtener/conetcom_tickets_soporte", views_module.conetcom_tickets_soporte_views, basename="conetcom_tickets_soporte")
router.register(r"obtener/conetcom_trafico_consumo", views_module.conetcom_trafico_consumo_views, basename="conetcom_trafico_consumo")
router.register(r"obtener/conetcom_campanas", views_module.conetcom_campanas_views, basename="conetcom_campanas")
router.register(
    r"obtener/conetcom_interacciones_campanas",
    views_module.conetcom_interacciones_campanas_views,
    basename="conetcom_interacciones_campanas",
)

urlpatterns = router.urls
urlpatterns += [
    path(
        "importar/conetcom_planes",
        views_module.conetcom_planes_import_views.as_view(),
        name="conetcom_planes_import_url",
    ),
    path(
        "importar/conetcom_clientes",
        views_module.conetcom_clientes_import_views.as_view(),
        name="conetcom_clientes_import_url",
    ),
    path(
        "importar/conetcom_facturacion",
        views_module.conetcom_facturacion_import_views.as_view(),
        name="conetcom_facturacion_import_url",
    ),
    path(
        "importar/conetcom_pagos",
        views_module.conetcom_pagos_import_views.as_view(),
        name="conetcom_pagos_import_url",
    ),
    path(
        "importar/conetcom_tickets_soporte",
        views_module.conetcom_tickets_soporte_import_views.as_view(),
        name="conetcom_tickets_soporte_import_url",
    ),
    path(
        "importar/conetcom_trafico_consumo",
        views_module.conetcom_trafico_consumo_import_views.as_view(),
        name="conetcom_trafico_consumo_import_url",
    ),
    path(
        "importar/conetcom_campanas",
        views_module.conetcom_campanas_import_views.as_view(),
        name="conetcom_campanas_import_url",
    ),
    path(
        "importar/conetcom_interacciones_campanas",
        views_module.conetcom_interacciones_campanas_import_views.as_view(),
        name="conetcom_interacciones_campanas_import_url",
    ),
]
