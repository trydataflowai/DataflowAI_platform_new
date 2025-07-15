

# views.py
import jwt
from datetime import datetime, timedelta
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Usuario


class LoginView(APIView):
    def post(self, request):
        correo = request.data.get('correo', '').strip()
        contrasena = request.data.get('contrasena', '').strip()

        if not correo or not contrasena:
            return Response({'error': 'Correo y contraseña son requeridos'}, status=400)

        try:
            usuario = Usuario.objects.get(correo=correo, contrasena=contrasena)
        except Usuario.DoesNotExist:
            return Response({'error': 'Credenciales inválidas'}, status=401)

        # Generar token JWT
        payload = {
            'id_usuario': usuario.id_usuario,
            'correo': usuario.correo,
            'exp': datetime.utcnow() + timedelta(hours=2),  # Expira en 2 horas
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






from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import DetalleProducto
from django.http import JsonResponse
import jwt
from django.conf import settings
from .models import Usuario

class ProductosUsuarioView(APIView):
    def get(self, request):
        # Obtener token del header
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
                'url': dp.id_producto.Url,
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



# views.py
from .models import DashboardVentasColtrade, DashboardVentasLoop, DashboardVentasDataflow

PRODUCTO_MODELO_MAP = {
    2525: DashboardVentasColtrade,
    2626: DashboardVentasLoop,
    2727: DashboardVentasDataflow,
    # Agrega más si es necesario
}


from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
import pandas as pd
from django.conf import settings

class ImportarDatosView(APIView):
    parser_classes = [MultiPartParser]

    def post(self, request, id_producto):
        modelo = PRODUCTO_MODELO_MAP.get(int(id_producto))
        if not modelo:
            return Response({'error': 'ID de producto no válido'}, status=400)

        archivo = request.FILES.get('archivo')
        if not archivo:
            return Response({'error': 'No se proporcionó archivo'}, status=400)

        try:
            df = pd.read_excel(archivo)

            for _, row in df.iterrows():
                modelo.objects.create(
                    id_punto_venta=row['id_punto_venta'],
                    punto_venta=row['punto_venta'],
                    dinero_entregado=row['dinero_entregado'],
                    cantidad_entregada=row['cantidad_entregada'],
                    fecha_entrega=row['fecha_entrega'],
                )

            return Response({'mensaje': 'Datos importados correctamente'})
        except Exception as e:
            return Response({'error': str(e)}, status=500)



from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Usuario
import jwt
from django.conf import settings

class UsuarioInfoView(APIView):
    def get(self, request):
        # Obtener y decodificar el token manualmente
        token = request.headers.get('Authorization', '').split(' ')[-1]
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            id_usuario = payload.get('id_usuario')
        except jwt.ExpiredSignatureError:
            return Response({'error': 'Token expirado'}, status=401)
        except jwt.InvalidTokenError:
            return Response({'error': 'Token inválido'}, status=401)

        # Obtener el usuario
        try:
            usuario = Usuario.objects.select_related('id_empresa', 'id_permiso_acceso').get(id_usuario=id_usuario)
        except Usuario.DoesNotExist:
            return Response({'error': 'Usuario no encontrado'}, status=404)

        # Estructurar la respuesta
        data = {
            'id': usuario.id_usuario,
            'nombres': usuario.nombres,
            'correo': usuario.correo,
            'rol': usuario.id_permiso_acceso.rol,
            'empresa': {
                'id': usuario.id_empresa.id_empresa,
                'nombre': usuario.id_empresa.nombre_empresa,
                'ciudad': usuario.id_empresa.ciudad,
                'pais': usuario.id_empresa.pais
            }
        }
        return Response(data, status=200)