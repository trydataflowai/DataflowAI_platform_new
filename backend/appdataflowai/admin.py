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
    )
    search_fields = ('producto', 'slug')
    list_filter = (
        'categoria_producto',
        'tipo_producto',
        'id_area',
        'id_estado',
    )
    ordering = ('id_producto',)
    prepopulated_fields = {"slug": ("producto",)}  # autogenera el slug

@admin.register(DetalleProducto)
class DetalleProductoAdmin(admin.ModelAdmin):
    list_display = ('id_producto', 'id_usuario')
    search_fields = ('id_producto__producto', 'id_usuario__nombres')
    list_filter = ('id_producto', 'id_usuario')


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
