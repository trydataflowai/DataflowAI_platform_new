from django.contrib import admin
from .models import (
    Categoria,
    Estado,
    PermisoAcceso,
    Empresa,
    Usuario,
    Producto,
    DetalleProducto,
    TipoPlan,
    DetalleProductoVendido, 
    Pagos,
    DashboardVentas
)

@admin.register(Categoria)
class CategoriaAdmin(admin.ModelAdmin):
    list_display = ('id_categoria', 'descripcion_categoria')
    search_fields = ('descripcion_categoria',)


@admin.register(Pagos)
class PagosAdmin(admin.ModelAdmin):
    list_display = ('id_pago', 'id_empresa', 'id_plan', 'fecha_hora_pago', 'ingreso')
    search_fields = ('id_empresa__nombre_empresa',)
    list_filter = ('fecha_hora_pago',)


@admin.register(Estado)
class EstadoAdmin(admin.ModelAdmin):
    list_display = ('id_estado', 'estado')
    search_fields = ('estado',)


@admin.register(PermisoAcceso)
class PermisoAccesoAdmin(admin.ModelAdmin):
    list_display = ('id_permiso_acceso', 'rol')
    search_fields = ('rol',)


@admin.register(Empresa)
class EmpresaAdmin(admin.ModelAdmin):
    list_display = (
        'id_empresa', 
        'id_categoria', 
        'id_plan', 
        'id_estado',
        'nombre_empresa', 
        'direccion', 
        'fecha_registros', 
        'prefijo_pais',
        'telefono', 
        'correo',
        'pagina_web',
        'fecha_hora_pago',
        'ciudad', 
        'pais'
    )
    search_fields = (
        'nombre_empresa', 
        'ciudad', 
        'pais', 
        'direccion', 
        'correo', 
        'pagina_web'
    )
    list_filter = (
        'id_categoria', 
        'id_estado', 
        'id_plan', 
        'ciudad', 
        'pais'
    )


@admin.register(Usuario)
class UsuarioAdmin(admin.ModelAdmin):
    list_display = (
        'id_usuario',
        'nombres',
        'apellidos',
        'correo',
        'id_empresa',
        'id_permiso_acceso',
        'id_area',
        'id_estado',
    )
    list_filter = (
        'id_empresa',
        'id_permiso_acceso',
        'id_area',
        'id_estado',
    )
    search_fields = ('nombres', 'apellidos', 'correo')
    ordering = ('id_usuario',)















@admin.register(Producto)
class ProductoAdmin(admin.ModelAdmin):
    list_display = (
        'id_producto',
        'producto',
        'categoria_producto',
        'tipo_producto',
        'id_area',
        'id_estado',
        'dashboard_context',
        'tables',
        'formularios_id',
    )

    search_fields = ('producto', 'slug', 'dashboard_context')

    list_filter = (
        'categoria_producto',
        'tipo_producto',
        'id_area',
        'id_estado',
    )

    ordering = ('id_producto',)

    prepopulated_fields = {"slug": ("producto",)}

    # 🔹 Opcional: mejor experiencia en el formulario
    fieldsets = (
        ('Información básica', {
            'fields': (
                'producto',
                'slug',
                'categoria_producto',
                'tipo_producto',
                'id_area',
                'id_estado',
            )
        }),
        ('Configuración Dashboard', {
            'fields': (
                'dashboard_context',
                'tables',
                'formularios_id',
            ),
            'classes': ('collapse',),
        }),
        ('Integraciones', {
            'fields': (
                'iframe',
                'link_pb',
                'link_dashboard_externo',
                'db_name',
            )
        }),
    )









@admin.register(DetalleProducto)
class DetalleProductoAdmin(admin.ModelAdmin):
    list_display = ('id_producto', 'id_usuario', 'get_db_name')
    search_fields = ('id_producto__producto', 'id_usuario__nombres', 'id_producto__db_name')
    list_filter = ('id_producto', 'id_usuario')

    def get_db_name(self, obj):
        return obj.db_name

    get_db_name.short_description = 'DB Name'


@admin.register(DetalleProductoVendido)
class DetalleProductoVendidoAdmin(admin.ModelAdmin):
    list_display = ('id_producto', 'id_usuario')
    search_fields = ('id_producto__producto', 'id_usuario__nombres')
    list_filter = ('id_producto', 'id_usuario')



