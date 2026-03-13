import importlib.util
import os
from django.utils.dateparse import parse_date, parse_datetime
from django.db import transaction
from django.db.models import Q
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet
import datetime as dt
import pandas as pd
from decimal import Decimal, InvalidOperation
from statsmodels.tsa.holtwinters import ExponentialSmoothing

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
conetcom_planes_import_serializer = serializers_module.conetcom_planes_import_serializer
conetcom_clientes_import_serializer = serializers_module.conetcom_clientes_import_serializer
conetcom_facturacion_import_serializer = serializers_module.conetcom_facturacion_import_serializer
conetcom_pagos_import_serializer = serializers_module.conetcom_pagos_import_serializer
conetcom_tickets_soporte_import_serializer = serializers_module.conetcom_tickets_soporte_import_serializer
conetcom_trafico_consumo_import_serializer = serializers_module.conetcom_trafico_consumo_import_serializer
conetcom_campanas_import_serializer = serializers_module.conetcom_campanas_import_serializer
conetcom_interacciones_campanas_import_serializer = serializers_module.conetcom_interacciones_campanas_import_serializer
conetcom_prediccion_churnrate_request_serializer = serializers_module.conetcom_prediccion_churnrate_request_serializer
conetcom_prediccion_churnrate_response_serializer = serializers_module.conetcom_prediccion_churnrate_response_serializer
conetcom_prediccion_upselling_request_serializer = serializers_module.conetcom_prediccion_upselling_request_serializer
conetcom_prediccion_upselling_response_serializer = serializers_module.conetcom_prediccion_upselling_response_serializer


def _read_import_file(file):
    if file.name.endswith(".csv"):
        return pd.read_csv(file)
    return pd.read_excel(file)


def _clean_cell(value):
    if value is None:
        return None
    try:
        if pd.isna(value):
            return None
    except Exception:
        pass
    return value


def _to_int(value):
    value = _clean_cell(value)
    if value is None or value == "":
        return None
    try:
        return int(float(value))
    except (ValueError, TypeError):
        return None


def _to_float(value):
    value = _clean_cell(value)
    if value is None or value == "":
        return None
    try:
        return float(value)
    except (ValueError, TypeError):
        return None


def _to_decimal(value):
    value = _clean_cell(value)
    if value is None or value == "":
        return None
    try:
        return Decimal(str(value))
    except (InvalidOperation, ValueError, TypeError):
        return None


def _to_date(value):
    value = _clean_cell(value)
    if value is None or value == "":
        return None
    if isinstance(value, dt.datetime):
        return value.date()
    if isinstance(value, dt.date):
        return value
    if isinstance(value, str):
        parsed = parse_date(value)
        if parsed:
            return parsed
    try:
        parsed = pd.to_datetime(value, errors="coerce")
        if pd.isna(parsed):
            return None
        return parsed.date()
    except Exception:
        return None


def _to_datetime(value):
    value = _clean_cell(value)
    if value is None or value == "":
        return None
    if isinstance(value, dt.datetime):
        return value
    if isinstance(value, dt.date):
        return dt.datetime.combine(value, dt.time.min)
    if isinstance(value, str):
        parsed = parse_datetime(value)
        if parsed:
            return parsed
    try:
        parsed = pd.to_datetime(value, errors="coerce")
        if pd.isna(parsed):
            return None
        return parsed.to_pydatetime()
    except Exception:
        return None


def _to_bool(value):
    value = _clean_cell(value)
    if value is None or value == "":
        return None
    if isinstance(value, bool):
        return value
    text = str(value).strip().lower()
    if text in {"1", "true", "t", "yes", "y", "si", "sí"}:
        return True
    if text in {"0", "false", "f", "no", "n"}:
        return False
    return None


def _to_duration(value):
    value = _clean_cell(value)
    if value is None or value == "":
        return None
    if isinstance(value, dt.timedelta):
        return value
    try:
        parsed = pd.to_timedelta(value, errors="coerce")
        if pd.isna(parsed):
            return None
        return parsed.to_pytimedelta()
    except Exception:
        return None


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

    def get_queryset(self):
        qs = super().get_queryset()
        q = self.request.query_params.get("q")
        if q:
            qs = qs.filter(
                Q(nombre_cliente__icontains=q)
                | Q(id_cliente__icontains=q)
                | Q(ciudad__icontains=q)
            )
        return qs


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


