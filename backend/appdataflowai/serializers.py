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








 #DASHBOARD CHURN RATE PARA SERVITEL
from rest_framework import serializers
from .models import DashboardChurnRate

class DashboardChurnRateSerializer(serializers.ModelSerializer):
    # Serializamos las FK como PKs de solo lectura (puedes cambiar a nested si prefieres)
    id_empresa = serializers.PrimaryKeyRelatedField(read_only=True)
    id_producto = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = DashboardChurnRate
        fields = [
            'id_registro',
            'id_empresa',
            'id_producto',

            'id_cliente',
            'nombre_cliente',

            'tipo_plan',
            'region',
            'departamento',

            'fecha_contratacion',
            'fecha_baja',
            'fecha_ultima_transaccion',

            'estado_cliente',

            'monto_facturado_mensual',
            'margen_bruto',
            'arpu',

            'numero_quejas',
            'total_reclamos',
            'interacciones_servicio',

            'satisfaccion_cliente',
            'valor_percibido',
            'recomendacion_nps',

            'observacion_cliente',
        ]
        read_only_fields = ['id_registro', 'id_empresa']




#DASHBOARD ARPU

#-------------------Dashboard ISP ARPU-------------------

# serializers.py
from rest_framework import serializers
from .models import DashboardARPU
from datetime import date

# PONER AQUI EL ID POR DEFECTO DEL PRODUCTO
DEFAULT_PRODUCT_ID = 15  # <-- ID DEL PRODUCTO POR DEFECTO

class ForecastPredictionSerializer(serializers.Serializer):
    periodo = serializers.DateField()
    arpu_pred = serializers.DecimalField(max_digits=14, decimal_places=2)
    lower = serializers.DecimalField(max_digits=14, decimal_places=2, required=False, allow_null=True)
    upper = serializers.DecimalField(max_digits=14, decimal_places=2, required=False, allow_null=True)

class ForecastSerializer(serializers.Serializer):
    horizonte = serializers.IntegerField()
    modelo = serializers.CharField(max_length=100)
    trained_at = serializers.DateTimeField(required=False, allow_null=True)
    predicciones = ForecastPredictionSerializer(many=True)

class DashboardARPUSerializer(serializers.ModelSerializer):
    """
    Serializador para CRUD del modelo DashboardARPU.
    Forzamos id_producto a DEFAULT_PRODUCT_ID en create y update.
    """
    id_registro = serializers.IntegerField(read_only=True)
    id = serializers.SerializerMethodField(read_only=True)

    # Exponer doc.forecast de forma opciona como campo anidado para validacion/representacion
    forecast = serializers.SerializerMethodField(read_only=False)

    class Meta:
        model = DashboardARPU
        fields = [
            'id_registro',
            'id',

            'id_empresa',
            'id_producto',

            # tiempo / cliente / evento
            'periodo_mes',
            'cliente_id',
            'fecha_evento',
            'tipo_evento',
            'monto_evento',

            # snapshot
            'estado',
            'fecha_alta',
            'fecha_baja',
            'tarifa_plan',
            'velocidad_mbps',
            'canal_adquisicion',

            # agregados
            'ingresos_totales',
            'mrr',
            'usuarios_promedio',
            'subs_inicio',
            'subs_final',
            'arpu',
            'churn',

            # promos / tags / metadata
            'promo_id',
            'tags',
            'metadata',

            # doc libre (JSON) y campo virtual forecast para facilitar inputs
            'doc',
            'forecast',

            'created_at',
            'updated_at',
        ]
        read_only_fields = ('id_registro', 'id', 'id_empresa', 'id_producto', 'created_at', 'updated_at')

    def get_id(self, obj):
        return getattr(obj, 'id_registro', getattr(obj, 'pk', None))

    def get_forecast(self, obj):
        """
        Retorna doc.forecast si existe; esto es solo para representation.
        """
        doc = getattr(obj, 'doc', None) or {}
        return doc.get('forecast', None)

    def validate_periodo_mes(self, value):
        """
        Validacion basica del periodo_mes: debe ser una fecha y no ser muy antigua/futura.
        """
        if not isinstance(value, (date,)):
            raise serializers.ValidationError("periodo_mes debe ser una fecha valida (date).")
        # opcional: evitar anos fuera de rango
        if value.year < 1900 or value.year > 2100:
            raise serializers.ValidationError("periodo_mes fuera de rango.")
        return value

    def validate_doc(self, value):
        """
        Validacion basica del campo doc.
        Si contiene 'forecast' valida su estructura minima esperada.
        """
        if value is None:
            return value

        if not isinstance(value, dict):
            raise serializers.ValidationError("doc debe ser un objecto JSON.")

        forecast = value.get('forecast')
        if forecast is not None:
            # validar campos basicos de forecast con el serializer de forecast
            ser = ForecastSerializer(data=forecast)
            if not ser.is_valid():
                raise serializers.ValidationError({'forecast': ser.errors})
        return value

    def validate_arpu(self, value):
        # validacion opcional: no negativo
        if value is not None and value < 0:
            raise serializers.ValidationError("arpu no puede ser negativo.")
        return value

    def create(self, validated_data):
        """
        Asigna id_empresa desde el contexto (si se provee) y fija id_producto al DEFAULT_PRODUCT_ID.
        Admite que el cliente envie campo 'forecast' en la raiz: lo movemos dentro de doc.
        """
        empresa = self.context.get('empresa', None)
        if empresa is None:
            # si prefieres no forzar empresa desde contexto puedes comentar la siguiente linea
            raise serializers.ValidationError("No se pudo determinar la empresa desde el contexto.")

        # si el payload traia 'forecast' como campo separado (no es parte del modelo), capturarlo
        forecast_input = self.initial_data.get('forecast', None)

        # forzamos FK por id para evitar query extra
        validated_data['id_empresa'] = empresa
        validated_data['id_producto_id'] = DEFAULT_PRODUCT_ID

        # si doc no existe lo inicializamos
        doc = validated_data.get('doc') or {}
        if forecast_input is not None:
            doc['forecast'] = forecast_input
            validated_data['doc'] = doc

        return super().create(validated_data)

    def update(self, instance, validated_data):
        """
        Ignora id_empresa/id_producto enviados por el cliente y vuelve a forzar id_producto.
        Maneja tambien 'forecast' en initial_data moviendolo dentro de doc.
        """
        # eliminar actualizaciones a FK para que no se puedan cambiar via API
        validated_data.pop('id_empresa', None)
        validated_data.pop('id_producto', None)
        validated_data['id_producto_id'] = DEFAULT_PRODUCT_ID

        forecast_input = self.initial_data.get('forecast', None)
        if forecast_input is not None:
            doc = validated_data.get('doc') or instance.doc or {}
            doc['forecast'] = forecast_input
            validated_data['doc'] = doc

        return super().update(instance, validated_data)
