@admin.register(TipoPlan)
class TipoPlanAdmin(admin.ModelAdmin):
    list_display = ('id_plan', 'tipo_plan', 'valor_plan')
    search_fields = ('tipo_plan',)
    list_filter = ('tipo_plan',)




from django.contrib import admin
from .models import EmpresaDashboard

@admin.register(EmpresaDashboard)
class EmpresaDashboardAdmin(admin.ModelAdmin):
    list_display = ('producto', 'empresa')
    search_fields = ('producto__nombre', 'empresa__nombre')
    list_filter = ('producto', 'empresa')


from django.contrib import admin
from .models import (
    DashboardVentasLoop,
    DashboardVentasColtrade,
    DashboardVentasDataflow,
)

@admin.register(DashboardVentasLoop)
class DashboardVentasLoopAdmin(admin.ModelAdmin):
    list_display = ('id_registro', 'punto_venta', 'dinero_entregado', 'cantidad_entregada', 'fecha_entrega')
    search_fields = ('punto_venta',)
    list_filter = ('fecha_entrega',)

@admin.register(DashboardVentasColtrade)
class DashboardVentasColtradeAdmin(admin.ModelAdmin):
    list_display = ('id_registro', 'punto_venta', 'dinero_entregado', 'cantidad_entregada', 'fecha_entrega')
    search_fields = ('punto_venta',)
    list_filter = ('fecha_entrega',)

@admin.register(DashboardVentasDataflow)
class DashboardVentasDataflowAdmin(admin.ModelAdmin):
    list_display = ('id_registro', 'punto_venta', 'dinero_entregado', 'cantidad_entregada', 'fecha_entrega')
    search_fields = ('punto_venta',)
    list_filter = ('fecha_entrega', 'punto_venta')  # ✅ Filtro por punto de venta






from django.contrib import admin

@admin.register(DashboardVentas)
class DashboardVentasAdmin(admin.ModelAdmin):
    list_display = (
        'id_registro', 'id_empresa', 'id_producto',
        'punto_venta', 'canal', 'ciudad', 'region',
        'fecha_venta', 'cantidad_vendida', 'dinero_vendido', 'ticket_promedio',
        'numero_transacciones', 'devoluciones', 'dinero_devoluciones',
        'sku', 'nombre_producto', 'categoria', 'marca'
    )

    list_filter = (
        'id_empresa', 'fecha_venta', 'canal', 'ciudad', 'region', 
        'categoria', 'marca', 'tipo_cliente', 'segmento_cliente'
    )

    search_fields = (
        'punto_venta', 'sku', 'nombre_producto', 'categoria',
        'marca', 'tipo_cliente', 'segmento_cliente'
    )

    readonly_fields = ('id_registro',)

    ordering = ('-fecha_venta',)

    date_hierarchy = 'fecha_venta'

    fieldsets = (
        ('Identificación', {
            'fields': ('id_registro', 'id_empresa', 'id_producto')
        }),
        ('Ubicación y Canal', {
            'fields': ('punto_venta', 'id_punto_venta', 'canal', 'ciudad', 'region')
        }),
        ('Detalles de la Venta', {
            'fields': (
                'cantidad_vendida', 'dinero_vendido', 'ticket_promedio',
                'unidades_promocionadas', 'descuento_total',
                'numero_transacciones', 'devoluciones', 'dinero_devoluciones'
            )
        }),
        ('Tiempos', {
            'fields': ('fecha_venta', 'mes', 'anio', 'dia_semana', 'hora')
        }),
        ('Producto', {
            'fields': ('sku', 'nombre_producto', 'categoria', 'subcategoria', 'marca')
        }),
        ('Cliente', {
            'fields': ('tipo_cliente', 'segmento_cliente', 'genero_cliente', 'edad_cliente')
        }),
        ('Indicadores Económicos', {
            'fields': ('utilidad_bruta', 'costo_total', 'margen_utilidad')
        }),
        ('Observaciones', {
            'fields': ('observaciones',)
        }),
    )




from django.contrib import admin
from .models import DashboardFinanzas

