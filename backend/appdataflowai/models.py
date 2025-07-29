from django.db import models

class Categoria(models.Model):
    id_categoria = models.AutoField(primary_key=True, db_column='id_categoria')
    descripcion_categoria = models.CharField(max_length=150, db_column='descripcion_categoria')

    class Meta:
        db_table = 'categoria'
        verbose_name_plural = 'Categorias'

    def __str__(self):
        return self.descripcion_categoria


class Estado(models.Model):
    id_estado = models.AutoField(primary_key=True, db_column='id_estado')
    estado = models.CharField(max_length=50, db_column='estado')

    class Meta:
        db_table = 'estados'
        verbose_name_plural = 'Estados'

    def __str__(self):
        return self.estado


class TipoPlan(models.Model):
    id_plan = models.AutoField(primary_key=True, db_column='id_plan')
    tipo_plan = models.CharField(max_length=50, db_column='producto')
    valor_plan = models.DecimalField(max_digits=10, decimal_places=2, db_column='valor_plan', null=True, blank=True)

    class Meta:
        db_table = 'planes'
        verbose_name_plural = 'Planes'

    def __str__(self):
        return self.tipo_plan


class PermisoAcceso(models.Model):
    id_permiso_acceso = models.AutoField(primary_key=True, db_column='id_permiso_acceso')
    rol = models.CharField(max_length=50, db_column='Rol')

    class Meta:
        db_table = 'permisos_acceso'
        verbose_name_plural = 'Permisos Acceso'

    def __str__(self):
        return self.rol


class Empresa(models.Model):
    id_empresa = models.AutoField(primary_key=True, db_column='id_empresa')
    id_categoria = models.ForeignKey(Categoria, on_delete=models.PROTECT, db_column='id_categoria') 
    id_plan = models.ForeignKey(TipoPlan, on_delete=models.PROTECT, db_column='id_plan')
    id_estado = models.ForeignKey(Estado, on_delete=models.PROTECT, db_column='id_estado')
    nombre_empresa = models.CharField(max_length=200, db_column='nombre_empresa')
    direccion = models.CharField(max_length=200, db_column='Direccion')
    fecha_registros = models.DateField(db_column='Fecha_registros')
    telefono = models.CharField(max_length=20, db_column='Telefono')
    ciudad = models.CharField(max_length=100, db_column='Ciudad')
    pais = models.CharField(max_length=100, db_column='pais')
    prefijo_pais = models.CharField(max_length=5, null=True, blank=True, db_column='Prefijo_pais')
    correo = models.EmailField(max_length=255, null=True, blank=True, db_column='Correo')
    pagina_web = models.URLField(max_length=255, null=True, blank=True, db_column='Pagina_web')
    fecha_hora_pago = models.DateTimeField(null=True, blank=True, db_column='Fecha_hora_pago')

    class Meta:
        db_table = 'empresas'
        verbose_name_plural = 'Empresas'

    def __str__(self):
        return self.nombre_empresa


class Pagos(models.Model):
    id_pago = models.AutoField(primary_key=True, db_column='id_pago')
    id_empresa = models.ForeignKey(Empresa, on_delete=models.PROTECT, db_column='id_empresa', related_name='pagos')
    id_plan = models.ForeignKey(TipoPlan, on_delete=models.PROTECT, db_column='id_plan')
    ingreso = models.DecimalField(max_digits=10, decimal_places=2, db_column='ingreso')
    fecha_hora_pago = models.DateTimeField(db_column='fecha_hora_pago')

    class Meta:
        db_table = 'pagos'
        verbose_name_plural = 'Pagos'

    def __str__(self):
        return f'Pago #{self.id_pago} - {self.id_empresa.nombre_empresa}'


class Usuario(models.Model):
    id_usuario = models.AutoField(primary_key=True, db_column='id_usuario')
    id_empresa = models.ForeignKey(Empresa, on_delete=models.PROTECT, db_column='id_empresa')
    id_permiso_acceso = models.ForeignKey(PermisoAcceso, on_delete=models.PROTECT, db_column='id_permiso_acceso')
    nombres = models.CharField(max_length=200, db_column='nombres')
    apellidos = models.CharField(max_length=200, null=True, blank=True, db_column='apellidos')
    correo = models.EmailField(max_length=255, db_column='correo', unique=True)
    contrasena = models.CharField(max_length=255, db_column='contrasena')  
    id_estado = models.ForeignKey(Estado, on_delete=models.PROTECT, db_column='id_estado')
    
    class Meta:
        db_table = 'usuarios'
        verbose_name_plural = 'Usuarios'

    def __str__(self):
        return self.nombres


