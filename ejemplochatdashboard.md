# appdataflowai/views.py

fromtypingimportOptional,Tuple,Dict,Any

importre

importunicodedata

importstring

importdifflib

importjson

fromdjango.utils.dateparseimportparse_date

fromdjango.db.modelsimportAvg,QuerySet

fromdjango.core.cacheimportcache

fromrest_framework.viewsimportAPIView

fromrest_framework.responseimportResponse

fromrest_framework.permissionsimportIsAuthenticated

fromrest_frameworkimportstatus

from..modelsimportDashboardChurnRate

# ---------------------------

# Clase reutilizable de cálculos

# ---------------------------

classCalculosChatBotDashboardChurn:

    """

    Contiene métodos de cálculo de métricas para el chat.

    Cada método recibe (queryset, **params) y devuelve {"value": ..., "meta": {...}}.

    Mantén aquí toda la lógica de negocio reproducible y testeable.

    """

    defcalcular_clientes_activos(self,queryset,**params):

    """Conteo simple de clientes con estado 'activo'."""

    value=queryset.filter(estado_cliente='activo').count()

    return{"value":value,"meta":{"method":"orm_count","filter":"estado_cliente='activo'"}}

    defcalcular_inactivos(self,queryset,**params):

    """Conteo simple de clientes con estado 'inactivo'."""

    value=queryset.filter(estado_cliente='inactivo').count()

    return{"value":value,"meta":{"method":"orm_count","filter":"estado_cliente='inactivo'"}}

    defcalcular_total_registros(self,queryset,**params):

    """Total de registros del queryset (útil para trazabilidad)."""

    value=queryset.count()

    return{"value":value,"meta":{"method":"orm_count"}}

    defcalcular_arpu_promedio(self,queryset,**params):

    """ARPU promedio sobre el campo 'arpu'."""

    avg=queryset.aggregate(avg_arpu=Avg('arpu'))['avg_arpu']

    v=float(avg)ifavgisnotNoneelseNone

    return{"value":v,"meta":{"method":"orm_aggregate","field":"arpu"}}

    defcalcular_churn_rate(self,queryset,fecha_inicio=None,fecha_fin=None,**params):

    """

    Calcula el churn rate (%) según:

    Churn Rate = Clientes perdidos durante el periodo / Clientes totales al inicio del periodo * 100

    - fecha_inicio, fecha_fin: strings 'YYYY-MM-DD' o None.

    """

    qs=queryset

    # Parseo fechas

    f_inicio=parse_date(fecha_inicio)iffecha_inicioelseNone

    f_fin=parse_date(fecha_fin)iffecha_finelseNone

    # Clientes totales al inicio del periodo (fecha_contratacion <= fecha_fin)

    clientes_totales=qs

    iff_fin:

    clientes_totales=clientes_totales.filter(fecha_contratacion__lte=f_fin)

    total_inicio=clientes_totales.count()

    # Clientes perdidos durante el periodo (fecha_baja entre fechas y estado inactivo o cancelado)

    clientes_perdidos=qs.filter(

    fecha_baja__isnull=False,

    estado_cliente__in=['inactivo','cancelado']

    )

    iff_inicio:

    clientes_perdidos=clientes_perdidos.filter(fecha_baja__gte=f_inicio)

    iff_fin:

    clientes_perdidos=clientes_perdidos.filter(fecha_baja__lte=f_fin)

    perdidos=clientes_perdidos.count()

    rate=(perdidos/total_inicio*100)iftotal_inicio>0elseNone

    return{

    "value":rate,

    "meta":{

    "method":"clientes_perdidos_sobre_total_inicio",

    "clientes_perdidos":perdidos,

    "clientes_totales_inicio":total_inicio,

    "fecha_inicio":fecha_inicio,

    "fecha_fin":fecha_fin

    }

    }

    # Función para listar clientes por estado

    # Función para listar clientes por estado

    # Función para listar solo nombres de clientes por estado

    deflistar_nombres_clientes_por_estado(self,queryset,estado=None,**params):

    """

    Devuelve un listado de nombres de clientes filtrados por estado:

    - estado: 'activo', 'inactivo' o 'cancelado'. Si None, devuelve todos.

    Retorna un string organizado, con un nombre por línea.

    """

    qs=queryset

    ifestadoin['activo','inactivo','cancelado']:

    qs=qs.filter(estado_cliente=estado)

    nombres=qs.values_list('nombre_cliente',flat=True)

    ifnotnombres:

    returnf"No hay clientes con estado '{estado}'."

    # Crear texto organizado

    texto=f"Listado de clientes {estadoor'todos'}:\n"

    texto+="\n".join(f"- {nombre}"fornombreinnombres)

    return{

    "value":texto,

    "meta":{

    "estado_filtrado":estado,

    "total":len(nombres)

    }

    }

    deflistar_nombres_clientes_inactivos(self,queryset,**params):

    """

    Devuelve un listado de nombres de clientes con estado 'inactivo'.

    Retorna un string organizado, con un nombre por línea.

    """

    qs=queryset.filter(estado_cliente='inactivo')

    nombres=qs.values_list('nombre_cliente',flat=True)

    ifnotnombres:

    return{

    "value":"No hay clientes inactivos en los datos filtrados.",

    "meta":{

    "estado_filtrado":"inactivo",

    "total":0

    }

    }

    # Crear texto organizado

    texto="Listado de clientes inactivos:\n"

    texto+="\n".join(f"- {nombre}"fornombreinnombres)

    return{

    "value":texto,

    "meta":{

    "estado_filtrado":"inactivo",

    "total":len(nombres)

    }

    }

    deflistar_nombres_clientes_activos(self,queryset,**params):

    """

    Devuelve un listado de nombres de clientes con estado 'activo'.

    Retorna un string organizado, con un nombre por línea.

    """

    qs=queryset.filter(estado_cliente='activo')

    nombres=qs.values_list('nombre_cliente',flat=True)

    ifnotnombres:

    return{

    "value":"No hay clientes activos en los datos filtrados.",

    "meta":{

    "estado_filtrado":"activo",

    "total":0

    }

    }

    # Crear texto organizado

    texto="Listado de clientes activos:\n"

    texto+="\n".join(f"- {nombre}"fornombreinnombres)

    return{

    "value":texto,

    "meta":{

    "estado_filtrado":"activo",

    "total":len(nombres)

    }

    }