@admin.register(DashboardFinanzas)
class DashboardFinanzasAdmin(admin.ModelAdmin):
    list_display = (
        'id_registro', 'id_empresa', 'id_producto',
        'fecha_registro', 'mes', 'anio',
        'ingresos_totales', 'total_egresos',
        'utilidad_neta', 'margen_neto',
        'flujo_efectivo_total', 'activos_totales', 'pasivos_totales', 'patrimonio'
    )

    list_filter = (
        'id_empresa', 'anio', 'mes',
    )

    search_fields = (
        'id_empresa__nombre', 'id_producto__nombre',
    )

    readonly_fields = ('id_registro',)

    ordering = ('-fecha_registro',)

    date_hierarchy = 'fecha_registro'

    fieldsets = (
        ('Identificación', {
            'fields': ('id_registro', 'id_empresa', 'id_producto')
        }),
        ('Periodo Contable', {
            'fields': ('fecha_registro', 'mes', 'anio')
        }),
        ('Ingresos', {
            'fields': (
                'ingresos_operacionales',
                'ingresos_no_operacionales',
                'ingresos_totales'
            )
        }),
        ('Egresos', {
            'fields': (
                'costo_ventas',
                'gastos_operacionales',
                'otros_gastos',
                'total_egresos'
            )
        }),
        ('Resultados', {
            'fields': (
                'utilidad_bruta',
                'utilidad_neta',
                'margen_neto'
            )
        }),
        ('Flujo de Efectivo', {
            'fields': (
                'flujo_efectivo_operaciones',
                'flujo_efectivo_inversion',
                'flujo_efectivo_financiacion',
                'flujo_efectivo_total'
            )
        }),
        ('Balance General', {
            'fields': (
                'activos_totales',
                'pasivos_totales',
                'patrimonio'
            )
        }),
        ('Observaciones', {
            'fields': ('observaciones',)
        }),
    )


from django.contrib import admin
from .models import DashboardCompras

@admin.register(DashboardCompras)
class DashboardComprasAdmin(admin.ModelAdmin):
    list_display = (
        'id_registro', 'id_empresa', 'id_producto',
        'fecha_compra', 'mes', 'anio',
        'proveedor', 'cantidad_comprada', 'valor_unitario', 'valor_total'
    )

    list_filter = (
        'id_empresa', 'anio', 'mes', 'proveedor', 'categoria', 'subcategoria'
    )

    search_fields = (
        'id_empresa__nombre', 'id_producto__nombre', 'proveedor',
        'nombre_producto', 'categoria', 'subcategoria'
    )

    readonly_fields = ('id_registro',)

    ordering = ('-fecha_compra',)

    date_hierarchy = 'fecha_compra'

    fieldsets = (
        ('Identificación', {
            'fields': ('id_registro', 'id_empresa', 'id_producto')
        }),
        ('Periodo Contable', {
            'fields': ('fecha_compra', 'mes', 'anio')
        }),
        ('Detalle de Compra', {
            'fields': (
                'proveedor', 'tipo_proveedor', 'cantidad_comprada',
                'valor_unitario', 'valor_total',
                'nombre_producto', 'categoria', 'subcategoria', 'marca'
            )
        }),
        ('Condiciones y Observaciones', {
            'fields': ('condiciones_pago', 'tiempo_entrega_dias', 'observaciones')
        }),
    )



from django.contrib import admin
from .models import DashboardSales


@admin.register(DashboardSales)
class DashboardSalesAdmin(admin.ModelAdmin):
    list_display = (
        'id_registro', 'id_empresa', 'id_producto',
        'point_of_sale', 'channel', 'city', 'region',
        'sale_date', 'quantity_sold', 'sales_amount', 'average_ticket',
        'number_transactions', 'returns', 'return_amount',
        'sku', 'product_name', 'category', 'brand'
    )

    list_filter = (
        'id_empresa', 'sale_date', 'channel', 'city', 'region',
        'category', 'brand', 'customer_type', 'customer_segment'
    )

    search_fields = (
        'point_of_sale', 'sku', 'product_name', 'category',
        'brand', 'customer_type', 'customer_segment'
    )

    readonly_fields = ('id_registro',)

    ordering = ('-sale_date',)

    date_hierarchy = 'sale_date'

    fieldsets = (
        ('Identificación', {
            'fields': ('id_registro', 'id_empresa', 'id_producto')
        }),
        ('Ubicación y Canal', {
            'fields': ('point_of_sale_id', 'point_of_sale', 'channel', 'city', 'region')
        }),
        ('Detalles de la Venta', {
            'fields': (
                'quantity_sold', 'sales_amount', 'average_ticket',
                'promoted_units', 'total_discount',
                'number_transactions', 'returns', 'return_amount'
            )
        }),
        ('Tiempos', {
            'fields': ('sale_date', 'month', 'year', 'weekday', 'hour')
        }),
        ('Producto', {
            'fields': ('sku', 'product_name', 'category', 'subcategory', 'brand')
        }),
        ('Cliente', {
            'fields': ('customer_type', 'customer_segment', 'customer_gender', 'customer_age')
        }),
        ('Indicadores Económicos', {
            'fields': ('gross_profit', 'total_cost', 'profit_margin')
        }),
        ('Notas', {
            'fields': ('notes',)
        }),
    )



