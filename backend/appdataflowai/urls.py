#HOLA JULI, ESTO ES POR PARTE D DANI



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
    AreasListView,




#ASOCIAR DASHBOARDS POR MEDIO DE PERFIL
    AsgDashboardUsuariosEmpresaView,
    AsgDashboardProductosListView,
    AsgDashboardUsuarioAsignacionesView,
    AsgDashboardUsuarioEliminarAsignacionView,

    #MODULO DE SOPORTE
    TicketListCreateView, TicketDetailView,


#url PARA RETORNAR LAS HERRAMIENTAS CORRESPONDIENTES A CADA USUARIO

    DashboardSalesreviewListCreate,


#URLS para el crud del dashboard de SALESREVIEW del modelo: DashboardSalesreview
    HerramientasUsuarioView,
    DashboardSalesreviewDetail,
    DashboardSalesreviewBulkDelete,
    DashboardSalesreviewExport,


#URRL PARA PRODUCTOS DE PRUEBA SHOPIFY
    shopify_products,
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



    path('perfil/usuarios/', UsuariosEmpresaView.as_view(), name='usuarios_empresa'),
    path('perfil/usuarios/<int:id_usuario>/estado/', UsuarioEstadoChangeView.as_view(), name='usuario_estado'),
    path('perfil/usuarios/<int:id_usuario>/rol/', UsuarioRolChangeView.as_view(), name='usuario_rol'),
    path('perfil/usuarios/<int:id_usuario>/', UsuarioDeleteView.as_view(), name='usuario_delete'),
    path('perfil/permisos/', PermisosListView.as_view(), name='permisos_list'),
    path('perfil/areas/', AreasListView.as_view(), name='areas_list'),




    path('editar/perfil/contrasena', CambiarContrasenaView.as_view(), name='editar_perfil_contrasena'),    
    path('perfil/permisos/', PermisosListView.as_view(), name='permisos_list'), 
    path('perfil/me/', PerfilMeView.as_view(), name='perfil_me'),         # GET, PATCH para usuario
    path('perfil/empresa/', EmpresaView.as_view(), name='perfil_empresa'),# 


#ASOCIAR DASHBOARDS POR MEDIO DE PERFIL
    path('asg/perfil/usuarios/', AsgDashboardUsuariosEmpresaView.as_view(), name='asg_dashboard_perfil_usuarios'),
    path('asg/perfil/productos/', AsgDashboardProductosListView.as_view(), name='asg_dashboard_perfil_productos'),
    path('asg/perfil/usuarios/<int:id_usuario>/asignaciones/', AsgDashboardUsuarioAsignacionesView.as_view(), name='asg_dashboard_usuario_asignaciones'),
    path('asg/perfil/usuarios/<int:id_usuario>/asignaciones/<int:id_producto>/', AsgDashboardUsuarioEliminarAsignacionView.as_view(), name='asg_dashboard_usuario_eliminar_asignacion'),


    #MODULO DE SOPORTE

    path('tickets/', TicketListCreateView.as_view(), name='tickets-list-create'),
    path('tickets/<int:pk>/', TicketDetailView.as_view(), name='ticket-detail'),


    #url PARA RETORNAR LAS HERRAMIENTAS CORRESPONDIENTES A CADA USUARIO
    path('usuario/productos/herramientas', HerramientasUsuarioView.as_view(), name='usuario-productos-herramientas'),




    #URLS para el crud del dashboard de SALESREVIEW del modelo: DashboardSalesreview
    path('api/dashboard_salesreview/', DashboardSalesreviewListCreate.as_view(), name='dashsales_list_create'),
    path('api/dashboard_salesreview/<int:pk>/', DashboardSalesreviewDetail.as_view(), name='dashsales_detail'),
    path('api/dashboard_salesreview/bulk-delete/', DashboardSalesreviewBulkDelete.as_view(), name='dashsales_bulk_delete'),
    path('api/dashboard_salesreview/export/', DashboardSalesreviewExport.as_view(), name='dashsales_export'),  # <-- nueva ruta


    #Ruta para shopify
    path("shopify/products/", shopify_products, name="shopify_products"),

]
    