ayúdame con lo siguiente y DAME LOS CODIGOS COMLETOS, EN EL BACKEND EL SERIALIZADOR, LA VISTA Y LA URL, Y EN EL FRONT EL JS Y EL JSX COMPLETOS

primero para que lo tengas en cuenta, quiero que use seguridad token JTW en el backend, te paso un ejemplo

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

este es mi login

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
        except Exception:
            logger.exception("Error buscando usuario")
            return Response({'error': 'Error interno'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # Verifica que el estado sea activo (id_estado == 1)
        try:
            estado_id = usuario.id_estado.id_estado
        except Exception:
            estado_id = None

    if estado_id != 1:
            return Response({'error': 'usuario inactivo'}, status=status.HTTP_403_FORBIDDEN)

    # Generamos access token (2 horas) y refresh token (7 días)
        now = timezone.now()
        access_token_exp = now + timedelta(hours=2)
        refresh_token_exp = now + timedelta(days=7)

    # Payload para access token
        access_payload = {
            'id_usuario': usuario.id_usuario,
            'correo': usuario.correo,
            'type': 'access',
            'exp': int(access_token_exp.timestamp()),
            'iat': int(now.timestamp())
        }

    # Payload para refresh token
        refresh_payload = {
            'id_usuario': usuario.id_usuario,
            'correo': usuario.correo,
            'type': 'refresh',
            'exp': int(refresh_token_exp.timestamp()),
            'iat': int(now.timestamp())
        }

    try:
            access_token = jwt.encode(access_payload, settings.SECRET_KEY, algorithm='HS256')
            refresh_token = jwt.encode(refresh_payload, settings.SECRET_KEY, algorithm='HS256')

    # Aseguramos que sean strings
            if isinstance(access_token, bytes):
                access_token = access_token.decode('utf-8')
            if isinstance(refresh_token, bytes):
                refresh_token = refresh_token.decode('utf-8')

    except Exception:
            logger.exception("Error generando tokens JWT")
            return Response({'error': 'Error generando tokens'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # Intentamos crear el registro de sesión (SIN refresh_token para no modificar el modelo)
        registro_data = None
        try:
            with transaction.atomic():
                id_empresa_fk = getattr(usuario, 'id_empresa', None)
                registro = RegistrosSesion.objects.create(
                    id_empresa=id_empresa_fk,
                    id_usuario=usuario,
                    fecha_inicio_sesion=timezone.now()
                    # NO incluimos refresh_token aquí para no modificar el modelo
                )
                registro.refresh_from_db()

    registro_data = {
                    'id_registro': registro.id_registro,
                    'fecha_inicio_sesion': registro.fecha_inicio_sesion.isoformat()
                }
        except Exception:
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
            'token': access_token,  # Mantenemos 'token' para compatibilidad
            'refresh_token': refresh_token,  # Añadimos refresh_token
            'usuario': respuesta_usuario,
            'registro_sesion': registro_data,
            'expires_in': 7200  # 2 horas en segundos
        }, status=status.HTTP_200_OK)

y ahora un ejemplo de JS

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const obtenerInfoUsuario = async () => {
  const token = localStorage.getItem('token');

  const response = await fetch(`${API_BASE_URL}usuario/info/`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('No se pudo obtener la información del usuario');
  }

  return await response.json();
};
