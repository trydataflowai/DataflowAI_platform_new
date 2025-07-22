# backend/appdataflowai/urls.py

from django.urls import path
from .views import (
    LoginView,
    ProductosUsuarioView,
    ImportarDatosView,
    UsuarioInfoView,
    ProductoListView,
    AdquirirDashboardView,
    EmpresaCreateAPIView,
    UsuarioCreateAPIView,
    CategoriaListAPIView,
    EstadoListAPIView,
    TipoPlanListAPIView,
    PermisoAccesoListAPIView,
)

urlpatterns = [
    # Autenticación y usuario
    path('login/', LoginView.as_view(), name='login'),
    path('usuario/productos/', ProductosUsuarioView.as_view(), name='usuario-productos'),
    path('usuario/info/', UsuarioInfoView.as_view(), name='usuario-info'),

    # Productos
    path('productos/', ProductoListView.as_view(), name='producto-list'),
    path('productos/adquirir/', AdquirirDashboardView.as_view(), name='producto-adquirir'),
    path('importar/<int:id_producto>/', ImportarDatosView.as_view(), name='importar-datos'),

    # Empresa & Catálogos
    path('empresas/', EmpresaCreateAPIView.as_view(), name='empresa-create'),
    path('categorias/', CategoriaListAPIView.as_view(), name='categoria-list'),
    path('estados/', EstadoListAPIView.as_view(), name='estado-list'),
    path('planes/', TipoPlanListAPIView.as_view(), name='plan-list'),
    path('permisos/', PermisoAccesoListAPIView.as_view(), name='permiso-list'),

    # Usuario (creación desde formulario combinado)
    path('usuarios/', UsuarioCreateAPIView.as_view(), name='usuario-create'),
]
