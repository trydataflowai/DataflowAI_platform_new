# appdataflowai/authentication.py
import jwt
from django.conf import settings
from rest_framework.authentication import BaseAuthentication, get_authorization_header
from rest_framework.exceptions import AuthenticationFailed

from .models import Usuario

class JWTAuthentication(BaseAuthentication):
    """
    Decodifica Bearer JWT y devuelve (user, token) donde user es instancia de Usuario.
    Si no hay Authorization header, devuelve None para que DRF pruebe otras autenticaciones.
    """
    def authenticate(self, request):
        auth = get_authorization_header(request).split()
        if not auth or auth[0].lower() != b'bearer':
            return None

        try:
            token = auth[1].decode('utf-8')
        except Exception:
            raise AuthenticationFailed('Formato de token inválido')

        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed('Token expirado')
        except jwt.InvalidTokenError:
            raise AuthenticationFailed('Token inválido')

        # buscar claim con id de usuario o email
        user_ident = payload.get('user_id') or payload.get('id_usuario') or payload.get('sub')
        email = payload.get('email') or payload.get('correo')

        if user_ident:
            try:
                user_ident_int = int(user_ident)
            except Exception:
                user_ident_int = user_ident
            try:
                usuario = Usuario.objects.select_related('id_empresa', 'id_permiso_acceso', 'id_estado').get(id_usuario=user_ident_int)
            except Usuario.DoesNotExist:
                raise AuthenticationFailed('Usuario no encontrado')
        elif email:
            try:
                usuario = Usuario.objects.select_related('id_empresa', 'id_permiso_acceso', 'id_estado').get(correo=email)
            except Usuario.DoesNotExist:
                raise AuthenticationFailed('Usuario no encontrado')
        else:
            raise AuthenticationFailed('Claims del token incompletos')

        # compatibilidad mínima: setear is_authenticated (DRF y librerías pueden esperarlo)
        setattr(usuario, 'is_authenticated', True)
        return (usuario, token)

    def authenticate_header(self, request):
        return 'Bearer'