from django.contrib import admin
from .models import Areas


@admin.register(Areas)
class AreasAdmin(admin.ModelAdmin):
    list_display = ('id_area', 'area_trabajo')  # columnas visibles en el listado
    search_fields = ('area_trabajo',)           # campo por el cual se puede buscar


from django.contrib import admin
from .models import DashboardSalesreview

@admin.register(DashboardSalesreview)
class DashboardSalesreviewAdmin(admin.ModelAdmin):
    list_display = (
        'id_registro', 
        'id_empresa', 
        'id_producto', 
        'mes', 
        'mes_numero', 
        'semana',
        'dia_compra', 
        'fecha_compra', 
        'fecha_envio', 
        'numero_pedido',
        'numero_oc', 
        'estado', 
        'linea', 
        'fuente', 
        'sku_enviado', 
        'categoria', 
        'producto',
        'precio_unidad_antes_iva', 
        'unidades', 
        'ingresos_antes_iva',
    )

    list_filter = (
        'mes', 
        'estado', 
        'linea', 
        'fuente', 
        'categoria',
        'fecha_compra', 
        'fecha_envio',
    )

    search_fields = (
        'numero_pedido', 
        'numero_oc', 
        'sku_enviado', 
        'producto',
    )

    ordering = ('-fecha_compra',)

    date_hierarchy = 'fecha_compra'


from django.contrib import admin
from .models import Ticket

@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = ('id_ticket', 'id_usuario', 'correo', 'asunto', 'estado', 'fecha_creacion', 'fecha_cierre')
    search_fields = ('asunto', 'correo', 'id_usuario__nombres')  # ajusta 'nombres' al campo que uses en Usuario
    list_filter = ('estado', 'fecha_creacion', 'fecha_cierre')
    ordering = ('-fecha_creacion',)





from django.contrib import admin
from .models import ProductoHerramientas

@admin.register(ProductoHerramientas)
class ProductoHerramientasAdmin(admin.ModelAdmin):
    list_display = (
        'id_producto_herramienta',
        'producto_herramienta',
        'id_area',
        'tipo_producto',
        'id_estado',
        'link_producto',
    )
    search_fields = (
        'producto_herramienta',
        'id_area__nombre',   # ajusta 'nombre' al campo que uses en tu modelo Areas
        'id_estado__nombre', # ajusta 'nombre' al campo que uses en tu modelo Estado
    )
    list_filter = (
        'tipo_producto',
        'id_area',
        'id_estado',
    )
    ordering = ('producto_herramienta',)




from django.contrib import admin
from .models import DetalleProductoHerramientas


@admin.register(DetalleProductoHerramientas)
class DetalleProductoHerramientasAdmin(admin.ModelAdmin):
    list_display = ('id_producto', 'id_usuario')
    search_fields = ('id_producto__producto_herramienta', 'id_usuario__nombres')  # ajusta 'nombres' si tu modelo Usuario usa otro campo
    list_filter = ('id_producto', 'id_usuario')



from django.contrib import admin
from .models import RegistrosSesion

