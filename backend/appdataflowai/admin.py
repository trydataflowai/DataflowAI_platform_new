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
    list_display = ('id_usuario', 'nombres', 'apellidos', 'correo', 'id_empresa', 'id_permiso_acceso', 'id_estado')
    list_filter = ('id_empresa', 'id_permiso_acceso', 'id_estado')


@admin.register(Producto)
class ProductoAdmin(admin.ModelAdmin):
    list_display = ('id_producto', 'producto', 'tipo_producto','id_estado')
    search_fields = ('producto',)
    list_filter = ('id_estado',)


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
