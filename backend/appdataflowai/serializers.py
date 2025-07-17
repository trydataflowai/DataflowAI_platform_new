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