@admin.register(RegistrosSesion)
class RegistrosSesionAdmin(admin.ModelAdmin):
    list_display = ('id_registro', 'nombre_empresa', 'nombres', 'fecha_inicio_sesion')
    search_fields = ('id_empresa__nombre_empresa', 'id_usuario__nombres')
    list_filter = ('id_empresa', 'id_usuario', 'fecha_inicio_sesion')
    ordering = ('-fecha_inicio_sesion',)

    # Opcional: solo lectura para los campos autocompletados
    readonly_fields = ('nombre_empresa', 'nombres', 'fecha_inicio_sesion')

    # Opcional: si quieres agrupar los campos en secciones en el formulario admin
    fieldsets = (
        ('Información de la Empresa', {
            'fields': ('id_empresa', 'nombre_empresa')
        }),
        ('Información del Usuario', {
            'fields': ('id_usuario', 'nombres')
        }),
        ('Registro de Sesión', {
            'fields': ('fecha_inicio_sesion',)
        }),
    )



from django.contrib import admin
from .models import DashboardSalesCorporativo

@admin.register(DashboardSalesCorporativo)
class DashboardSalesCorporativoAdmin(admin.ModelAdmin):
    list_display = (
        'id_registro',
        'orden_compra',
        'fecha',
        'mes_nombre',
        'categoria_cliente',
        'nombre_cliente',
        'categoria_producto',
        'marca',
        'producto',
        'estado_cotizacion',
        'unidades',
        'precio_unitario',
    )
    search_fields = (
        'orden_compra',
        'nombre_cliente',
        'marca',
        'producto',
        'categoria_cliente',
        'categoria_producto',
    )
    list_filter = (
        'mes_nombre',
        'marca',
        'categoria_producto',
        'categoria_cliente',
        'fecha',
    )
    ordering = ('-fecha',)



from django.contrib import admin
from .models import DashboardSalesCorporativoMetas

@admin.register(DashboardSalesCorporativoMetas)
class DashboardSalesCorporativoMetasAdmin(admin.ModelAdmin):
    list_display = (
        'id_registro',
        'ano',
        'mes',
        'categoria_cliente',
        'nombre_cliente',
        'categoria_producto',
        'meta',
        'id_empresa',
        'id_producto',
    )

    list_filter = ('ano', 'mes', 'categoria_cliente', 'categoria_producto')
    search_fields = ('nombre_cliente', 'categoria_cliente', 'categoria_producto')
    ordering = ('-ano', '-mes')



from django.contrib import admin
from .models import DashboardIspVentas


@admin.register(DashboardIspVentas)
class DashboardIspVentasAdmin(admin.ModelAdmin):
    list_display = (
        'id_registro',
        'ano',
        'mes',
        'nombre_cliente',
        'categoria_cliente',
        'ciudad',
        'segmento',
        'nombre_plan',
        'categoria_plan',
        'velocidad_mbps',
        'precio_mensual',
        'estado_suscripcion',
        'monto_facturado',
        'fecha_inicio',
        'fecha_fin',
        'id_empresa',
        'id_producto',
    )

    list_filter = (
        'ano',
        'mes',
        'categoria_cliente',
        'ciudad',
        'segmento',
        'categoria_plan',
        'estado_suscripcion',
        'metodo_pago',
    )

    search_fields = (
        'nombre_cliente',
        'nombre_plan',
        'categoria_cliente',
        'categoria_plan',
        'ciudad',
    )

    ordering = ('-ano', '-mes')




 #DASHBOARD CHURN RATE PARA SERVITEL

from django.contrib import admin
from .models import DashboardChurnRate

@admin.register(DashboardChurnRate)
class DashboardChurnRateAdmin(admin.ModelAdmin):
    list_display = (
        'id_registro',
        'id_empresa',
        'id_producto',
        'id_cliente',
        'nombre_cliente',
        'tipo_plan',
        'region',
        'departamento',
        'estado_cliente',
        'fecha_contratacion',
        'fecha_baja',
        'fecha_ultima_transaccion',
        'monto_facturado_mensual',
        'margen_bruto',
        'arpu',
        'satisfaccion_cliente',
        'recomendacion_nps',
    )

    # Campos de búsqueda (relacionales y de texto)
    search_fields = (
        'id_cliente',
        'nombre_cliente',
        'id_empresa__nombre_empresa',
        'region',
        'departamento',
    )

    # Filtros útiles en el panel admin
    list_filter = (
        'tipo_plan',
        'estado_cliente',
        'region',
        'departamento',
        'fecha_contratacion',
        'fecha_baja',
        'fecha_ultima_transaccion',
    )

    # Orden por fecha más reciente
    ordering = ('-fecha_ultima_transaccion',)

    # Opcional: hacer que ciertos campos sean de solo lectura
    readonly_fields = ('id_registro',)

    # Opcional: ajustar cantidad de registros por página
    list_per_page = 25








