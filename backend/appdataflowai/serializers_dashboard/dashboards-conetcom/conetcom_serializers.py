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


class conetcom_prediccion_churnrate_request_serializer(serializers.Serializer):
    horizonte = serializers.IntegerField(required=False, min_value=1, max_value=12, default=3)


class conetcom_prediccion_churnrate_item_serializer(serializers.Serializer):
    ano = serializers.IntegerField()
    mes = serializers.IntegerField()
    churn_rate = serializers.FloatField()
    lower = serializers.FloatField(required=False, allow_null=True)
    upper = serializers.FloatField(required=False, allow_null=True)


class conetcom_prediccion_churnrate_response_serializer(serializers.Serializer):
    horizonte = serializers.IntegerField()
    modelo = serializers.CharField(max_length=100)
    trained_at = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    ultimo_periodo = serializers.DateField()
    base_year = serializers.IntegerField()
    base_month = serializers.IntegerField()
    historico_base = conetcom_prediccion_churnrate_item_serializer(many=True)
    predicciones = conetcom_prediccion_churnrate_item_serializer(many=True)


class conetcom_prediccion_upselling_request_serializer(serializers.Serializer):
    horizonte = serializers.IntegerField(required=False, min_value=1, max_value=12, default=3)


class conetcom_prediccion_facturacion_item_serializer(serializers.Serializer):
    ano = serializers.IntegerField()
    mes = serializers.IntegerField()
    total_facturado = serializers.FloatField()
    lower = serializers.FloatField(required=False, allow_null=True)
    upper = serializers.FloatField(required=False, allow_null=True)


class conetcom_prediccion_upselling_cliente_serializer(serializers.Serializer):
    id_cliente = serializers.CharField()
    nombre_cliente = serializers.CharField()
    oportunidad = serializers.FloatField()


class conetcom_prediccion_upselling_response_serializer(serializers.Serializer):
    horizonte = serializers.IntegerField()
    modelo = serializers.CharField(max_length=100)
    trained_at = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    ultimo_periodo = serializers.DateField()
    base_year = serializers.IntegerField()
    base_month = serializers.IntegerField()
    historico_facturacion = conetcom_prediccion_facturacion_item_serializer(many=True)
    predicciones_facturacion = conetcom_prediccion_facturacion_item_serializer(many=True)
    oportunidades = conetcom_prediccion_upselling_cliente_serializer(many=True)
