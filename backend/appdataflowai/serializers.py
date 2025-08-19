# appdataflowai/serializers.py
from rest_framework import serializers
from .models import Producto

class ProductoSerializer(serializers.ModelSerializer):
    estado = serializers.CharField(source='id_estado.estado')  # Mostrar nombre del estado
    categoria_producto = serializers.CharField(source='get_categoria_producto_display')
    tipo_producto = serializers.CharField(source='get_tipo_producto_display')

    class Meta:
        model = Producto
        fields = [
            'id_producto',
            'producto',
            'estado',
            'slug',
            'iframe',
            'link_pb',
            'categoria_producto',
            'tipo_producto',
        ]





from rest_framework import serializers
from .models import DetalleProducto

class DetalleProductoSerializer(serializers.ModelSerializer):
    class Meta:
        model = DetalleProducto
        fields = ['id_producto']  # el usuario se toma del token, no del payload




# backend/appdataflowai/serializers.py
# backend/appdataflowai/serializers.py
from datetime import date
from rest_framework import serializers
from .models import Empresa, Usuario, Categoria, Estado, TipoPlan, PermisoAcceso

class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = ['id_categoria', 'descripcion_categoria']

class EstadoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Estado
        fields = ['id_estado', 'estado']

class TipoPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoPlan
        fields = ['id_plan', 'tipo_plan', 'valor_plan' ]

class PermisoAccesoSerializer(serializers.ModelSerializer):
    class Meta:
        model = PermisoAcceso
        fields = ['id_permiso_acceso', 'rol']

class EmpresaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Empresa
        fields = [
            'id_empresa',
            'id_categoria',
            'id_plan',
            'id_estado',
            'nombre_empresa',
            'direccion',
            'fecha_registros',
            'telefono',
            'ciudad',
            'pais',
            'prefijo_pais',
            'correo',
            'pagina_web',
            'fecha_hora_pago',
        ]
        read_only_fields = ['id_empresa', 'id_estado', 'fecha_registros', 'fecha_hora_pago']

    def create(self, validated_data):
        estado_activo = Estado.objects.get(pk=1)
        return Empresa.objects.create(
            id_estado=estado_activo,
            fecha_registros=date.today(),
            fecha_hora_pago=None,
            **validated_data
        )

class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = [
            'id_usuario',
            'id_empresa',
            'id_permiso_acceso',
            'nombres',
            'apellidos',
            'correo',
            'contrasena',
            'id_estado',
        ]
        read_only_fields = ['id_usuario', 'id_permiso_acceso', 'id_estado']

    def create(self, validated_data):
        permiso_admin = PermisoAcceso.objects.get(pk=1)
        estado_activo = Estado.objects.get(pk=1)
        return Usuario.objects.create(
            id_permiso_acceso=permiso_admin,
            id_estado=estado_activo,
            **validated_data
        )




from rest_framework import serializers

class CreatePaymentIntentSerializer(serializers.Serializer):
    id_empresa = serializers.IntegerField()
    id_plan = serializers.IntegerField()




#DashboardVentasDataflow de PRUEBA
from rest_framework import serializers
from .models import DashboardVentasDataflow

class DashboardVentasDataflowSerializer(serializers.ModelSerializer):
    class Meta:
        model = DashboardVentasDataflow
        fields = [
            'id_registro',
            'id_punto_venta',
            'punto_venta',
            'dinero_entregado',
            'cantidad_entregada',
            'fecha_entrega',
        ]



#Serializer para DashboardVentas
# Este serializer es para el modelo DashboardVentas, que se usa en la implementación de React y
from .models import DashboardVentas
from rest_framework import serializers

class DashboardVentasSerializer(serializers.ModelSerializer):
    class Meta:
        model = DashboardVentas
        fields = [
            'id_registro',
            'id_empresa',
            'id_producto',

            'id_punto_venta', 'punto_venta', 'canal', 'ciudad', 'region',

            'cantidad_vendida', 'dinero_vendido', 'ticket_promedio',
            'unidades_promocionadas', 'descuento_total',
            'numero_transacciones', 'devoluciones', 'dinero_devoluciones',

            'fecha_venta', 'mes', 'anio', 'dia_semana', 'hora',

            'sku', 'nombre_producto', 'categoria', 'subcategoria', 'marca',

            'tipo_cliente', 'segmento_cliente', 'genero_cliente', 'edad_cliente',

            'utilidad_bruta', 'costo_total', 'margen_utilidad',

            'observaciones'
        ]



from rest_framework import serializers
from .models import DashboardFinanzas

class DashboardFinanzasSerializer(serializers.ModelSerializer):
    class Meta:
        model = DashboardFinanzas
        fields = [
            'id_registro',
            'id_empresa',
            'id_producto',

            'fecha_registro', 'mes', 'anio',

            'ingresos_operacionales', 'ingresos_no_operacionales', 'ingresos_totales',

            'costo_ventas', 'gastos_operacionales', 'otros_gastos', 'total_egresos',

            'utilidad_bruta', 'utilidad_neta', 'margen_neto',

            'flujo_efectivo_operaciones', 'flujo_efectivo_inversion',
            'flujo_efectivo_financiacion', 'flujo_efectivo_total',

            'activos_totales', 'pasivos_totales', 'patrimonio',

            'observaciones'
        ]


from rest_framework import serializers
from .models import DashboardCompras

class DashboardComprasSerializer(serializers.ModelSerializer):
    class Meta:
        model = DashboardCompras
        fields = [
            'id_registro',
            'id_empresa',
            'id_producto',

            'fecha_compra',
            'mes',
            'anio',

            'proveedor',
            'tipo_proveedor',

            'cantidad_comprada',
            'valor_unitario',
            'valor_total',

            'nombre_producto',
            'categoria',
            'subcategoria',
            'marca',

            'condiciones_pago',
            'tiempo_entrega_dias',
            'observaciones'
        ]




"""
Serialización de los dashboard OFICIALES.
"""

from .models import DashboardSales
from rest_framework import serializers

class DashboardSalesSerializer(serializers.ModelSerializer):
    class Meta:
        model = DashboardSales
        fields = [  
            'id_registro',
            'id_empresa',
            'id_producto',

            'point_of_sale_id', 'point_of_sale', 'channel', 'city', 'region',

            'quantity_sold', 'sales_amount', 'average_ticket',
            'promoted_units', 'total_discount',
            'number_transactions', 'returns', 'return_amount',

            'sale_date', 'month', 'year', 'weekday', 'hour',

            'sku', 'product_name', 'category', 'subcategory', 'brand',

            'customer_type', 'customer_segment', 'customer_gender', 'customer_age',

            'gross_profit', 'total_cost', 'profit_margin',

            'notes'
        ]
