#HOLA DANI, ESTO ES POR PARTE DE JULIAN


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
    DashboardVentasDataflow
)

class LoginView(APIView):
    """
    Vista para autenticación de usuarios.
    Ahora valida además que el usuario esté activo (id_estado == 1).
    Si el usuario no está activo devuelve {'error': 'usuario inactivo'} con status 403.
    """
    def post(self, request):
        correo = request.data.get('correo', '').strip()
        contrasena = request.data.get('contrasena', '').strip()

        if not correo or not contrasena:
            return Response({'error': 'Correo y contraseña son requeridos'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Busca usuario por correo y contraseña (manteniendo tu enfoque actual de contraseñas en texto plano)
            usuario = Usuario.objects.get(correo=correo, contrasena=contrasena)
        except Usuario.DoesNotExist:
            return Response({'error': 'Credenciales inválidas'}, status=status.HTTP_401_UNAUTHORIZED)

        # Verifica que el estado sea activo (id_estado == 1)
        # id_estado es FK a Estado; comparamos la PK
        try:
            estado_id = usuario.id_estado.id_estado
        except Exception:
            estado_id = None

        if estado_id != 1:
            # Usuario existe pero no está activo
            return Response({'error': 'usuario inactivo'}, status=status.HTTP_403_FORBIDDEN)

        # Usuario activo: generamos token JWT
        payload = {
            'id_usuario': usuario.id_usuario,
            'correo': usuario.correo,
            'exp': datetime.utcnow() + timedelta(hours=1),  # mantiene 1 hora; ajusta si quieres
            'iat': datetime.utcnow()
        }

        token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')
        # jwt.encode puede devolver bytes en algunas versiones; aseguramos string
        if isinstance(token, bytes):
            token = token.decode('utf-8')

        return Response({
            'token': token,
            'usuario': {
                'id': usuario.id_usuario,
                'nombre': usuario.nombres,
                'correo': usuario.correo,
                'rol': getattr(usuario.id_permiso_acceso, 'rol', None),
                'estado': getattr(usuario.id_estado, 'estado', None)
            }
        }, status=status.HTTP_200_OK)

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
                'nombre_corto': usuario.id_empresa.nombre_corto,   # 🔹 agregado
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
    junto con información relevante del producto, área y usuario.
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
            usuario = Usuario.objects.select_related(
                'id_empresa',
                'id_permiso_acceso'
            ).get(id_usuario=id_usuario)
        except Usuario.DoesNotExist:
            return Response({'error': 'Usuario no encontrado'}, status=404)

        # Traemos productos con relaciones (estado y área) para evitar N+1 queries
        detalles = DetalleProducto.objects.select_related(
            'id_producto',
            'id_producto__id_estado',
            'id_producto__id_area'
        ).filter(id_usuario=usuario)

        productos = []
        for dp in detalles:
            prod = dp.id_producto  # instancia Producto

            productos.append({
                'id_producto': getattr(prod, 'id_producto', None),
                'producto': getattr(prod, 'producto', None),
                'slug': getattr(prod, 'slug', None),
                'iframe': getattr(prod, 'iframe', None),
                'estado': getattr(prod.id_estado, 'estado', None) if getattr(prod, 'id_estado', None) else None,
                'link_pb': getattr(prod, 'link_pb', None),
                'categoria_producto': getattr(prod, 'categoria_producto', None),
                # 🔹 Nueva info del área
                'area': {
                    'id_area': getattr(prod.id_area, 'id_area', None),
                    'nombre': getattr(prod.id_area, 'area_trabajo', None),
                },
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
    3: 100,  # Enterprise (o el número que definas)
    4: 1,
    5: 5,   # Dataflow (o el número que definas)
    6:100,
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
    


from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authentication import get_authorization_header
from django.utils.dateparse import parse_date
from django.conf import settings
import jwt

from .models import DashboardSales
from .serializers import DashboardSalesSerializer


class DashboardSalesView(APIView):
    """
    Protected view that returns DashboardSales records,
    with optional filtering by date range (?start=YYYY-MM-DD&end=YYYY-MM-DD)
    """

    def get(self, request):
        # 1. Manual JWT authentication
        auth_header = get_authorization_header(request).split()
        if not auth_header or auth_header[0].lower() != b'bearer':
            return Response({'error': 'Token not provided'}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            token = auth_header[1].decode('utf-8')
            jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            return Response({'error': 'Token expired'}, status=status.HTTP_401_UNAUTHORIZED)
        except jwt.InvalidTokenError:
            return Response({'error': 'Invalid token'}, status=status.HTTP_401_UNAUTHORIZED)

        # 2. Query and filters
        queryset = DashboardSales.objects.all().order_by('sale_date')
        start = request.query_params.get('start')
        end = request.query_params.get('end')
        if start:
            queryset = queryset.filter(sale_date__gte=parse_date(start))
        if end:
            queryset = queryset.filter(sale_date__lte=parse_date(end))

        # 3. Serialize
        serializer = DashboardSalesSerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)














# Vista para retornar registros de DashboardFinanzas
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authentication import get_authorization_header
from django.utils.dateparse import parse_date
from django.conf import settings
import jwt

from .models import DashboardFinanzas
from .serializers import DashboardFinanzasSerializer

class DashboardFinanzasView(APIView):
    """
    Vista protegida que retorna los registros de DashboardFinanzas,
    con filtrado opcional por rango de fechas (?start=YYYY-MM-DD&end=YYYY-MM-DD)
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

        # 2. Consulta y filtros por fecha_registro
        queryset = DashboardFinanzas.objects.all().order_by('fecha_registro')
        start = request.query_params.get('start')
        end = request.query_params.get('end')
        if start:
            queryset = queryset.filter(fecha_registro__gte=parse_date(start))
        if end:
            queryset = queryset.filter(fecha_registro__lte=parse_date(end))

        # 3. Serializar
        serializer = DashboardFinanzasSerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)





from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authentication import get_authorization_header
from django.utils.dateparse import parse_date
from django.conf import settings
import jwt

from .models import DashboardCompras
from .serializers import DashboardComprasSerializer

class DashboardComprasView(APIView):
    """
    Vista protegida que retorna los registros de DashboardCompras,
    con filtrado opcional por rango de fechas (?start=YYYY-MM-DD&end=YYYY-MM-DD)
    """

    def get(self, request):
        # 1. Autenticación JWT manual
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

        # 2. Consulta y filtros por fecha_compra
        queryset = DashboardCompras.objects.all().order_by('fecha_compra')
        start = request.query_params.get('start')
        end = request.query_params.get('end')
        if start:
            queryset = queryset.filter(fecha_compra__gte=parse_date(start))
        if end:
            queryset = queryset.filter(fecha_compra__lte=parse_date(end))

        # 3. Serialización
        serializer = DashboardComprasSerializer(queryset, many=True)
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
    DashboardFinanzas,
    DashboardVentasColtrade,
    DashboardVentasLoop,
    Usuario,
    Producto,
)

logger = logging.getLogger(__name__)

# Mapeo de producto-ID a modelo de dashboard
PRODUCTO_MODELO_MAP = {
    3: DashboardVentasDataflow,
    2: DashboardVentas,
    4: DashboardFinanzas,
    1: DashboardCompras,
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




"""

Endpoints para página de perfil

"""
# your_app/views.py
import jwt
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import AuthenticationFailed
from .models import Usuario
from .serializers import PasswordChangeSerializer

class CambiarContrasenaView(APIView):
    """
    PATCH: Cambia la contraseña del usuario autenticado por JWT.
    Body JSON:
    {
      "contrasena_actual": "laActual",
      "contrasena_nueva": "laNueva"
    }
    (ATENCIÓN: guarda la contraseña en texto plano tal cual se recibe)
    """

    def _get_usuario_from_token(self, request):
        auth = request.headers.get('Authorization', '')
        token = auth.split('Bearer ')[-1] if 'Bearer ' in auth else auth.split(' ')[-1] if auth else ''
        if not token:
            raise AuthenticationFailed('No se proporcionó token')

        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            id_usuario = payload.get('id_usuario')
            if not id_usuario:
                raise AuthenticationFailed('Token inválido')
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed('Token expirado')
        except jwt.InvalidTokenError:
            raise AuthenticationFailed('Token inválido')

        try:
            usuario = Usuario.objects.get(id_usuario=id_usuario)
            return usuario
        except Usuario.DoesNotExist:
            raise AuthenticationFailed('Usuario no encontrado')

    def patch(self, request):
        try:
            usuario = self._get_usuario_from_token(request)
        except AuthenticationFailed as e:
            return Response({'error': str(e)}, status=status.HTTP_401_UNAUTHORIZED)

        serializer = PasswordChangeSerializer(data=request.data, context={'user': usuario})
        if serializer.is_valid():
            serializer.save()
            return Response({'detail': 'Contraseña actualizada correctamente.'}, status=status.HTTP_200_OK)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)




#modificar usuario y empresa
# views.py
import jwt
from django.conf import settings
from django.db import IntegrityError, transaction
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, serializers
from rest_framework.exceptions import AuthenticationFailed

from .models import Usuario, Empresa, Estado, TipoPlan, PermisoAcceso


def _get_usuario_from_token(request):
    """
    Extrae y valida el token JWT del header Authorization y devuelve la instancia Usuario.
    Lanza AuthenticationFailed si algo falla.
    """
    auth = request.headers.get('Authorization', '')
    token = ''
    if auth:
        token = auth.split('Bearer ')[-1] if 'Bearer ' in auth else auth.split(' ')[-1]

    if not token:
        raise AuthenticationFailed('No se proporcionó token')

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        id_usuario = payload.get('id_usuario')
        if not id_usuario:
            raise AuthenticationFailed('Token inválido')
    except jwt.ExpiredSignatureError:
        raise AuthenticationFailed('Token expirado')
    except jwt.InvalidTokenError:
        raise AuthenticationFailed('Token inválido')

    try:
        usuario = Usuario.objects.select_related('id_empresa__id_plan', 'id_estado', 'id_permiso_acceso').get(id_usuario=id_usuario)
        return usuario
    except Usuario.DoesNotExist:
        raise AuthenticationFailed('Usuario no encontrado')


# Serializers para actualización

class UsuarioUpdateSerializer(serializers.Serializer):
    # Campos permitidos para editar en Usuario (NO se incluyen los campos bloqueados)
    nombres = serializers.CharField(max_length=200, required=False)
    apellidos = serializers.CharField(max_length=200, allow_blank=True, required=False)
    correo = serializers.EmailField(required=False)

    def validate_correo(self, value):
        # La vista debe pasar el usuario actual en context para comparar
        usuario_actual = self.context.get('usuario_actual')
        if usuario_actual and usuario_actual.correo == value:
            return value
        # Verificar unicidad
        if Usuario.objects.filter(correo=value).exists():
            raise serializers.ValidationError('El correo ya está en uso')
        return value


class EmpresaUpdateSerializer(serializers.Serializer):
    # Campos permitidos para editar en Empresa (los campos bloqueados NO están aquí)
    nombre_empresa = serializers.CharField(max_length=200, required=False)
    direccion = serializers.CharField(max_length=200, required=False)
    telefono = serializers.CharField(max_length=20, required=False)
    ciudad = serializers.CharField(max_length=100, required=False)
    pais = serializers.CharField(max_length=100, required=False)
    prefijo_pais = serializers.CharField(max_length=5, allow_blank=True, required=False)
    correo = serializers.EmailField(required=False, allow_null=True)
    pagina_web = serializers.URLField(required=False, allow_null=True)

    # validaciones adicionales si se requieren se pueden agregar aquí


class PerfilMeView(APIView):
    """
    GET: devuelve info del usuario autenticado y la empresa asociada (lectura).
    PATCH: actualiza la información del usuario autenticado (solo campos permitidos).
    Ruta: GET/PATCH /perfil/me/
    """
    def get(self, request):
        try:
            usuario = _get_usuario_from_token(request)
        except AuthenticationFailed as e:
            return Response({'error': str(e)}, status=status.HTTP_401_UNAUTHORIZED)

        empresa = usuario.id_empresa

        resp = {
            'usuario': {
                'id_usuario': usuario.id_usuario,
                'nombres': usuario.nombres,
                'apellidos': usuario.apellidos,
                'correo': usuario.correo,
                'id_permiso_acceso': getattr(usuario.id_permiso_acceso, 'id_permiso_acceso', None),
                'rol': getattr(usuario.id_permiso_acceso, 'rol', None),
                'id_estado': getattr(usuario.id_estado, 'id_estado', None),
                'estado': getattr(usuario.id_estado, 'estado', None),
            },
            'empresa': {
                'id_empresa': empresa.id_empresa,
                'id_plan': getattr(empresa.id_plan, 'id_plan', None),
                'nombre_empresa': empresa.nombre_empresa,
                'direccion': empresa.direccion,
                'telefono': empresa.telefono,
                'ciudad': empresa.ciudad,
                'pais': empresa.pais,
                'prefijo_pais': empresa.prefijo_pais,
                'correo': empresa.correo,
                'pagina_web': empresa.pagina_web,
                'id_estado': getattr(empresa.id_estado, 'id_estado', None),
                'fecha_registros': empresa.fecha_registros.isoformat() if empresa.fecha_registros else None,
                'fecha_hora_pago': empresa.fecha_hora_pago.isoformat() if empresa.fecha_hora_pago else None,
            }
        }
        return Response(resp, status=status.HTTP_200_OK)

    def patch(self, request):
        """
        Actualiza los campos permitidos del usuario autenticado.
        NO permite actualizar: id_usuario, id_empresa, id_permiso_acceso, id_estado, contrasena.
        """
        try:
            usuario = _get_usuario_from_token(request)
        except AuthenticationFailed as e:
            return Response({'error': str(e)}, status=status.HTTP_401_UNAUTHORIZED)

        serializer = UsuarioUpdateSerializer(data=request.data, context={'usuario_actual': usuario})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        # Actualizar
        try:
            with transaction.atomic():
                if 'nombres' in data:
                    usuario.nombres = data['nombres']
                if 'apellidos' in data:
                    usuario.apellidos = data['apellidos']
                if 'correo' in data:
                    usuario.correo = data['correo']
                usuario.save()
        except IntegrityError:
            return Response({'error': 'No se pudo actualizar usuario. Posible conflicto de datos.'}, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            'detail': 'Usuario actualizado correctamente',
            'usuario': {
                'id_usuario': usuario.id_usuario,
                'nombres': usuario.nombres,
                'apellidos': usuario.apellidos,
                'correo': usuario.correo
            }
        }, status=status.HTTP_200_OK)


class EmpresaView(APIView):
    """
    GET: devuelve los datos de la empresa del usuario autenticado.
    PATCH: actualiza los campos permitidos de la empresa (solo si el usuario es admin: id_permiso_acceso == 1)
    Ruta: GET/PATCH /perfil/empresa/
    """
    def get(self, request):
        try:
            usuario = _get_usuario_from_token(request)
        except AuthenticationFailed as e:
            return Response({'error': str(e)}, status=status.HTTP_401_UNAUTHORIZED)

        empresa = usuario.id_empresa
        resp = {
            'empresa': {
                'id_empresa': empresa.id_empresa,
                'id_plan': getattr(empresa.id_plan, 'id_plan', None),
                'nombre_empresa': empresa.nombre_empresa,
                'direccion': empresa.direccion,
                'telefono': empresa.telefono,
                'ciudad': empresa.ciudad,
                'pais': empresa.pais,
                'prefijo_pais': empresa.prefijo_pais,
                'correo': empresa.correo,
                'pagina_web': empresa.pagina_web,
                'id_estado': getattr(empresa.id_estado, 'id_estado', None),
                'fecha_registros': empresa.fecha_registros.isoformat() if empresa.fecha_registros else None,
                'fecha_hora_pago': empresa.fecha_hora_pago.isoformat() if empresa.fecha_hora_pago else None,
            }
        }
        return Response(resp, status=status.HTTP_200_OK)

    def patch(self, request):
        """
        Actualizar empresa: SOLO si el usuario autenticado tiene id_permiso_acceso == 1
        Campos NO editables: id_empresa, id_plan, id_estado, fecha_registros, fecha_hora_pago
        Campos editables: nombre_empresa, direccion, telefono, ciudad, pais, prefijo_pais, correo, pagina_web
        """
        try:
            usuario = _get_usuario_from_token(request)
        except AuthenticationFailed as e:
            return Response({'error': str(e)}, status=status.HTTP_401_UNAUTHORIZED)

        # comprobación de permiso (solo rol con id_permiso_acceso == 1 puede editar empresa)
        permiso_id = getattr(usuario.id_permiso_acceso, 'id_permiso_acceso', None)
        if permiso_id != 1:
            return Response({'error': 'No autorizado. Se requiere permiso administrativo para editar la empresa.'}, status=status.HTTP_403_FORBIDDEN)

        empresa = usuario.id_empresa

        serializer = EmpresaUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        try:
            with transaction.atomic():
                if 'nombre_empresa' in data:
                    empresa.nombre_empresa = data['nombre_empresa']
                if 'direccion' in data:
                    empresa.direccion = data['direccion']
                if 'telefono' in data:
                    empresa.telefono = data['telefono']
                if 'ciudad' in data:
                    empresa.ciudad = data['ciudad']
                if 'pais' in data:
                    empresa.pais = data['pais']
                if 'prefijo_pais' in data:
                    empresa.prefijo_pais = data['prefijo_pais']
                if 'correo' in data:
                    empresa.correo = data['correo']
                if 'pagina_web' in data:
                    empresa.pagina_web = data['pagina_web']
                empresa.save()
        except IntegrityError:
            return Response({'error': 'No se pudo actualizar la empresa. Posible conflicto de datos.'}, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            'detail': 'Empresa actualizada correctamente',
            'empresa': {
                'id_empresa': empresa.id_empresa,
                'nombre_empresa': empresa.nombre_empresa,
                'direccion': empresa.direccion,
                'telefono': empresa.telefono,
                'ciudad': empresa.ciudad,
                'pais': empresa.pais,
                'prefijo_pais': empresa.prefijo_pais,
                'correo': empresa.correo,
                'pagina_web': empresa.pagina_web,
            }
        }, status=status.HTTP_200_OK)















#ACTIVAR O DESACTIVAR USUARIOS
# views.py
import jwt
import logging
from django.conf import settings
from django.db import IntegrityError, transaction
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, serializers
from rest_framework.exceptions import AuthenticationFailed

from .models import Usuario, Empresa, Estado, TipoPlan, PermisoAcceso, Areas

logger = logging.getLogger(__name__)

# Map de límites por plan: None = ilimitado
PLAN_LIMITES = {
    1: 1,    # Basic
    2: 3,    # Professional
    3: 100,  # Enterprise -> ilimitado
    4: 1,
    5: 3,
    6: 100,  # Unlimited
}


def _get_usuario_from_token(request):
    auth = request.headers.get('Authorization', '')
    token = ''
    if auth:
        token = auth.split('Bearer ')[-1] if 'Bearer ' in auth else auth.split(' ')[-1]

    if not token:
        raise AuthenticationFailed('No se proporcionó token')

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        id_usuario = payload.get('id_usuario')
        if not id_usuario:
            raise AuthenticationFailed('Token inválido')
    except jwt.ExpiredSignatureError:
        raise AuthenticationFailed('Token expirado')
    except jwt.InvalidTokenError:
        raise AuthenticationFailed('Token inválido')

    try:
        usuario = Usuario.objects.select_related('id_empresa__id_plan', 'id_estado', 'id_permiso_acceso', 'id_area').get(id_usuario=id_usuario)
        return usuario
    except Usuario.DoesNotExist:
        raise AuthenticationFailed('Usuario no encontrado')


# Serializers

class EstadoChangeSerializer(serializers.Serializer):
    id_estado = serializers.IntegerField()


class CreateUserSerializer(serializers.Serializer):
    nombres = serializers.CharField(max_length=200)
    apellidos = serializers.CharField(max_length=200, allow_blank=True, required=False)
    correo = serializers.EmailField()
    contrasena = serializers.CharField(max_length=255)
    contrasena_confirm = serializers.CharField(max_length=255, write_only=True)
    id_permiso_acceso = serializers.IntegerField(required=False)
    id_estado = serializers.IntegerField(required=False)
    id_area = serializers.IntegerField(required=True)  # ahora obligatorio desde frontend

    def validate_id_permiso_acceso(self, value):
        try:
            PermisoAcceso.objects.get(id_permiso_acceso=value)
        except PermisoAcceso.DoesNotExist:
            raise serializers.ValidationError('PermisoAcceso no existe')
        return value

    def validate_id_estado(self, value):
        try:
            Estado.objects.get(id_estado=value)
        except Estado.DoesNotExist:
            raise serializers.ValidationError('Estado no existe')
        return value

    def validate_id_area(self, value):
        try:
            Areas.objects.get(id_area=value)
        except Areas.DoesNotExist:
            raise serializers.ValidationError('Área no existe')
        return value

    def validate(self, data):
        if data.get('contrasena') != data.get('contrasena_confirm'):
            raise serializers.ValidationError({'contrasena_confirm': 'Las contraseñas no coinciden'})

        correo = data.get('correo', '').strip().lower()
        data['correo'] = correo
        return data


class RoleChangeSerializer(serializers.Serializer):
    id_permiso_acceso = serializers.IntegerField()

    def validate_id_permiso_acceso(self, value):
        try:
            PermisoAcceso.objects.get(id_permiso_acceso=value)
        except PermisoAcceso.DoesNotExist:
            raise serializers.ValidationError('PermisoAcceso no existe')
        return value


class UsuariosEmpresaView(APIView):
    """
    GET: lista usuarios de la misma empresa del usuario autenticado.
    POST: crea un usuario en la misma empresa (respectando limites del plan).
    Ruta: /perfil/usuarios/
    """
    def get(self, request):
        try:
            usuario = _get_usuario_from_token(request)
        except AuthenticationFailed as e:
            return Response({'error': str(e)}, status=status.HTTP_401_UNAUTHORIZED)

        empresa = usuario.id_empresa
        usuarios_qs = Usuario.objects.filter(id_empresa=empresa).select_related('id_estado', 'id_permiso_acceso', 'id_area')

        usuarios = []
        for u in usuarios_qs:
            usuarios.append({
                'id_usuario': u.id_usuario,
                'nombres': u.nombres,
                'apellidos': u.apellidos,
                'correo': u.correo,
                'id_permiso_acceso': getattr(u.id_permiso_acceso, 'id_permiso_acceso', None),
                'rol': getattr(u.id_permiso_acceso, 'rol', None),
                'id_estado': getattr(u.id_estado, 'id_estado', None),
                'estado': getattr(u.id_estado, 'estado', None),
                'id_area': getattr(u.id_area, 'id_area', None),
                'area_trabajo': getattr(u.id_area, 'area_trabajo', None),
            })

        return Response({'usuarios': usuarios}, status=status.HTTP_200_OK)

    def post(self, request):
        try:
            usuario_aut = _get_usuario_from_token(request)
        except AuthenticationFailed as e:
            return Response({'error': str(e)}, status=status.HTTP_401_UNAUTHORIZED)

        serializer = CreateUserSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        empresa = usuario_aut.id_empresa
        try:
            plan_id = empresa.id_plan.id_plan
        except Exception:
            plan_id = None
        limite = PLAN_LIMITES.get(plan_id, None)

        usuarios_count = Usuario.objects.filter(id_empresa=empresa).count()
        if limite is not None and usuarios_count >= limite:
            return Response({
                'error': 'Límite de usuarios alcanzado para el plan de la empresa',
                'limit': limite,
                'current': usuarios_count
            }, status=status.HTTP_403_FORBIDDEN)

        correo_normalizado = data['correo']
        if Usuario.objects.filter(correo=correo_normalizado).exists():
            return Response({'error': 'Correo ya registrado'}, status=status.HTTP_400_BAD_REQUEST)

        id_permiso_acceso = data.get('id_permiso_acceso', None)
        if id_permiso_acceso is None:
            id_permiso_acceso = getattr(usuario_aut.id_permiso_acceso, 'id_permiso_acceso', None)

        try:
            permiso_obj = PermisoAcceso.objects.get(id_permiso_acceso=id_permiso_acceso)
        except PermisoAcceso.DoesNotExist:
            permiso_obj = usuario_aut.id_permiso_acceso

        id_estado = data.get('id_estado', None)
        if id_estado is None:
            id_estado = 1
        try:
            estado_obj = Estado.objects.get(id_estado=id_estado)
        except Estado.DoesNotExist:
            return Response({'error': 'Estado no existe'}, status=status.HTTP_400_BAD_REQUEST)

        # Validar area (ahora obligatorio en serializer)
        id_area = data.get('id_area')
        try:
            area_obj = Areas.objects.get(id_area=id_area)
        except Areas.DoesNotExist:
            return Response({'error': 'Área no existe'}, status=status.HTTP_400_BAD_REQUEST)

        # Crear usuario
        try:
            with transaction.atomic():
                nuevo = Usuario.objects.create(
                    id_empresa=empresa,
                    id_permiso_acceso=permiso_obj,
                    id_area=area_obj,
                    nombres=data['nombres'],
                    apellidos=data.get('apellidos', '') or '',
                    correo=correo_normalizado,
                    contrasena=data['contrasena'],
                    id_estado=estado_obj
                )
        except IntegrityError as e:
            msg = str(e)
            logger.exception("IntegrityError creando usuario: %s", e)
            if 'unique' in msg.lower() or 'duplicate' in msg.lower() or 'correo' in msg.lower():
                return Response({'error': 'Correo ya registrado (unique constraint).'}, status=status.HTTP_400_BAD_REQUEST)
            return Response({'error': 'No se pudo crear usuario. Error de integridad en la base de datos.'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.exception("Error creando usuario: %s", e)
            return Response({'error': 'Error interno al crear usuario.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({
            'detail': 'Usuario creado correctamente',
            'usuario': {
                'id_usuario': nuevo.id_usuario,
                'nombres': nuevo.nombres,
                'apellidos': nuevo.apellidos,
                'correo': nuevo.correo,
                'id_estado': nuevo.id_estado.id_estado,
                'estado': nuevo.id_estado.estado,
                'id_area': nuevo.id_area.id_area,
                'area_trabajo': nuevo.id_area.area_trabajo
            }
        }, status=status.HTTP_201_CREATED)


class UsuarioEstadoChangeView(APIView):
    def patch(self, request, id_usuario):
        try:
            usuario_autenticado = _get_usuario_from_token(request)
        except AuthenticationFailed as e:
            return Response({'error': str(e)}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            usuario_obj = Usuario.objects.select_related('id_empresa', 'id_estado').get(id_usuario=id_usuario)
        except Usuario.DoesNotExist:
            return Response({'error': 'Usuario objetivo no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        if usuario_obj.id_empresa.id_empresa != usuario_autenticado.id_empresa.id_empresa:
            return Response({'error': 'No autorizado para modificar usuarios de otra empresa'}, status=status.HTTP_403_FORBIDDEN)

        serializer = EstadoChangeSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        nuevo_estado_id = serializer.validated_data['id_estado']
        try:
            nuevo_estado = Estado.objects.get(id_estado=nuevo_estado_id)
        except Estado.DoesNotExist:
            return Response({'error': 'Estado no existe'}, status=status.HTTP_400_BAD_REQUEST)

        usuario_obj.id_estado = nuevo_estado
        usuario_obj.save()

        return Response({
            'detail': 'Estado actualizado correctamente',
            'id_usuario': usuario_obj.id_usuario,
            'id_estado': nuevo_estado.id_estado,
            'estado': nuevo_estado.estado
        }, status=status.HTTP_200_OK)


class UsuarioRolChangeView(APIView):
    def patch(self, request, id_usuario):
        try:
            usuario_autenticado = _get_usuario_from_token(request)
        except AuthenticationFailed as e:
            return Response({'error': str(e)}, status=status.HTTP_401_UNAUTHORIZED)

        permiso_act = getattr(usuario_autenticado.id_permiso_acceso, 'id_permiso_acceso', None)
        if permiso_act != 1:
            return Response({'error': 'No autorizado. Se requiere permiso administrativo para cambiar roles.'}, status=status.HTTP_403_FORBIDDEN)

        try:
            usuario_obj = Usuario.objects.select_related('id_empresa', 'id_permiso_acceso').get(id_usuario=id_usuario)
        except Usuario.DoesNotExist:
            return Response({'error': 'Usuario objetivo no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        if usuario_obj.id_empresa.id_empresa != usuario_autenticado.id_empresa.id_empresa:
            return Response({'error': 'No autorizado para modificar usuarios de otra empresa'}, status=status.HTTP_403_FORBIDDEN)

        if usuario_obj.id_usuario == usuario_autenticado.id_usuario:
            return Response({'error': 'No puedes cambiar tu propio rol'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = RoleChangeSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        nuevo_rol_id = serializer.validated_data['id_permiso_acceso']
        try:
            nuevo_rol = PermisoAcceso.objects.get(id_permiso_acceso=nuevo_rol_id)
        except PermisoAcceso.DoesNotExist:
            return Response({'error': 'PermisoAcceso no existe'}, status=status.HTTP_400_BAD_REQUEST)

        usuario_obj.id_permiso_acceso = nuevo_rol
        usuario_obj.save()

        return Response({
            'detail': 'Rol actualizado correctamente',
            'id_usuario': usuario_obj.id_usuario,
            'id_permiso_acceso': nuevo_rol.id_permiso_acceso,
            'rol': nuevo_rol.rol
        }, status=status.HTTP_200_OK)


class UsuarioDeleteView(APIView):
    def delete(self, request, id_usuario):
        try:
            usuario_autenticado = _get_usuario_from_token(request)
        except AuthenticationFailed as e:
            return Response({'error': str(e)}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            usuario_obj = Usuario.objects.select_related('id_empresa').get(id_usuario=id_usuario)
        except Usuario.DoesNotExist:
            return Response({'error': 'Usuario objetivo no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        if usuario_obj.id_empresa.id_empresa != usuario_autenticado.id_empresa.id_empresa:
            return Response({'error': 'No autorizado para eliminar usuarios de otra empresa'}, status=status.HTTP_403_FORBIDDEN)

        if usuario_obj.id_usuario == usuario_autenticado.id_usuario:
            return Response({'error': 'No puedes eliminar tu propio usuario'}, status=status.HTTP_400_BAD_REQUEST)

        usuario_obj.delete()
        return Response({'detail': 'Usuario eliminado correctamente'}, status=status.HTTP_204_NO_CONTENT)


class PermisosListView(APIView):
    def get(self, request):
        permisos_qs = PermisoAcceso.objects.all()
        permisos = []
        for p in permisos_qs:
            permisos.append({
                'id_permiso_acceso': p.id_permiso_acceso,
                'rol': p.rol
            })
        return Response({'permisos': permisos}, status=status.HTTP_200_OK)


class AreasListView(APIView):
    """
    GET: lista todas las áreas.
    Ruta: GET /perfil/areas/
    """
    def get(self, request):
        areas_qs = Areas.objects.all()
        areas = [{'id_area': a.id_area, 'area_trabajo': a.area_trabajo} for a in areas_qs]
        return Response({'areas': areas}, status=status.HTTP_200_OK)


















































#ASOCIAR DASHBOARDS POR MEDIO DE PERFIL
import jwt
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import AuthenticationFailed
from django.db import transaction

from .models import Usuario, Producto, DetalleProducto, EmpresaDashboard
from .serializers import (
    AsgDashboardUsuarioListSerializer,
    AsgDashboardProductoSerializer,
    AsgDashboardDetalleProductoSerializer
)

# Mapa de límites por id_plan (usa el tuyo)
PLAN_LIMITES = {
    1: 1,   # Basic
    2: 5,   # Professional
    3: 10,  # Enterprise
    4: 1,
    5: 5,   # Dataflow
    6: 10,
}


class AsgDashboardBasePerfilView(APIView):
    """
    Clase base para obtener usuario desde token.
    """

    def asgdashboard_get_usuario_from_token(self, request):
        auth = request.headers.get('Authorization', '')
        token = auth.split('Bearer ')[-1] if 'Bearer ' in auth else auth.split(' ')[-1] if auth else ''
        if not token:
            raise AuthenticationFailed('No se proporcionó token')

        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            id_usuario = payload.get('id_usuario')
            if not id_usuario:
                raise AuthenticationFailed('Token inválido')
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed('Token expirado')
        except jwt.InvalidTokenError:
            raise AuthenticationFailed('Token inválido')

        try:
            usuario = Usuario.objects.get(id_usuario=id_usuario)
            return usuario
        except Usuario.DoesNotExist:
            raise AuthenticationFailed('Usuario no encontrado')


class AsgDashboardUsuariosEmpresaView(AsgDashboardBasePerfilView):
    """
    GET /asg/perfil/usuarios/  -> Lista los usuarios que pertenecen a la misma empresa
    """
    def get(self, request):
        try:
            usuario = self.asgdashboard_get_usuario_from_token(request)
        except AuthenticationFailed as e:
            return Response({'error': str(e)}, status=status.HTTP_401_UNAUTHORIZED)

        usuarios = Usuario.objects.filter(id_empresa=usuario.id_empresa)
        serializer = AsgDashboardUsuarioListSerializer(usuarios, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AsgDashboardProductosListView(AsgDashboardBasePerfilView):
    """
    GET /asg/perfil/productos/  -> Lista de productos disponibles para la empresa del usuario que hace la petición.
    Regla: se excluyen productos que estén asociados (en EmpresaDashboard) a otras empresas.
    """
    def get(self, request):
        try:
            requester = self.asgdashboard_get_usuario_from_token(request)
        except AuthenticationFailed as e:
            return Response({'error': str(e)}, status=status.HTTP_401_UNAUTHORIZED)

        # Productos que están asociados a OTRAS empresas
        productos_bloqueados_ids = EmpresaDashboard.objects.exclude(empresa=requester.id_empresa).values_list('producto_id', flat=True)
        productos = Producto.objects.exclude(id_producto__in=productos_bloqueados_ids).order_by('producto')
        serializer = AsgDashboardProductoSerializer(productos, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AsgDashboardUsuarioAsignacionesView(AsgDashboardBasePerfilView):
    """
    GET  /asg/perfil/usuarios/<id_usuario>/asignaciones/  -> devuelve productos asignados a ese usuario
    POST /asg/perfil/usuarios/<id_usuario>/asignaciones/  -> asigna un producto a ese usuario (body: { "id_producto": <int> })
    """

    def asgdashboard_get_target_usuario_or_401(self, request, id_usuario):
        try:
            requester = self.asgdashboard_get_usuario_from_token(request)
        except AuthenticationFailed as e:
            raise AuthenticationFailed(str(e))
        try:
            target = Usuario.objects.get(id_usuario=id_usuario)
        except Usuario.DoesNotExist:
            return None, Response({'error': 'Usuario objetivo no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        # Solo permitir operar sobre usuarios de la misma empresa
        if target.id_empresa.id_empresa != requester.id_empresa.id_empresa:
            return None, Response({'error': 'No autorizado para ver/editar usuarios de otra empresa.'}, status=status.HTTP_403_FORBIDDEN)

        return target, None

    def get(self, request, id_usuario):
        try:
            target, err_resp = self.asgdashboard_get_target_usuario_or_401(request, id_usuario)
            if err_resp:
                return err_resp
        except AuthenticationFailed as e:
            return Response({'error': str(e)}, status=status.HTTP_401_UNAUTHORIZED)

        asignaciones = DetalleProducto.objects.filter(id_usuario=target)
        serializer = AsgDashboardDetalleProductoSerializer(asignaciones, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @transaction.atomic
    def post(self, request, id_usuario):
        """
        Body: { "id_producto": <int> }
        """
        try:
            target, err_resp = self.asgdashboard_get_target_usuario_or_401(request, id_usuario)
            if err_resp:
                return err_resp
        except AuthenticationFailed as e:
            return Response({'error': str(e)}, status=status.HTTP_401_UNAUTHORIZED)

        id_producto = request.data.get('id_producto')
        if not id_producto:
            return Response({'error': 'Se requiere id_producto'}, status=status.HTTP_400_BAD_REQUEST)

        # Verificar existencia del producto
        try:
            producto = Producto.objects.get(id_producto=id_producto)
        except Producto.DoesNotExist:
            return Response({'error': 'Producto no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        # ** NUEVA VALIDACIÓN: si el producto está asociado en EmpresaDashboard a OTRA empresa -> bloquear **
        pertenece_otra_empresa = EmpresaDashboard.objects.filter(producto=producto).exclude(empresa=target.id_empresa).exists()
        if pertenece_otra_empresa:
            return Response({'error': 'Producto pertenece a otra empresa y no puede asignarse.'}, status=status.HTTP_400_BAD_REQUEST)

        # Límite por plan de la empresa del usuario objetivo
        plan_obj = target.id_empresa.id_plan  # objeto TipoPlan
        plan_id = getattr(plan_obj, 'id_plan', None)
        limite = PLAN_LIMITES.get(plan_id, None)
        if limite is None:
            # sin límite por defecto (puedes ajustar)
            limite = None

        # Conteo actual de asignaciones del usuario objetivo
        cuenta_actual = DetalleProducto.objects.filter(id_usuario=target).count()
        if limite is not None and cuenta_actual >= limite:
            return Response({
                'error': 'Límite de dashboards alcanzado para este usuario según su plan.',
                'limite': limite,
                'asignados': cuenta_actual
            }, status=status.HTTP_400_BAD_REQUEST)

        # Verificar si ya existe la asociación
        exists = DetalleProducto.objects.filter(id_usuario=target, id_producto=producto).exists()
        if exists:
            return Response({'error': 'Producto ya asignado a este usuario.'}, status=status.HTTP_400_BAD_REQUEST)

        # Crear la asociación
        detalle = DetalleProducto.objects.create(id_usuario=target, id_producto=producto)
        serializer = AsgDashboardDetalleProductoSerializer(detalle)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class AsgDashboardUsuarioEliminarAsignacionView(AsgDashboardBasePerfilView):
    """
    DELETE /asg/perfil/usuarios/<id_usuario>/asignaciones/<id_producto>/  -> elimina la asignación (opcional)
    """
    def delete(self, request, id_usuario, id_producto):
        try:
            requester = self.asgdashboard_get_usuario_from_token(request)
        except AuthenticationFailed as e:
            return Response({'error': str(e)}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            target = Usuario.objects.get(id_usuario=id_usuario)
        except Usuario.DoesNotExist:
            return Response({'error': 'Usuario objetivo no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        if target.id_empresa.id_empresa != requester.id_empresa.id_empresa:
            return Response({'error': 'No autorizado.'}, status=status.HTTP_403_FORBIDDEN)

        try:
            producto = Producto.objects.get(id_producto=id_producto)
        except Producto.DoesNotExist:
            return Response({'error': 'Producto no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        deleted, _ = DetalleProducto.objects.filter(id_usuario=target, id_producto=producto).delete()
        if deleted:
            return Response({'detail': 'Asignación eliminada.'}, status=status.HTTP_204_NO_CONTENT)
        else:
            return Response({'error': 'Asignación no encontrada.'}, status=status.HTTP_404_NOT_FOUND)



# Vista para retornar registros de DashboardSalesreview
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authentication import get_authorization_header
from django.utils.dateparse import parse_date
from django.conf import settings
import jwt

from .models import DashboardSalesreview
from .serializers import DashboardSalesreviewSerializer

class DashboardSalesreviewView(APIView):
    """
    Vista protegida que retorna los registros de DashboardSalesreview,
    con filtrado opcional por rango de fechas (?start=YYYY-MM-DD&end=YYYY-MM-DD)
    """

    def get(self, request):
        # 1. Autenticacion JWT (manual)
        auth_header = get_authorization_header(request).split()
        if not auth_header or auth_header[0].lower() != b'bearer':
            return Response({'error': 'Token no enviado'}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            token = auth_header[1].decode('utf-8')
            jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            return Response({'error': 'Token expirado'}, status=status.HTTP_401_UNAUTHORIZED)
        except jwt.InvalidTokenError:
            return Response({'error': 'Token invalido'}, status=status.HTTP_401_UNAUTHORIZED)

        # 2. Consulta y filtros por fecha_compra
        queryset = DashboardSalesreview.objects.all().order_by('fecha_compra')
        start = request.query_params.get('start')
        end = request.query_params.get('end')
        if start:
            date_start = parse_date(start)
            if date_start:
                queryset = queryset.filter(fecha_compra__gte=date_start)
        if end:
            date_end = parse_date(end)
            if date_end:
                queryset = queryset.filter(fecha_compra__lte=date_end)

        # 3. Serializar
        serializer = DashboardSalesreviewSerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)








#VISTA PARA SOPORTE DE MODULO
import jwt
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import AuthenticationFailed
from .models import Ticket, Usuario
from .serializers import TicketSerializer

class TokenHelperMixin:
    """
    Mixin con el método para obtener el usuario desde el token (misma lógica que tu ejemplo).
    """
    def _get_usuario_from_token(self, request):
        auth = request.headers.get('Authorization', '')
        token = ''
        if 'Bearer ' in auth:
            token = auth.split('Bearer ')[-1]
        elif auth:
            token = auth.split(' ')[-1]
        if not token:
            raise AuthenticationFailed('No se proporcionó token')

        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            id_usuario = payload.get('id_usuario')
            if not id_usuario:
                raise AuthenticationFailed('Token inválido')
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed('Token expirado')
        except jwt.InvalidTokenError:
            raise AuthenticationFailed('Token inválido')

        try:
            usuario = Usuario.objects.get(id_usuario=id_usuario)
            return usuario
        except Usuario.DoesNotExist:
            raise AuthenticationFailed('Usuario no encontrado')

class TicketListCreateView(TokenHelperMixin, APIView):
    """
    GET: Lista todos los tickets del usuario autenticado.
    POST: Crea un ticket asignado al usuario del token.
    """
    def get(self, request):
        try:
            usuario = self._get_usuario_from_token(request)
        except AuthenticationFailed as e:
            return Response({'error': str(e)}, status=status.HTTP_401_UNAUTHORIZED)

        tickets = Ticket.objects.filter(id_usuario=usuario).order_by('-fecha_creacion')
        serializer = TicketSerializer(tickets, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        try:
            usuario = self._get_usuario_from_token(request)
        except AuthenticationFailed as e:
            return Response({'error': str(e)}, status=status.HTTP_401_UNAUTHORIZED)

        # Tomamos solo los campos que el usuario debe enviar
        data = {
            'correo': request.data.get('correo'),
            'asunto': request.data.get('asunto'),
            'descripcion': request.data.get('descripcion', ''),
            # comentario lo dejamos vacío por ahora; estado se asigna por default en el modelo
        }

        serializer = TicketSerializer(data=data)
        if serializer.is_valid():
            # crear instancia pero asegurando id_usuario
            ticket = Ticket(
                id_usuario=usuario,
                correo=serializer.validated_data['correo'],
                asunto=serializer.validated_data['asunto'],
                descripcion=serializer.validated_data.get('descripcion', '')
            )
            ticket.save()
            out_serialized = TicketSerializer(ticket)
            return Response(out_serialized.data, status=status.HTTP_201_CREATED)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TicketDetailView(TokenHelperMixin, APIView):
    """
    GET: Detalle de un ticket (el ticket debe pertenecer al usuario autenticado).
    """
    def get(self, request, pk):
        try:
            usuario = self._get_usuario_from_token(request)
        except AuthenticationFailed as e:
            return Response({'error': str(e)}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            ticket = Ticket.objects.get(pk=pk)
        except Ticket.DoesNotExist:
            return Response({'error': 'Ticket no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        if ticket.id_usuario != usuario:
            return Response({'error': 'No autorizado para ver este ticket'}, status=status.HTTP_403_FORBIDDEN)

        serializer = TicketSerializer(ticket)
        return Response(serializer.data, status=status.HTTP_200_OK)

