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
    PasswordRecoveryRequestView,
    PasswordRecoveryConfirmView,
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
    

    #


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



    #CHAT N8N
    ChatWebhookProxyAPIView, DashboardContextListAPIView,


    #listado de Formularios

    ListadoFormulariosView,


    #Editar formulario
    FormularioEditView,

    #Serializador para dashboard de ventas de formulario de ventas espacio y mercadeo
    DashboardFormsVentasPuntoVentaView,


    #
    TiendaListCreateView,
    TiendaDetailView,
    DashVeinteProductListCreateView,
    DashVeinteProductDetailView,
    DashVeinteInventarioListCreateView,
    DashVeinteInventarioDetailView,
    DashVeinteVentaListCreateView,
    DashVeinteVentaDetailView,
    DashVeinteMetaListCreateView,
    DashVeinteMetaDetailView,


    PerfilBrokerView,
    LeadsBrokersListCreateView,
    LeadsBrokersDetailView,
    LeadsBrokersImportView,
    LeadsBrokersExportView,
    BrokerLiqPagosView,
    TutorialesListView,



    #URL de Dashboard Belkin
    ProductosBelkinListCreateView,
    ProductosBelkinDetailView,
    ProductosBelkinBulkImportView,
    ProductosBelkinBulkUpdateExcelView,
    ProductosBelkinBulkDeleteView,
    ProductosBelkinExportView,
    PdvBelkinListCreateView,
    PdvBelkinDetailView,
    PdvBelkinBulkImportView,
    PdvBelkinBulkUpdateExcelView,
    PdvBelkinBulkDeleteView,
    PdvBelkinExportView,
    VentasBelkinListCreateView,
    VentasBelkinDetailView,
    VentasBelkinBulkImportView,
    VentasBelkinBulkUpdateExcelView,
    VentasBelkinBulkDeleteView,
    VentasBelkinExportView,
    InventariosBelkinListCreateView,
    InventariosBelkinDetailView,
    InventariosBelkinBulkImportView,
    InventariosBelkinBulkUpdateExcelView,
    InventariosBelkinBulkDeleteView,
    InventariosBelkinExportView,




#URLs de Dashboard Bluetti
    # Productos
    ProductosBluettiListCreateView,
    ProductosBluettiDetailView,
    ProductosBluettiBulkImportView,
    ProductosBluettiBulkUpdateExcelView,
    ProductosBluettiBulkDeleteView,
    ProductosBluettiExportView,
    ProductosBluettiTemplateView,

    # Canales
    CanalesBluettiListCreateView,
    CanalesBluettiDetailView,
    CanalesBluettiBulkImportView,
    CanalesBluettiBulkUpdateExcelView,
    CanalesBluettiBulkDeleteView,
    CanalesBluettiExportView,
    CanalesBluettiTemplateView,

    # Cuentas / Clientes
    CuentasClientesBluettiListCreateView,
    CuentasClientesBluettiDetailView,
    CuentasClientesBluettiBulkImportView,
    CuentasClientesBluettiBulkUpdateExcelView,
    CuentasClientesBluettiBulkDeleteView,
    CuentasClientesBluettiExportView,
    CuentasClientesBluettiTemplateView,

    # Ventas
    VentasBluettiListCreateView,
    VentasBluettiDetailView,
    VentasBluettiBulkImportView,
    VentasBluettiBulkUpdateExcelView,
    VentasBluettiBulkDeleteView,
    VentasBluettiExportView,
    VentasBluettiTemplateView,

    # Inventarios
    InventariosBluettiListCreateView,
    InventariosBluettiDetailView,
    InventariosBluettiBulkImportView,
    InventariosBluettiBulkUpdateExcelView,
    InventariosBluettiBulkDeleteView,
    InventariosBluettiExportView,
    InventariosBluettiTemplateView,

    # Ventas Sellout
    VentasSelloutBluettiListCreateView,
    VentasSelloutBluettiDetailView,
    VentasSelloutBluettiBulkImportView,
    VentasSelloutBluettiBulkUpdateExcelView,
    VentasSelloutBluettiBulkDeleteView,
    VentasSelloutBluettiExportView,
    VentasSelloutBluettiTemplateView,

    # Inventarios Sellout
    InventariosSelloutBluettiListCreateView,
    InventariosSelloutBluettiDetailView,
    InventariosSelloutBluettiBulkImportView,
    InventariosSelloutBluettiBulkUpdateExcelView,
    InventariosSelloutBluettiBulkDeleteView,
    InventariosSelloutBluettiExportView,
    InventariosSelloutBluettiTemplateView,

    # Metas Comerciales
    MetasComercialesBluettiListCreateView,
    MetasComercialesBluettiDetailView,
    MetasComercialesBluettiBulkImportView,
    MetasComercialesBluettiBulkUpdateExcelView,
    MetasComercialesBluettiBulkDeleteView,
    MetasComercialesBluettiExportView,
    MetasComercialesBluettiTemplateView,



    #URLS DE DASHBOARD LOOP
    LoopserviciosTotekKpisView,
    LoopserviciosTotekListCreateView,
    LoopserviciosTotekDetailView,
    LoopserviciosTotekBulkImportView,
    LoopserviciosTotekBulkUpdateExcelView,
    LoopserviciosTotekBulkDeleteView,
    LoopserviciosTotekExportView,
    LoopserviciosTotekTemplateView,




)

