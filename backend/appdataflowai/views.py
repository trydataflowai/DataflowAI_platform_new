
import logging
from datetime import datetime, timedelta

import jwt
from django.conf import settings
from django.db import transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Usuario, RegistrosSesion

logger = logging.getLogger(__name__)


class LoginView(APIView):
    """
    Vista para autenticación de usuarios.
    Al autenticarse correctamente, además crea un registro en RegistrosSesion.
    """
    def post(self, request):
        correo = (request.data.get('correo') or '').strip()
        contrasena = (request.data.get('contrasena') or '').strip()

        if not correo or not contrasena:
            return Response({'error': 'Correo y contraseña son requeridos'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Nota: mantengo tu verificación por correo + contraseña en texto plano
            usuario = Usuario.objects.get(correo=correo, contrasena=contrasena)
        except Usuario.DoesNotExist:
            return Response({'error': 'Credenciales inválidas'}, status=status.HTTP_401_UNAUTHORIZED)
        except Exception as e:
            logger.exception("Error buscando usuario")
            return Response({'error': 'Error interno'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Verifica que el estado sea activo (id_estado == 1)
        try:
            estado_id = usuario.id_estado.id_estado
        except Exception:
            estado_id = None

        if estado_id != 1:
            return Response({'error': 'usuario inactivo'}, status=status.HTTP_403_FORBIDDEN)

        # Generamos token JWT
        payload = {
            'id_usuario': usuario.id_usuario,
            'correo': usuario.correo,
            'exp': datetime.utcnow() + timedelta(hours=1),
            'iat': datetime.utcnow()
        }

        try:
            token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')
            if isinstance(token, bytes):
                token = token.decode('utf-8')
        except Exception:
            logger.exception("Error generando token JWT")
            return Response({'error': 'Error generando token'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Intentamos crear el registro de sesión.
        registro_data = None
        try:
            # Usamos transaction.on_commit para asegurar consistencia, pero igualmente
            # creamos sin bloquear el flujo de login si falla.
            with transaction.atomic():
                # Asumo que Usuario tiene campo id_empresa FK y es instancia válida
                id_empresa_fk = getattr(usuario, 'id_empresa', None)
                # Creación: pasamos instancias FK directamente
                registro = RegistrosSesion.objects.create(
                    id_empresa=id_empresa_fk,
                    id_usuario=usuario,
                    fecha_inicio_sesion=timezone.now()
                )
                # Aseguramos que nombre_empresa/nombres queden rellenados por save()
                registro.refresh_from_db()

                registro_data = {
                    'id_registro': registro.id_registro,
                    'fecha_inicio_sesion': registro.fecha_inicio_sesion.isoformat()
                }
        except Exception as e:
            # No detenemos el login si hay error creando el registro; lo logueamos.
            logger.exception("No se pudo crear RegistrosSesion tras login para usuario %s", getattr(usuario, 'id_usuario', None))
            registro_data = None

        respuesta_usuario = {
            'id': usuario.id_usuario,
            'nombre': usuario.nombres,
            'correo': usuario.correo,
            'rol': getattr(usuario.id_permiso_acceso, 'rol', None),
            'estado': getattr(usuario.id_estado, 'estado', None)
        }

        return Response({
            'token': token,
            'usuario': respuesta_usuario,
            'registro_sesion': registro_data
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
                # 🔹 Nuevo campo solicitado: link_dashboard_externo
                'link_dashboard_externo': getattr(prod, 'link_dashboard_externo', None),
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

from rest_framework.permissions import IsAuthenticated
from django.utils.dateparse import parse_date
from .serializers import DashboardVentasDataflowSerializer
from .serializers import DashboardVentasSerializer


class DashboardVentasDataflowView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        usuario = request.user
        if not hasattr(usuario, 'id_usuario'):
            return Response({'error': 'Usuario inválido en request'}, status=401)

        qs = DashboardVentasDataflow.objects.filter(id_empresa=usuario.id_empresa).order_by('fecha_entrega')
        start = request.query_params.get('start')
        end = request.query_params.get('end')
        if start:
            qs = qs.filter(fecha_entrega__gte=parse_date(start))
        if end:
            qs = qs.filter(fecha_entrega__lte=parse_date(end))

        serializer = DashboardVentasDataflowSerializer(qs, many=True)
        return Response(serializer.data, status=200)


class DashboardVentasView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        usuario = request.user
        if not hasattr(usuario, 'id_usuario'):
            return Response({'error': 'Usuario inválido en request'}, status=401)

        queryset = DashboardVentas.objects.filter(id_empresa=usuario.id_empresa).order_by('fecha_venta')
        start = request.query_params.get('start')
        end = request.query_params.get('end')
        if start:
            queryset = queryset.filter(fecha_venta__gte=parse_date(start))
        if end:
            queryset = queryset.filter(fecha_venta__lte=parse_date(end))

        serializer = DashboardVentasSerializer(queryset, many=True, context={'usuario': usuario})
        return Response(serializer.data, status=200)

    




























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
    DashboardSalesreview,
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
    10: DashboardSalesreview,
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
    3: 1000,  # Enterprise
    4: 1,
    5: 5,   # Dataflow
    6: 1000,
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
from .models import DashboardSalesreview
from .serializers import DashboardSalesreviewSerializer

class DashboardSalesreviewView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        usuario = request.user
        if not hasattr(usuario, 'id_usuario'):
            return Response({'error': 'Usuario inválido en request'}, status=status.HTTP_401_UNAUTHORIZED)
        try:
            queryset = DashboardSalesreview.objects.filter(id_empresa=usuario.id_empresa).order_by('fecha_compra')
        except Exception as exc:
            return Response({'error': 'Error al consultar datos'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        start = request.query_params.get('start')
        end = request.query_params.get('end')
        if start:
            date_start = parse_date(start)
            if not date_start:
                return Response({'error': 'Formato de fecha "start" inválido. Use YYYY-MM-DD'}, status=status.HTTP_400_BAD_REQUEST)
            queryset = queryset.filter(fecha_compra__gte=date_start)
        if end:
            date_end = parse_date(end)
            if not date_end:
                return Response({'error': 'Formato de fecha "end" inválido. Use YYYY-MM-DD'}, status=status.HTTP_400_BAD_REQUEST)
            queryset = queryset.filter(fecha_compra__lte=date_end)

        serializer = DashboardSalesreviewSerializer(queryset, many=True, context={'usuario': usuario})
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





#VISTA PARA RETORNAR LAS HERRAMIENTAS CORRESPONDIENTES A CADA USUARIO
import jwt
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .models import Usuario, DetalleProductoHerramientas


class HerramientasUsuarioView(APIView):
    """
    Retorna una lista de productos (producto_herramienta) asociados al usuario autenticado,
    sin información del usuario.
    """
    def get(self, request):
        token = request.headers.get('Authorization', '').split(' ')[-1]
        if not token:
            return Response({'error': 'Token no proporcionado'}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            id_usuario = payload.get('id_usuario')
        except jwt.ExpiredSignatureError:
            return Response({'error': 'Token expirado'}, status=status.HTTP_401_UNAUTHORIZED)
        except jwt.InvalidTokenError:
            return Response({'error': 'Token inválido'}, status=status.HTTP_401_UNAUTHORIZED)

        # traemos los detalles vinculados al usuario (evita N+1)
        detalles = DetalleProductoHerramientas.objects.select_related(
            'id_producto',
            'id_producto__id_area',
            'id_producto__id_estado'
        ).filter(id_usuario__id_usuario=id_usuario)

        productos = []
        for dp in detalles:
            prod = dp.id_producto  # instancia ProductoHerramientas

            # nombre del campo del estado/área puede variar; try varios nombres comunes
            estado_obj = getattr(prod, 'id_estado', None)
            estado_val = None
            if estado_obj is not None:
                estado_val = getattr(estado_obj, 'estado', None) or getattr(estado_obj, 'nombre', None)

            area_obj = getattr(prod, 'id_area', None)
            area_id = getattr(area_obj, 'id_area', None) or getattr(area_obj, 'pk', None)
            area_nombre = getattr(area_obj, 'area_trabajo', None) or getattr(area_obj, 'nombre', None)

            productos.append({
                'id_producto': getattr(prod, 'id_producto_herramienta', None) or getattr(prod, 'pk', None),
                'producto': getattr(prod, 'producto_herramienta', None),
                'tipo_producto': getattr(prod, 'tipo_producto', None),
                'link_producto': getattr(prod, 'link_producto', None),
                'estado': estado_val,
                'area': {
                    'id_area': area_id,
                    'nombre': area_nombre,
                }
            })

        return Response(productos, status=status.HTTP_200_OK)




#
#Vista para el crud del dashboard de SALESREVIEW del modelo: DashboardSalesreview
# views.py
import jwt
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import AuthenticationFailed
from .models import DashboardSalesreview, Usuario
from .serializers import DashboardSalesreviewSerializer
from django.shortcuts import get_object_or_404
from datetime import datetime

class DashboardSalesreviewListCreate(APIView):
    """
    GET (lista con filtros opcionales): ?mes=abril  OR ?mes_numero=4 OR ?fecha_from=2025-04-01&fecha_to=2025-04-30
    POST: crea un registro (id_producto se forzará a DEFAULT_PRODUCT_ID en el serializer).
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
            usuario = Usuario.objects.select_related('id_empresa').get(id_usuario=id_usuario)
            return usuario
        except Usuario.DoesNotExist:
            raise AuthenticationFailed('Usuario no encontrado')

    def _apply_filters(self, qs, request):
        """
        Aplica filtros de query params al queryset.
        Soporta:
        - mes (nombre, case-insensitive, exact match)
        - mes_numero (int)
        - fecha_from (YYYY-MM-DD)
        - fecha_to (YYYY-MM-DD)
        """
        q = qs
        mes = request.query_params.get('mes')
        mes_numero = request.query_params.get('mes_numero')
        fecha_from = request.query_params.get('fecha_from')
        fecha_to = request.query_params.get('fecha_to')

        if mes:
            q = q.filter(mes__iexact=mes)
        if mes_numero:
            try:
                q = q.filter(mes_numero=int(mes_numero))
            except ValueError:
                pass
        if fecha_from:
            try:
                dfrom = datetime.strptime(fecha_from, '%Y-%m-%d').date()
                q = q.filter(fecha_compra__gte=dfrom)
            except ValueError:
                pass
        if fecha_to:
            try:
                dto = datetime.strptime(fecha_to, '%Y-%m-%d').date()
                q = q.filter(fecha_compra__lte=dto)
            except ValueError:
                pass
        return q

    def get(self, request):
        try:
            usuario = self._get_usuario_from_token(request)
        except AuthenticationFailed as e:
            return Response({'error': str(e)}, status=status.HTTP_401_UNAUTHORIZED)

        empresa = getattr(usuario, 'id_empresa', None)
        if empresa is None:
            return Response({'error': 'Usuario sin empresa asignada'}, status=status.HTTP_400_BAD_REQUEST)

        qs = DashboardSalesreview.objects.filter(id_empresa=empresa)
        qs = self._apply_filters(qs, request)
        serializer = DashboardSalesreviewSerializer(qs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        try:
            usuario = self._get_usuario_from_token(request)
        except AuthenticationFailed as e:
            return Response({'error': str(e)}, status=status.HTTP_401_UNAUTHORIZED)

        empresa = getattr(usuario, 'id_empresa', None)
        if empresa is None:
            return Response({'error': 'Usuario sin empresa asignada'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = DashboardSalesreviewSerializer(data=request.data, context={'empresa': empresa})
        if serializer.is_valid():
            obj = serializer.save()
            return Response(DashboardSalesreviewSerializer(obj).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class DashboardSalesreviewDetail(APIView):
    """
    GET/PUT/PATCH/DELETE por pk. Mantiene la validación de empresa.
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
            usuario = Usuario.objects.select_related('id_empresa').get(id_usuario=id_usuario)
            return usuario
        except Usuario.DoesNotExist:
            raise AuthenticationFailed('Usuario no encontrado')

    def get(self, request, pk):
        try:
            usuario = self._get_usuario_from_token(request)
        except AuthenticationFailed as e:
            return Response({'error': str(e)}, status=status.HTTP_401_UNAUTHORIZED)

        empresa = getattr(usuario, 'id_empresa', None)
        if empresa is None:
            return Response({'error': 'Usuario sin empresa asignada'}, status=status.HTTP_400_BAD_REQUEST)

        obj = get_object_or_404(DashboardSalesreview, pk=pk)
        if obj.id_empresa != empresa:
            return Response({'error': 'No autorizado para ver este registro'}, status=status.HTTP_403_FORBIDDEN)

        serializer = DashboardSalesreviewSerializer(obj)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def _update(self, request, pk, partial):
        try:
            usuario = self._get_usuario_from_token(request)
        except AuthenticationFailed as e:
            return Response({'error': str(e)}, status=status.HTTP_401_UNAUTHORIZED)

        empresa = getattr(usuario, 'id_empresa', None)
        if empresa is None:
            return Response({'error': 'Usuario sin empresa asignada'}, status=status.HTTP_400_BAD_REQUEST)

        obj = get_object_or_404(DashboardSalesreview, pk=pk)
        if obj.id_empresa != empresa:
            return Response({'error': 'No autorizado para modificar este registro'}, status=status.HTTP_403_FORBIDDEN)

        data = dict(request.data)
        data.pop('id_empresa', None)
        data.pop('id_producto', None)
        serializer = DashboardSalesreviewSerializer(obj, data=data, partial=partial, context={'empresa': empresa})
        if serializer.is_valid():
            updated = serializer.save()
            return Response(DashboardSalesreviewSerializer(updated).data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk):
        return self._update(request, pk, partial=False)

    def patch(self, request, pk):
        return self._update(request, pk, partial=True)

    def delete(self, request, pk):
        try:
            usuario = self._get_usuario_from_token(request)
        except AuthenticationFailed as e:
            return Response({'error': str(e)}, status=status.HTTP_401_UNAUTHORIZED)

        empresa = getattr(usuario, 'id_empresa', None)
        if empresa is None:
            return Response({'error': 'Usuario sin empresa asignada'}, status=status.HTTP_400_BAD_REQUEST)

        obj = get_object_or_404(DashboardSalesreview, pk=pk)
        if obj.id_empresa != empresa:
            return Response({'error': 'No autorizado para eliminar este registro'}, status=status.HTTP_403_FORBIDDEN)

        obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class DashboardSalesreviewBulkDelete(APIView):
    """
    POST: borra en masa los registros que coinciden con los filtros y pertenecen a la empresa del usuario.
    Body (JSON) o query params soportados (se usan los query params si se llaman desde frontend sin body):
    - mes (nombre)
    - mes_numero (int)
    - fecha_from (YYYY-MM-DD)
    - fecha_to (YYYY-MM-DD)

    Responde: {'deleted': <cantidad>}
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
            usuario = Usuario.objects.select_related('id_empresa').get(id_usuario=id_usuario)
            return usuario
        except Usuario.DoesNotExist:
            raise AuthenticationFailed('Usuario no encontrado')

    def post(self, request):
        try:
            usuario = self._get_usuario_from_token(request)
        except AuthenticationFailed as e:
            return Response({'error': str(e)}, status=status.HTTP_401_UNAUTHORIZED)

        empresa = getattr(usuario, 'id_empresa', None)
        if empresa is None:
            return Response({'error': 'Usuario sin empresa asignada'}, status=status.HTTP_400_BAD_REQUEST)

        # Preparamos filtros: permitimos recibir por body (JSON) o por query params
        params = {}
        if request.data:
            params = request.data
        else:
            params = request.query_params

        # Construimos queryset base
        qs = DashboardSalesreview.objects.filter(id_empresa=empresa)
        # Re-utilizamos la lógica de filtrado (copia simple)
        mes = params.get('mes')
        mes_numero = params.get('mes_numero')
        fecha_from = params.get('fecha_from')
        fecha_to = params.get('fecha_to')

        if mes:
            qs = qs.filter(mes__iexact=mes)
        if mes_numero:
            try:
                qs = qs.filter(mes_numero=int(mes_numero))
            except ValueError:
                pass
        if fecha_from:
            try:
                dfrom = datetime.strptime(fecha_from, '%Y-%m-%d').date()
                qs = qs.filter(fecha_compra__gte=dfrom)
            except ValueError:
                pass
        if fecha_to:
            try:
                dto = datetime.strptime(fecha_to, '%Y-%m-%d').date()
                qs = qs.filter(fecha_compra__lte=dto)
            except ValueError:
                pass

        count = qs.count()
        if count == 0:
            return Response({'deleted': 0, 'detail': 'No se encontraron registros para eliminar'}, status=status.HTTP_200_OK)

        qs.delete()
        return Response({'deleted': count}, status=status.HTTP_200_OK)


from io import BytesIO
from openpyxl import Workbook
from openpyxl.utils import get_column_letter

class DashboardSalesreviewExport(APIView):
    """
    GET: Exporta los registros filtrados de la empresa del usuario como un archivo Excel (.xlsx).
    Soporta los mismos filtros que DashboardSalesreviewListCreate:
    - mes
    - mes_numero
    - fecha_from (YYYY-MM-DD)
    - fecha_to   (YYYY-MM-DD)
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
            usuario = Usuario.objects.select_related('id_empresa').get(id_usuario=id_usuario)
            return usuario
        except Usuario.DoesNotExist:
            raise AuthenticationFailed('Usuario no encontrado')

    def _apply_filters(self, qs, request):
        """
        Copia simple de la lógica de filtros usada en ListCreate.
        """
        q = qs
        mes = request.query_params.get('mes')
        mes_numero = request.query_params.get('mes_numero')
        fecha_from = request.query_params.get('fecha_from')
        fecha_to = request.query_params.get('fecha_to')

        if mes:
            q = q.filter(mes__iexact=mes)
        if mes_numero:
            try:
                q = q.filter(mes_numero=int(mes_numero))
            except ValueError:
                pass
        if fecha_from:
            try:
                dfrom = datetime.strptime(fecha_from, '%Y-%m-%d').date()
                q = q.filter(fecha_compra__gte=dfrom)
            except ValueError:
                pass
        if fecha_to:
            try:
                dto = datetime.strptime(fecha_to, '%Y-%m-%d').date()
                q = q.filter(fecha_compra__lte=dto)
            except ValueError:
                pass
        return q

    def get(self, request):
        # autenticar
        try:
            usuario = self._get_usuario_from_token(request)
        except AuthenticationFailed as e:
            return Response({'error': str(e)}, status=status.HTTP_401_UNAUTHORIZED)

        empresa = getattr(usuario, 'id_empresa', None)
        if empresa is None:
            return Response({'error': 'Usuario sin empresa asignada'}, status=status.HTTP_400_BAD_REQUEST)

        # obtener queryset y aplicar filtros
        qs = DashboardSalesreview.objects.filter(id_empresa=empresa)
        qs = self._apply_filters(qs, request)

        # serializar
        serializer = DashboardSalesreviewSerializer(qs, many=True)
        data = serializer.data  # lista de OrderedDicts

        # Preparar workbook con openpyxl
        wb = Workbook()
        ws = wb.active
        ws.title = "DashboardSalesReview"

        # Determinar headers: si no hay registros usar fields del serializer
        if data and len(data) > 0:
            headers = list(data[0].keys())
        else:
            # si no hay datos, tomamos los campos definidos en el serializer Meta
            try:
                headers = list(DashboardSalesreviewSerializer.Meta.fields)
            except Exception:
                headers = [
                    'id_registro','id','mes','mes_numero','semana','dia_compra','fecha_compra','fecha_envio',
                    'numero_pedido','numero_oc','estado','linea','fuente','sku_enviado','categoria','producto',
                    'precio_unidad_antes_iva','unidades','ingresos_antes_iva'
                ]

        # escribir headers
        for col_idx, h in enumerate(headers, start=1):
            cell = ws.cell(row=1, column=col_idx, value=h)

        # escribir filas
        for row_idx, row in enumerate(data, start=2):
            for col_idx, h in enumerate(headers, start=1):
                val = row.get(h, None)
                # normalizar tipos: las fechas serializadas ya vienen como strings (YYYY-MM-DD) desde el serializer
                ws.cell(row=row_idx, column=col_idx, value=val)

        # opcional: autoajustar anchos de columna (básico)
        for i, _ in enumerate(headers, start=1):
            col = get_column_letter(i)
            max_length = 0
            for cell in ws[col]:
                try:
                    if cell.value:
                        s = str(cell.value)
                        if len(s) > max_length:
                            max_length = len(s)
                except Exception:
                    pass
            adjusted_width = min(max_length + 2, 60)
            ws.column_dimensions[col].width = adjusted_width

        # guardar en memoria
        output = BytesIO()
        wb.save(output)
        output.seek(0)

        # nombre de archivo (incluye id_empresa o pk)
        empresa_id = getattr(empresa, 'id_empresa', None) or getattr(empresa, 'pk', None) or 'empresa'
        today = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"dashboard_salesreview_{empresa_id}_{today}.xlsx"

        # respuesta HttpResponse con attachment
        from django.http import HttpResponse
        response = HttpResponse(
            output.read(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response
    


# vista para SHOPIFY 
#Otro comentario
# views.py
import re
import time
import requests
from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.http import require_GET
from django.views.decorators.csrf import csrf_exempt

# --- estilo Stripe: tomamos la config desde settings (que ya usa decouple) ---
SHOPIFY_SHOP_DOMAIN = getattr(settings, "SHOPIFY_SHOP_DOMAIN", None)
SHOPIFY_ACCESS_TOKEN = getattr(settings, "SHOPIFY_ACCESS_TOKEN", None)
API_VERSION = getattr(settings, "SHOPIFY_API_VERSION", "2025-10")

# Crear headers a nivel de módulo (igual que stripe.api_key = settings.STRIPE_SECRET_KEY)
SHOPIFY_HEADERS = {
    "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
    "Content-Type": "application/json",
}

def _fetch_from_shopify(resource_path, shop=None, token=None, limit=50, fetch_all=False, timeout=20):
    """Helper compacto para obtener recursos (ej. products.json)."""
    shop = shop or SHOPIFY_SHOP_DOMAIN
    token = token or SHOPIFY_ACCESS_TOKEN

    if not shop or not token:
        # Mismo comportamiento simple que en tu ejemplo: falla en la llamada si no hay token.
        raise requests.RequestException(
            "Falta configuración: define SHOPIFY_SHOP_DOMAIN y SHOPIFY_ACCESS_TOKEN en tu .env/settings"
        )

    headers = {
        "X-Shopify-Access-Token": token,
        "Content-Type": "application/json",
    }

    base_url = f"https://{shop}/admin/api/{API_VERSION}/{resource_path}"
    params = {"limit": max(1, min(250, int(limit)))}

    results = []
    url = base_url

    while True:
        resp = requests.get(url, headers=headers, params=params if url == base_url else None, timeout=timeout)

        # retry sencillo si rate-limited
        if resp.status_code == 429:
            time.sleep(2)
            resp = requests.get(url, headers=headers, params=params if url == base_url else None, timeout=timeout)

        resp.raise_for_status()
        data = resp.json()

        key = resource_path.split(".")[0]  # 'products'
        items = data.get(key, [])

        if not fetch_all:
            return items

        results.extend(items)

        link = resp.headers.get("Link", "")
        m = re.search(r'<([^>]+)>;\s*rel="next"', link)
        if m:
            url = m.group(1)
            params = None
            continue
        break

    return results

@csrf_exempt
@require_GET
def shopify_products(request):
    """
    GET /shopify/products/?limit=50
    Opcional: ?all=1 para traer TODAS las páginas (paginación automática).
    Opcional: ?shop=otra-tienda.myshopify.com para sobrescribir el shop configurado.
    """
    try:
        limit = int(request.GET.get("limit", 50))
    except (TypeError, ValueError):
        return JsonResponse({"error": "limit debe ser entero"}, status=400)

    fetch_all = request.GET.get("all") in ("1", "true", "True")
    shop = request.GET.get("shop") or SHOPIFY_SHOP_DOMAIN

    if not SHOPIFY_ACCESS_TOKEN or not shop:
        return JsonResponse(
            {"error": "Falta configuración de SHOPIFY_ACCESS_TOKEN o SHOPIFY_SHOP_DOMAIN en settings/.env"},
            status=500
        )

    try:
        products = _fetch_from_shopify("products.json", shop=shop, limit=limit, fetch_all=fetch_all)
    except requests.RequestException as e:
        return JsonResponse({"error": "Error al consultar Shopify", "detail": str(e)}, status=500)

    return JsonResponse({"products": products}, json_dumps_params={"ensure_ascii": False})