# ---------------------------

# METRIC_AYUDA: respuestas textuales rápidas (sin función)

# ---------------------------

METRIC_AYUDA={

    "que_puedo_hacer":{

    "text":"Puedo ayudar con información sobre tu data del KPI Churn, si deseas listar la las cosas que puedo hacer por ti, dime.",

    "aliases":["qué puedes hacer","que puedes hacer","ayuda","help"]

    },

    "listar_metricas":{

    "text":"Lista de métricas: clientes_activos, inactivos, total_registros, arpu_promedio, hallar_churn.",

    "aliases":["listar metricas","listar métricas","metrics list","qué métricas hay"]

    },

    "sobre_churn":{

    "text":"La tasa de churn se calcula típicamente como clientes que se dieron de baja / total de clientes en el periodo.",

    "aliases":["qué es churn","definición churn","sobre churn"]

    },

    "esperanza":{

    "text":"no se",

    "aliases":["quien es esperanza"]

    }

}

# ---------------------------

# Vista principal

# ---------------------------

classDashboardChurnChatView(APIView):

    """

    Chat endpoint para métricas de churn.

    - Usa CalculosChatBotDashboardChurn para cálculos (METRIC_CALCULOS).

    - Usa METRIC_AYUDA para respuestas de ayuda rápidas.

    - ALLOWED_METRIC_SOURCES controla si el chat responde desde 'calculos' y/o 'ayuda'.

    - Incluye matching robusto (keys, aliases, token search, fuzzy).

    - Incluye cache por métrica para reducir carga y mejorar latencia.

    """

    permission_classes=(IsAuthenticated,)

    # Control de fuentes permitidas (ajusta según tu política)

    # Valores posibles: "calculos", "ayuda"

    ALLOWED_METRIC_SOURCES=("calculos","ayuda")

    # TTL (segundos) para cache de métricas (simple). 0 para desactivar.

    METRIC_CACHE_TTL=300  # 5 minutos

    # Instancia de la clase de cálculos (reutilizable)

    calc=CalculosChatBotDashboardChurn()

    # Registro de cálculos: key -> {func, descripcion, params, aliases}

    METRIC_CALCULOS={

    "clientes_activos":{

    "func":calc.calcular_clientes_activos,

    "descripcion":"Conteo de clientes con estado 'activo'.",

    "params":[],

    "aliases":["clientes activos","cantidad de clientes activos","clientes_activos","cuantos clientes activos"]

    },

    "inactivos":{

    "func":calc.calcular_inactivos,

    "descripcion":"Conteo de clientes con estado 'inactivo'.",

    "params":[],

    "aliases":["clientes inactivos","cantidad de clientes inactivos","inactivos"]

    },

    "total_registros":{

    "func":calc.calcular_total_registros,

    "descripcion":"Total de registros en el dataset filtrado.",

    "params":[],

    "aliases":["total registros","cantidad total","total_registros"]

    },

    "arpu_promedio":{

    "func":calc.calcular_arpu_promedio,

    "descripcion":"ARPU promedio (campo 'arpu').",

    "params":[],

    "aliases":["arpu promedio","promedio arpu","arpu_promedio"]

    },

    "hallar_churn":{

    "func":calc.calcular_churn_rate,

    "descripcion":"Tasa de churn: clientes con fecha_baja en rango / total clientes.",

    "params":["fecha_inicio","fecha_fin"],

    "aliases":["churn","tasa de churn","hallar churn","hallar_churn"]

    },

    "listar_clientes_inactivos":{

    "func":calc.listar_nombres_clientes_inactivos,

    "descripcion":"Devuelve un listado de nombres de clientes inactivos en formato texto organizado.",

    "params":[],  # Ya no necesita parámetro 'estado'

    "aliases":[

    "listado clientes inactivos",

    "clientes inactivos",

    "listar inactivos",

    "mostrar clientes inactivos",

    "quienes son los clientes inactivos",

    "clientes que están inactivos",

    "listado de inactivos"

    ]

    },

    "listar_clientes_activos":{

    "func":calc.listar_nombres_clientes_activos,

    "descripcion":"Devuelve un listado de nombres de clientes activos en formato texto organizado.",

    "params":[],  # No necesita parámetros

    "aliases":[

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

    GREETINGS=re.compile(r'^\s*(hola|buenas|buenos días|buenas tardes|hi|hey)\b',re.I)

    THANKS=re.compile(r'^\s*(gracias|thank you|thx)\b',re.I)

    SHORT_HELP=re.compile(r'\b(help|ayuda|qué puedes hacer|que haces)\b',re.I)

    defis_trivial_intent(self,message:str)->Tuple[bool,str]:

    m=(messageor"").strip()

    ifnotm:

    returnTrue,"Envía tu pregunta sobre métricas (ej: 'clientes_activos' o 'hallar_churn 2025-01-01 2025-10-31')"

    ifself.GREETINGS.search(m):

    returnTrue,"Hola 👋. Pregunta algo como: 'clientes_activos' o 'hallar_churn 2025-01-01 2025-10-31'."

    ifself.THANKS.search(m):

    returnTrue,"De nada — cuando quieras."

    ifself.SHORT_HELP.search(m):

    returnTrue,("Puedo ayudar con información sobre tu data del KPI Churn, si deseas listar las cosas que puedo hacer por ti, dime.")

    returnFalse,""

    # ---------------------------

    # Normalización y matching helpers

    # ---------------------------

    @staticmethod

    defnormalize_text(text:str)->str:

    ifnottext:

    return""

    text=text.lower()

    text=unicodedata.normalize("NFKD",text)

    text="".join([cforcintextifnotunicodedata.combining(c)])

    translator=str.maketrans(string.punctuation+"¿¡"," "*(len(string.punctuation)+2))

    text=text.translate(translator)

    text=re.sub(r"\s+"," ",text).strip()

    returntext

    deffind_metric_key_from_message(self,message:str)->Optional[Tuple[str,str]]:

    """

    Busca una clave en METRIC_CALCULOS y METRIC_AYUDA según ALLOWED_METRIC_SOURCES.

    Devuelve (source, key) con source en {"calculos","ayuda"} o None si no encuentra.

    Orden de matching: exact key -> alias exact -> token search -> fuzzy.

    """

    ifnotmessage:

    returnNone

    norm=self.normalize_text(message)

    defcheck_registry(registry:Dict[str,dict],reg_name:str):

    # exact key

    forkeyinregistry.keys():

    ifnorm==self.normalize_text(key):

    return(reg_name,key)

    # alias exact

    forkey,mdinregistry.items():

    foraliasinmd.get("aliases",[]):

    ifnorm==self.normalize_text(alias):

    return(reg_name,key)

    # token search

    forkey,mdinregistry.items():

    nk=self.normalize_text(key)

    ifre.search(r'\b'+re.escape(nk)+r'\b',norm):

    return(reg_name,key)

    foraliasinmd.get("aliases",[]):

    na=self.normalize_text(alias)

    ifre.search(r'\b'+re.escape(na)+r'\b',norm):

    return(reg_name,key)

    # fuzzy

    candidates=[]

    map_back={}

    forkey,mdinregistry.items():

    nk=self.normalize_text(key)

    candidates.append(nk)

    map_back[nk]=(reg_name,key)

    foraliasinmd.get("aliases",[]):

    na=self.normalize_text(alias)

    candidates.append(na)

    map_back[na]=(reg_name,key)

    matches=difflib.get_close_matches(norm,candidates,n=1,cutoff=0.65)

    ifmatches:

    returnmap_back[matches[0]]

    returnNone

    # Chequear registries según permiso

    if"calculos"inself.ALLOWED_METRIC_SOURCES:

    out=check_registry(self.METRIC_CALCULOS,"calculos")

    ifout:

    returnout

    if"ayuda"inself.ALLOWED_METRIC_SOURCES:

    out=check_registry(METRIC_AYUDA,"ayuda")

    ifout:

    returnout

    returnNone

    # ---------------------------

    # Schema caching (opcional)

    # ---------------------------

    defget_and_cache_schema(self,empresa_id:int):

    cache_key=f"churn_schema_{empresa_id}"

    schema=cache.get(cache_key)

    ifschema:

    returnschema

    schema=[]

    forfinDashboardChurnRate._meta.get_fields():

    ifnothasattr(f,'attname'):

    continue

    name=f.attname

    try:

    t=f.get_internal_type()

    exceptException:

    t=type(f).__name__

    schema.append({"name":name,"type":t})

    cache.set(cache_key,schema,6*3600)

    returnschema

    # ---------------------------

    # Caching helper para métricas

    # ---------------------------

    def_metric_cache_key(self,empresa_id:int,metric_key:str,params:dict)->str:

    params_serial=json.dumps(paramsor{},sort_keys=True,separators=(',',':'))

    returnf"metric:{empresa_id}:{metric_key}:{params_serial}"

    # ---------------------------

    # Ejecutar cálculo (con cache opcional)

    # ---------------------------

    defexecute_metric_calc(self,metric_key:str,queryset:QuerySet,empresa_id:Optional[int]=None,

    **params)->Dict[str,Any]:

    md=self.METRIC_CALCULOS.get(metric_key)

    ifnotmd:

    return{"success":False,"error":f"Métrica no encontrada: {metric_key}"}

    func=md["func"]

    ifself.METRIC_CACHE_TTLandempresa_idisnotNone:

    cache_key=self._metric_cache_key(empresa_id,metric_key,params)

    cached=cache.get(cache_key)

    ifcachedisnotNone:

    return{"success":True,"result":cached}

    try:

    bound=func.__get__(self,self.__class__)ifhasattr(func,"__get__")elsefunc

    res=bound(queryset,**params)

    ifnotisinstance(res,dict)or"value"notinres:

    return{"success":False,"error":"La métrica debe devolver dict con clave 'value'."}

    ifself.METRIC_CACHE_TTLandempresa_idisnotNone:

    cache.set(cache_key,res,self.METRIC_CACHE_TTL)

    return{"success":True,"result":res}

    exceptTypeErrorase:

    return{"success":False,"error":f"Error de parámetros al ejecutar la métrica: {str(e)}"}

    exceptExceptionase:

    return{"success":False,"error":f"Excepción al ejecutar métrica: {str(e)}"}

    # ---------------------------

    # Formateo humano breve

    # ---------------------------

    @staticmethod

    defformat_human_readable(descripcion:str,value:Any)->str:

    ifvalueisNone:

    returnf"{descripcion}: sin datos"

    ifisinstance(value,int):

    returnf"{descripcion}: {format(value,',')}"

    ifisinstance(value,float):

    s=f"{value:.3f}".rstrip('0').rstrip('.')

    returnf"{descripcion}: {s}"

    returnf"{descripcion}: {str(value)}"

    # ---------------------------

    # Endpoint POST

    # ---------------------------

    defpost(self,request):

    usuario=request.user

    ifnothasattr(usuario,'id_empresa')orusuario.id_empresaisNone:

    returnResponse({'error':'Usuario inválido o sin id_empresa.'},status=status.HTTP_401_UNAUTHORIZED)

    raw_message=(request.data.get('message')or"").strip()

    message=raw_messageor""

    trivial,reply=self.is_trivial_intent(message)

    iftrivial:

    returnResponse({"assistant":reply,"source":"local"},status=status.HTTP_200_OK)

    # comandos prioritarios

    ifre.search(r'\b(listar metricas|listar métricas|metrics list)\b',message,re.I):

    if"ayuda"inself.ALLOWED_METRIC_SOURCESand"listar_metricas"inMETRIC_AYUDA:

    returnResponse({"assistant":METRIC_AYUDA["listar_metricas"]["text"],"source":"local"},status=status.HTTP_200_OK)

    returnResponse({"assistant":"Métricas disponibles: "+", ".join(self.METRIC_CALCULOS.keys()),"source":"local"},status=status.HTTP_200_OK)

    ifre.search(r'\b(schema|columnas|columnas\?|qué columnas|qué campos)\b',message,re.I):

    schema=self.get_and_cache_schema(usuario.id_empresa)

    returnResponse({"assistant":"Esquema (columnas)","columnas":[s['name']forsinschema],"source":"local"},status=status.HTTP_200_OK)

    # preparar queryset

    queryset=DashboardChurnRate.objects.filter(id_empresa=usuario.id_empresa)

    start=request.query_params.get('start')

    end=request.query_params.get('end')

    ifstart:

    f=parse_date(start)

    iff:

    queryset=queryset.filter(fecha_ultima_transaccion__gte=f)

    ifend:

    f=parse_date(end)

    iff:

    queryset=queryset.filter(fecha_ultima_transaccion__lte=f)

    estado=request.query_params.get('estado')

    ifestado:

    queryset=queryset.filter(estado_cliente=estado)

    tipo=request.query_params.get('tipo')

    iftipo:

    queryset=queryset.filter(tipo_plan=tipo)

    params=request.data.get('params')or{}

    ifnotparams:

    found_dates=re.findall(r'(\d{4}-\d{2}-\d{2})',message)

    iffound_dates:

    iflen(found_dates)==1:

    params["fecha_inicio"]=found_dates[0]

    eliflen(found_dates)>=2:

    params["fecha_inicio"]=found_dates[0]

    params["fecha_fin"]=found_dates[1]

    found=self.find_metric_key_from_message(message)

    ifnotfound:

    suggestion=list(self.METRIC_CALCULOS.keys())[:6]

    returnResponse({

    "assistant":"No identifiqué una métrica o ayuda en tu mensaje.",

    "sugerencias_metricas":suggestion,

    "hint":"Escribe el nombre exacto, usa un alias o 'listar metricas'.",

    "source":"local"

    },status=status.HTTP_200_OK)

    source,metric_key=found

    ifsource=="ayuda":

    help_entry=METRIC_AYUDA.get(metric_key)

    ifhelp_entry:

    returnResponse({"assistant":help_entry["text"],"metric_key":metric_key,"source":"local"},status=status.HTTP_200_OK)

    returnResponse({"assistant":"Ayuda no disponible.","source":"local"},status=status.HTTP_200_OK)

    ifsource=="calculos":

    exec_res=self.execute_metric_calc(metric_key,queryset,empresa_id=usuario.id_empresa,**params)

    ifnotexec_res.get("success"):

    returnResponse({"assistant":"Error ejecutando métrica","detail":exec_res.get("error")},status=status.HTTP_400_BAD_REQUEST)

    result=exec_res["result"]

    value=result.get("value")

    meta=result.get("meta",{})

    descripcion=self.METRIC_CALCULOS[metric_key]["descripcion"]

    human_readable=self.format_human_readable(descripcion,value)

    response_payload={

    "assistant":human_readable,

    "metric_key":metric_key,

    "descripcion":descripcion,

    "value":value,

    "meta":meta,

    "params_used":params,

    "source":"local"

    }

    returnResponse(response_payload,status=status.HTTP_200_OK)

    returnResponse({"assistant":"No se pudo procesar la solicitud.","source":"local"},status=status.HTTP_400_BAD_REQUEST)
