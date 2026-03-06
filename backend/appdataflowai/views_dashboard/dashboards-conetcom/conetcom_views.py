import importlib.util
import os

from django.utils.dateparse import parse_date
from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet

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


def _load_module(module_name, file_path):
    spec = importlib.util.spec_from_file_location(module_name, file_path)
    module = importlib.util.module_from_spec(spec)
    if spec is None or spec.loader is None:
        raise ImportError(f"No se pudo cargar modulo: {file_path}")
    spec.loader.exec_module(module)
    return module


APPDATAFLOW_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
SERIALIZERS_FILE = os.path.join(
    APPDATAFLOW_DIR,
    "serializers_dashboard",
    "dashboards-conetcom",
    "conetcom_serializers.py",
)
serializers_module = _load_module(
    "appdataflowai.serializers_dashboard.dashboards_conetcom.conetcom_serializers",
    SERIALIZERS_FILE,
)

conetcom_clientes_serializer = serializers_module.conetcom_clientes_serializer
conetcom_planes_serializer = serializers_module.conetcom_planes_serializer
conetcom_facturacion_serializer = serializers_module.conetcom_facturacion_serializer
conetcom_pagos_serializer = serializers_module.conetcom_pagos_serializer
conetcom_tickets_soporte_serializer = serializers_module.conetcom_tickets_soporte_serializer
conetcom_trafico_consumo_serializer = serializers_module.conetcom_trafico_consumo_serializer
conetcom_campanas_serializer = serializers_module.conetcom_campanas_serializer
conetcom_interacciones_campanas_serializer = serializers_module.conetcom_interacciones_campanas_serializer


class _conetcom_base_views(ModelViewSet):
    permission_classes = [IsAuthenticated]
    date_field = None
    use_date_lookup = False
    ordering = None

    def _get_empresa(self):
        usuario = self.request.user
        if not hasattr(usuario, "id_usuario") or not hasattr(usuario, "id_empresa"):
            return None
        return usuario.id_empresa

    def get_queryset(self):
        empresa = self._get_empresa()
        if empresa is None:
            return self.queryset.none()

        qs = self.queryset.filter(id_empresa=empresa)

        if self.date_field:
            start = self.request.query_params.get("start")
            end = self.request.query_params.get("end")
            if start:
                start_date = parse_date(start)
                if start_date:
                    lookup = f"{self.date_field}__date__gte" if self.use_date_lookup else f"{self.date_field}__gte"
                    qs = qs.filter(**{lookup: start_date})
            if end:
                end_date = parse_date(end)
                if end_date:
                    lookup = f"{self.date_field}__date__lte" if self.use_date_lookup else f"{self.date_field}__lte"
                    qs = qs.filter(**{lookup: end_date})

        if self.ordering:
            return qs.order_by(*self.ordering)
        return qs

    def perform_create(self, serializer):
        serializer.save(id_empresa=self._get_empresa())

    def perform_update(self, serializer):
        serializer.save(id_empresa=self._get_empresa())


class conetcom_clientes_views(_conetcom_base_views):
    queryset = conetcom_clientes.objects.all()
    serializer_class = conetcom_clientes_serializer
    date_field = "fecha_alta_cliente"
    ordering = ("fecha_alta_cliente",)


class conetcom_planes_views(_conetcom_base_views):
    queryset = conetcom_planes.objects.all()
    serializer_class = conetcom_planes_serializer
    ordering = ("nombre_plan",)


class conetcom_facturacion_views(_conetcom_base_views):
    queryset = conetcom_facturacion.objects.all()
    serializer_class = conetcom_facturacion_serializer
    date_field = "fecha_emision"
    ordering = ("fecha_emision",)


class conetcom_pagos_views(_conetcom_base_views):
    queryset = conetcom_pagos.objects.all()
    serializer_class = conetcom_pagos_serializer
    date_field = "fecha_pago"
    ordering = ("fecha_pago",)


class conetcom_tickets_soporte_views(_conetcom_base_views):
    queryset = conetcom_tickets_soporte.objects.all()
    serializer_class = conetcom_tickets_soporte_serializer
    date_field = "fecha_creacion"
    use_date_lookup = True
    ordering = ("fecha_creacion",)


class conetcom_trafico_consumo_views(_conetcom_base_views):
    queryset = conetcom_trafico_consumo.objects.all()
    serializer_class = conetcom_trafico_consumo_serializer
    date_field = "fecha"
    ordering = ("fecha",)


class conetcom_campanas_views(_conetcom_base_views):
    queryset = conetcom_campanas.objects.all()
    serializer_class = conetcom_campanas_serializer
    date_field = "fecha_inicio"
    ordering = ("fecha_inicio",)


class conetcom_interacciones_campanas_views(_conetcom_base_views):
    queryset = conetcom_interacciones_campanas.objects.all()
    serializer_class = conetcom_interacciones_campanas_serializer
    date_field = "fecha_envio"
    use_date_lookup = True
    ordering = ("fecha_envio",)
