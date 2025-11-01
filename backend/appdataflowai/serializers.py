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







# your_app/serializers.py  SERLIAZIZADORES PARA EDITAR PERFIL
# your_app/serializers.py
# your_app/serializers.py
from rest_framework import serializers

class PasswordChangeSerializer(serializers.Serializer):
    contrasena_actual = serializers.CharField(write_only=True)
    contrasena_nueva  = serializers.CharField(write_only=True)

    def validate(self, data):
        usuario = self.context.get('user')
        if usuario is None:
            raise serializers.ValidationError('Usuario no provisto en contexto')

        almacenada = usuario.contrasena or ''
        ingresada = data.get('contrasena_actual', '')

        # Comparación directa en texto plano (sin hashing)
        if ingresada != almacenada:
            raise serializers.ValidationError({'contrasena_actual': 'Contraseña actual incorrecta'})

        return data

    def save(self, **kwargs):
        usuario = self.context.get('user')
        nueva = self.validated_data['contrasena_nueva']
        # Almacena tal cual la cadena enviada (texto plano)
        usuario.contrasena = nueva
        usuario.save()
        return usuario







#ASOCIAR DASHBOARDS POR MEDIO DE PERFIL
from rest_framework import serializers
from .models import Usuario, Producto, DetalleProducto, EmpresaDashboard
from django.conf import settings


class AsgDashboardUsuarioListSerializer(serializers.ModelSerializer):
    area = serializers.CharField(source='id_area.area_trabajo', read_only=True)
    id_empresa = serializers.IntegerField(source='id_empresa.id_empresa', read_only=True)

    class Meta:
        model = Usuario
        fields = ('id_usuario', 'nombres', 'apellidos', 'correo', 'area', 'id_empresa')


class AsgDashboardProductoSerializer(serializers.ModelSerializer):
    area = serializers.CharField(source='id_area.area_trabajo', read_only=True)
    # Lista de empresas propietarias (si las hay). Puede ser None o lista.
    owned_by = serializers.SerializerMethodField(method_name='asgdashboard_get_owned_by')

    class Meta:
        model = Producto
        fields = (
            'id_producto',
            'producto',
            'area',
            'slug',
            'categoria_producto',
            'tipo_producto',
            'id_estado',
            'link_pb',
            'owned_by',
        )

    def asgdashboard_get_owned_by(self, obj):
        qs = EmpresaDashboard.objects.filter(producto=obj)
        if not qs.exists():
            return None
        return [
            {
                'id_empresa': e.empresa.id_empresa,
                'nombre_empresa': e.empresa.nombre_empresa
            }
            for e in qs
        ]


class AsgDashboardDetalleProductoSerializer(serializers.ModelSerializer):
    # Devuelve info simple del producto en la asignación
    producto = AsgDashboardProductoSerializer(source='id_producto', read_only=True)

    class Meta:
        model = DetalleProducto
        fields = ('id_usuario', 'id_producto', 'producto')


#Serializador del Dashboard Sales Review

from rest_framework import serializers
from .models import DashboardSalesreview

class DashboardSalesreviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = DashboardSalesreview
        fields = [
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
        ]



#SERIALIZADOR PARA MODULO DE SOPORTE


from rest_framework import serializers
from .models import Ticket

class TicketSerializer(serializers.ModelSerializer):
    id_usuario = serializers.PrimaryKeyRelatedField(read_only=True)
    fecha_creacion = serializers.DateTimeField(read_only=True)
    fecha_cierre = serializers.DateTimeField(read_only=True)
    estado = serializers.CharField(read_only=True)  # siempre 'creada' al crear desde frontend

    class Meta:
        model = Ticket
        fields = [
            'id_ticket',
            'id_usuario',
            'correo',
            'asunto',
            'descripcion',
            'comentario',
            'estado',
            'fecha_creacion',
            'fecha_cierre',
        ]
        read_only_fields = ['id_ticket', 'id_usuario', 'estado', 'fecha_creacion', 'fecha_cierre']





 #Serializadores para el crud del dashboard de SALESREVIEW del modelo: DashboardSalesreview
# serializers.py
from rest_framework import serializers
from .models import DashboardSalesreview

# Cambia este valor si quieres otro producto por defecto
DEFAULT_PRODUCT_ID = 10  # <-- PONER EL ID DEL PRODUCTO POR DEFECTO AQUÍ

class DashboardSalesreviewSerializer(serializers.ModelSerializer):
    """
    Serializador que expone id_registro y alias id.
    Forzamos id_producto a DEFAULT_PRODUCT_ID en create y update (el cliente no lo manda).
    """
    id_registro = serializers.IntegerField(read_only=True)
    id = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = DashboardSalesreview
        fields = [
            'id_registro',
            'id',
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
        ]
        read_only_fields = ('id_registro', 'id')

    def get_id(self, obj):
        return getattr(obj, 'id_registro', getattr(obj, 'pk', None))

    def validate_mes_numero(self, value):
        if value is None:
            return value
        if value < 1 or value > 12:
            raise serializers.ValidationError("mes_numero debe estar entre 1 y 12")
        return value

    def create(self, validated_data):
        """
        - Asigna id_empresa desde el contexto (igual que antes).
        - Fuerza id_producto al DEFAULT_PRODUCT_ID (no se permite que el cliente lo fije).
        """
        empresa = self.context.get('empresa', None)
        if empresa is None:
            raise serializers.ValidationError("No se pudo determinar la empresa del usuario.")
        validated_data['id_empresa'] = empresa
        # Forzamos el FK id_producto al ID por defecto (usamos la clave *_id para evitar hacer query extra)
        validated_data['id_producto_id'] = DEFAULT_PRODUCT_ID  # <-- AQUI SE COLOCA EL ID POR DEFECTO
        return super().create(validated_data)

    def update(self, instance, validated_data):
        """
        - Ignora intentos de cambiar id_empresa o id_producto desde el cliente.
        - Vuelve a forzar id_producto al DEFAULT_PRODUCT_ID (con ello siempre permanece 10).
        """
        validated_data.pop('id_empresa', None)
        validated_data.pop('id_producto', None)
        # Forzamos id_producto al valor por defecto (siempre)
        validated_data['id_producto_id'] = DEFAULT_PRODUCT_ID  # <-- AQUI SE COLOCA EL ID POR DEFECTO
        return super().update(instance, validated_data)
    
    