#Formulario de creación
from rest_framework import serializers
from django.db import transaction
from .models import Formulario, Pregunta, Respuesta, Empresa, Usuario

class PreguntaSerializer(serializers.ModelSerializer):
    id_pregunta = serializers.IntegerField(read_only=True)
    branching = serializers.JSONField(required=False, allow_null=True)

    class Meta:
        model = Pregunta
        fields = ['id_pregunta', 'texto', 'tipo', 'orden', 'requerido', 'opciones', 'branching']


class FormularioCreateSerializer(serializers.ModelSerializer):
    """
    Serializer para crear Formulario con preguntas anidadas.
    'empresa' y 'usuario' son opcionales: la vista puede asignarlos desde request.user.
    """
    empresa = serializers.PrimaryKeyRelatedField(queryset=Empresa.objects.all(), required=False, allow_null=True)
    usuario = serializers.PrimaryKeyRelatedField(queryset=Usuario.objects.all(), required=False, allow_null=True)
    preguntas = PreguntaSerializer(many=True, required=False)

    class Meta:
        model = Formulario
        fields = ['id_formulario', 'empresa', 'usuario', 'nombre', 'descripcion', 'slug', 'preguntas']
        read_only_fields = ['id_formulario', 'slug']

    def create(self, validated_data):
        preguntas_data = validated_data.pop('preguntas', [])
        with transaction.atomic():
            formulario = Formulario.objects.create(**validated_data)
            for i, p in enumerate(preguntas_data):
                Pregunta.objects.create(
                    formulario=formulario,
                    texto=p.get('texto'),
                    tipo=p.get('tipo'),
                    orden=p.get('orden', i),
                    requerido=p.get('requerido', False),
                    opciones=p.get('opciones', None),
                    branching=p.get('branching', None),
                )
        return formulario


class FormularioDetailSerializer(serializers.ModelSerializer):
    preguntas = PreguntaSerializer(many=True, read_only=True)

    class Meta:
        model = Formulario
        fields = ['id_formulario', 'empresa', 'usuario', 'nombre', 'descripcion', 'slug', 'fecha_creacion', 'preguntas']


class RespuestaSerializer(serializers.ModelSerializer):
    id_respuesta = serializers.IntegerField(read_only=True)

    class Meta:
        model = Respuesta
        fields = ['id_respuesta', 'formulario', 'data', 'fecha']
        read_only_fields = ['id_respuesta', 'fecha']








#CHATBOT DE N8N# myapp/serializers.py
# myapp/serializers.py
# myapp/serializers.py
# myapp/serializers.py
from rest_framework import serializers

class WebhookProxySerializer(serializers.Serializer):
    chatInput = serializers.CharField()
    sessionId = serializers.CharField()
    # ahora table es requerido: el frontend DEBE enviar la tabla seleccionada
    table = serializers.CharField()
    # NO aceptamos empresaId desde el cliente por seguridad