#DASHBOARD ARPU

from django.contrib import admin
from .models import DashboardARPU

@admin.register(DashboardARPU)
class DashboardARPUAdmin(admin.ModelAdmin):
    list_display = (
        'id_registro',
        'id_empresa',
        'id_producto',
        'periodo_mes',
        'cliente_id',
        'estado',
        'tarifa_plan',
        'velocidad_mbps',
        'promo_id',
        'ingresos_totales',
        'mrr',
        'usuarios_promedio',
        'subs_inicio',
        'subs_final',
        'arpu',
        'churn',
        'created_at',
        'updated_at',
    )

    list_filter = (
        'periodo_mes',
        'id_empresa',
        'id_producto',
        'estado',
        'velocidad_mbps',
        'promo_id',
    )

    search_fields = (
        'cliente_id',
        'promo_id',
        'metadata',
    )

    ordering = ('-periodo_mes',)















# backend/appdataflowai/admin.py
from django.contrib import admin
from .models import Formulario, Pregunta, Respuesta

class PreguntaInline(admin.TabularInline):
    model = Pregunta
    extra = 0

@admin.register(Formulario)
class FormularioAdmin(admin.ModelAdmin):
    list_display = ('id_formulario', 'nombre', 'empresa', 'usuario', 'fecha_creacion', 'slug')
    search_fields = ('nombre', 'slug', 'empresa__nombre_empresa')
    inlines = [PreguntaInline]

@admin.register(Pregunta)
class PreguntaAdmin(admin.ModelAdmin):
    list_display = ('id_pregunta', 'texto', 'tipo', 'formulario', 'orden', 'requerido')
    list_filter = ('tipo', 'requerido')

@admin.register(Respuesta)
class RespuestaAdmin(admin.ModelAdmin):
    list_display = ('id_respuesta', 'formulario', 'fecha')
    readonly_fields = ('data',)









from .models import (
    DashboardTradeVentas,
    DashboardTradeMetas,
    DashboardTradeInventario,

)

# ADMIN VENTAS
#
@admin.register(DashboardTradeVentas)
class DashboardTradeVentasAdmin(admin.ModelAdmin):
    list_display = (
        'id_registro',
        'id_empresa',
        'id_producto',
        'fecha_venta',
        'ano',
        'mes',
        'sem',
        'id_pos',
        'punto_de_venta',
        'sku',
        'producto',
        'cantidad',
        'unit_price',
        'display_total_sellthru',
    )

    list_filter = (
        'ano',
        'mes',
        'id_empresa',
        'id_producto',
        'punto_de_venta',
    )

    search_fields = (
        'producto',
        'sku',
        'codigo_barras_product',
        'id_pos',
        'punto_de_venta',
    )

    ordering = ('-fecha_venta',)
    date_hierarchy = 'fecha_venta'
    list_per_page = 50
    readonly_fields = ('total_sellthru',)

    # optimizacion de consultas relacionadas
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related('id_empresa', 'id_producto')

    # mostrar total_sellthru calculado (siempre redondeado)
    def display_total_sellthru(self, obj):
        if obj.total_sellthru is None:
            return '-'
        return obj.total_sellthru
    display_total_sellthru.short_description = 'total_sellthru'

#
# ADMIN METAS
#
@admin.register(DashboardTradeMetas)
class DashboardTradeMetasAdmin(admin.ModelAdmin):
    list_display = (
        'id_registro',
        'id_empresa',
        'id_producto',
        'ano',
        'mes',
        'ciudad',
        'tienda',
        'meta',
        'display_meta_diaria',
        'display_meta_semanal',
    )

    list_filter = (
        'ano',
        'mes',
        'id_empresa',
        'ciudad',
        'tienda',
    )

    search_fields = (
        'tienda',
        'ean_pvd',
    )

    ordering = ('-ano', 'mes')
    list_per_page = 50
    readonly_fields = ('meta_diaria', 'meta_semanal')

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related('id_empresa', 'id_producto')

    def display_meta_diaria(self, obj):
        if obj.meta_diaria is None:
            return '-'
        return obj.meta_diaria
    display_meta_diaria.short_description = 'meta_diaria'

    def display_meta_semanal(self, obj):
        if obj.meta_semanal is None:
            return '-'
        return obj.meta_semanal
    display_meta_semanal.short_description = 'meta_semanal'

