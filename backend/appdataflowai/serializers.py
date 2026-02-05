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
# serializers.py
from rest_framework import serializers
from .models import Usuario, Producto, DetalleProducto, EmpresaDashboard, DashboardContext

class AsgDashboardUsuarioListSerializer(serializers.ModelSerializer):
    area = serializers.CharField(source='id_area.area_trabajo', read_only=True)
    id_empresa = serializers.IntegerField(source='id_empresa.id_empresa', read_only=True)

    class Meta:
        model = Usuario
        fields = ('id_usuario', 'nombres', 'apellidos', 'correo', 'area', 'id_empresa')


class AsgDashboardProductoSerializer(serializers.ModelSerializer):
    area = serializers.CharField(source='id_area.area_trabajo', read_only=True)
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


class DashboardContextSerializer(serializers.ModelSerializer):
    class Meta:
        model = DashboardContext
        fields = (
            'id_registro',
            'session_id',
            'dashboard_name',
            'dashboard_context',
            'tables',
            'formularios_id',
            'empresa_id',
        )


class AsgDashboardDetalleProductoSerializer(serializers.ModelSerializer):
    # Devuelve info simple del producto en la asignación
    producto = AsgDashboardProductoSerializer(source='id_producto', read_only=True)
    # Devuelve el DashboardContext asociado (si existe) para la empresa del usuario asignado
    dashboard_context = serializers.SerializerMethodField()

    class Meta:
        model = DetalleProducto
        fields = ('id_usuario', 'id_producto', 'producto', 'dashboard_context')

    def get_dashboard_context(self, obj):
        # obj.id_usuario -> Usuario instance
        # obj.id_producto -> Producto instance
        usuario = getattr(obj, 'id_usuario', None)
        producto = getattr(obj, 'id_producto', None)
        if not usuario or not producto:
            return None
        empresa = getattr(usuario, 'id_empresa', None)
        if not empresa:
            return None
        empresa_id = getattr(empresa, 'id_empresa', None) or empresa  # por si id_empresa es int o FK
        if empresa_id is None:
            return None

        qs = DashboardContext.objects.filter(dashboard_name=producto.producto, empresa_id=empresa_id)
        if not qs.exists():
            return None
        return DashboardContextSerializer(qs.first()).data










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
from rest_framework import serializers
from .models import DashboardContext

class DashboardContextSerializer(serializers.ModelSerializer):
    class Meta:
        model = DashboardContext
        fields = (
            "id_registro",
            "session_id",
            "dashboard_name",
            "dashboard_context",
            "tables",
            "formularios_id",
            "empresa_id",
        )

class WebhookProxySerializer(serializers.Serializer):
    """
    El body que el frontend enviará para pedir que se ejecute el webhook.
    - id_registro: integer (id del DashboardContext a usar)
    - chatInput: string (lo que escribió el usuario; NO se leerá desde la BD)
    """
    id_registro = serializers.IntegerField()
    chatInput = serializers.CharField()




# LISTADO DE LOS FORMUYLARIOS
# your_app/serializers.py
from rest_framework import serializers
from .models import Formulario

class ListadoFormulariosSerializer(serializers.ModelSerializer):
    empresa_id = serializers.IntegerField(source='empresa.id_empresa', read_only=True)
    usuario_id = serializers.IntegerField(source='usuario.id_usuario', read_only=True)
    fecha_creacion = serializers.DateTimeField(format="%Y-%m-%d %H:%M:%S", read_only=True)

    class Meta:
        model = Formulario
        fields = [
            'id_formulario',
            'nombre',
            'descripcion',
            'slug',
            'fecha_creacion',
            'empresa_id',
            'usuario_id',
        ]






#Editar formulario
# your_app/serializers.py
from rest_framework import serializers
from .models import Formulario, Pregunta

class EditPreguntaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pregunta
        fields = [
            'id_pregunta',
            'texto',
            'tipo',
            'orden',
            'requerido',
            'opciones',
            'branching',
        ]
        read_only_fields = ['id_pregunta']

class FormularioEditSerializer(serializers.ModelSerializer):
    preguntas = EditPreguntaSerializer(many=True, read_only=True)
    empresa_id = serializers.IntegerField(source='empresa.id_empresa', read_only=True)
    usuario_id = serializers.IntegerField(source='usuario.id_usuario', read_only=True)
    fecha_creacion = serializers.DateTimeField(format="%Y-%m-%d %H:%M:%S", read_only=True)

    class Meta:
        model = Formulario
        fields = [
            'id_formulario',
            'nombre',
            'descripcion',
            'slug',
            'fecha_creacion',
            'empresa_id',
            'usuario_id',
            'preguntas',
        ]






