# views.py

import jwt
import pandas as pd
from datetime import datetime, timedelta
from django.conf import settings
from django.http import JsonResponse
from django.db import models
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import (
    Usuario,
    DetalleProducto,
    DashboardVentasColtrade,
    DashboardVentasLoop,
    DashboardVentasDataflow
)




class LoginView(APIView):
    """
    Vista para autenticación de usuarios.
    Recibe un correo y una contraseña, valida las credenciales,
    y si son correctas, genera un token JWT con datos del usuario.
    """
    def post(self, request):
        correo = request.data.get('correo', '').strip()
        contrasena = request.data.get('contrasena', '').strip()

        if not correo or not contrasena:
            return Response({'error': 'Correo y contraseña son requeridos'}, status=400)

        try:
            usuario = Usuario.objects.get(correo=correo, contrasena=contrasena)
        except Usuario.DoesNotExist:
            return Response({'error': 'Credenciales inválidas'}, status=401)

        # Genera el token con duración de 2 horas
        payload = {
            'id_usuario': usuario.id_usuario,
            'correo': usuario.correo,
            'exp': datetime.utcnow() + timedelta(hours=2),
            'iat': datetime.utcnow()
        }

        token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')

        return Response({
            'token': token,
            'usuario': {
                'id': usuario.id_usuario,
                'nombre': usuario.nombres,
                'correo': usuario.correo,
                'rol': usuario.id_permiso_acceso.rol
            }
        })


# appdataflowai/views.py

import jwt
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .models import Usuario, DetalleProducto
# Nota: no necesitamos importar Producto aquí porque accedemos vía DetalleProducto.

