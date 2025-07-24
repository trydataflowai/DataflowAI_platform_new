# appdataflowai/serializers.py
from rest_framework import serializers
from .models import Producto

class ProductoSerializer(serializers.ModelSerializer):
    estado = serializers.CharField(source='id_estado.estado')  # Mostrar nombre del estado

    class Meta:
        model = Producto
        fields = ['id_producto', 'producto', 'estado', 'Url', 'iframe']





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
        fields = ['id_plan', 'tipo_plan']

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