from django.utils.text import slugify
from django.db import models

class Producto(models.Model):
    CATEGORIA_CHOICES = [
        ('software', 'Software'),
        ('servicio', 'Servicio'),
        ('herramienta', 'Herramienta'),
    ]

    TIPO_PRODUCTO_CHOICES = [
        ('suscripcion', 'Suscripción'),
        ('pago_unico', 'Pago Único'),
        ('demo', 'Versión Demo'),
    ]

    id_producto = models.AutoField(primary_key=True, db_column='id_producto')
    producto = models.CharField(max_length=200, db_column='producto')
    
    slug = models.SlugField(
        max_length=250,
        unique=True,
        db_column='slug',
        blank=True,
        null=True
    )

    categoria_producto = models.CharField(
        max_length=30,
        choices=CATEGORIA_CHOICES,
        default='software',
        db_column='categoria_producto'
    )

    tipo_producto = models.CharField(
        max_length=30,
        choices=TIPO_PRODUCTO_CHOICES,
        null=True,
        blank=True,
        db_column='tipo_producto'
    )

    id_estado = models.ForeignKey(Estado, on_delete=models.PROTECT, db_column='id_estado')

    iframe = models.CharField(max_length=500, db_column='iframe')

    class Meta:
        db_table = 'productos'
        verbose_name_plural = 'Productos'

    def __str__(self):
        return self.producto

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.producto)
        super().save(*args, **kwargs)



class DetalleProducto(models.Model):
    id_producto = models.ForeignKey(Producto, on_delete=models.PROTECT, db_column='id_producto')
    id_usuario = models.ForeignKey(Usuario, on_delete=models.PROTECT, db_column='id_usuario')

    class Meta:
        db_table = 'detalle_producto'
        verbose_name_plural = 'Detalle Producto'
        unique_together = (('id_producto', 'id_usuario'),)

    def __str__(self):
        return f"Producto {self.id_producto_id} - Usuario {self.id_usuario_id}"


class DetalleProductoVendido(models.Model):
    id_producto = models.ForeignKey(Producto, on_delete=models.PROTECT, db_column='id_producto')
    id_usuario = models.ForeignKey(Usuario, on_delete=models.PROTECT, db_column='id_usuario')

    class Meta:
        db_table = 'detalle_producto_vendido'
        verbose_name_plural = 'Detalle Producto Vendido'
        unique_together = (('id_producto', 'id_usuario'),)

    def __str__(self):
        return f"Producto {self.id_producto_id} - Usuario {self.id_usuario_id}"



class DashboardVentasLoop(models.Model):
    id_registro = models.AutoField(
    primary_key=True,
    db_column='id_registro'
    )
    id_punto_venta = models.CharField(
        max_length=150,
        db_column='id_punto_venta'
    )
    punto_venta = models.CharField(
        max_length=150,
        db_column='punto_venta'
    )
    dinero_entregado = models.IntegerField(
        db_column='dinero_entregado'
    )
    cantidad_entregada = models.IntegerField(
        db_column='cantidad_entregada'
    )
    fecha_entrega = models.DateField(
        db_column='fecha_entrega'
    )

    class Meta:
        db_table = 'dashboard_ventas_loop'
        verbose_name_plural = 'Dashboard Ventas Loop'

    def __str__(self):
        return f"{self.punto_venta} - {self.fecha_entrega}"



class DashboardVentasColtrade(models.Model):
    id_registro = models.AutoField(
    primary_key=True,
    db_column='id_registro'
    )
    id_punto_venta = models.CharField(
        max_length=150,
        db_column='id_punto_venta'
    )
    punto_venta = models.CharField(
        max_length=150,
        db_column='punto_venta'
    )
    dinero_entregado = models.IntegerField(
        db_column='dinero_entregado'
    )
    cantidad_entregada = models.IntegerField(
        db_column='cantidad_entregada'
    )
    fecha_entrega = models.DateField(
        db_column='fecha_entrega'
    )

    class Meta:
        db_table = 'dashboard_ventas_coltrade'
        verbose_name_plural = 'Dashboard Ventas Coltrade'

    def __str__(self):
        return f"{self.punto_venta} - {self.fecha_entrega}"


class DashboardVentasDataflow(models.Model):
    id_registro = models.AutoField(
    primary_key=True,
    db_column='id_registro'
    )
    id_punto_venta = models.CharField(
        max_length=150,
        db_column='id_punto_venta'
    )
    punto_venta = models.CharField(
        max_length=150,
        db_column='punto_venta'
    )
    dinero_entregado = models.IntegerField(
        db_column='dinero_entregado'
    )
    cantidad_entregada = models.IntegerField(
        db_column='cantidad_entregada'
    )
    fecha_entrega = models.DateField(
        db_column='fecha_entrega'
    )

    class Meta:
        db_table = 'dashboard_ventas_dataflow'
        verbose_name_plural = 'Dashboard Ventas Dataflow'

    def __str__(self):
        return f"{self.punto_venta} - {self.fecha_entrega}"
    


