# appdataflowai/views.py
from typing import Optional, Tuple, Dict, Any
import re
import unicodedata
import string
import difflib
import json

from django.utils.dateparse import parse_date
from django.db.models import Avg, QuerySet
from django.core.cache import cache

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from ..models import DashboardChurnRate


# ---------------------------
# Clase reutilizable de cálculos
# ---------------------------
class CalculosChatBotDashboardChurn:
    """
    Contiene métodos de cálculo de métricas para el chat.
    Cada método recibe (queryset, **params) y devuelve {"value": ..., "meta": {...}}.
    Mantén aquí toda la lógica de negocio reproducible y testeable.
    """

    def calcular_clientes_activos(self, queryset, **params):
        """Conteo simple de clientes con estado 'activo'."""
        value = queryset.filter(estado_cliente='activo').count()
        return {"value": value, "meta": {"method": "orm_count", "filter": "estado_cliente='activo'"}}

    def calcular_inactivos(self, queryset, **params):
        """Conteo simple de clientes con estado 'inactivo'."""
        value = queryset.filter(estado_cliente='inactivo').count()
        return {"value": value, "meta": {"method": "orm_count", "filter": "estado_cliente='inactivo'"}}

    def calcular_total_registros(self, queryset, **params):
        """Total de registros del queryset (útil para trazabilidad)."""
        value = queryset.count()
        return {"value": value, "meta": {"method": "orm_count"}}

    def calcular_arpu_promedio(self, queryset, **params):
        """ARPU promedio sobre el campo 'arpu'."""
        avg = queryset.aggregate(avg_arpu=Avg('arpu'))['avg_arpu']
        v = float(avg) if avg is not None else None
        return {"value": v, "meta": {"method": "orm_aggregate", "field": "arpu"}}


    def calcular_churn_rate(self, queryset, fecha_inicio=None, fecha_fin=None, **params):
        """
        Calcula el churn rate (%) según:
        Churn Rate = Clientes perdidos durante el periodo / Clientes totales al inicio del periodo * 100

        - fecha_inicio, fecha_fin: strings 'YYYY-MM-DD' o None.
        """
        qs = queryset

        # Parseo fechas
        f_inicio = parse_date(fecha_inicio) if fecha_inicio else None
        f_fin = parse_date(fecha_fin) if fecha_fin else None

        # Clientes totales al inicio del periodo (fecha_contratacion <= fecha_fin)
        clientes_totales = qs
        if f_fin:
            clientes_totales = clientes_totales.filter(fecha_contratacion__lte=f_fin)
        total_inicio = clientes_totales.count()

        # Clientes perdidos durante el periodo (fecha_baja entre fechas y estado inactivo o cancelado)
        clientes_perdidos = qs.filter(
            fecha_baja__isnull=False,
            estado_cliente__in=['inactivo', 'cancelado']
        )
        if f_inicio:
            clientes_perdidos = clientes_perdidos.filter(fecha_baja__gte=f_inicio)
        if f_fin:
            clientes_perdidos = clientes_perdidos.filter(fecha_baja__lte=f_fin)
        
        perdidos = clientes_perdidos.count()

        rate = (perdidos / total_inicio * 100) if total_inicio > 0 else None

        return {
            "value": rate,
            "meta": {
                "method": "clientes_perdidos_sobre_total_inicio",
                "clientes_perdidos": perdidos,
                "clientes_totales_inicio": total_inicio,
                "fecha_inicio": fecha_inicio,
                "fecha_fin": fecha_fin
            }
        }
    
    # Función para listar clientes por estado
    # Función para listar clientes por estado
    # Función para listar solo nombres de clientes por estado
    def listar_nombres_clientes_por_estado(self, queryset, estado=None, **params):
        """
        Devuelve un listado de nombres de clientes filtrados por estado:
        - estado: 'activo', 'inactivo' o 'cancelado'. Si None, devuelve todos.
        Retorna un string organizado, con un nombre por línea.
        """
        qs = queryset
        if estado in ['activo', 'inactivo', 'cancelado']:
            qs = qs.filter(estado_cliente=estado)
        
        nombres = qs.values_list('nombre_cliente', flat=True)
        if not nombres:
            return f"No hay clientes con estado '{estado}'."
        
        # Crear texto organizado
        texto = f"Listado de clientes {estado or 'todos'}:\n"
        texto += "\n".join(f"- {nombre}" for nombre in nombres)
        return {
            "value": texto,
            "meta": {
                "estado_filtrado": estado,
                "total": len(nombres)
            }
        }
    def listar_nombres_clientes_inactivos(self, queryset, **params):
        """
        Devuelve un listado de nombres de clientes con estado 'inactivo'.
        Retorna un string organizado, con un nombre por línea.
        """
        qs = queryset.filter(estado_cliente='inactivo')
        
        nombres = qs.values_list('nombre_cliente', flat=True)
        if not nombres:
            return {
                "value": "No hay clientes inactivos en los datos filtrados.",
                "meta": {
                    "estado_filtrado": "inactivo",
                    "total": 0
                }
            }
        
        # Crear texto organizado
        texto = "Listado de clientes inactivos:\n"
        texto += "\n".join(f"- {nombre}" for nombre in nombres)
        return {
            "value": texto,
            "meta": {
                "estado_filtrado": "inactivo",
                "total": len(nombres)
            }
        }
    def listar_nombres_clientes_activos(self, queryset, **params):
        """
        Devuelve un listado de nombres de clientes con estado 'activo'.
        Retorna un string organizado, con un nombre por línea.
        """
        qs = queryset.filter(estado_cliente='activo')
        
        nombres = qs.values_list('nombre_cliente', flat=True)
        if not nombres:
            return {
                "value": "No hay clientes activos en los datos filtrados.",
                "meta": {
                    "estado_filtrado": "activo",
                    "total": 0
                }
            }
        
        # Crear texto organizado
        texto = "Listado de clientes activos:\n"
        texto += "\n".join(f"- {nombre}" for nombre in nombres)
        return {
            "value": texto,
            "meta": {
                "estado_filtrado": "activo",
                "total": len(nombres)
            }
        }