#Serializador para dashboard de ventas de formulario de ventas espacio yu 
# backend/appdataflowai/serializers.py
# backend/appdataflowai/serializers.py
import random
from rest_framework import serializers
from .models import Respuesta

class DashboardFormsVentasPuntoVentaSAerializer(serializers.ModelSerializer):
    organized = serializers.SerializerMethodField()

    class Meta:
        model = Respuesta
        fields = (
            'id_respuesta',
            'fecha',
            'organized',
        )

    def _generate_ingresos(self, obj, marca_nombre):
        """
        Genera cantidad vendida y dinero vendido de forma determinista
        usando obj.id_respuesta como semilla para reproducibilidad.
        """
        seed = getattr(obj, 'id_respuesta', None) or 0
        rnd = random.Random(seed)

        cantidad = rnd.randint(1, 20)

        # rango unitario por marca (valores aproximados en COP)
        if marca_nombre == "Apple":
            unit_low, unit_high = 1200000, 4200000
        elif marca_nombre == "Xiaomi":
            unit_low, unit_high = 250000, 1800000
        elif marca_nombre == "Motorola":
            unit_low, unit_high = 180000, 900000
        elif marca_nombre == "Zte":
            unit_low, unit_high = 120000, 800000
        else:
            unit_low, unit_high = 100000, 1000000

        unit_price = rnd.randint(unit_low, unit_high)
        dinero = cantidad * unit_price

        return {
            "cantidad vendida": int(cantidad),
            "dinero vendido": int(dinero)
        }

    def _override_ingresos_from_data(self, ingresos, data):
        """
        Si en data vienen valores explícitos, los usa para sobreescribir
        los generados. Soporta varias variantes de nombres comunes.
        """
        if not isinstance(data, dict):
            return ingresos

        # Posibles claves que el formulario puede usar (ordénadas por prioridad)
        qty_keys = ["Cantidad vendida", "cantidad vendida", "Cantidad", "cantidad"]
        money_keys = ["Dinero vendido", "dinero vendido", "Dinero", "dinero"]

        # Override cantidad si existe en data
        for k in qty_keys:
            if k in data and data[k] not in (None, ""):
                try:
                    ingresos["cantidad vendida"] = int(float(data[k]))
                except (ValueError, TypeError):
                    # si no se puede convertir, lo ignoramos
                    pass
                break

        # Override dinero si existe en data
        for k in money_keys:
            if k in data and data[k] not in (None, ""):
                try:
                    ingresos["dinero vendido"] = int(float(data[k]))
                except (ValueError, TypeError):
                    pass
                break

        return ingresos

    def get_organized(self, obj):
        data = getattr(obj, 'data', {}) or {}

        # =========================
        # REGIÓN Y PUNTO
        # =========================
        region = data.get("Seleccione la región:")
        punto = None
        if region == "Zona sur:":
            punto = data.get("Seleccione el punto de venta zona sur:")
        elif region == "Zona norte:":
            punto = data.get("Seleccione el punto de venta zona norte:")

        regional = {
            "Seleccione la región:": region,
            "punto": punto
        }

        # =========================
        # MARCA Y PRODUCTO
        # =========================
        marca_nombre = data.get("Seleccione la marca:")

        producto = None
        if marca_nombre == "Xiaomi":
            producto = data.get("Seleccione celular Xiaomi")
        elif marca_nombre == "Zte":
            producto = data.get("Seleccione celular Zte")
        elif marca_nombre == "Motorola":
            producto = data.get("Seleccione celular Motorola")
        elif marca_nombre == "Apple":
            producto = data.get("Seleccione celular Apple")

        marca = {
            "Seleccione la marca:": marca_nombre,
            "productos": {}
        }

        if marca_nombre:
            marca["productos"][marca_nombre] = {
                f"Seleccione celular {marca_nombre}": producto
            }

        # =========================
        # OTROS CAMPOS
        # =========================
        otros = {
            "Nombre asesor:": data.get("Nombre asesor:"),
            "Fecha venta:": data.get("Fecha venta:"),
            "Observación (opcional)": data.get("Observación (opcional)"),
        }

        # =========================
        # INGRESOS: generar y luego sobreescribir si vienen en data
        # =========================
        ingresos = self._generate_ingresos(obj, marca_nombre)
        ingresos = self._override_ingresos_from_data(ingresos, data)

        return {
            "regional": regional,
            "marca": marca,
            "otros": otros,
            "Ingresos": ingresos
        }












