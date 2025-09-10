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


    DashboardSalesView,
    DashboardSalesreviewView,

    ImportarDatosView,
    EstadoImportacionView,


    CambiarContrasenaView,
    UsuariosEmpresaView,
    UsuarioEstadoChangeView,
    UsuarioRolChangeView,
    UsuarioDeleteView,
    PermisosListView,
    PerfilMeView,
    EmpresaView,




#ASOCIAR DASHBOARDS POR MEDIO DE PERFIL
    AsgDashboardUsuariosEmpresaView,
    AsgDashboardProductosListView,
    AsgDashboardUsuarioAsignacionesView,
    AsgDashboardUsuarioEliminarAsignacionView,
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
    path('dashboard-Salesreview/', DashboardSalesreviewView.as_view(), name='dashboard-Salesreview'),

    path('dashboard-sales/', DashboardSalesView.as_view(), name='dashboard-sales'),


    path('importar/<int:id_producto>/', ImportarDatosView.as_view(), name='importar-datos'),
    path('estado-importacion/<int:id_producto>/', EstadoImportacionView.as_view(), name='estado-importacion'),



    path('perfil/usuarios/', UsuariosEmpresaView.as_view(), name='usuarios_empresa'),                     # GET, POST
    path('perfil/usuarios/<int:id_usuario>/', UsuarioDeleteView.as_view(), name='usuario_eliminar'),     # DELETE
    path('perfil/usuarios/<int:id_usuario>/estado/', UsuarioEstadoChangeView.as_view(), name='usuario_cambiar_estado'),  # PATCH estado
    path('perfil/usuarios/<int:id_usuario>/rol/', UsuarioRolChangeView.as_view(), name='usuario_cambiar_rol'),          # PATCH rol
    path('perfil/permisos/', PermisosListView.as_view(), name='permisos_list'),                         # GET permisos/roles




    path('editar/perfil/contrasena', CambiarContrasenaView.as_view(), name='editar_perfil_contrasena'),    
    path('perfil/permisos/', PermisosListView.as_view(), name='permisos_list'), 
    path('perfil/me/', PerfilMeView.as_view(), name='perfil_me'),         # GET, PATCH para usuario
    path('perfil/empresa/', EmpresaView.as_view(), name='perfil_empresa'),# 


#ASOCIAR DASHBOARDS POR MEDIO DE PERFIL
    path('asg/perfil/usuarios/', AsgDashboardUsuariosEmpresaView.as_view(), name='asg_dashboard_perfil_usuarios'),
    path('asg/perfil/productos/', AsgDashboardProductosListView.as_view(), name='asg_dashboard_perfil_productos'),
    path('asg/perfil/usuarios/<int:id_usuario>/asignaciones/', AsgDashboardUsuarioAsignacionesView.as_view(), name='asg_dashboard_usuario_asignaciones'),
    path('asg/perfil/usuarios/<int:id_usuario>/asignaciones/<int:id_producto>/', AsgDashboardUsuarioEliminarAsignacionView.as_view(), name='asg_dashboard_usuario_eliminar_asignacion'),

]
    