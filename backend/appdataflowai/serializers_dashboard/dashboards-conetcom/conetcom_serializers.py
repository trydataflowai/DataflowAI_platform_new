from rest_framework import serializers

from appdataflowai.models import (
    conetcom_campanas,
    conetcom_clientes,
    conetcom_facturacion,
    conetcom_interacciones_campanas,
    conetcom_pagos,
    conetcom_planes,
    conetcom_tickets_soporte,
    conetcom_trafico_consumo,
)


class conetcom_clientes_serializer(serializers.ModelSerializer):
    class Meta:
        model = conetcom_clientes
        fields = "__all__"
        extra_kwargs = {
            "id_empresa": {"required": False},
            "nombre_cliente": {"required": False, "allow_null": True, "allow_blank": True},
        }


class conetcom_planes_serializer(serializers.ModelSerializer):
    class Meta:
        model = conetcom_planes
        fields = "__all__"
        extra_kwargs = {
            "id_empresa": {"required": False},
        }


class conetcom_facturacion_serializer(serializers.ModelSerializer):
    class Meta:
        model = conetcom_facturacion
        fields = "__all__"
        extra_kwargs = {
            "id_empresa": {"required": False},
        }


class conetcom_pagos_serializer(serializers.ModelSerializer):
    class Meta:
        model = conetcom_pagos
        fields = "__all__"
        extra_kwargs = {
            "id_empresa": {"required": False},
        }


class conetcom_tickets_soporte_serializer(serializers.ModelSerializer):
    class Meta:
        model = conetcom_tickets_soporte
        fields = "__all__"
        extra_kwargs = {
            "id_empresa": {"required": False},
        }


class conetcom_trafico_consumo_serializer(serializers.ModelSerializer):
    class Meta:
        model = conetcom_trafico_consumo
        fields = "__all__"
        extra_kwargs = {
            "id_empresa": {"required": False},
        }


class conetcom_campanas_serializer(serializers.ModelSerializer):
    class Meta:
        model = conetcom_campanas
        fields = "__all__"
        extra_kwargs = {
            "id_empresa": {"required": False},
        }


class conetcom_interacciones_campanas_serializer(serializers.ModelSerializer):
    class Meta:
        model = conetcom_interacciones_campanas
        fields = "__all__"
        extra_kwargs = {
            "id_empresa": {"required": False},
        }


class conetcom_planes_import_serializer(serializers.Serializer):
    file = serializers.FileField()
    id_producto = serializers.IntegerField(required=False)


class conetcom_clientes_import_serializer(serializers.Serializer):
    file = serializers.FileField()


class conetcom_facturacion_import_serializer(serializers.Serializer):
    file = serializers.FileField()


class conetcom_pagos_import_serializer(serializers.Serializer):
    file = serializers.FileField()


class conetcom_tickets_soporte_import_serializer(serializers.Serializer):
    file = serializers.FileField()


class conetcom_trafico_consumo_import_serializer(serializers.Serializer):
    file = serializers.FileField()


class conetcom_campanas_import_serializer(serializers.Serializer):
    file = serializers.FileField()


class conetcom_interacciones_campanas_import_serializer(serializers.Serializer):
    file = serializers.FileField()