# app/serializers.py
from rest_framework import serializers
from .models import DashDfTiendas

class DashDfTiendasSerializer(serializers.ModelSerializer):
    # id_empresa será read-only — se asigna desde el token en el backend
    id_empresa = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = DashDfTiendas
        fields = [
            'id_tienda',
            'id_empresa',
            'nombre_tienda',
            'direccion_tienda',
            'horario_tienda',
            'ciudad',
            'telefono',
            'email',
            'canal',
            'estado',
        ]
        read_only_fields = ['id_tienda', 'id_empresa']



# app/serializers.py
from rest_framework import serializers
from .models import DashDfProductos

class DashVeinteProductSerializer(serializers.ModelSerializer):
    id_empresa = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = DashDfProductos
        fields = [
            'id_producto',
            'id_empresa',
            'nombre_producto',
            'categoria',
            'marca',
            'valor_producto',
        ]
        read_only_fields = ['id_producto', 'id_empresa']



# app/serializers.py
from rest_framework import serializers
from .models import DashDfInventarios

class DashVeinteInventarioSerializer(serializers.ModelSerializer):
    id_empresa = serializers.PrimaryKeyRelatedField(read_only=True)
    tienda_nombre = serializers.SerializerMethodField(read_only=True)
    producto_nombre = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = DashDfInventarios
        fields = [
            'id_registro',
            'id_empresa',
            'id_tienda',
            'tienda_nombre',
            'id_producto',
            'producto_nombre',
            'inventario_cantidad',
        ]
        read_only_fields = ['id_registro', 'id_empresa', 'tienda_nombre', 'producto_nombre']

    def get_tienda_nombre(self, obj):
        return getattr(obj.id_tienda, 'nombre_tienda', None)

    def get_producto_nombre(self, obj):
        return getattr(obj.id_producto, 'nombre_producto', None)




# app/serializers.py
from rest_framework import serializers
from .models import DashDfVentas

class DashVeinteVentaSerializer(serializers.ModelSerializer):
    id_empresa = serializers.PrimaryKeyRelatedField(read_only=True)
    tienda_nombre = serializers.SerializerMethodField(read_only=True)
    producto_nombre = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = DashDfVentas
        fields = [
            'id_registro',
            'id_empresa',
            'id_tienda',
            'tienda_nombre',
            'id_producto',
            'producto_nombre',
            'cantidad_vendida',
            'dinero_vendido',
            'fecha_venta',
        ]
        read_only_fields = ['id_registro', 'id_empresa', 'tienda_nombre', 'producto_nombre']

    def get_tienda_nombre(self, obj):
        return getattr(obj.id_tienda, 'nombre_tienda', None)

    def get_producto_nombre(self, obj):
        return getattr(obj.id_producto, 'nombre_producto', None)


# app/serializers.py
from rest_framework import serializers
from .models import DashDfMetas

class DashVeinteMetaSerializer(serializers.ModelSerializer):
    id_empresa = serializers.PrimaryKeyRelatedField(read_only=True)
    tienda_nombre = serializers.SerializerMethodField(read_only=True)
    producto_nombre = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = DashDfMetas
        fields = [
            'id_registro',
            'id_empresa',
            'id_tienda',
            'tienda_nombre',
            'id_producto',
            'producto_nombre',
            'meta_cantidad',
            'meta_dinero',
            'fecha_meta',
        ]
        read_only_fields = ['id_registro', 'id_empresa', 'tienda_nombre', 'producto_nombre']

    def get_tienda_nombre(self, obj):
        return getattr(obj.id_tienda, 'nombre_tienda', None)

    def get_producto_nombre(self, obj):
        return getattr(obj.id_producto, 'nombre_producto', None)






















# appdataflowai/serializers.py
from rest_framework import serializers
from django.db import transaction
from .models import UsuariosBrokers, Usuario

class UsuarioMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ('id_usuario', 'nombres', 'apellidos', 'correo')
        read_only_fields = ('id_usuario',)

    def validate_correo(self, value):
        user_id = self.instance.id_usuario if self.instance else None
        qs = Usuario.objects.filter(correo=value)
        if user_id:
            qs = qs.exclude(id_usuario=user_id)
        if qs.exists():
            raise serializers.ValidationError("El correo ya está en uso por otro usuario.")
        return value


