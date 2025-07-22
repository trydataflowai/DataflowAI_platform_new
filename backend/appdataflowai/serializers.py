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
from rest_framework import serializers
from .models import (
    Empresa,
    Categoria,
    Estado,
    TipoPlan,
    Usuario,
    PermisoAcceso
)

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
            'estado',
        ]

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
        fields = '__all__'