class UsuarioInfoView(APIView):
    """
    Vista que retorna la información detallada del usuario autenticado,
    incluyendo datos personales, rol, empresa, categoría, plan, estado
    y los productos (dashboards) asignados, a partir del token JWT.
    """
    def get(self, request):
        token = request.headers.get('Authorization', '').split(' ')[-1]
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            id_usuario = payload.get('id_usuario')
        except jwt.ExpiredSignatureError:
            return Response({'error': 'Token expirado'}, status=status.HTTP_401_UNAUTHORIZED)
        except jwt.InvalidTokenError:
            return Response({'error': 'Token inválido'}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            usuario = Usuario.objects.select_related(
                'id_empresa__id_categoria',
                'id_empresa__id_plan',
                'id_empresa__id_estado',
                'id_permiso_acceso'
            ).get(id_usuario=id_usuario)
        except Usuario.DoesNotExist:
            return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        detalles = DetalleProducto.objects.filter(id_usuario=usuario)\
                                         .select_related('id_producto')
        lista_productos = [
            {
                'id_producto': det.id_producto.id_producto,
                'producto':     det.id_producto.producto,
                'slug':         det.id_producto.slug,   # Usamos slug en lugar de URL
                'iframe':       det.id_producto.iframe,
            }
            for det in detalles
        ]

        data = {
            'id': usuario.id_usuario,
            'nombres': usuario.nombres,
            'correo': usuario.correo,
            'rol': usuario.id_permiso_acceso.rol,
            'empresa': {
                'id': usuario.id_empresa.id_empresa,
                'nombre': usuario.id_empresa.nombre_empresa,
                'direccion': usuario.id_empresa.direccion,
                'fecha_registro': usuario.id_empresa.fecha_registros.isoformat(),
                'telefono': usuario.id_empresa.telefono,
                'ciudad': usuario.id_empresa.ciudad,
                'pais': usuario.id_empresa.pais,
                'categoria': {
                    'id': usuario.id_empresa.id_categoria.id_categoria,
                    'descripcion': usuario.id_empresa.id_categoria.descripcion_categoria,
                },
                'plan': {
                    'id': usuario.id_empresa.id_plan.id_plan,
                    'tipo': usuario.id_empresa.id_plan.tipo_plan,
                },
                'estado': {
                    'id': usuario.id_empresa.id_estado.id_estado,
                    'nombre': usuario.id_empresa.id_estado.estado,
                },
            },
            'productos': lista_productos
        }

        return Response(data, status=status.HTTP_200_OK)


class ProductosUsuarioView(APIView):
    """
    Vista que retorna todos los productos asociados al usuario autenticado,
    junto con información relevante del producto y del usuario.
    """
    def get(self, request):
        token = request.headers.get('Authorization', '').split(' ')[-1]
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            id_usuario = payload.get('id_usuario')
        except jwt.ExpiredSignatureError:
            return Response({'error': 'Token expirado'}, status=401)
        except jwt.InvalidTokenError:
            return Response({'error': 'Token inválido'}, status=401)

        try:
            usuario = Usuario.objects.select_related('id_empresa', 'id_permiso_acceso').get(id_usuario=id_usuario)
        except Usuario.DoesNotExist:
            return Response({'error': 'Usuario no encontrado'}, status=404)

        detalles = DetalleProducto.objects.select_related('id_producto').filter(id_usuario=usuario)

        productos = []
        for dp in detalles:
            productos.append({
                'id': dp.id_producto.id_producto,
                'nombre': dp.id_producto.producto,
                'slug': dp.id_producto.slug,  # <-- usamos slug
                'iframe': dp.id_producto.iframe,
                'estado': dp.id_producto.id_estado.estado,
                'usuario': {
                    'id': usuario.id_usuario,
                    'nombres': usuario.nombres,
                    'correo': usuario.correo,
                    'rol': usuario.id_permiso_acceso.rol,
                    'empresa': usuario.id_empresa.nombre_empresa,
                }
            })

        return JsonResponse(productos, safe=False)







from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import get_authorization_header
from .models import Producto
from .serializers import ProductoSerializer
import jwt
from django.conf import settings

#Retornar todos los productos para el Marketplace

class ProductoListView(APIView):
    """
    Vista protegida que retorna todos los productos del sistema.
    El usuario debe estar autenticado mediante token JWT.
    """

    def get(self, request):
        # Validar el token manualmente
        auth_header = get_authorization_header(request).split()
        if not auth_header or auth_header[0].lower() != b'bearer':
            return Response({'error': 'Token no enviado'}, status=401)

        try:
            token = auth_header[1].decode('utf-8')
            jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        except (jwt.ExpiredSignatureError, jwt.DecodeError):
            return Response({'error': 'Token inválido o expirado'}, status=401)

        # Obtener y serializar productos
        productos = Producto.objects.select_related('id_estado').all()
        serializer = ProductoSerializer(productos, many=True)
        return Response(serializer.data, status=200)
    



import jwt
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authentication import get_authorization_header

from .models import Producto, DetalleProducto, Usuario
from .serializers import DetalleProductoSerializer

# Mapa de límites por id_plan
PLAN_LIMITES = {
    1: 1,   # Basic
    2: 5,   # Professional
    3: 10,  # Enterprise (o el número que definas)
    4: 1,
    5: 5,   # Dataflow (o el número que definas)
    6:10,
}

class AdquirirDashboardView(APIView):
    """
    POST: { "id_producto": <int> }
    Crea un registro en detalle_producto si el usuario no ha excedido su límite.
    """
    def post(self, request):
        # 1) Validar y decodificar token
        auth = get_authorization_header(request).split()
        if not auth or auth[0].lower() != b'bearer':
            return Response({'error': 'Token no enviado'}, status=status.HTTP_401_UNAUTHORIZED)
        try:
            token = auth[1].decode()
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            id_usuario = payload['id_usuario']
        except jwt.ExpiredSignatureError:
            return Response({'error': 'Token expirado'}, status=status.HTTP_401_UNAUTHORIZED)
        except jwt.InvalidTokenError:
            return Response({'error': 'Token inválido'}, status=status.HTTP_401_UNAUTHORIZED)

        # 2) Traer usuario y su plan
        try:
            usuario = Usuario.objects.select_related('id_empresa__id_plan').get(id_usuario=id_usuario)
        except Usuario.DoesNotExist:
            return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        id_plan = usuario.id_empresa.id_plan.id_plan
        limite = PLAN_LIMITES.get(id_plan, 0)

        # 3) Contar dashboards ya adquiridos
        actuales = DetalleProducto.objects.filter(id_usuario=usuario).count()
        if actuales >= limite:
            return Response(
                {'error': f'Has alcanzado el límite de {limite} dashboards para tu plan.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 4) Validar que exista el producto
        id_prod = request.data.get('id_producto')
        try:
            producto = Producto.objects.get(id_producto=id_prod)
        except Producto.DoesNotExist:
            return Response({'error': 'Producto no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        # 5) Crear el detalle (será único por unique_together)
        detalle = DetalleProducto.objects.create(id_usuario=usuario, id_producto=producto)
        serializer = DetalleProductoSerializer(detalle)
        return Response(serializer.data, status=status.HTTP_201_CREATED)





# backend/appdataflowai/views.py
from rest_framework import generics
from .models import Empresa, Categoria, Estado, TipoPlan, Usuario, PermisoAcceso
from .serializers import (
    EmpresaSerializer,
    UsuarioSerializer,
    CategoriaSerializer,
    EstadoSerializer,
    TipoPlanSerializer,
    PermisoAccesoSerializer
)

# Crear Empresa
class EmpresaCreateAPIView(generics.CreateAPIView):
    queryset = Empresa.objects.all()
    serializer_class = EmpresaSerializer

# Crear Usuario
class UsuarioCreateAPIView(generics.CreateAPIView):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer

# Listar Categorías
class CategoriaListAPIView(generics.ListAPIView):
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer

# Listar Estados
class EstadoListAPIView(generics.ListAPIView):
    queryset = Estado.objects.all()
    serializer_class = EstadoSerializer

# Listar Planes
class TipoPlanListAPIView(generics.ListAPIView):
    queryset = TipoPlan.objects.all()
    serializer_class = TipoPlanSerializer

# Listar Permisos de Acceso
class PermisoAccesoListAPIView(generics.ListAPIView):
    queryset = PermisoAcceso.objects.all()
    serializer_class = PermisoAccesoSerializer




# backend/appdataflowai/views.py


# backend/appdataflowai/views.py

import stripe
from datetime import datetime
from django.conf import settings
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Empresa, TipoPlan, Pagos
from .serializers import CreatePaymentIntentSerializer

# Inicializa la API de Stripe con tu clave secreta
stripe.api_key = settings.STRIPE_SECRET_KEY


class CreatePaymentIntentAPIView(generics.GenericAPIView):
    """
    POST /api/create-payment-intent/
    Recibe { id_empresa, id_plan } y devuelve clientSecret para el frontend.
    """
    serializer_class = CreatePaymentIntentSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        id_empresa = serializer.validated_data['id_empresa']
        id_plan = serializer.validated_data['id_plan']

        # Obtiene empresa y plan de la base
        empresa = Empresa.objects.get(pk=id_empresa)
        plan = TipoPlan.objects.get(pk=id_plan)
        amount = int(plan.valor_plan * 100)  # en centavos

        # Crea el PaymentIntent en Stripe, añadiendo metadata para el webhook
        intent = stripe.PaymentIntent.create(
            amount=amount,
            currency='usd',
            metadata={
                'id_empresa': str(id_empresa),
                'id_plan': str(id_plan),
            },
        )
        return Response({'clientSecret': intent.client_secret})


class StripeWebhookAPIView(APIView):
    """
    POST /api/stripe-webhook/
    Endpoint público para recibir eventos de Stripe.
    """
    def post(self, request, *args, **kwargs):
        payload = request.body
        sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
        try:
            evt = stripe.Webhook.construct_event(
                payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
            )
        except Exception:
            return Response(status=400)

        # Solo nos interesa el pago exitoso
        if evt['type'] == 'payment_intent.succeeded':
            intent = evt['data']['object']
            id_empresa = int(intent['metadata']['id_empresa'])
            id_plan = int(intent['metadata']['id_plan'])
            amount = intent['amount_received'] / 100.0
            # Stripe devuelve 'created' en timestamp en segundos
            paid_at = datetime.fromtimestamp(intent['created'])

            # 1) Actualizar la fecha de pago en Empresa
            Empresa.objects.filter(pk=id_empresa).update(fecha_hora_pago=paid_at)

            # 2) Crear registro en tabla Pagos
            Pagos.objects.create(
                id_empresa_id=id_empresa,
                id_plan_id=id_plan,
                ingreso=amount,
                fecha_hora_pago=paid_at
            )

        return Response(status=200)






#DashboardVentasDataflow de PRUEBA
# appdataflowai/views.py

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authentication import get_authorization_header
import jwt
from django.conf import settings
from django.utils.dateparse import parse_date
from .models import DashboardVentasDataflow
from .serializers import DashboardVentasDataflowSerializer

class DashboardVentasDataflowView(APIView):
    """
    Vista protegida que retorna todos los registros de DashboardVentasDataflow.
    La autenticación se realiza manualmente con JWT en la cabecera Authorization.
    """
    def get(self, request):
        # 1) Extraer y validar el token del header Authorization
        auth_header = get_authorization_header(request).split()
        if not auth_header or auth_header[0].lower() != b'bearer':
            return Response({'error': 'Token no enviado'}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            token = auth_header[1].decode('utf-8')
            # Esto lanzará ExpiredSignatureError o InvalidTokenError si no es válido
            jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            return Response({'error': 'Token expirado'}, status=status.HTTP_401_UNAUTHORIZED)
        except jwt.InvalidTokenError:
            return Response({'error': 'Token inválido'}, status=status.HTTP_401_UNAUTHORIZED)

        # 2) Consultar datos (opcional: filtrar por fecha con ?start=&end=)
        qs = DashboardVentasDataflow.objects.all().order_by('fecha_entrega')
        start = request.query_params.get('start')
        end   = request.query_params.get('end')
        if start:
            qs = qs.filter(fecha_entrega__gte=parse_date(start))
        if end:
            qs = qs.filter(fecha_entrega__lte=parse_date(end))

        # 3) Serializar y devolver
        serializer = DashboardVentasDataflowSerializer(qs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)





# Vista para retornar registros de DashboardVentas
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authentication import get_authorization_header
from django.utils.dateparse import parse_date
from django.conf import settings
import jwt

from .models import DashboardVentas
from .serializers import DashboardVentasSerializer

class DashboardVentasView(APIView):
    """
    Vista protegida que retorna los registros de DashboardVentas,
    con filtrado opcional por rango de fecha (?start=YYYY-MM-DD&end=YYYY-MM-DD)
    """

    def get(self, request):
        # 1. Autenticación JWT (manual)
        auth_header = get_authorization_header(request).split()
        if not auth_header or auth_header[0].lower() != b'bearer':
            return Response({'error': 'Token no enviado'}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            token = auth_header[1].decode('utf-8')
            jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            return Response({'error': 'Token expirado'}, status=status.HTTP_401_UNAUTHORIZED)
        except jwt.InvalidTokenError:
            return Response({'error': 'Token inválido'}, status=status.HTTP_401_UNAUTHORIZED)

        # 2. Consulta y filtros
        queryset = DashboardVentas.objects.all().order_by('fecha_venta')
        start = request.query_params.get('start')
        end = request.query_params.get('end')
        if start:
            queryset = queryset.filter(fecha_venta__gte=parse_date(start))
        if end:
            queryset = queryset.filter(fecha_venta__lte=parse_date(end))

        # 3. Serializar
        serializer = DashboardVentasSerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)









































































































# appdataflowai/views.py

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser
from rest_framework.authentication import get_authorization_header

import jwt
import pandas as pd
import logging

from django.conf import settings
from django.db import models

from .models import (
    DashboardVentasDataflow,
    DashboardVentas,
    DashboardVentasColtrade,
    DashboardVentasLoop,
    Usuario,
    Producto,
)

logger = logging.getLogger(__name__)

# Mapeo de producto-ID a modelo de dashboard
PRODUCTO_MODELO_MAP = {
    5: DashboardVentasDataflow,
    4: DashboardVentas,
    #  ...otros productos si los hubiera
}


class ImportarDatosView(APIView):
    """
    Importa un Excel y crea registros en el modelo correspondiente,
    asignando automáticamente id_empresa y id_producto desde el usuario y la URL.
    """
    parser_classes = [MultiPartParser]

    def post(self, request, id_producto):
        # 1) Autenticación JWT y extracción de usuario
        auth = get_authorization_header(request).split()
        if not auth or auth[0].lower() != b'bearer':
            return Response({'error': 'Token no enviado'}, status=status.HTTP_401_UNAUTHORIZED)
        try:
            token = auth[1].decode()
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            usuario = Usuario.objects.select_related('id_empresa').get(id_usuario=payload['id_usuario'])
        except jwt.ExpiredSignatureError:
            return Response({'error': 'Token expirado'}, status=status.HTTP_401_UNAUTHORIZED)
        except (jwt.InvalidTokenError, Usuario.DoesNotExist):
            return Response({'error': 'Token inválido o usuario no encontrado'}, status=status.HTTP_401_UNAUTHORIZED)

        # 2) Validar modelo y obtener instancia de Producto
        modelo = PRODUCTO_MODELO_MAP.get(int(id_producto))
        if not modelo:
            return Response({
                'error': f'ID de producto inválido: {id_producto}. Válidos: {list(PRODUCTO_MODELO_MAP)}'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            producto_obj = Producto.objects.get(id_producto=id_producto)
        except Producto.DoesNotExist:
            return Response({'error': f'Producto {id_producto} no encontrado'}, status=status.HTTP_400_BAD_REQUEST)

        # 3) Validar archivo Excel
        archivo = request.FILES.get('archivo')
        if not archivo:
            return Response({'error': 'No se proporcionó archivo'}, status=status.HTTP_400_BAD_REQUEST)
        if not archivo.name.lower().endswith(('.xlsx', '.xls')):
            return Response({'error': 'Formato no válido (.xlsx/.xls)'}, status=status.HTTP_400_BAD_REQUEST)
        if archivo.size > 10 * 1024 * 1024:
            return Response({'error': 'Archivo >10MB'}, status=status.HTTP_400_BAD_REQUEST)

        # 4) Leer y normalizar DataFrame
        try:
            df = pd.read_excel(archivo)
        except Exception as e:
            return Response({'error': f'Error leyendo Excel: {e}'}, status=status.HTTP_400_BAD_REQUEST)
        if df.empty:
            return Response({'error': 'Excel vacío'}, status=status.HTTP_400_BAD_REQUEST)

        df.columns = (
            df.columns
            .str.strip()
            .str.lower()
            .str.replace(' ', '_')
            .str.replace('-', '_')
        )

        # 5) Determinar campos del modelo EXCLUYENDO id_empresa e id_producto
        campos_modelo = [
            f.name for f in modelo._meta.fields
            if not isinstance(f, models.AutoField)
            and f.name not in ('id_empresa', 'id_producto')
        ]

        # 6) Filtrar sólo las columnas presentes en el Excel
        columnas = set(df.columns)
        campos_validos = [c for c in campos_modelo if c in columnas]
        if not campos_validos:
            return Response({
                'error': 'No hay columnas válidas',
                'esperados': campos_modelo,
                'encontrados': list(columnas)
            }, status=status.HTTP_400_BAD_REQUEST)

        # 7) Procesar fila por fila
        creados = 0
        errores = []
        for idx, row in df.iterrows():
            datos = {}
            try:
                # Rellenar campos válidos
                for campo in campos_validos:
                    valor = row[campo]
                    if pd.isna(valor):
                        datos[campo] = None
                    else:
                        field = modelo._meta.get_field(campo)
                        if isinstance(field, models.DateField):
                            datos[campo] = pd.to_datetime(valor).date()
                        elif isinstance(field, models.TimeField):
                            datos[campo] = pd.to_datetime(valor).time()
                        elif isinstance(field, models.IntegerField):
                            datos[campo] = int(valor)
                        elif isinstance(field, models.DecimalField):
                            datos[campo] = float(valor)
                        else:
                            datos[campo] = valor

                # Asignar foráneas obligatorias desde contexto
                datos['id_empresa'] = usuario.id_empresa
                datos['id_producto'] = producto_obj

                # Crear registro
                modelo.objects.create(**datos)
                creados += 1

            except Exception as e:
                errores.append(f'Fila {idx+2}: {e}')
                if len(errores) > 50:
                    errores.append('Detenido por exceso de errores')
                    break

        # 8) Responder
        resp = {
            'mensaje': f'{creados} registros creados correctamente',
            'totales': len(df),
            'creados': creados,
            'campos_importados': campos_validos,
        }
        if errores:
            resp['errores'] = errores[:10]
            resp['total_errores'] = len(errores)

        return Response(resp, status=status.HTTP_200_OK)


class EstadoImportacionView(APIView):
    """
    Retorna estadísticas básicas del modelo de importación.
    """
    def get(self, request, id_producto):
        auth = get_authorization_header(request).split()
        if not auth or auth[0].lower() != b'bearer':
            return Response({'error': 'Token no enviado'}, status=status.HTTP_401_UNAUTHORIZED)
        try:
            token = auth[1].decode()
            jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            return Response({'error': 'Token expirado'}, status=status.HTTP_401_UNAUTHORIZED)
        except jwt.InvalidTokenError:
            return Response({'error': 'Token inválido'}, status=status.HTTP_401_UNAUTHORIZED)

        modelo = PRODUCTO_MODELO_MAP.get(int(id_producto))
        if not modelo:
            return Response({'error': 'Producto inválido'}, status=status.HTTP_400_BAD_REQUEST)

        total = modelo.objects.count()
        campos = [
            f.name for f in modelo._meta.fields
            if not isinstance(f, models.AutoField)
        ]
        return Response({
            'id_producto': id_producto,
            'modelo': modelo.__name__,
            'total_registros': total,
            'campos': campos,
            'tabla': modelo._meta.db_table
        }, status=status.HTTP_200_OK)