class UsuariosBrokersSerializer(serializers.ModelSerializer):
    id_usuario = serializers.PrimaryKeyRelatedField(queryset=Usuario.objects.all())
    usuario = UsuarioMiniSerializer(source='id_usuario', read_only=True)

    class Meta:
        model = UsuariosBrokers
        fields = (
            'id_broker',
            'id_usuario',
            'usuario',
            'numero_telefono',
            'pais_residencia',
            'entidad_financiera',
            'numero_cuenta',
            'tipo_cuenta',
            'codigo_swift',
            'tipo_identificacion',
            'numero_identificacion',
        )
        read_only_fields = ('id_broker', 'usuario')


class EditarPerfilBrokersSerializer(serializers.Serializer):
    # Usuario
    nombres = serializers.CharField(required=False, allow_blank=False, max_length=200)
    apellidos = serializers.CharField(required=False, allow_blank=True, max_length=200)
    correo = serializers.EmailField(required=False, allow_blank=False, max_length=255)

    # Contraseña (texto plano según tu requerimiento)
    contrasena_actual = serializers.CharField(required=False, write_only=True, allow_blank=False, max_length=255)
    contrasena_nueva = serializers.CharField(required=False, write_only=True, allow_blank=False, max_length=255)

    # Broker
    numero_telefono = serializers.CharField(required=False, allow_blank=True, max_length=30)
    pais_residencia = serializers.CharField(required=False, allow_blank=True, max_length=100)
    entidad_financiera = serializers.CharField(required=False, allow_blank=True, max_length=100)
    numero_cuenta = serializers.CharField(required=False, allow_blank=True, max_length=100)
    tipo_cuenta = serializers.CharField(required=False, allow_blank=True, max_length=10)
    codigo_swift = serializers.CharField(required=False, allow_blank=True, max_length=50)
    tipo_identificacion = serializers.CharField(required=False, allow_blank=True, max_length=10)
    numero_identificacion = serializers.CharField(required=False, allow_blank=True, max_length=60)

    def validate_correo(self, value):
        user_id = self.context.get('id_usuario')
        qs = Usuario.objects.filter(correo=value)
        if user_id:
            qs = qs.exclude(id_usuario=user_id)
        if qs.exists():
            raise serializers.ValidationError("El correo ya está en uso.")
        return value

    def validate(self, attrs):
        """
        Si se solicita cambiar contraseña (contrasena_nueva), exigir contrasena_actual y validar que coincida.
        """
        id_usuario = self.context.get('id_usuario')
        if not id_usuario:
            raise serializers.ValidationError("Falta contexto de usuario (id_usuario).")

        # Si quieren cambiar contraseña
        new_pw = attrs.get('contrasena_nueva')
        if new_pw is not None:
            old_pw = attrs.get('contrasena_actual')
            if not old_pw:
                raise serializers.ValidationError({"contrasena_actual": "La contraseña actual es requerida para cambiar la contraseña."})
            # comprobar que la contrasena_actual coincida con la que está en la BD (texto plano)
            try:
                usuario = Usuario.objects.get(id_usuario=id_usuario)
            except Usuario.DoesNotExist:
                raise serializers.ValidationError("Usuario no encontrado al validar contraseña.")

            if usuario.contrasena != old_pw:
                raise serializers.ValidationError({"contrasena_actual": "Contraseña actual incorrecta."})

            # Opcional: validaciones de longitud mínima
            if len(new_pw) < 4:
                raise serializers.ValidationError({"contrasena_nueva": "La contraseña nueva debe tener al menos 4 caracteres."})
        return attrs

    def update_or_create(self, id_usuario: int):
        """
        Actualiza Usuario y UsuariosBrokers. Si contrasena_nueva está presente, actualiza usuario.contrasena (texto plano).
        Retorna (usuario_obj, broker_obj).
        """
        data = self.validated_data
        with transaction.atomic():
            usuario = Usuario.objects.select_for_update().get(id_usuario=id_usuario)

            # Actualizar campos del usuario
            usuario_changed = False
            if 'nombres' in data:
                usuario.nombres = data['nombres']
                usuario_changed = True
            if 'apellidos' in data:
                usuario.apellidos = data['apellidos']
                usuario_changed = True
            if 'correo' in data:
                usuario.correo = data['correo']
                usuario_changed = True

            # Actualizar contraseña en texto plano si viene contrasena_nueva
            if 'contrasena_nueva' in data:
                usuario.contrasena = data['contrasena_nueva']
                usuario_changed = True

            if usuario_changed:
                usuario.save()

            # Obtener o crear broker asociado
            broker, created = UsuariosBrokers.objects.get_or_create(id_usuario=usuario, defaults={
                'numero_telefono': data.get('numero_telefono', ''),
                'pais_residencia': data.get('pais_residencia', ''),
                'entidad_financiera': data.get('entidad_financiera', ''),
                'numero_cuenta': data.get('numero_cuenta', ''),
                'tipo_cuenta': data.get('tipo_cuenta', ''),
                'codigo_swift': data.get('codigo_swift', ''),
                'tipo_identificacion': data.get('tipo_identificacion', ''),
                'numero_identificacion': data.get('numero_identificacion', ''),
            })

            if not created:
                broker_changed = False
                for fld in [
                    'numero_telefono', 'pais_residencia', 'entidad_financiera',
                    'numero_cuenta', 'tipo_cuenta', 'codigo_swift',
                    'tipo_identificacion', 'numero_identificacion'
                ]:
                    if fld in data:
                        setattr(broker, fld, data[fld])
                        broker_changed = True
                if broker_changed:
                    broker.save()

        return usuario, broker