from .views_chat.chat_dashboard_churn import DashboardChurnChatView


urlpatterns = [
    # --- Autenticación y usuario ---
    path('login/', LoginView.as_view(), name='login'),
    path('refresh-token/', RefreshTokenView.as_view(), name='refresh-token'),
    path('password-recovery/request-code/', PasswordRecoveryRequestView.as_view(), name='password-recovery-request-code'),
    path('password-recovery/confirm/', PasswordRecoveryConfirmView.as_view(), name='password-recovery-confirm'),
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


#ASOCIAR DASHBOARDS POR MEDIO DE PERFIL $
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


    #Chatbot N8N
    path("n8n/webhook-proxy/", ChatWebhookProxyAPIView.as_view(), name="webhook-proxy"),
    path("n8n/dashboard-contexts/", DashboardContextListAPIView.as_view(), name="dashboard-context-list"),

    #Listado dormulario

     path('formularios/empresa/listado/', ListadoFormulariosView.as_view(), name='formularios-listado'),


     #Editar Formularios

     path('formularios/<slug:slug>/editar/', FormularioEditView.as_view(), name='formulario-edit'),



     #Serializador para dashboard de ventas de formulario de ventas espacio y mercadeo
     path('dashboard/forms/ventas-punto-venta/', DashboardFormsVentasPuntoVentaView.as_view(), name='dashboard-forms-ventas-punto-venta'),



    path('tiendas/', TiendaListCreateView.as_view(), name='tienda-list-create'),
    path('tiendas/<int:pk>/', TiendaDetailView.as_view(), name='tienda-detail'),
    path('DashVeinte/Prodcutos/', DashVeinteProductListCreateView.as_view(), name='dashveinte-product-list-create'),
    path('DashVeinte/Prodcutos/<int:pk>/', DashVeinteProductDetailView.as_view(), name='dashveinte-product-detail'),
    path('DashVeinte/Inventarios/', DashVeinteInventarioListCreateView.as_view(), name='dashveinte-inventario-list-create'),
    path('DashVeinte/Inventarios/<int:pk>/', DashVeinteInventarioDetailView.as_view(), name='dashveinte-inventario-detail'),
    path('DashVeinte/Ventas/', DashVeinteVentaListCreateView.as_view(), name='dashveinte-venta-list-create'),
    path('DashVeinte/Ventas/<int:pk>/', DashVeinteVentaDetailView.as_view(), name='dashveinte-venta-detail'),
    path('DashVeinte/Metas/', DashVeinteMetaListCreateView.as_view(), name='dashveinte-meta-list-create'),
    path('DashVeinte/Metas/<int:pk>/', DashVeinteMetaDetailView.as_view(), name='dashveinte-meta-detail'),



    path('brokers/perfil/', PerfilBrokerView.as_view(), name='perfil-broker'),
    path('brokers/leads/', LeadsBrokersListCreateView.as_view(), name='brokers-leads-list-create'),
    path('brokers/leads/<int:pk>/', LeadsBrokersDetailView.as_view(), name='brokers-leads-detail'),
    path('brokers/leads/import/', LeadsBrokersImportView.as_view(), name='brokers-leads-import'),
    path('brokers/leads/export/', LeadsBrokersExportView.as_view(), name='brokers-leads-export'),
    path('usuario/broker/liquidacion/', BrokerLiqPagosView.as_view(), name='broker_liq_pagos'),
    path('tutoriales/', TutorialesListView.as_view(), name='tutoriales-list'),




        path('productos-belkin/', ProductosBelkinListCreateView.as_view(), name='productos_belkin_list_create'),  # GET, POST
    path('productos-belkin/<int:pk>/', ProductosBelkinDetailView.as_view(), name='productos_belkin_detail'),  # PUT, PATCH, DELETE

    # Operaciones masivas / import / export
    path('productos-belkin/bulk-import/', ProductosBelkinBulkImportView.as_view(), name='productos_belkin_bulk_import'),  # POST
    path('productos-belkin/bulk-update-excel/',ProductosBelkinBulkUpdateExcelView.as_view(),name='productos_belkin_bulk_update_excel'),  # PUT
    path('productos-belkin/bulk-delete/', ProductosBelkinBulkDeleteView.as_view(), name='productos_belkin_bulk_delete'),  # DELETE
    path('productos-belkin/export/', ProductosBelkinExportView.as_view(), name='productos_belkin_export'),  # GET


     # CRUD basico
    path('pdv-belkin/', PdvBelkinListCreateView.as_view(), name='pdv_belkin_list_create'),
    path('pdv-belkin/<int:pk>/', PdvBelkinDetailView.as_view(), name='pdv_belkin_detail'),

    # Operaciones masivas / import / export
    path('pdv-belkin/bulk-import/', PdvBelkinBulkImportView.as_view(), name='pdv_belkin_bulk_import'),
    path('pdv-belkin/bulk-update-excel/', PdvBelkinBulkUpdateExcelView.as_view(), name='pdv_belkin_bulk_update_excel'),
    path('pdv-belkin/bulk-delete/', PdvBelkinBulkDeleteView.as_view(), name='pdv_belkin_bulk_delete'),
    path('pdv-belkin/export/', PdvBelkinExportView.as_view(), name='pdv_belkin_export'),


    # CRUD basico
    path('ventas-belkin/', VentasBelkinListCreateView.as_view(), name='ventas_belkin_list_create'),
    path('ventas-belkin/<int:pk>/', VentasBelkinDetailView.as_view(), name='ventas_belkin_detail'),

    # Operaciones masivas / import / export
    path('ventas-belkin/bulk-import/', VentasBelkinBulkImportView.as_view(), name='ventas_belkin_bulk_import'),
    path('ventas-belkin/bulk-update-excel/', VentasBelkinBulkUpdateExcelView.as_view(), name='ventas_belkin_bulk_update_excel'),
    path('ventas-belkin/bulk-delete/', VentasBelkinBulkDeleteView.as_view(), name='ventas_belkin_bulk_delete'),
    path('ventas-belkin/export/', VentasBelkinExportView.as_view(), name='ventas_belkin_export'),


    # ======================
    # CRUD basico Inventarios Belkin
    # ======================
    path('inventarios-belkin/', InventariosBelkinListCreateView.as_view(), name='inventarios_belkin_list_create'),
    path('inventarios-belkin/<int:pk>/', InventariosBelkinDetailView.as_view(), name='inventarios_belkin_detail'),


    # ======================
    # Operaciones masivas / import / export
    # ======================

    path('inventarios-belkin/bulk-import/', InventariosBelkinBulkImportView.as_view(), name='inventarios_belkin_bulk_import'),
    path('inventarios-belkin/bulk-update-excel/', InventariosBelkinBulkUpdateExcelView.as_view(), name='inventarios_belkin_bulk_update_excel'),
    path('inventarios-belkin/bulk-delete/', InventariosBelkinBulkDeleteView.as_view(), name='inventarios_belkin_bulk_delete'),
    path('inventarios-belkin/export/', InventariosBelkinExportView.as_view(), name='inventarios_belkin_export'),



# Cruds Modelos Bluetti

# ---------------- Productos ----------------
    path('productos-bluetti/', ProductosBluettiListCreateView.as_view(), name='productos_bluetti_list_create'),
    path('productos-bluetti/<int:pk>/', ProductosBluettiDetailView.as_view(), name='productos_bluetti_detail'),
    path('productos-bluetti/bulk-import/', ProductosBluettiBulkImportView.as_view(), name='productos_bluetti_bulk_import'),
    path('productos-bluetti/bulk-update-excel/', ProductosBluettiBulkUpdateExcelView.as_view(), name='productos_bluetti_bulk_update_excel'),
    path('productos-bluetti/bulk-delete/', ProductosBluettiBulkDeleteView.as_view(), name='productos_bluetti_bulk_delete'),
    path('productos-bluetti/export/', ProductosBluettiExportView.as_view(), name='productos_bluetti_export'),
    path('productos-bluetti/export-template/', ProductosBluettiTemplateView.as_view(), name='productos_bluetti_export_template'),

    # ---------------- Canales ----------------
    path('canales-bluetti/', CanalesBluettiListCreateView.as_view(), name='canales_bluetti_list_create'),
    path('canales-bluetti/<int:pk>/', CanalesBluettiDetailView.as_view(), name='canales_bluetti_detail'),
    path('canales-bluetti/bulk-import/', CanalesBluettiBulkImportView.as_view(), name='canales_bluetti_bulk_import'),
    path('canales-bluetti/bulk-update-excel/', CanalesBluettiBulkUpdateExcelView.as_view(), name='canales_bluetti_bulk_update_excel'),
    path('canales-bluetti/bulk-delete/', CanalesBluettiBulkDeleteView.as_view(), name='canales_bluetti_bulk_delete'),
    path('canales-bluetti/export/', CanalesBluettiExportView.as_view(), name='canales_bluetti_export'),
    path('canales-bluetti/export-template/', CanalesBluettiTemplateView.as_view(), name='canales_bluetti_export_template'),

    # --------------- Cuentas / Clientes ---------------
    path('cuentas-clientes-bluetti/', CuentasClientesBluettiListCreateView.as_view(), name='cuentas_clientes_bluetti_list_create'),
    path('cuentas-clientes-bluetti/<int:pk>/', CuentasClientesBluettiDetailView.as_view(), name='cuentas_clientes_bluetti_detail'),
    path('cuentas-clientes-bluetti/bulk-import/', CuentasClientesBluettiBulkImportView.as_view(), name='cuentas_clientes_bluetti_bulk_import'),
    path('cuentas-clientes-bluetti/bulk-update-excel/', CuentasClientesBluettiBulkUpdateExcelView.as_view(), name='cuentas_clientes_bluetti_bulk_update_excel'),
    path('cuentas-clientes-bluetti/bulk-delete/', CuentasClientesBluettiBulkDeleteView.as_view(), name='cuentas_clientes_bluetti_bulk_delete'),
    path('cuentas-clientes-bluetti/export/', CuentasClientesBluettiExportView.as_view(), name='cuentas_clientes_bluetti_export'),
    path('cuentas-clientes-bluetti/export-template/', CuentasClientesBluettiTemplateView.as_view(), name='cuentas_clientes_bluetti_export_template'),

    # ---------------- Ventas ----------------
    path('ventas-bluetti/', VentasBluettiListCreateView.as_view(), name='ventas_bluetti_list_create'),
    path('ventas-bluetti/<int:pk>/', VentasBluettiDetailView.as_view(), name='ventas_bluetti_detail'),
    path('ventas-bluetti/bulk-import/', VentasBluettiBulkImportView.as_view(), name='ventas_bluetti_bulk_import'),
    path('ventas-bluetti/bulk-update-excel/', VentasBluettiBulkUpdateExcelView.as_view(), name='ventas_bluetti_bulk_update_excel'),
    path('ventas-bluetti/bulk-delete/', VentasBluettiBulkDeleteView.as_view(), name='ventas_bluetti_bulk_delete'),
    path('ventas-bluetti/export/', VentasBluettiExportView.as_view(), name='ventas_bluetti_export'),
    path('ventas-bluetti/export-template/', VentasBluettiTemplateView.as_view(), name='ventas_bluetti_export_template'),

    # ---------------- Inventarios ----------------
    path('inventarios-bluetti/', InventariosBluettiListCreateView.as_view(), name='inventarios_bluetti_list_create'),
    path('inventarios-bluetti/<int:pk>/', InventariosBluettiDetailView.as_view(), name='inventarios_bluetti_detail'),
    path('inventarios-bluetti/bulk-import/', InventariosBluettiBulkImportView.as_view(), name='inventarios_bluetti_bulk_import'),
    path('inventarios-bluetti/bulk-update-excel/', InventariosBluettiBulkUpdateExcelView.as_view(), name='inventarios_bluetti_bulk_update_excel'),
    path('inventarios-bluetti/bulk-delete/', InventariosBluettiBulkDeleteView.as_view(), name='inventarios_bluetti_bulk_delete'),
    path('inventarios-bluetti/export/', InventariosBluettiExportView.as_view(), name='inventarios_bluetti_export'),
    path('inventarios-bluetti/export-template/', InventariosBluettiTemplateView.as_view(), name='inventarios_bluetti_export_template'),

    # ---------------- Ventas Sellout ----------------
    path('ventas-sellout-bluetti/', VentasSelloutBluettiListCreateView.as_view(), name='ventas_sellout_bluetti_list_create'),
    path('ventas-sellout-bluetti/<int:pk>/', VentasSelloutBluettiDetailView.as_view(), name='ventas_sellout_bluetti_detail'),
    path('ventas-sellout-bluetti/bulk-import/', VentasSelloutBluettiBulkImportView.as_view(), name='ventas_sellout_bluetti_bulk_import'),
    path('ventas-sellout-bluetti/bulk-update-excel/', VentasSelloutBluettiBulkUpdateExcelView.as_view(), name='ventas_sellout_bluetti_bulk_update_excel'),
    path('ventas-sellout-bluetti/bulk-delete/', VentasSelloutBluettiBulkDeleteView.as_view(), name='ventas_sellout_bluetti_bulk_delete'),
    path('ventas-sellout-bluetti/export/', VentasSelloutBluettiExportView.as_view(), name='ventas_sellout_bluetti_export'),
    path('ventas-sellout-bluetti/export-template/', VentasSelloutBluettiTemplateView.as_view(), name='ventas_sellout_bluetti_export_template'),

    # ---------------- Inventarios Sellout ----------------
    path('inventarios-sellout-bluetti/', InventariosSelloutBluettiListCreateView.as_view(), name='inventarios_sellout_bluetti_list_create'),
    path('inventarios-sellout-bluetti/<int:pk>/', InventariosSelloutBluettiDetailView.as_view(), name='inventarios_sellout_bluetti_detail'),
    path('inventarios-sellout-bluetti/bulk-import/', InventariosSelloutBluettiBulkImportView.as_view(), name='inventarios_sellout_bluetti_bulk_import'),
    path('inventarios-sellout-bluetti/bulk-update-excel/', InventariosSelloutBluettiBulkUpdateExcelView.as_view(), name='inventarios_sellout_bluetti_bulk_update_excel'),
    path('inventarios-sellout-bluetti/bulk-delete/', InventariosSelloutBluettiBulkDeleteView.as_view(), name='inventarios_sellout_bluetti_bulk_delete'),
    path('inventarios-sellout-bluetti/export/', InventariosSelloutBluettiExportView.as_view(), name='inventarios_sellout_bluetti_export'),
    path('inventarios-sellout-bluetti/export-template/', InventariosSelloutBluettiTemplateView.as_view(), name='inventarios_sellout_bluetti_export_template'),

    # --------------- Metas Comerciales ---------------
    path('metas-comerciales-bluetti/', MetasComercialesBluettiListCreateView.as_view(), name='metas_comerciales_bluetti_list_create'),
    path('metas-comerciales-bluetti/<int:pk>/', MetasComercialesBluettiDetailView.as_view(), name='metas_comerciales_bluetti_detail'),
    path('metas-comerciales-bluetti/bulk-import/', MetasComercialesBluettiBulkImportView.as_view(), name='metas_comerciales_bluetti_bulk_import'),
    path('metas-comerciales-bluetti/bulk-update-excel/', MetasComercialesBluettiBulkUpdateExcelView.as_view(), name='metas_comerciales_bluetti_bulk_update_excel'),
    path('metas-comerciales-bluetti/bulk-delete/', MetasComercialesBluettiBulkDeleteView.as_view(), name='metas_comerciales_bluetti_bulk_delete'),
    path('metas-comerciales-bluetti/export/', MetasComercialesBluettiExportView.as_view(), name='metas_comerciales_bluetti_export'),
    path('metas-comerciales-bluetti/export-template/', MetasComercialesBluettiTemplateView.as_view(), name='metas_comerciales_bluetti_export_template'),



    #URLS DE DASHBOARD LOOP
    path('loopserviciostotek/kpis/', LoopserviciosTotekKpisView.as_view(), name='loopserviciostotek_kpis'),
    path('loopserviciostotek/', LoopserviciosTotekListCreateView.as_view(), name='loopserviciostotek_list_create'),
    path('loopserviciostotek/<int:pk>/', LoopserviciosTotekDetailView.as_view(), name='loopserviciostotek_detail'),
    path('loopserviciostotek/bulk-import/', LoopserviciosTotekBulkImportView.as_view(), name='loopserviciostotek_bulk_import'),
    path('loopserviciostotek/bulk-update-excel/', LoopserviciosTotekBulkUpdateExcelView.as_view(), name='loopserviciostotek_bulk_update_excel'),
    path('loopserviciostotek/bulk-delete/', LoopserviciosTotekBulkDeleteView.as_view(), name='loopserviciostotek_bulk_delete'),
    path('loopserviciostotek/export/', LoopserviciosTotekExportView.as_view(), name='loopserviciostotek_export'),
    path('loopserviciostotek/export-template/', LoopserviciosTotekTemplateView.as_view(), name='loopserviciostotek_export_template'),



]


import importlib.util
from pathlib import Path


def _load_urlpatterns_from_file(relative_file, module_name):
    base_dir = Path(__file__).resolve().parent
    file_path = base_dir / relative_file
    spec = importlib.util.spec_from_file_location(module_name, file_path)
    if spec is None or spec.loader is None:
        return []
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return getattr(module, "urlpatterns", [])


urlpatterns += _load_urlpatterns_from_file(
    "urls_dashboard/dashboards-conetcom/conetcom_urls.py",
    "appdataflowai.urls_dashboard.dashboards_conetcom.conetcom_urls",
)


    