#DASHBOARD VENTAS para implementación usando React y Django, sin usar Power BI
# Este modelo es una versión simplificada y adaptada para el uso de Django ORM y React

from django.db import models

class DashboardVentas(models.Model):
    id_registro = models.AutoField(primary_key=True, db_column='id_registro')

    # Identificadores clave obligatorios
    id_empresa = models.ForeignKey('Empresa', on_delete=models.PROTECT, db_column='id_empresa')
    id_producto = models.ForeignKey('Producto', on_delete=models.PROTECT, db_column='id_producto', null=True, blank=True)

    # Información general
    id_punto_venta = models.CharField(max_length=150, db_column='id_punto_venta', null=True, blank=True)
    punto_venta = models.CharField(max_length=150, db_column='punto_venta', null=True, blank=True)
    canal = models.CharField(max_length=100, db_column='canal', null=True, blank=True)  # Online, tienda física, etc.
    ciudad = models.CharField(max_length=100, db_column='ciudad', null=True, blank=True)
    region = models.CharField(max_length=100, db_column='region', null=True, blank=True)

    # Métricas comerciales
    cantidad_vendida = models.IntegerField(db_column='cantidad_vendida', null=True, blank=True)
    dinero_vendido = models.DecimalField(db_column='dinero_vendido', max_digits=15, decimal_places=2, null=True, blank=True)
    ticket_promedio = models.DecimalField(db_column='ticket_promedio', max_digits=10, decimal_places=2, null=True, blank=True)
    unidades_promocionadas = models.IntegerField(db_column='unidades_promocionadas', null=True, blank=True)
    descuento_total = models.DecimalField(db_column='descuento_total', max_digits=12, decimal_places=2, null=True, blank=True)
    numero_transacciones = models.IntegerField(db_column='numero_transacciones', null=True, blank=True)
    devoluciones = models.IntegerField(db_column='devoluciones', null=True, blank=True)
    dinero_devoluciones = models.DecimalField(db_column='dinero_devoluciones', max_digits=12, decimal_places=2, null=True, blank=True)

    # Tiempos
    fecha_venta = models.DateField(db_column='fecha_venta', null=True, blank=True)
    mes = models.IntegerField(db_column='mes', null=True, blank=True)
    anio = models.IntegerField(db_column='anio', null=True, blank=True)
    dia_semana = models.CharField(max_length=20, db_column='dia_semana', null=True, blank=True)
    hora = models.TimeField(db_column='hora', null=True, blank=True)

    # Productos
    sku = models.CharField(max_length=100, db_column='sku', null=True, blank=True)
    nombre_producto = models.CharField(max_length=255, db_column='nombre_producto', null=True, blank=True)
    categoria = models.CharField(max_length=100, db_column='categoria', null=True, blank=True)
    subcategoria = models.CharField(max_length=100, db_column='subcategoria', null=True, blank=True)
    marca = models.CharField(max_length=100, db_column='marca', null=True, blank=True)

    # Cliente (si aplica)
    tipo_cliente = models.CharField(max_length=100, db_column='tipo_cliente', null=True, blank=True)  # minorista, mayorista, etc.
    segmento_cliente = models.CharField(max_length=100, db_column='segmento_cliente', null=True, blank=True)
    genero_cliente = models.CharField(max_length=20, db_column='genero_cliente', null=True, blank=True)
    edad_cliente = models.IntegerField(db_column='edad_cliente', null=True, blank=True)

    # Indicadores adicionales
    utilidad_bruta = models.DecimalField(db_column='utilidad_bruta', max_digits=15, decimal_places=2, null=True, blank=True)
    costo_total = models.DecimalField(db_column='costo_total', max_digits=15, decimal_places=2, null=True, blank=True)
    margen_utilidad = models.DecimalField(db_column='margen_utilidad', max_digits=5, decimal_places=2, null=True, blank=True)  # En porcentaje

    # Observaciones
    observaciones = models.TextField(null=True, blank=True)

    class Meta:
        db_table = 'dashboard_ventas'
        verbose_name_plural = 'Dashboard Ventas'

    def __str__(self):
        return f"Empresa {self.id_empresa_id} - Producto {self.id_producto_id} - Venta #{self.id_registro}"
