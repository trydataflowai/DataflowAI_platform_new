#HOLA JULI, ESTO ES POR PARTE D DANI

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FormularioViewSet

router = DefaultRouter()
router.register(r'formularios', FormularioViewSet, basename='formularios')



submit_view = FormularioViewSet.as_view({'post': 'submit'})
respuestas_view = FormularioViewSet.as_view({'get': 'listar_respuestas'})
retrieve_view = FormularioViewSet.as_view({'get': 'retrieve'})




from django.urls import path
from .views import (
    LoginView,
    RefreshTokenView,
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


    ##VISTA PARA RETORNAR LAS HERRAMIENTAS CORRESPONDIENTES A CADA USUARIO
    HerramientasUsuarioView,


    #URLS para el crud del dashboard de SALESREVIEW del modelo: DashboardSalesreview

    DashboardSalesreviewListCreate,
    DashboardSalesreviewDetail,
    DashboardSalesreviewBulkDelete,
    DashboardSalesreviewExport,
    

    


#URRL PARA PRODUCTOS DE PRUEBA SHOPIFY
    shopify_products,


    #odoo
    OdooSales2025View,


    #CHATBOT

    ChatbotAPIView,



#URLS para el crud del dashboard de Sales Corporativo Cotizaciones del modelo:
    DashboardSalesCorporativoListCreateProd15,
    DashboardSalesCorporativoDetailProd15,
    DashboardSalesCorporativoBulkDeleteProd15,
    DashboardSalesCorporativoExportProd15,

#URLS para el crud del dashboard de Sales Corporativo Metas del modelo:
     DashboardSalesCorporativoMetasProduct15_ListCreate,
    DashboardSalesCorporativoMetasProduct15_Detail,
    DashboardSalesCorporativoMetasProduct15_BulkDelete,
    DashboardSalesCorporativoMetasProduct15_Export,


#URL de Dashboard ISP Ventas
    DashboardIspVentas_List,


        #DASHBOARD CHURN RATE PARA SERVITEL

    DashboardChurnRateView,


    
    #URL de Dashboard ISP Arpu

    DashboardARPUListView,
    DashboardARPUForecastView,
    DashboardARPUUpsertView,



)

from .views_chat.chat_dashboard_churn import DashboardChurnChatView


urlpatterns = [
    # --- Autenticación y usuario ---
    path('login/', LoginView.as_view(), name='login'),
    path('refresh-token/', RefreshTokenView.as_view(), name='refresh-token'),
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


    #odoo
    path("odoo/order/salescoltrade/", OdooSales2025View.as_view(), name="odoo-order-s68097"),


    #chatbot
    path('chatbot/message/', ChatbotAPIView.as_view(), name='chatbot-message'),


    #URLS para el crud del dashboard de Sales Corporativo del modelo: DashboardSalesCorporativo
    path('dashboard_salescorporativo_prod15/', DashboardSalesCorporativoListCreateProd15.as_view(), name='dashcorp_list_create_prod15'),
    path('dashboard_salescorporativo_prod15/<int:pk>/', DashboardSalesCorporativoDetailProd15.as_view(), name='dashcorp_detail_prod15'),
    path('dashboard_salescorporativo_prod15/bulk-delete/', DashboardSalesCorporativoBulkDeleteProd15.as_view(), name='dashcorp_bulk_delete_prod15'),
    path('dashboard_salescorporativo_prod15/export/', DashboardSalesCorporativoExportProd15.as_view(), name='dashcorp_export_prod15'),


      # CRUD para DashboardSalesCorporativoMetas (product id 15)
    path('dashboard_salescorporativometas/product15/', DashboardSalesCorporativoMetasProduct15_ListCreate.as_view(), name='dashmetas_prod15_list_create'),
    path('dashboard_salescorporativometas/product15/<int:pk>/', DashboardSalesCorporativoMetasProduct15_Detail.as_view(), name='dashmetas_prod15_detail'),
    path('dashboard_salescorporativometas/product15/bulk-delete/', DashboardSalesCorporativoMetasProduct15_BulkDelete.as_view(), name='dashmetas_prod15_bulk_delete'),
    path('dashboard_salescorporativometas/product15/export/', DashboardSalesCorporativoMetasProduct15_Export.as_view(), name='dashmetas_prod15_export'),


    #URL de Dashboard ISP Ventas
    path('dashboard_isp_ventas/list/', DashboardIspVentas_List.as_view(), name='dashboard_isp_ventas_list'),




    #DASHBOARD CHURN RATE PARA SERVITEL
    path('dashboard/churn/rate/', DashboardChurnRateView.as_view(), name='dashboard-churn-kpi'),
    path('dashboard/churn/chat/', DashboardChurnChatView.as_view(), name='dashboard-churn-chat'),




     # ======================
# URLs de Dashboard ARPU
# ======================

     # Listado general filtrado por empresa y fechas
    path('dashboard_arpu/list/', DashboardARPUListView.as_view(), name='dashboard_arpu_list'),

    # Generación de forecast usando statsmodels (ExponentialSmoothing)
    path('dashboard_arpu/forecast/', DashboardARPUForecastView.as_view(), name='dashboard_arpu_forecast'),

    # Crear o actualizar (upsert) registro de ARPU
    path('dashboard_arpu/upsert/', DashboardARPUUpsertView.as_view(), name='dashboard_arpu_upsert'),



    path('', include(router.urls)),
    # paths explícitos (opcionales — el router ya los crea, pero te los muestro en estilo "path(...)"):
    path('formularios/<slug:slug>/submit/', submit_view, name='formularios-submit'),
    path('formularios/<slug:slug>/respuestas/', respuestas_view, name='formularios-respuestas'),
    path('formularios/<slug:slug>/', retrieve_view, name='formularios-retrieve'),





]
    