# Este es el serializador para el crud del Dashboard Sales Corporativo del modelo: DashboardSalesCorporativo
# serializers.py
from rest_framework import serializers
from .models import DashboardSalesCorporativo

# Producto por defecto para forzar id_producto
DEFAULT_PRODUCT_ID = 15  # <-- ID del producto por defecto

class DashboardSalesCorporativoSerializerProd15(serializers.ModelSerializer):
    """
    Serializador que expone id_registro y alias id.
    Forzamos id_producto a DEFAULT_PRODUCT_ID en create y update.
    """
    id_registro = serializers.IntegerField(read_only=True)
    id = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = DashboardSalesCorporativo
        fields = [
            'id_registro',
            'id',
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
            'observaciones',
        ]
        read_only_fields = ('id_registro', 'id')

    def get_id(self, obj):
        return getattr(obj, 'id_registro', getattr(obj, 'pk', None))

    def validate_unidades(self, value):
        if value is None:
            return value
        if value < 0:
            raise serializers.ValidationError("unidades no puede ser negativo")
        return value

    def create(self, validated_data):
        """
        - Asigna id_empresa desde el contexto.
        - Forza id_producto al DEFAULT_PRODUCT_ID (el cliente no lo manda).
        """
        empresa = self.context.get('empresa', None)
        if empresa is None:
            raise serializers.ValidationError("No se pudo determinar la empresa del usuario.")
        validated_data['id_empresa'] = empresa
        # Forzamos el FK id_producto al ID por defecto
        validated_data['id_producto_id'] = DEFAULT_PRODUCT_ID
        return super().create(validated_data)

    def update(self, instance, validated_data):
        """
        - Ignora intentos de cambiar id_empresa o id_producto desde el cliente.
        - Forza id_producto al DEFAULT_PRODUCT_ID.
        """
        validated_data.pop('id_empresa', None)
        validated_data.pop('id_producto', None)
        validated_data['id_producto_id'] = DEFAULT_PRODUCT_ID
        return super().update(instance, validated_data)


# Este es el serializador para el crud del Dashboard Sales Corporativo del modelo: DashboardSalesCorporativometas
# serializers.py
from rest_framework import serializers
from .models import DashboardSalesCorporativoMetas

# PONER AQUI EL ID POR DEFECTO DEL PRODUCTO
DEFAULT_PRODUCT_ID = 15  # <-- ID DEL PRODUCTO POR DEFECTO

class DashboardSalesCorporativoMetasProduct15Serializer(serializers.ModelSerializer):
    """
    Serializador que expone id_registro e id.
    Forzamos id_producto a DEFAULT_PRODUCT_ID en create y update.
    """
    id_registro = serializers.IntegerField(read_only=True)
    id = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = DashboardSalesCorporativoMetas
        fields = [
            'id_registro',
            'id',
            'id_empresa',
            'id_producto',
            'ano',
            'mes',
            'categoria_cliente',
            'nombre_cliente',
            'categoria_producto',
            'meta',
        ]
        read_only_fields = ('id_registro', 'id', 'id_empresa', 'id_producto')

    def get_id(self, obj):
        return getattr(obj, 'id_registro', getattr(obj, 'pk', None))

    def validate_ano(self, value):
        # opcional: validar rango basico de anio
        try:
            v = int(value)
        except Exception:
            raise serializers.ValidationError("ano debe ser un numero entero")
        if v < 1900 or v > 2100:
            raise serializers.ValidationError("ano fuera de rango")
        return v

    def create(self, validated_data):
        """
        Asigna id_empresa desde el contexto (usuario) y fija id_producto al DEFAULT_PRODUCT_ID.
        """
        empresa = self.context.get('empresa', None)
        if empresa is None:
            raise serializers.ValidationError("No se pudo determinar la empresa del usuario.")
        validated_data['id_empresa'] = empresa
        # forzamos FK por id para evitar query extra
        validated_data['id_producto_id'] = DEFAULT_PRODUCT_ID
        return super().create(validated_data)

    def update(self, instance, validated_data):
        """
        Ignora id_empresa/id_producto enviados por el cliente y vuelve a forzar id_producto.
        """
        validated_data.pop('id_empresa', None)
        validated_data.pop('id_producto', None)
        validated_data['id_producto_id'] = DEFAULT_PRODUCT_ID
        return super().update(instance, validated_data)





#Serializador de Dashboard ISP Ventas
from rest_framework import serializers
from .models import DashboardIspVentas

class DashboardIspVentasSerializer(serializers.ModelSerializer):
    class Meta:
        model = DashboardIspVentas
        fields = '__all__'
