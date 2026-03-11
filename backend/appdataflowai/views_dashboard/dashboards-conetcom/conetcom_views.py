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
