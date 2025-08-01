from django.urls import path
from .views import (
    LoginView,
    ProductosUsuarioView,
    
    UsuarioInfoView,
    ProductoListView,
    AdquirirDashboardView,
    EmpresaCreateAPIView,
    UsuarioCreateAPIView,
    CategoriaListAPIView,
    EstadoListAPIView,
    TipoPlanListAPIView,
    PermisoAccesoListAPIView,
    
    CreatePaymentIntentAPIView,
    StripeWebhookAPIView,

    DashboardVentasDataflowView,
    DashboardVentasView,
    DashboardFinanzasView,
    DashboardComprasView,


    ImportarDatosView,
    EstadoImportacionView,
)

urlpatterns = [
    # --- Autenticación y usuario ---
    path('login/', LoginView.as_view(), name='login'),
    path('usuario/productos/', ProductosUsuarioView.as_view(), name='usuario-productos'),
    path('usuario/info/', UsuarioInfoView.as_view(), name='usuario-info'),

    # --- Productos ---
    path('productos/', ProductoListView.as_view(), name='producto-list'),
    path('productos/adquirir/', AdquirirDashboardView.as_view(), name='producto-adquirir'),
  

    # --- Empresa & Catálogos ---
    path('empresas/', EmpresaCreateAPIView.as_view(), name='empresa-create'),
    path('categorias/', CategoriaListAPIView.as_view(), name='categoria-list'),
    path('estados/', EstadoListAPIView.as_view(), name='estado-list'),
    path('planes/', TipoPlanListAPIView.as_view(), name='plan-list'),
    path('permisos/', PermisoAccesoListAPIView.as_view(), name='permiso-list'),

    # --- Usuario (creación combinado empresa+usuario) ---
    path('usuarios/', UsuarioCreateAPIView.as_view(), name='usuario-create'),


    # --- Url para crear Payment Intent ---
    path('create-payment-intent/', CreatePaymentIntentAPIView.as_view(), name='create-payment-intent'),
    path('stripe-webhook/', StripeWebhookAPIView.as_view(), name='stripe-webhook'),


    path('dashboard-dataflow/', DashboardVentasDataflowView.as_view(), name='dashboard-dataflow'),
    path('dashboard-ventas/', DashboardVentasView.as_view(), name='dashboard-ventas'),
    path('dashboard-finanzas/', DashboardFinanzasView.as_view(), name='dashboard-finanzas'),
    path('dashboard-compras/', DashboardComprasView.as_view(), name='dashboard-compras'),



    path('importar/<int:id_producto>/', ImportarDatosView.as_view(), name='importar-datos'),
    path('estado-importacion/<int:id_producto>/', EstadoImportacionView.as_view(), name='estado-importacion'),

]
    