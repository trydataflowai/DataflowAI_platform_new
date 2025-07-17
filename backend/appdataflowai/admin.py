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
    DetalleProductoVendido
)

@admin.register(Categoria)
class CategoriaAdmin(admin.ModelAdmin):
    list_display = ('id_categoria', 'descripcion_categoria')
    search_fields = ('descripcion_categoria',)


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
        'telefono', 
        'ciudad', 
        'pais'
    )
    search_fields = ('nombre_empresa', 'ciudad', 'pais', 'direccion')
    list_filter = ('id_categoria', 'id_estado', 'id_plan', 'ciudad', 'pais')


@admin.register(Usuario)
class UsuarioAdmin(admin.ModelAdmin):
    list_display = ('id_usuario', 'nombres', 'correo', 'id_empresa', 'id_permiso_acceso', 'estado')
    search_fields = ('nombres', 'correo')
    list_filter = ('id_empresa', 'id_permiso_acceso', 'estado')


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
    list_display = ('id_plan', 'tipo_plan')
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
    list_filter = ('fecha_entrega',)