# appdataflowai/serializers.py
from rest_framework import serializers
from .models import LeadsBrokers, UsuariosBrokers, Usuario

class UsuarioMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ('id_usuario', 'nombres', 'apellidos', 'correo')
        read_only_fields = ('id_usuario',)

class UsuariosBrokersMiniSerializer(serializers.ModelSerializer):
    # incluye mini info del usuario dueño del broker
    usuario = UsuarioMiniSerializer(source='id_usuario', read_only=True)

    class Meta:
        model = UsuariosBrokers
        fields = ('id_broker', 'usuario', 'numero_telefono', 'pais_residencia', 'entidad_financiera')
        read_only_fields = fields

class LeadsBrokersListSerializer(serializers.ModelSerializer):
    """
    Serializer para listar leads. Incluye mini info del broker y del usuario que creó el broker.
    """
    id_broker = UsuariosBrokersMiniSerializer(read_only=True)

    class Meta:
        model = LeadsBrokers
        fields = (
            'id_lead',
            'id_broker',
            'nombre_lead',
            'correo',
            'persona_de_contacto',
            'telefono',
            'pais',
            'industria',
            'tamano_empresa',
            'ticket_estimado',
            'moneda_ticket',
            'probabilidad_cierre',
            'campo_etiqueta',
            'fuente_lead',
            'comentarios',
            'etapa',
        )
        read_only_fields = fields


# appdataflowai/serializers.py
from rest_framework import serializers
from .models import LeadsBrokers, UsuariosBrokers, Usuario

class LeadsBrokersListSerializer(serializers.ModelSerializer):
    """
    Serializer para listar leads (incluye mini info del broker -> usuario).
    """
    id_broker = serializers.SerializerMethodField()

    class Meta:
        model = LeadsBrokers
        fields = (
            'id_lead',
            'id_broker',
            'nombre_lead',
            'correo',
            'persona_de_contacto',
            'telefono',
            'pais',
            'industria',
            'tamano_empresa',
            'ticket_estimado',
            'moneda_ticket',
            'probabilidad_cierre',
            'campo_etiqueta',
            'fuente_lead',
            'comentarios',
            'etapa',
        )
        read_only_fields = fields

    def get_id_broker(self, obj):
        broker = obj.id_broker
        if not broker:
            return None
        usuario = getattr(broker, 'id_usuario', None)
        return {
            'id_broker': broker.id_broker,
            'numero_telefono': broker.numero_telefono,
            'pais_residencia': broker.pais_residencia,
            'entidad_financiera': broker.entidad_financiera,
            'usuario': {
                'id_usuario': usuario.id_usuario if usuario else None,
                'nombres': usuario.nombres if usuario else None,
                'apellidos': usuario.apellidos if usuario else None,
                'correo': usuario.correo if usuario else None,
            }
        }

class LeadsBrokersCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer usado para crear/editar leads desde el frontend.
    id_broker NO es enviado por el cliente (se asigna en la vista según el usuario autenticado).
    """
    class Meta:
        model = LeadsBrokers
        # NO incluir id_broker como writable
        fields = (
            'id_lead',
            'nombre_lead',
            'correo',
            'persona_de_contacto',
            'telefono',
            'pais',
            'industria',
            'tamano_empresa',
            'ticket_estimado',
            'moneda_ticket',
            'probabilidad_cierre',
            'campo_etiqueta',
            'fuente_lead',
            'comentarios',
            'etapa',
        )
        read_only_fields = ('id_lead',)