class conetcom_planes_import_views(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        serializer = conetcom_planes_import_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        file = serializer.validated_data["file"]
        id_producto_fijo = serializer.validated_data.get("id_producto")

        usuario = request.user
        empresa = getattr(usuario, "id_empresa", None)
        if empresa is None:
            return Response({"error": "Usuario sin empresa asociada."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            df = _read_import_file(file)
        except Exception as exc:
            return Response({"error": f"Archivo invalido: {str(exc)}"}, status=status.HTTP_400_BAD_REQUEST)

        required = {
            "id_plan",
            "nombre_plan",
            "velocidad_descarga_mbps",
            "velocidad_subida_mbps",
            "precio_mensual",
            "duracion_minima_contrato_meses",
            "tipo_tecnologia",
        }
        faltantes = list(required - set(df.columns))
        if faltantes:
            return Response(
                {"error": "Columnas invalidas", "faltantes": faltantes},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if id_producto_fijo is None:
            id_producto_fijo = 24

        created = 0
        updated = 0
        errores = []

        for idx, row in df.iterrows():
            id_plan = _clean_cell(row.get("id_plan"))
            nombre_plan = _clean_cell(row.get("nombre_plan"))
            velocidad_descarga_mbps = _to_float(row.get("velocidad_descarga_mbps"))
            velocidad_subida_mbps = _to_float(row.get("velocidad_subida_mbps"))
            precio_mensual = _to_decimal(row.get("precio_mensual"))
            duracion_minima_contrato_meses = _to_int(row.get("duracion_minima_contrato_meses"))
            tipo_tecnologia = _clean_cell(row.get("tipo_tecnologia"))
            id_producto = id_producto_fijo if id_producto_fijo is not None else _to_int(row.get("id_producto"))

            if not id_plan:
                errores.append(f"Fila {idx + 2}: id_plan es obligatorio")
                continue
            if not nombre_plan:
                errores.append(f"Fila {idx + 2}: nombre_plan es obligatorio")
                continue
            if velocidad_descarga_mbps is None:
                errores.append(f"Fila {idx + 2}: velocidad_descarga_mbps invalida")
                continue
            if velocidad_subida_mbps is None:
                errores.append(f"Fila {idx + 2}: velocidad_subida_mbps invalida")
                continue
            if precio_mensual is None:
                errores.append(f"Fila {idx + 2}: precio_mensual invalido")
                continue
            if duracion_minima_contrato_meses is None:
                errores.append(f"Fila {idx + 2}: duracion_minima_contrato_meses invalida")
                continue
            if not tipo_tecnologia:
                errores.append(f"Fila {idx + 2}: tipo_tecnologia es obligatorio")
                continue
            if id_producto is None:
                id_producto = 24

            defaults = {
                "id_empresa": empresa,
                "id_producto_id": id_producto,
                "nombre_plan": nombre_plan,
                "velocidad_descarga_mbps": velocidad_descarga_mbps,
                "velocidad_subida_mbps": velocidad_subida_mbps,
                "precio_mensual": precio_mensual,
                "duracion_minima_contrato_meses": duracion_minima_contrato_meses,
                "tipo_tecnologia": tipo_tecnologia,
            }

            obj, was_created = conetcom_planes.objects.update_or_create(
                id_plan=str(id_plan).strip(),
                defaults=defaults,
            )
            if was_created:
                created += 1
            else:
                updated += 1

        if errores:
            return Response(
                {"error": "Errores de validacion en plantilla", "detalles": errores[:50]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {"importados": created, "actualizados": updated},
            status=status.HTTP_201_CREATED,
        )


class conetcom_clientes_import_views(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        serializer = conetcom_clientes_import_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        file = serializer.validated_data["file"]
        usuario = request.user
        empresa = getattr(usuario, "id_empresa", None)
        if empresa is None:
            return Response({"error": "Usuario sin empresa asociada."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            df = _read_import_file(file)
        except Exception as exc:
            return Response({"error": f"Archivo invalido: {str(exc)}"}, status=status.HTTP_400_BAD_REQUEST)

        required = {
            "id_cliente",
            "fecha_alta_cliente",
            "estado_cliente",
            "tipo_cliente",
            "ciudad",
            "region_departamento",
            "canal_adquisicion",
        }
        faltantes = list(required - set(df.columns))
        if faltantes:
            return Response(
                {"error": "Columnas invalidas", "faltantes": faltantes},
                status=status.HTTP_400_BAD_REQUEST,
            )

        created = 0
        updated = 0
        errores = []

        for idx, row in df.iterrows():
            id_cliente = _clean_cell(row.get("id_cliente"))
            nombre_cliente = _clean_cell(row.get("nombre_cliente"))
            fecha_alta_cliente = _to_date(row.get("fecha_alta_cliente"))
            estado_cliente = _clean_cell(row.get("estado_cliente"))
            tipo_cliente = _clean_cell(row.get("tipo_cliente"))
            ciudad = _clean_cell(row.get("ciudad"))
            region_departamento = _clean_cell(row.get("region_departamento"))
            canal_adquisicion = _clean_cell(row.get("canal_adquisicion"))
            id_plan_contratado = _clean_cell(row.get("id_plan_contratado"))
            nombre_plan_contratado = _clean_cell(row.get("nombre_plan_contratado"))
            fecha_inicio_contrato = _to_date(row.get("fecha_inicio_contrato"))
            fecha_finalizacion_contrato = _to_date(row.get("fecha_finalizacion_contrato"))
            indicador_vip = _to_bool(row.get("indicador_vip"))

            if not id_cliente:
                errores.append(f"Fila {idx + 2}: id_cliente es obligatorio")
                continue
            if fecha_alta_cliente is None:
                errores.append(f"Fila {idx + 2}: fecha_alta_cliente invalida")
                continue
            if not estado_cliente:
                errores.append(f"Fila {idx + 2}: estado_cliente es obligatorio")
                continue
            if not tipo_cliente:
                errores.append(f"Fila {idx + 2}: tipo_cliente es obligatorio")
                continue
            if not ciudad:
                errores.append(f"Fila {idx + 2}: ciudad es obligatorio")
                continue
            if not region_departamento:
                errores.append(f"Fila {idx + 2}: region_departamento es obligatorio")
                continue
            if not canal_adquisicion:
                errores.append(f"Fila {idx + 2}: canal_adquisicion es obligatorio")
                continue

            if id_plan_contratado:
                existe_plan = conetcom_planes.objects.filter(id_plan=str(id_plan_contratado)).exists()
                if not existe_plan:
                    errores.append(f"Fila {idx + 2}: id_plan_contratado no existe")
                    continue

            defaults = {
                "id_empresa": empresa,
                "id_producto_id": 24,
                "nombre_cliente": nombre_cliente,
                "fecha_alta_cliente": fecha_alta_cliente,
                "estado_cliente": estado_cliente,
                "tipo_cliente": tipo_cliente,
                "ciudad": ciudad,
                "region_departamento": region_departamento,
                "canal_adquisicion": canal_adquisicion,
                "id_plan_contratado_id": str(id_plan_contratado).strip() if id_plan_contratado else None,
                "nombre_plan_contratado": nombre_plan_contratado,
                "fecha_inicio_contrato": fecha_inicio_contrato,
                "fecha_finalizacion_contrato": fecha_finalizacion_contrato,
                "indicador_vip": bool(indicador_vip) if indicador_vip is not None else False,
            }

            _, was_created = conetcom_clientes.objects.update_or_create(
                id_cliente=str(id_cliente).strip(),
                defaults=defaults,
            )
            if was_created:
                created += 1
            else:
                updated += 1

        if errores:
            return Response(
                {"error": "Errores de validacion en plantilla", "detalles": errores[:50]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {"importados": created, "actualizados": updated},
            status=status.HTTP_201_CREATED,
        )


class conetcom_facturacion_import_views(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        serializer = conetcom_facturacion_import_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        file = serializer.validated_data["file"]
        usuario = request.user
        empresa = getattr(usuario, "id_empresa", None)
        if empresa is None:
            return Response({"error": "Usuario sin empresa asociada."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            df = _read_import_file(file)
        except Exception as exc:
            return Response({"error": f"Archivo invalido: {str(exc)}"}, status=status.HTTP_400_BAD_REQUEST)

        required = {
            "id_factura",
            "id_cliente",
            "fecha_emision",
            "fecha_vencimiento",
            "valor_total_facturado",
            "estado_factura",
        }
        faltantes = list(required - set(df.columns))
        if faltantes:
            return Response(
                {"error": "Columnas invalidas", "faltantes": faltantes},
                status=status.HTTP_400_BAD_REQUEST,
            )

        created = 0
        updated = 0
        errores = []

        for idx, row in df.iterrows():
            id_factura = _clean_cell(row.get("id_factura"))
            id_cliente = _clean_cell(row.get("id_cliente"))
            fecha_emision = _to_date(row.get("fecha_emision"))
            fecha_vencimiento = _to_date(row.get("fecha_vencimiento"))
            valor_total_facturado = _to_decimal(row.get("valor_total_facturado"))
            estado_factura = _clean_cell(row.get("estado_factura"))
            valor_pagado = _to_decimal(row.get("valor_pagado"))
            fecha_pago = _to_date(row.get("fecha_pago"))
            metodo_pago = _clean_cell(row.get("metodo_pago"))

            if not id_factura:
                errores.append(f"Fila {idx + 2}: id_factura es obligatorio")
                continue
            if not id_cliente:
                errores.append(f"Fila {idx + 2}: id_cliente es obligatorio")
                continue
            if fecha_emision is None:
                errores.append(f"Fila {idx + 2}: fecha_emision invalida")
                continue
            if fecha_vencimiento is None:
                errores.append(f"Fila {idx + 2}: fecha_vencimiento invalida")
                continue
            if valor_total_facturado is None:
                errores.append(f"Fila {idx + 2}: valor_total_facturado invalido")
                continue
            if not estado_factura:
                errores.append(f"Fila {idx + 2}: estado_factura es obligatorio")
                continue

            if not conetcom_clientes.objects.filter(id_cliente=str(id_cliente)).exists():
                errores.append(f"Fila {idx + 2}: id_cliente no existe")
                continue

            defaults = {
                "id_empresa": empresa,
                "id_producto_id": 24,
                "id_cliente_id": str(id_cliente).strip(),
                "fecha_emision": fecha_emision,
                "fecha_vencimiento": fecha_vencimiento,
                "valor_total_facturado": valor_total_facturado,
                "estado_factura": estado_factura,
                "valor_pagado": valor_pagado,
                "fecha_pago": fecha_pago,
                "metodo_pago": metodo_pago,
            }

            _, was_created = conetcom_facturacion.objects.update_or_create(
                id_factura=str(id_factura).strip(),
                defaults=defaults,
            )
            if was_created:
                created += 1
            else:
                updated += 1

        if errores:
            return Response(
                {"error": "Errores de validacion en plantilla", "detalles": errores[:50]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {"importados": created, "actualizados": updated},
            status=status.HTTP_201_CREATED,
        )


class conetcom_pagos_import_views(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        serializer = conetcom_pagos_import_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        file = serializer.validated_data["file"]
        usuario = request.user
        empresa = getattr(usuario, "id_empresa", None)
        if empresa is None:
            return Response({"error": "Usuario sin empresa asociada."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            df = _read_import_file(file)
        except Exception as exc:
            return Response({"error": f"Archivo invalido: {str(exc)}"}, status=status.HTTP_400_BAD_REQUEST)

        required = {
            "id_pago",
            "id_cliente",
            "valor_pagado",
        }
        faltantes = list(required - set(df.columns))
        if faltantes:
            return Response(
                {"error": "Columnas invalidas", "faltantes": faltantes},
                status=status.HTTP_400_BAD_REQUEST,
            )

        created = 0
        updated = 0
        errores = []

        for idx, row in df.iterrows():
            id_pago = _clean_cell(row.get("id_pago"))
            id_cliente = _clean_cell(row.get("id_cliente"))
            id_factura_asociada = _clean_cell(row.get("id_factura_asociada"))
            fecha_pago = _to_date(row.get("fecha_pago"))
            valor_pagado = _to_decimal(row.get("valor_pagado"))
            medio_de_pago = _clean_cell(row.get("medio_de_pago"))
            estado_pago = _clean_cell(row.get("estado_pago"))
            metodo_de_pago = _clean_cell(row.get("metodo_de_pago"))

            if not id_pago:
                errores.append(f"Fila {idx + 2}: id_pago es obligatorio")
                continue
            if not id_cliente:
                errores.append(f"Fila {idx + 2}: id_cliente es obligatorio")
                continue
            if valor_pagado is None:
                errores.append(f"Fila {idx + 2}: valor_pagado invalido")
                continue

            if not conetcom_clientes.objects.filter(id_cliente=str(id_cliente)).exists():
                errores.append(f"Fila {idx + 2}: id_cliente no existe")
                continue

            if id_factura_asociada:
                existe_factura = conetcom_facturacion.objects.filter(id_factura=str(id_factura_asociada)).exists()
                if not existe_factura:
                    errores.append(f"Fila {idx + 2}: id_factura_asociada no existe")
                    continue

            defaults = {
                "id_empresa": empresa,
                "id_producto_id": 24,
                "id_cliente_id": str(id_cliente).strip(),
                "id_factura_asociada_id": str(id_factura_asociada).strip() if id_factura_asociada else None,
                "fecha_pago": fecha_pago,
                "valor_pagado": valor_pagado,
                "medio_de_pago": medio_de_pago,
                "estado_pago": estado_pago,
                "metodo_de_pago": metodo_de_pago,
            }

            _, was_created = conetcom_pagos.objects.update_or_create(
                id_pago=str(id_pago).strip(),
                defaults=defaults,
            )
            if was_created:
                created += 1
            else:
                updated += 1

        if errores:
            return Response(
                {"error": "Errores de validacion en plantilla", "detalles": errores[:50]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {"importados": created, "actualizados": updated},
            status=status.HTTP_201_CREATED,
        )


class conetcom_tickets_soporte_import_views(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        serializer = conetcom_tickets_soporte_import_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        file = serializer.validated_data["file"]
        usuario = request.user
        empresa = getattr(usuario, "id_empresa", None)
        if empresa is None:
            return Response({"error": "Usuario sin empresa asociada."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            df = _read_import_file(file)
        except Exception as exc:
            return Response({"error": f"Archivo invalido: {str(exc)}"}, status=status.HTTP_400_BAD_REQUEST)

        required = {
            "id_ticket",
            "id_cliente",
            "fecha_creacion",
            "categoria_ticket",
        }
        faltantes = list(required - set(df.columns))
        if faltantes:
            return Response(
                {"error": "Columnas invalidas", "faltantes": faltantes},
                status=status.HTTP_400_BAD_REQUEST,
            )

        created = 0
        updated = 0
        errores = []

        for idx, row in df.iterrows():
            id_ticket = _clean_cell(row.get("id_ticket"))
            id_cliente = _clean_cell(row.get("id_cliente"))
            fecha_creacion = _to_datetime(row.get("fecha_creacion"))
            fecha_cierre = _to_datetime(row.get("fecha_cierre"))
            area_agente_asignado = _clean_cell(row.get("area_agente_asignado"))
            categoria_ticket = _clean_cell(row.get("categoria_ticket"))
            prioridad = _clean_cell(row.get("prioridad"))
            indicador_incumplimiento_sla = _to_bool(row.get("indicador_incumplimiento_sla"))
            tiempo_resolucion = _to_duration(row.get("tiempo_resolucion"))

            if not id_ticket:
                errores.append(f"Fila {idx + 2}: id_ticket es obligatorio")
                continue
            if not id_cliente:
                errores.append(f"Fila {idx + 2}: id_cliente es obligatorio")
                continue
            if fecha_creacion is None:
                errores.append(f"Fila {idx + 2}: fecha_creacion invalida")
                continue
            if not categoria_ticket:
                errores.append(f"Fila {idx + 2}: categoria_ticket es obligatorio")
                continue

            if not conetcom_clientes.objects.filter(id_cliente=str(id_cliente)).exists():
                errores.append(f"Fila {idx + 2}: id_cliente no existe")
                continue

            defaults = {
                "id_empresa": empresa,
                "id_producto_id": 24,
                "id_cliente_id": str(id_cliente).strip(),
                "fecha_creacion": fecha_creacion,
                "fecha_cierre": fecha_cierre,
                "area_agente_asignado": area_agente_asignado,
                "categoria_ticket": categoria_ticket,
                "prioridad": prioridad,
                "indicador_incumplimiento_sla": bool(indicador_incumplimiento_sla)
                if indicador_incumplimiento_sla is not None
                else False,
                "tiempo_resolucion": tiempo_resolucion,
            }

            _, was_created = conetcom_tickets_soporte.objects.update_or_create(
                id_ticket=str(id_ticket).strip(),
                defaults=defaults,
            )
            if was_created:
                created += 1
            else:
                updated += 1

        if errores:
            return Response(
                {"error": "Errores de validacion en plantilla", "detalles": errores[:50]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {"importados": created, "actualizados": updated},
            status=status.HTTP_201_CREATED,
        )


class conetcom_trafico_consumo_import_views(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        serializer = conetcom_trafico_consumo_import_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        file = serializer.validated_data["file"]
        usuario = request.user
        empresa = getattr(usuario, "id_empresa", None)
        if empresa is None:
            return Response({"error": "Usuario sin empresa asociada."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            df = _read_import_file(file)
        except Exception as exc:
            return Response({"error": f"Archivo invalido: {str(exc)}"}, status=status.HTTP_400_BAD_REQUEST)

        required = {
            "id_registro",
            "id_cliente",
            "fecha",
        }
        faltantes = list(required - set(df.columns))
        if faltantes:
            return Response(
                {"error": "Columnas invalidas", "faltantes": faltantes},
                status=status.HTTP_400_BAD_REQUEST,
            )

        created = 0
        updated = 0
        errores = []

        for idx, row in df.iterrows():
            id_registro = _clean_cell(row.get("id_registro"))
            id_cliente = _clean_cell(row.get("id_cliente"))
            fecha = _to_date(row.get("fecha"))
            consumo_descarga_gb = _to_float(row.get("consumo_descarga_gb"))
            consumo_subida_gb = _to_float(row.get("consumo_subida_gb"))
            velocidad_pico_mbps = _to_float(row.get("velocidad_pico_mbps"))
            velocidad_promedio_mbps = _to_float(row.get("velocidad_promedio_mbps"))
            numero_sesiones = _to_int(row.get("numero_sesiones"))

            if not id_registro:
                errores.append(f"Fila {idx + 2}: id_registro es obligatorio")
                continue
            if not id_cliente:
                errores.append(f"Fila {idx + 2}: id_cliente es obligatorio")
                continue
            if fecha is None:
                errores.append(f"Fila {idx + 2}: fecha invalida")
                continue

            if not conetcom_clientes.objects.filter(id_cliente=str(id_cliente)).exists():
                errores.append(f"Fila {idx + 2}: id_cliente no existe")
                continue

            defaults = {
                "id_empresa": empresa,
                "id_producto_id": 24,
                "id_cliente_id": str(id_cliente).strip(),
                "fecha": fecha,
                "consumo_descarga_gb": consumo_descarga_gb,
                "consumo_subida_gb": consumo_subida_gb,
                "velocidad_pico_mbps": velocidad_pico_mbps,
                "velocidad_promedio_mbps": velocidad_promedio_mbps,
                "numero_sesiones": numero_sesiones,
            }

            _, was_created = conetcom_trafico_consumo.objects.update_or_create(
                id_registro=str(id_registro).strip(),
                defaults=defaults,
            )
            if was_created:
                created += 1
            else:
                updated += 1

        if errores:
            return Response(
                {"error": "Errores de validacion en plantilla", "detalles": errores[:50]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {"importados": created, "actualizados": updated},
            status=status.HTTP_201_CREATED,
        )


class conetcom_campanas_import_views(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        serializer = conetcom_campanas_import_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        file = serializer.validated_data["file"]
        usuario = request.user
        empresa = getattr(usuario, "id_empresa", None)
        if empresa is None:
            return Response({"error": "Usuario sin empresa asociada."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            df = _read_import_file(file)
        except Exception as exc:
            return Response({"error": f"Archivo invalido: {str(exc)}"}, status=status.HTTP_400_BAD_REQUEST)

        required = {
            "id_campana",
            "nombre_campana",
        }
        faltantes = list(required - set(df.columns))
        if faltantes:
            return Response(
                {"error": "Columnas invalidas", "faltantes": faltantes},
                status=status.HTTP_400_BAD_REQUEST,
            )

        created = 0
        updated = 0
        errores = []

        for idx, row in df.iterrows():
            id_campana = _clean_cell(row.get("id_campana"))
            nombre_campana = _clean_cell(row.get("nombre_campana"))
            fecha_inicio = _to_date(row.get("fecha_inicio"))
            fecha_fin = _to_date(row.get("fecha_fin"))
            canal = _clean_cell(row.get("canal"))
            segmento_objetivo = _clean_cell(row.get("segmento_objetivo"))

            if not id_campana:
                errores.append(f"Fila {idx + 2}: id_campana es obligatorio")
                continue
            if not nombre_campana:
                errores.append(f"Fila {idx + 2}: nombre_campana es obligatorio")
                continue

            defaults = {
                "id_empresa": empresa,
                "id_producto_id": 24,
                "nombre_campana": nombre_campana,
                "fecha_inicio": fecha_inicio,
                "fecha_fin": fecha_fin,
                "canal": canal,
                "segmento_objetivo": segmento_objetivo,
            }

            _, was_created = conetcom_campanas.objects.update_or_create(
                id_campana=str(id_campana).strip(),
                defaults=defaults,
            )
            if was_created:
                created += 1
            else:
                updated += 1

        if errores:
            return Response(
                {"error": "Errores de validacion en plantilla", "detalles": errores[:50]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {"importados": created, "actualizados": updated},
            status=status.HTTP_201_CREATED,
        )


class conetcom_interacciones_campanas_import_views(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        serializer = conetcom_interacciones_campanas_import_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        file = serializer.validated_data["file"]
        usuario = request.user
        empresa = getattr(usuario, "id_empresa", None)
        if empresa is None:
            return Response({"error": "Usuario sin empresa asociada."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            df = _read_import_file(file)
        except Exception as exc:
            return Response({"error": f"Archivo invalido: {str(exc)}"}, status=status.HTTP_400_BAD_REQUEST)

        required = {
            "id_interaccion",
            "id_campana",
            "id_cliente",
        }
        faltantes = list(required - set(df.columns))
        if faltantes:
            return Response(
                {"error": "Columnas invalidas", "faltantes": faltantes},
                status=status.HTTP_400_BAD_REQUEST,
            )

        created = 0
        updated = 0
        errores = []

        for idx, row in df.iterrows():
            id_interaccion = _clean_cell(row.get("id_interaccion"))
            id_campana = _clean_cell(row.get("id_campana"))
            id_cliente = _clean_cell(row.get("id_cliente"))
            fecha_envio = _to_datetime(row.get("fecha_envio"))
            abrio_mensaje = _to_bool(row.get("abrio_mensaje"))
            hizo_clic = _to_bool(row.get("hizo_clic"))
            genero_conversion = _to_bool(row.get("genero_conversion"))
            ingresos_generados = _to_decimal(row.get("ingresos_generados"))

            if not id_interaccion:
                errores.append(f"Fila {idx + 2}: id_interaccion es obligatorio")
                continue
            if not id_campana:
                errores.append(f"Fila {idx + 2}: id_campana es obligatorio")
                continue
            if not id_cliente:
                errores.append(f"Fila {idx + 2}: id_cliente es obligatorio")
                continue

            if not conetcom_campanas.objects.filter(id_campana=str(id_campana)).exists():
                errores.append(f"Fila {idx + 2}: id_campana no existe")
                continue
            if not conetcom_clientes.objects.filter(id_cliente=str(id_cliente)).exists():
                errores.append(f"Fila {idx + 2}: id_cliente no existe")
                continue

            defaults = {
                "id_empresa": empresa,
                "id_producto_id": 24,
                "id_campana_id": str(id_campana).strip(),
                "id_cliente_id": str(id_cliente).strip(),
                "fecha_envio": fecha_envio,
                "abrio_mensaje": bool(abrio_mensaje) if abrio_mensaje is not None else False,
                "hizo_clic": bool(hizo_clic) if hizo_clic is not None else False,
                "genero_conversion": bool(genero_conversion) if genero_conversion is not None else False,
                "ingresos_generados": ingresos_generados,
            }

            _, was_created = conetcom_interacciones_campanas.objects.update_or_create(
                id_interaccion=str(id_interaccion).strip(),
                defaults=defaults,
            )
            if was_created:
                created += 1
            else:
                updated += 1

        if errores:
            return Response(
                {"error": "Errores de validacion en plantilla", "detalles": errores[:50]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {"importados": created, "actualizados": updated},
            status=status.HTTP_201_CREATED,
        )


class conetcom_prediccion_churnrate_view(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = conetcom_prediccion_churnrate_request_serializer(data=request.query_params)
        if serializer.is_valid():
            horizonte = serializer.validated_data.get("horizonte", 3)
        else:
            horizonte = 3

        if horizonte not in {1, 3, 6}:
            horizonte = 3

        usuario = request.user
        empresa = getattr(usuario, "id_empresa", None)
        if empresa is None:
            return Response({"error": "Usuario sin empresa asociada."}, status=status.HTTP_400_BAD_REQUEST)

        qs = conetcom_clientes.objects.filter(id_empresa=empresa).values(
            "fecha_alta_cliente",
            "fecha_finalizacion_contrato",
            "estado_cliente",
        )
        if not qs.exists():
            return Response(
                {"error": "No hay datos de clientes para calcular churn."},
                status=status.HTTP_404_NOT_FOUND,
            )

        df = pd.DataFrame(list(qs))
        if df.empty:
            return Response(
                {"error": "No hay datos suficientes para calcular churn."},
                status=status.HTTP_404_NOT_FOUND,
            )

        df["fecha_alta_cliente"] = pd.to_datetime(df["fecha_alta_cliente"], errors="coerce")
        df["fecha_finalizacion_contrato"] = pd.to_datetime(df["fecha_finalizacion_contrato"], errors="coerce")
        df = df[df["fecha_alta_cliente"].notna()].copy()
        if df.empty:
            return Response(
                {"error": "No hay fechas validas para calcular churn."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        last_dates = df[["fecha_alta_cliente", "fecha_finalizacion_contrato"]].max()
        last_date = last_dates.max()
        if pd.isna(last_date):
            return Response(
                {"error": "No se encontro una fecha valida para la serie."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        min_date = df["fecha_alta_cliente"].min()
        start_month = pd.Timestamp(year=min_date.year, month=min_date.month, day=1)
        end_month = pd.Timestamp(year=last_date.year, month=last_date.month, day=1)
        month_starts = pd.date_range(start=start_month, end=end_month, freq="MS")

        estado_cancelado = (
            df["estado_cliente"].fillna("").astype(str).str.strip().str.lower() == "cancelado"
        )
        fecha_alta = df["fecha_alta_cliente"]
        fecha_fin = df["fecha_finalizacion_contrato"]

        series_vals = []
        for month_start in month_starts:
            next_month = month_start + pd.offsets.MonthBegin(1)
            activos_inicio = (fecha_alta < month_start) & ((fecha_fin.isna()) | (fecha_fin >= month_start))
            cancelados_mes = estado_cancelado & (fecha_fin >= month_start) & (fecha_fin < next_month)
            activos_count = int(activos_inicio.sum())
            cancelados_count = int(cancelados_mes.sum())
            churn_rate = (cancelados_count / activos_count) * 100 if activos_count > 0 else 0.0
            series_vals.append((month_start, churn_rate))

        series_index = [item[0] for item in series_vals]
        series_data = pd.Series([item[1] for item in series_vals], index=series_index).astype(float)

        modelo = "naive_mean"
        sigma = float(series_data.std(ddof=1)) if len(series_data) > 1 else 0.0
        forecast_vals = None

        if len(series_data) >= 2:
            try:
                seasonal = "add" if len(series_data) >= 24 else None
                seasonal_periods = 12 if seasonal else None
                model = ExponentialSmoothing(
                    series_data,
                    trend="add",
                    seasonal=seasonal,
                    seasonal_periods=seasonal_periods,
                    initialization_method="estimated",
                )
                fit = model.fit(optimized=True)
                forecast_vals = fit.forecast(steps=horizonte)
                residuals = fit.resid
                sigma = float(residuals.std(ddof=1)) if len(residuals) > 1 else sigma
                modelo = "ExponentialSmoothing_hw" if seasonal else "ExponentialSmoothing_trend"
            except Exception:
                try:
                    model = ExponentialSmoothing(
                        series_data,
                        trend="add",
                        seasonal=None,
                        initialization_method="estimated",
                    )
                    fit = model.fit(optimized=True)
                    forecast_vals = fit.forecast(steps=horizonte)
                    residuals = fit.resid
                    sigma = float(residuals.std(ddof=1)) if len(residuals) > 1 else sigma
                    modelo = "ExponentialSmoothing_trend"
                except Exception:
                    forecast_vals = None

        if forecast_vals is None:
            last_value = float(series_data.iloc[-1]) if len(series_data) else 0.0
            forecast_vals = [last_value for _ in range(horizonte)]

        last_index = series_data.index.max()
        preds = []
        for i, val in enumerate(forecast_vals, start=1):
            periodo = (last_index + pd.DateOffset(months=i)).to_pydatetime().date().replace(day=1)
            pred_val = float(val)
            pred_val = max(0.0, min(100.0, pred_val))
            lower = pred_val - 1.96 * sigma
            upper = pred_val + 1.96 * sigma
            preds.append(
                {
                    "ano": periodo.year,
                    "mes": periodo.month,
                    "churn_rate": round(pred_val, 2),
                    "lower": round(max(0.0, lower), 2),
                    "upper": round(min(100.0, upper), 2),
                }
            )

        series_map = {(idx.year, idx.month): float(val) for idx, val in series_data.items()}
        base_year = last_index.year
        base_month = last_index.month
        historico_base = []
        for month in range(1, base_month + 1):
            rate = series_map.get((base_year, month), 0.0)
            historico_base.append(
                {
                    "ano": base_year,
                    "mes": month,
                    "churn_rate": round(rate, 2),
                }
            )

        response = {
            "horizonte": horizonte,
            "modelo": modelo,
            "trained_at": dt.datetime.utcnow().isoformat() + "Z",
            "ultimo_periodo": last_index.to_pydatetime().date().isoformat(),
            "base_year": base_year,
            "base_month": base_month,
            "historico_base": historico_base,
            "predicciones": preds,
        }

        out_serializer = conetcom_prediccion_churnrate_response_serializer(data=response)
        out_serializer.is_valid(raise_exception=True)
        return Response(out_serializer.data, status=status.HTTP_200_OK)


class conetcom_prediccion_upselling_view(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = conetcom_prediccion_upselling_request_serializer(data=request.query_params)
        if serializer.is_valid():
            horizonte = serializer.validated_data.get("horizonte", 3)
        else:
            horizonte = 3

        if horizonte not in {1, 3, 6}:
            horizonte = 3

        usuario = request.user
        empresa = getattr(usuario, "id_empresa", None)
        if empresa is None:
            return Response({"error": "Usuario sin empresa asociada."}, status=status.HTTP_400_BAD_REQUEST)

        facturas_qs = conetcom_facturacion.objects.filter(id_empresa=empresa).values(
            "fecha_emision",
            "valor_total_facturado",
            "id_cliente",
        )
        if not facturas_qs.exists():
            return Response(
                {"error": "No hay facturacion para calcular predicciones."},
                status=status.HTTP_404_NOT_FOUND,
            )

        df_fact = pd.DataFrame(list(facturas_qs))
        if df_fact.empty:
            return Response(
                {"error": "No hay datos suficientes para facturacion."},
                status=status.HTTP_404_NOT_FOUND,
            )

        df_fact["fecha_emision"] = pd.to_datetime(df_fact["fecha_emision"], errors="coerce")
        df_fact["valor_total_facturado"] = pd.to_numeric(
            df_fact["valor_total_facturado"], errors="coerce"
        ).fillna(0.0)
        df_fact = df_fact[df_fact["fecha_emision"].notna()].copy()
        if df_fact.empty:
            return Response(
                {"error": "No hay fechas validas para facturacion."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        df_fact["id_cliente"] = df_fact["id_cliente"].astype(str)
        df_fact["periodo"] = df_fact["fecha_emision"].dt.to_period("M").dt.to_timestamp()

        series = df_fact.groupby("periodo")["valor_total_facturado"].sum().sort_index()
        if series.empty:
            return Response(
                {"error": "No hay serie de facturacion para predecir."},
                status=status.HTTP_404_NOT_FOUND,
            )

        month_index = pd.date_range(start=series.index.min(), end=series.index.max(), freq="MS")
        series = series.reindex(month_index, fill_value=0.0)
        series_data = series.astype(float)

        modelo = "naive_mean"
        sigma = float(series_data.std(ddof=1)) if len(series_data) > 1 else 0.0
        forecast_vals = None

        if len(series_data) >= 2:
            try:
                seasonal = "add" if len(series_data) >= 24 else None
                seasonal_periods = 12 if seasonal else None
                model = ExponentialSmoothing(
                    series_data,
                    trend="add",
                    seasonal=seasonal,
                    seasonal_periods=seasonal_periods,
                    initialization_method="estimated",
                )
                fit = model.fit(optimized=True)
                forecast_vals = fit.forecast(steps=horizonte)
                residuals = fit.resid
                sigma = float(residuals.std(ddof=1)) if len(residuals) > 1 else sigma
                modelo = "ExponentialSmoothing_hw" if seasonal else "ExponentialSmoothing_trend"
            except Exception:
                try:
                    model = ExponentialSmoothing(
                        series_data,
                        trend="add",
                        seasonal=None,
                        initialization_method="estimated",
                    )
                    fit = model.fit(optimized=True)
                    forecast_vals = fit.forecast(steps=horizonte)
                    residuals = fit.resid
                    sigma = float(residuals.std(ddof=1)) if len(residuals) > 1 else sigma
                    modelo = "ExponentialSmoothing_trend"
                except Exception:
                    forecast_vals = None

        if forecast_vals is None:
            last_value = float(series_data.iloc[-1]) if len(series_data) else 0.0
            forecast_vals = [last_value for _ in range(horizonte)]

        last_index = series_data.index.max()
        preds_fact = []
        for i, val in enumerate(forecast_vals, start=1):
            periodo = (last_index + pd.DateOffset(months=i)).to_pydatetime().date().replace(day=1)
            pred_val = float(val)
            lower = pred_val - 1.96 * sigma
            upper = pred_val + 1.96 * sigma
            preds_fact.append(
                {
                    "ano": periodo.year,
                    "mes": periodo.month,
                    "total_facturado": round(max(0.0, pred_val), 2),
                    "lower": round(max(0.0, lower), 2),
                    "upper": round(max(0.0, upper), 2),
                }
            )

        series_map = {(idx.year, idx.month): float(val) for idx, val in series_data.items()}
        base_year = last_index.year
        base_month = last_index.month
        historico_facturacion = []
        for month in range(1, base_month + 1):
            total = series_map.get((base_year, month), 0.0)
            historico_facturacion.append(
                {
                    "ano": base_year,
                    "mes": month,
                    "total_facturado": round(float(total), 2),
                }
            )

        clientes_qs = conetcom_clientes.objects.filter(id_empresa=empresa).values(
            "id_cliente",
            "nombre_cliente",
            "id_plan_contratado",
        )
        clientes_list = list(clientes_qs)

        planes_qs = conetcom_planes.objects.filter(id_empresa=empresa).values(
            "id_plan",
            "precio_mensual",
        )
        planes_price = {
            str(item["id_plan"]): float(item["precio_mensual"] or 0.0) for item in planes_qs
        }

        reference_date = df_fact["fecha_emision"].max()
        cutoff = reference_date - pd.DateOffset(months=6)
        last_invoice = df_fact.groupby("id_cliente")["fecha_emision"].max()
        recent_df = df_fact[df_fact["fecha_emision"] >= cutoff]
        freq = recent_df.groupby("id_cliente").size()
        monetary = recent_df.groupby("id_cliente")["valor_total_facturado"].sum()

        raw_rows = []
        recency_vals = []
        freq_vals = []
        monetary_vals = []
        plan_vals = []

        for cliente in clientes_list:
            id_cliente = str(cliente.get("id_cliente") or "")
            if not id_cliente:
                continue
            last_date = last_invoice.get(id_cliente, pd.NaT)
            if pd.isna(last_date):
                recency_days = 9999
            else:
                recency_days = int((reference_date - last_date).days)
            freq_val = int(freq.get(id_cliente, 0))
            mon_val = float(monetary.get(id_cliente, 0.0))
            plan_id = cliente.get("id_plan_contratado")
            plan_price = float(planes_price.get(str(plan_id), 0.0))

            raw_rows.append(
                {
                    "id_cliente": id_cliente,
                    "nombre_cliente": cliente.get("nombre_cliente") or id_cliente,
                    "recency": recency_days,
                    "frequency": freq_val,
                    "monetary": mon_val,
                    "plan_price": plan_price,
                }
            )
            recency_vals.append(recency_days)
            freq_vals.append(freq_val)
            monetary_vals.append(mon_val)
            plan_vals.append(plan_price)

        def _normalize(value, min_v, max_v, default=0.5):
            if max_v == min_v:
                return default
            return (value - min_v) / (max_v - min_v)

        rec_min = min(recency_vals) if recency_vals else 0.0
        rec_max = max(recency_vals) if recency_vals else 1.0
        freq_min = min(freq_vals) if freq_vals else 0.0
        freq_max = max(freq_vals) if freq_vals else 1.0
        mon_min = min(monetary_vals) if monetary_vals else 0.0
        mon_max = max(monetary_vals) if monetary_vals else 1.0
        plan_min = min(plan_vals) if plan_vals else 0.0
        plan_max = max(plan_vals) if plan_vals else 1.0

        oportunidades = []
        for row in raw_rows:
            rec_norm = _normalize(row["recency"], rec_min, rec_max, default=0.5)
            rec_score = 1 - rec_norm
            freq_norm = _normalize(row["frequency"], freq_min, freq_max, default=0.0)
            mon_norm = _normalize(row["monetary"], mon_min, mon_max, default=0.0)
            plan_norm = _normalize(row["plan_price"], plan_min, plan_max, default=0.5)
            plan_score = 1 - plan_norm

            score = (0.35 * rec_score) + (0.25 * freq_norm) + (0.25 * mon_norm) + (0.15 * plan_score)
            oportunidad = max(0.0, min(100.0, score * 100))

            oportunidades.append(
                {
                    "id_cliente": row["id_cliente"],
                    "nombre_cliente": row["nombre_cliente"],
                    "oportunidad": round(oportunidad, 2),
                }
            )

        oportunidades = sorted(oportunidades, key=lambda x: x["oportunidad"], reverse=True)[:30]

        response = {
            "horizonte": horizonte,
            "modelo": modelo,
            "trained_at": dt.datetime.utcnow().isoformat() + "Z",
            "ultimo_periodo": last_index.to_pydatetime().date().isoformat(),
            "base_year": base_year,
            "base_month": base_month,
            "historico_facturacion": historico_facturacion,
            "predicciones_facturacion": preds_fact,
            "oportunidades": oportunidades,
        }

        out_serializer = conetcom_prediccion_upselling_response_serializer(data=response)
        out_serializer.is_valid(raise_exception=True)
        return Response(out_serializer.data, status=status.HTTP_200_OK)
