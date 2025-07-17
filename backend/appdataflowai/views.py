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

# Diccionario que mapea el ID del producto con el modelo correspondiente en base de datos.
PRODUCTO_MODELO_MAP = {
    2525: DashboardVentasColtrade,
    2626: DashboardVentasLoop,
    2727: DashboardVentasDataflow,
    # Se pueden agregar más productos en el futuro si es necesario.
}


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


class UsuarioInfoView(APIView):
    """
    Vista que retorna la información detallada del usuario autenticado,
    incluyendo datos personales, rol, empresa, categoría, plan, estado
    y los productos asignados, a partir del token JWT.
    """
    def get(self, request):
        # Se extrae y valida el token del header Authorization
        token = request.headers.get('Authorization', '').split(' ')[-1]
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            id_usuario = payload.get('id_usuario')
        except jwt.ExpiredSignatureError:
            return Response({'error': 'Token expirado'}, status=401)
        except jwt.InvalidTokenError:
            return Response({'error': 'Token inválido'}, status=401)

        # Traemos todas las relaciones necesarias en una sola query
        try:
            usuario = Usuario.objects.select_related(
                'id_empresa__id_categoria',
                'id_empresa__id_plan',
                'id_empresa__id_estado',
                'id_permiso_acceso'
            ).get(id_usuario=id_usuario)
        except Usuario.DoesNotExist:
            return Response({'error': 'Usuario no encontrado'}, status=404)

        # Construimos el payload con todo lo que necesitemos exponer
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
            'productos': [
                {
                    'id': detalle.id_producto.id_producto,
                    'nombre': detalle.id_producto.producto,
                    'url': detalle.id_producto.Url,
                    'iframe': detalle.id_producto.iframe,
                }
                for detalle in usuario.detalleproducto_set.select_related('id_producto').all()
            ]
        }

        return Response(data, status=200)


class ProductosUsuarioView(APIView):
    """
    Vista que retorna todos los productos asociados al usuario autenticado,
    junto con información relevante del producto y del usuario.
    """
    def get(self, request):
        # Se extrae y valida el token del header Authorization
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

        # Se consultan los detalles de productos vinculados al usuario
        detalles = DetalleProducto.objects.select_related('id_producto').filter(id_usuario=usuario)

        # Construcción del array de productos con info adicional del usuario
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


class ImportarDatosView(APIView):
    """
    Vista que permite importar datos desde un archivo Excel (.xlsx),
    asociándolos al modelo correspondiente según el ID del producto.
    Solo se importan columnas que coinciden con los campos del modelo.
    """
    parser_classes = [MultiPartParser]

    def post(self, request, id_producto):
        modelo = PRODUCTO_MODELO_MAP.get(int(id_producto))
        if not modelo:
            return Response({'error': 'ID de producto no válido'}, status=400)

        archivo = request.FILES.get('archivo')
        if not archivo:
            return Response({'error': 'No se proporcionó archivo'}, status=400)

        try:
            # Carga del archivo Excel y normalización de nombres de columnas
            df = pd.read_excel(archivo)
            df.columns = df.columns.str.strip().str.lower().str.replace(' ', '_')

            # Obtención de los campos válidos del modelo (excluyendo el ID autogenerado)
            campos_modelo = [
                field.name for field in modelo._meta.fields
                if not isinstance(field, models.AutoField)
            ]
            columnas_excel = df.columns.tolist()
            campos_validos = [c for c in campos_modelo if c in columnas_excel]

            if not campos_validos:
                return Response({'error': 'El archivo no contiene columnas válidas para el modelo'}, status=400)

            registros_creados = 0

            # Iteración por cada fila del Excel para insertar en la base de datos
            for index, row in df.iterrows():
                datos = {
                    campo: None if pd.isna(row[campo]) else row[campo]
                    for campo in campos_validos
                }
                try:
                    modelo.objects.create(**datos)
                    registros_creados += 1
                except Exception as e:
                    return Response({'error': f'Error en la fila {index+2}: {str(e)}'}, status=500)

            return Response({'mensaje': f'{registros_creados} registros importados correctamente'})

        except Exception as e:
            return Response({'error': f'Error al procesar archivo: {str(e)}'}, status=500)