# ---------------------------
# METRIC_AYUDA: respuestas textuales rápidas (sin función)
# ---------------------------
METRIC_AYUDA = {
    "que_puedo_hacer": {
        "text": "Puedo ayudar con información sobre tu data del KPI Churn, si deseas listar la las cosas que puedo hacer por ti, dime.",
        "aliases": ["qué puedes hacer", "que puedes hacer", "ayuda", "help"]
    },
    "listar_metricas": {
        "text": "Lista de métricas: clientes_activos, inactivos, total_registros, arpu_promedio, hallar_churn.",
        "aliases": ["listar metricas", "listar métricas", "metrics list", "qué métricas hay"]
    },
    "sobre_churn": {
        "text": "La tasa de churn se calcula típicamente como clientes que se dieron de baja / total de clientes en el periodo.",
        "aliases": ["qué es churn", "definición churn", "sobre churn"]
    },

    "esperanza": {
        "text": "no se",
        "aliases": ["quien es esperanza"]
    }
}


# ---------------------------
# Vista principal
# ---------------------------
class DashboardChurnChatView(APIView):
    """
    Chat endpoint para métricas de churn.

    - Usa CalculosChatBotDashboardChurn para cálculos (METRIC_CALCULOS).
    - Usa METRIC_AYUDA para respuestas de ayuda rápidas.
    - ALLOWED_METRIC_SOURCES controla si el chat responde desde 'calculos' y/o 'ayuda'.
    - Incluye matching robusto (keys, aliases, token search, fuzzy).
    - Incluye cache por métrica para reducir carga y mejorar latencia.
    """
    permission_classes = (IsAuthenticated,)

    # Control de fuentes permitidas (ajusta según tu política)
    # Valores posibles: "calculos", "ayuda"
    ALLOWED_METRIC_SOURCES = ("calculos", "ayuda")

    # TTL (segundos) para cache de métricas (simple). 0 para desactivar.
    METRIC_CACHE_TTL = 300  # 5 minutos

    # Instancia de la clase de cálculos (reutilizable)
    calc = CalculosChatBotDashboardChurn()

    # Registro de cálculos: key -> {func, descripcion, params, aliases}
    METRIC_CALCULOS = {
        "clientes_activos": {
            "func": calc.calcular_clientes_activos,
            "descripcion": "Conteo de clientes con estado 'activo'.",
            "params": [],
            "aliases": ["clientes activos", "cantidad de clientes activos", "clientes_activos", "cuantos clientes activos"]
        },
        "inactivos": {
            "func": calc.calcular_inactivos,
            "descripcion": "Conteo de clientes con estado 'inactivo'.",
            "params": [],
            "aliases": ["clientes inactivos", "cantidad de clientes inactivos", "inactivos"]
        },
        "total_registros": {
            "func": calc.calcular_total_registros,
            "descripcion": "Total de registros en el dataset filtrado.",
            "params": [],
            "aliases": ["total registros", "cantidad total", "total_registros"]
        },
        "arpu_promedio": {
            "func": calc.calcular_arpu_promedio,
            "descripcion": "ARPU promedio (campo 'arpu').",
            "params": [],
            "aliases": ["arpu promedio", "promedio arpu", "arpu_promedio"]
        },
        "hallar_churn": {
            "func": calc.calcular_churn_rate,
            "descripcion": "Tasa de churn: clientes con fecha_baja en rango / total clientes.",
            "params": ["fecha_inicio", "fecha_fin"],
            "aliases": ["churn", "tasa de churn", "hallar churn", "hallar_churn"]
        },
        "listar_clientes_inactivos": {
            "func": calc.listar_nombres_clientes_inactivos,
            "descripcion": "Devuelve un listado de nombres de clientes inactivos en formato texto organizado.",
            "params": [],  # Ya no necesita parámetro 'estado'
            "aliases": [
                "listado clientes inactivos",
                "clientes inactivos",
                "listar inactivos", 
                "mostrar clientes inactivos",
                "quienes son los clientes inactivos",
                "clientes que están inactivos",
                "listado de inactivos"
            ]
        },
        "listar_clientes_activos": {
                "func": calc.listar_nombres_clientes_activos,
                "descripcion": "Devuelve un listado de nombres de clientes activos en formato texto organizado.",
                "params": [],  # No necesita parámetros
                "aliases": [
                    "listado clientes activos",
                    "clientes activos",
                    "listar activos", 
                    "mostrar clientes activos",
                    "quienes son los clientes activos",
                    "clientes que están activos",
                    "listado de activos",
                    "clientes actuales"
                ]
            }

    }

    # ---------------------------
    # Intent classifier (local short-circuit)
    # ---------------------------
    GREETINGS = re.compile(r'^\s*(hola|buenas|buenos días|buenas tardes|hi|hey)\b', re.I)
    THANKS = re.compile(r'^\s*(gracias|thank you|thx)\b', re.I)
    SHORT_HELP = re.compile(r'\b(help|ayuda|qué puedes hacer|que haces)\b', re.I)

    def is_trivial_intent(self, message: str) -> Tuple[bool, str]:
        m = (message or "").strip()
        if not m:
            return True, "Envía tu pregunta sobre métricas (ej: 'clientes_activos' o 'hallar_churn 2025-01-01 2025-10-31')"
        if self.GREETINGS.search(m):
            return True, "Hola 👋. Pregunta algo como: 'clientes_activos' o 'hallar_churn 2025-01-01 2025-10-31'."
        if self.THANKS.search(m):
            return True, "De nada — cuando quieras."
        if self.SHORT_HELP.search(m):
            return True, ("Puedo ayudar con información sobre tu data del KPI Churn, si deseas listar las cosas que puedo hacer por ti, dime.")
        return False, ""

    # ---------------------------
    # Normalización y matching helpers
    # ---------------------------
    @staticmethod
    def normalize_text(text: str) -> str:
        if not text:
            return ""
        text = text.lower()
        text = unicodedata.normalize("NFKD", text)
        text = "".join([c for c in text if not unicodedata.combining(c)])
        translator = str.maketrans(string.punctuation + "¿¡", " " * (len(string.punctuation) + 2))
        text = text.translate(translator)
        text = re.sub(r"\s+", " ", text).strip()
        return text

    def find_metric_key_from_message(self, message: str) -> Optional[Tuple[str, str]]:
        """
        Busca una clave en METRIC_CALCULOS y METRIC_AYUDA según ALLOWED_METRIC_SOURCES.
        Devuelve (source, key) con source en {"calculos","ayuda"} o None si no encuentra.
        Orden de matching: exact key -> alias exact -> token search -> fuzzy.
        """
        if not message:
            return None
        norm = self.normalize_text(message)

        def check_registry(registry: Dict[str, dict], reg_name: str):
            # exact key
            for key in registry.keys():
                if norm == self.normalize_text(key):
                    return (reg_name, key)
            # alias exact
            for key, md in registry.items():
                for alias in md.get("aliases", []):
                    if norm == self.normalize_text(alias):
                        return (reg_name, key)
            # token search
            for key, md in registry.items():
                nk = self.normalize_text(key)
                if re.search(r'\b' + re.escape(nk) + r'\b', norm):
                    return (reg_name, key)
                for alias in md.get("aliases", []):
                    na = self.normalize_text(alias)
                    if re.search(r'\b' + re.escape(na) + r'\b', norm):
                        return (reg_name, key)
            # fuzzy
            candidates = []
            map_back = {}
            for key, md in registry.items():
                nk = self.normalize_text(key)
                candidates.append(nk)
                map_back[nk] = (reg_name, key)
                for alias in md.get("aliases", []):
                    na = self.normalize_text(alias)
                    candidates.append(na)
                    map_back[na] = (reg_name, key)
            matches = difflib.get_close_matches(norm, candidates, n=1, cutoff=0.65)
            if matches:
                return map_back[matches[0]]
            return None

        # Chequear registries según permiso
        if "calculos" in self.ALLOWED_METRIC_SOURCES:
            out = check_registry(self.METRIC_CALCULOS, "calculos")
            if out:
                return out
        if "ayuda" in self.ALLOWED_METRIC_SOURCES:
            out = check_registry(METRIC_AYUDA, "ayuda")
            if out:
                return out
        return None

    # ---------------------------
    # Schema caching (opcional)
    # ---------------------------
    def get_and_cache_schema(self, empresa_id: int):
        cache_key = f"churn_schema_{empresa_id}"
        schema = cache.get(cache_key)
        if schema:
            return schema
        schema = []
        for f in DashboardChurnRate._meta.get_fields():
            if not hasattr(f, 'attname'):
                continue
            name = f.attname
            try:
                t = f.get_internal_type()
            except Exception:
                t = type(f).__name__
            schema.append({"name": name, "type": t})
        cache.set(cache_key, schema, 6 * 3600)
        return schema

    # ---------------------------
    # Caching helper para métricas
    # ---------------------------
    def _metric_cache_key(self, empresa_id: int, metric_key: str, params: dict) -> str:
        params_serial = json.dumps(params or {}, sort_keys=True, separators=(',', ':'))
        return f"metric:{empresa_id}:{metric_key}:{params_serial}"

    # ---------------------------
    # Ejecutar cálculo (con cache opcional)
    # ---------------------------
    def execute_metric_calc(self, metric_key: str, queryset: QuerySet, empresa_id: Optional[int] = None,
                            **params) -> Dict[str, Any]:
        md = self.METRIC_CALCULOS.get(metric_key)
        if not md:
            return {"success": False, "error": f"Métrica no encontrada: {metric_key}"}
        func = md["func"]

        if self.METRIC_CACHE_TTL and empresa_id is not None:
            cache_key = self._metric_cache_key(empresa_id, metric_key, params)
            cached = cache.get(cache_key)
            if cached is not None:
                return {"success": True, "result": cached}

        try:
            bound = func.__get__(self, self.__class__) if hasattr(func, "__get__") else func
            res = bound(queryset, **params)
            if not isinstance(res, dict) or "value" not in res:
                return {"success": False, "error": "La métrica debe devolver dict con clave 'value'."}
            if self.METRIC_CACHE_TTL and empresa_id is not None:
                cache.set(cache_key, res, self.METRIC_CACHE_TTL)
            return {"success": True, "result": res}
        except TypeError as e:
            return {"success": False, "error": f"Error de parámetros al ejecutar la métrica: {str(e)}"}
        except Exception as e:
            return {"success": False, "error": f"Excepción al ejecutar métrica: {str(e)}"}

    # ---------------------------
    # Formateo humano breve
    # ---------------------------
    @staticmethod
    def format_human_readable(descripcion: str, value: Any) -> str:
        if value is None:
            return f"{descripcion}: sin datos"
        if isinstance(value, int):
            return f"{descripcion}: {format(value, ',')}"
        if isinstance(value, float):
            s = f"{value:.3f}".rstrip('0').rstrip('.')
            return f"{descripcion}: {s}"
        return f"{descripcion}: {str(value)}"

    # ---------------------------
    # Endpoint POST
    # ---------------------------
    def post(self, request):
        usuario = request.user
        if not hasattr(usuario, 'id_empresa') or usuario.id_empresa is None:
            return Response({'error': 'Usuario inválido o sin id_empresa.'}, status=status.HTTP_401_UNAUTHORIZED)

        raw_message = (request.data.get('message') or "").strip()
        message = raw_message or ""
        trivial, reply = self.is_trivial_intent(message)
        if trivial:
            return Response({"assistant": reply, "source": "local"}, status=status.HTTP_200_OK)

        # comandos prioritarios
        if re.search(r'\b(listar metricas|listar métricas|metrics list)\b', message, re.I):
            if "ayuda" in self.ALLOWED_METRIC_SOURCES and "listar_metricas" in METRIC_AYUDA:
                return Response({"assistant": METRIC_AYUDA["listar_metricas"]["text"], "source": "local"}, status=status.HTTP_200_OK)
            return Response({"assistant": "Métricas disponibles: " + ", ".join(self.METRIC_CALCULOS.keys()), "source": "local"}, status=status.HTTP_200_OK)

        if re.search(r'\b(schema|columnas|columnas\?|qué columnas|qué campos)\b', message, re.I):
            schema = self.get_and_cache_schema(usuario.id_empresa)
            return Response({"assistant": "Esquema (columnas)", "columnas": [s['name'] for s in schema], "source": "local"}, status=status.HTTP_200_OK)

        # preparar queryset
        queryset = DashboardChurnRate.objects.filter(id_empresa=usuario.id_empresa)
        start = request.query_params.get('start')
        end = request.query_params.get('end')
        if start:
            f = parse_date(start)
            if f:
                queryset = queryset.filter(fecha_ultima_transaccion__gte=f)
        if end:
            f = parse_date(end)
            if f:
                queryset = queryset.filter(fecha_ultima_transaccion__lte=f)
        estado = request.query_params.get('estado')
        if estado:
            queryset = queryset.filter(estado_cliente=estado)
        tipo = request.query_params.get('tipo')
        if tipo:
            queryset = queryset.filter(tipo_plan=tipo)

        params = request.data.get('params') or {}
        if not params:
            found_dates = re.findall(r'(\d{4}-\d{2}-\d{2})', message)
            if found_dates:
                if len(found_dates) == 1:
                    params["fecha_inicio"] = found_dates[0]
                elif len(found_dates) >= 2:
                    params["fecha_inicio"] = found_dates[0]
                    params["fecha_fin"] = found_dates[1]

        found = self.find_metric_key_from_message(message)
        if not found:
            suggestion = list(self.METRIC_CALCULOS.keys())[:6]
            return Response({
                "assistant": "No identifiqué una métrica o ayuda en tu mensaje.",
                "sugerencias_metricas": suggestion,
                "hint": "Escribe el nombre exacto, usa un alias o 'listar metricas'.",
                "source": "local"
            }, status=status.HTTP_200_OK)

        source, metric_key = found

        if source == "ayuda":
            help_entry = METRIC_AYUDA.get(metric_key)
            if help_entry:
                return Response({"assistant": help_entry["text"], "metric_key": metric_key, "source": "local"}, status=status.HTTP_200_OK)
            return Response({"assistant": "Ayuda no disponible.", "source": "local"}, status=status.HTTP_200_OK)

        if source == "calculos":
            exec_res = self.execute_metric_calc(metric_key, queryset, empresa_id=usuario.id_empresa, **params)
            if not exec_res.get("success"):
                return Response({"assistant": "Error ejecutando métrica", "detail": exec_res.get("error")}, status=status.HTTP_400_BAD_REQUEST)
            result = exec_res["result"]
            value = result.get("value")
            meta = result.get("meta", {})
            descripcion = self.METRIC_CALCULOS[metric_key]["descripcion"]
            human_readable = self.format_human_readable(descripcion, value)
            response_payload = {
                "assistant": human_readable,
                "metric_key": metric_key,
                "descripcion": descripcion,
                "value": value,
                "meta": meta,
                "params_used": params,
                "source": "local"
            }
            return Response(response_payload, status=status.HTTP_200_OK)

        return Response({"assistant": "No se pudo procesar la solicitud.", "source": "local"}, status=status.HTTP_400_BAD_REQUEST)