#
# ADMIN INVENTARIO
#
@admin.register(DashboardTradeInventario)
class DashboardTradeInventarioAdmin(admin.ModelAdmin):
    list_display = (
        'id_registro',
        'id_empresa',
        'id_producto',
        'fecha_inventario',
        'ano',
        'mes',
        'id_pos',
        'punto_de_venta',
        'sku',
        'producto',
        'cantidad',
        'unit_price',
        'display_stock_value',
    )

    list_filter = (
        'ano',
        'mes',
        'id_empresa',
        'punto_de_venta',
    )

    search_fields = (
        'producto',
        'sku',
        'codigo_barras_product',
        'id_pos',
    )

    ordering = ('-fecha_inventario',)
    date_hierarchy = 'fecha_inventario'
    list_per_page = 50

    readonly_fields = ()

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related('id_empresa', 'id_producto')

    # stock_value = cantidad * unit_price (siempre mostrar si hay datos)
    def display_stock_value(self, obj):
        try:
            if obj.cantidad is None or obj.unit_price is None:
                return '-'
            return obj.cantidad * obj.unit_price
        except Exception:
            return '-'
    display_stock_value.short_description = 'stock_value'



#admin para contexto del chat
from django.contrib import admin
from .models import DashboardContext


@admin.register(DashboardContext)
class DashboardContextAdmin(admin.ModelAdmin):
    list_display = (
        'id_registro',
        'dashboard_name',
        'session_id',
        'empresa_id'
    )

    search_fields = (
        'dashboard_name',
        'session_id'
    )

    list_filter = (
        'empresa_id',
    )

    readonly_fields = (
        'id_registro',
    )


from django.contrib import admin
from .models import (
    DashDfTiendas,
    DashDfProductos,
    DashDfVentas,
    DashDfMetas,
    DashDfInventarios
)


# =========================
# TIENDAS
# =========================
@admin.register(DashDfTiendas)
class DashDfTiendasAdmin(admin.ModelAdmin):
    list_display = (
        'id_tienda',
        'nombre_tienda',
        'ciudad',
        'canal',
        'estado',
        'id_empresa'
    )

    search_fields = (
        'nombre_tienda',
        'ciudad',
        'canal'
    )

    list_filter = (
        'estado',
        'canal',
        'ciudad',
        'id_empresa'
    )

    readonly_fields = (
        'id_tienda',
    )


# =========================
# PRODUCTOS
# =========================
@admin.register(DashDfProductos)
class DashDfProductosAdmin(admin.ModelAdmin):
    list_display = (
        'id_producto',
        'nombre_producto',
        'categoria',
        'marca',
        'valor_producto',
        'id_empresa'
    )

    search_fields = (
        'nombre_producto',
        'categoria',
        'marca'
    )

    list_filter = (
        'categoria',
        'marca',
        'id_empresa'
    )

    readonly_fields = (
        'id_producto',
    )


# =========================
# VENTAS
# =========================
@admin.register(DashDfVentas)
class DashDfVentasAdmin(admin.ModelAdmin):
    list_display = (
        'id_registro',
        'id_tienda',
        'id_producto',
        'cantidad_vendida',
        'dinero_vendido',
        'fecha_venta',
        'id_empresa'
    )

    search_fields = (
        'id_tienda__nombre_tienda',
        'id_producto__nombre_producto'
    )

    list_filter = (
        'fecha_venta',
        'id_empresa',
        'id_tienda'
    )

    readonly_fields = (
        'id_registro',
    )


# =========================
# METAS
# =========================
@admin.register(DashDfMetas)
class DashDfMetasAdmin(admin.ModelAdmin):
    list_display = (
        'id_registro',
        'id_tienda',
        'id_producto',
        'meta_cantidad',
        'meta_dinero',
        'fecha_meta',
        'id_empresa'
    )

    search_fields = (
        'id_tienda__nombre_tienda',
        'id_producto__nombre_producto'
    )

    list_filter = (
        'fecha_meta',
        'id_empresa',
        'id_tienda'
    )

    readonly_fields = (
        'id_registro',
    )


# =========================
# INVENTARIOS
# =========================
@admin.register(DashDfInventarios)
class DashDfInventariosAdmin(admin.ModelAdmin):
    list_display = (
        'id_registro',
        'id_tienda',
        'id_producto',
        'inventario_cantidad',
        'id_empresa'
    )

    search_fields = (
        'id_tienda__nombre_tienda',
        'id_producto__nombre_producto'
    )

    list_filter = (
        'id_empresa',
        'id_tienda'
    )

    readonly_fields = (
        'id_registro',
    )



from django.contrib import admin
from .models import (
    UsuariosBrokers,
    LeadsBrokers,
    FacturacionLeadsBrokers,
    PagosBrokersLeads,
)

# ---------- UsuariosBrokers ----------
@admin.register(UsuariosBrokers)
class UsuariosBrokersAdmin(admin.ModelAdmin):
    list_display = (
        'id_broker',
        'id_usuario',
        'numero_telefono',
        'pais_residencia',
        'entidad_financiera',
        'tipo_cuenta',
        'numero_identificacion',
    )

    search_fields = (
        'id_usuario__nombres',
        'id_usuario__correo',
        'numero_identificacion',
        'entidad_financiera',
    )

    list_filter = (
        'pais_residencia',
        'entidad_financiera',
        'tipo_cuenta',
    )

    readonly_fields = (
        'id_broker',
    )


# ---------- LeadsBrokers ----------
@admin.register(LeadsBrokers)
class LeadsBrokersAdmin(admin.ModelAdmin):
    list_display = (
        'id_lead',
        'nombre_lead',
        'id_broker',
        'correo',
        'persona_de_contacto',
        'telefono',
        'pais',
        'industria',
        'tamano_empresa',
        'etapa',
        'probabilidad_cierre',
        'ticket_estimado',
    )

    search_fields = (
        'nombre_lead',
        'correo',
        'persona_de_contacto',
        'id_broker__id_usuario__nombres',
        'id_broker__id_usuario__correo',
    )

    list_filter = (
        'tamano_empresa',
        'etapa',
        'pais',
        'industria',
        'id_broker',
    )

    readonly_fields = (
        'id_lead',
    )

    ordering = ('-id_lead',)


# ---------- FacturacionLeadsBrokers ----------
from django.contrib import admin
from .models import FacturacionLeadsBrokers


@admin.register(FacturacionLeadsBrokers)
class FacturacionLeadsBrokersAdmin(admin.ModelAdmin):

    list_display = (
        'numero_factura',
        'id_broker',
        'id_lead',
        'fecha_facturacion',
        'valor_facturado',
        'comision_percent',
        'valor_comision_display',
    )

    search_fields = (
        'numero_factura',
        'id_lead__nombre_lead',
        'id_broker__id_usuario__nombres',
    )

    list_filter = (
        'fecha_facturacion',
        'id_broker',
        'id_lead',
    )

    # 🔥 IMPORTANTE: quitamos numero_factura de readonly
    readonly_fields = (
        'valor_comision_display',
    )

    date_hierarchy = 'fecha_facturacion'
    ordering = ('-fecha_facturacion',)

    def valor_comision_display(self, obj):
        """Muestra el valor calculado de la comisión (propiedad del modelo)."""
        try:
            return obj.valor_comision_amount
        except Exception:
            return None

    valor_comision_display.short_description = 'Valor comisión'


# ---------- PagosBrokersLeads ----------
@admin.register(PagosBrokersLeads)
class PagosBrokersLeadsAdmin(admin.ModelAdmin):
    list_display = (
        'id_pago',
        'fecha_pago',
        'numero_factura',
        'valor_pagado',
        'estado',
    )

    search_fields = (
        'id_pago',
        'numero_factura__numero_factura',
        'numero_factura__id_lead__nombre_lead',
    )

    list_filter = (
        'estado',
        'fecha_pago',
        'numero_factura__id_broker',
    )

    readonly_fields = (
        'id_pago',
    )

    ordering = ('-fecha_pago',)
