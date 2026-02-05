from django.db import models

class Categoria(models.Model):
    id_categoria = models.AutoField(primary_key=True, db_column='id_categoria')
    descripcion_categoria = models.CharField(max_length=150, db_column='descripcion_categoria')

    class Meta:
        db_table = 'categoria'
        verbose_name_plural = 'Categorias'

    def __str__(self):
        return self.descripcion_categoria
    

class Areas(models.Model):
    id_area = models.AutoField(primary_key=True, db_column='id_area')
    area_trabajo = models.CharField(max_length=150, db_column='area_trabajo')

    class Meta:
        db_table = 'areas'
        verbose_name_plural = 'Areas'

    def __str__(self):
        return self.area_trabajo


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
    nombre_corto = models.CharField(max_length=100, db_column='nombre_corto')
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
    id_area = models.ForeignKey(Areas, on_delete=models.PROTECT, db_column='id_area')
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
        ('javascript', 'Javascript'),
        ('power', 'Power'),
        ('externo', 'Informe Externo'),
    ]

    TIPO_PRODUCTO_CHOICES = [
        ('publico', 'Publico'),
        ('privado', 'Privado'),
    ]

    id_producto = models.AutoField(primary_key=True, db_column='id_producto')
    producto = models.CharField(max_length=200, db_column='producto')
    id_area = models.ForeignKey(Areas, on_delete=models.PROTECT, db_column='id_area')

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

    id_estado = models.ForeignKey(
        Estado,
        on_delete=models.PROTECT,
        db_column='id_estado'
    )

    iframe = models.CharField(max_length=500, db_column='iframe')

    link_pb = models.URLField(
        max_length=500,
        db_column='link_pb',
        null=True,
        blank=True
    )

    link_dashboard_externo = models.URLField(
        max_length=500,
        db_column='link_dashboard_externo',
        null=True,
        blank=True,
        help_text='URL del dashboard externos'
    )

    db_name = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        db_column='db_name'
    )

    # 🔽 CAMPOS AGREGADOS 🔽
    dashboard_context = models.TextField(
        null=True,
        blank=True,
        db_column='dashboard_context'
    )

    tables = models.JSONField(
        null=True,
        blank=True,
        db_column='tables'
    )

    formularios_id = models.JSONField(
        null=True,
        blank=True,
        db_column='formularios_id'
    )

    class Meta:
        db_table = 'productos'
        verbose_name_plural = 'Productos'

    def __str__(self):
        return self.producto

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.producto)
        super().save(*args, **kwargs)





#Productos de herramientas
from django.db import models

class ProductoHerramientas(models.Model):

    TIPO_PRODUCTO_CHOICES = [
        ('publico', 'Público'),
        ('privado', 'Privado'),
    ]

    id_producto_herramienta = models.AutoField(
        primary_key=True,
        db_column='id_producto'
    )

    producto_herramienta = models.CharField(
        max_length=200,
        db_column='producto',
        verbose_name='Nombre del producto'
    )

    id_area = models.ForeignKey(
        'Areas',
        on_delete=models.PROTECT,
        db_column='id_area',
        related_name='productos_herramientas'
    )

    tipo_producto = models.CharField(
        max_length=30,
        choices=TIPO_PRODUCTO_CHOICES,
        null=True,
        blank=True,
        db_column='tipo_producto'
    )

    id_estado = models.ForeignKey(
        'Estado',
        on_delete=models.PROTECT,
        db_column='id_estado',
        related_name='productos_herramientas'
    )

    # Corrige el db_column si el typo no existe en tu BD
    link_producto = models.URLField(
        max_length=500,
        db_column='link_producto',  # usa 'link_prodcuto' si tu BD ya lo tiene así
        null=True,
        blank=True,
        help_text='URL del recurso (ej. informe Power BI)'
    )

    class Meta:
        db_table = 'productos_herramientas'
        verbose_name = 'Producto Herramienta'
        verbose_name_plural = 'Productos Herramientas'
        ordering = ['producto_herramienta']

    def __str__(self):
        return self.producto_herramienta



class DetalleProductoHerramientas(models.Model):
    id_producto = models.ForeignKey(
        ProductoHerramientas,
        on_delete=models.PROTECT,
        db_column='id_producto_herramienta',
        related_name='detalles'
    )
    id_usuario = models.ForeignKey(
        Usuario,
        on_delete=models.PROTECT,
        db_column='id_usuario',
        related_name='detalles'
    )

    class Meta:
        db_table = 'detalle_producto_herramientas'  
        verbose_name = 'Detalle Producto Herramientas'
        verbose_name_plural = 'Detalle Producto Herramientas'
        unique_together = (('id_producto', 'id_usuario'),)




# myapp/models.py (fragmento)

class DetalleProducto(models.Model):
    id_producto = models.ForeignKey(
        Producto,
        on_delete=models.PROTECT,
        db_column='id_producto'
    )
    id_usuario = models.ForeignKey(
        Usuario,
        on_delete=models.PROTECT,
        db_column='id_usuario'
    )

    class Meta:
        db_table = 'detalle_producto'
        verbose_name_plural = 'Detalle Producto'
        unique_together = (('id_producto', 'id_usuario'),)

    @property
    def db_name(self):
        # Devuelve el db_name del producto relacionado (puede ser None)
        return getattr(self.id_producto, "db_name", None)

    def __str__(self):
        return (
            f"Producto {self.id_producto_id} - "
            f"Usuario {self.id_usuario_id} - "
            f"DB: {self.db_name}"
        )




class DetalleProductoVendido(models.Model):
    id_producto = models.ForeignKey(Producto, on_delete=models.PROTECT, db_column='id_producto')
    id_usuario = models.ForeignKey(Usuario, on_delete=models.PROTECT, db_column='id_usuario')

    class Meta:
        db_table = 'detalle_producto_vendido'
        verbose_name_plural = 'Detalle Producto Vendido'
        unique_together = (('id_producto', 'id_usuario'),)

    def __str__(self):
        return f"Producto {self.id_producto_id} - Usuario {self.id_usuario_id}"
    


class EmpresaDashboard(models.Model):
    producto = models.ForeignKey(Producto, on_delete=models.PROTECT, db_column='id_producto')
    empresa = models.ForeignKey(Empresa, on_delete=models.PROTECT, db_column='id_empresa')

    class Meta:
        db_table = 'detalle_empresa_dashboard'
        verbose_name = 'Detalle Empresa Dashboard'
        verbose_name_plural = 'Detalle Empresa Dashboard'
        unique_together = (('producto', 'empresa'),)

    def __str__(self):
        return f"{self.empresa} - {self.producto}"




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

class DashboardFinanzas(models.Model):
    id_registro = models.AutoField(primary_key=True, db_column='id_registro')

    # Claves foráneas requeridas
    id_empresa = models.ForeignKey('Empresa', on_delete=models.PROTECT, db_column='id_empresa')
    id_producto = models.ForeignKey('Producto', on_delete=models.PROTECT, db_column='id_producto', null=True, blank=True)

    # Periodo contable
    fecha_registro = models.DateField(db_column='fecha_registro', null=True, blank=True)
    mes = models.IntegerField(db_column='mes', null=True, blank=True)
    anio = models.IntegerField(db_column='anio', null=True, blank=True)

    # Ingresos
    ingresos_operacionales = models.DecimalField(max_digits=15, decimal_places=2, db_column='ingresos_operacionales', null=True, blank=True)
    ingresos_no_operacionales = models.DecimalField(max_digits=15, decimal_places=2, db_column='ingresos_no_operacionales', null=True, blank=True)
    ingresos_totales = models.DecimalField(max_digits=15, decimal_places=2, db_column='ingresos_totales', null=True, blank=True)

    # Costos y gastos
    costo_ventas = models.DecimalField(max_digits=15, decimal_places=2, db_column='costo_ventas', null=True, blank=True)
    gastos_operacionales = models.DecimalField(max_digits=15, decimal_places=2, db_column='gastos_operacionales', null=True, blank=True)
    otros_gastos = models.DecimalField(max_digits=15, decimal_places=2, db_column='otros_gastos', null=True, blank=True)
    total_egresos = models.DecimalField(max_digits=15, decimal_places=2, db_column='total_egresos', null=True, blank=True)

    # Resultados
    utilidad_bruta = models.DecimalField(max_digits=15, decimal_places=2, db_column='utilidad_bruta', null=True, blank=True)
    utilidad_neta = models.DecimalField(max_digits=15, decimal_places=2, db_column='utilidad_neta', null=True, blank=True)
    margen_neto = models.DecimalField(max_digits=5, decimal_places=2, db_column='margen_neto', null=True, blank=True)  # %

    # Flujo de caja
    flujo_efectivo_operaciones = models.DecimalField(max_digits=15, decimal_places=2, db_column='flujo_efectivo_operaciones', null=True, blank=True)
    flujo_efectivo_inversion = models.DecimalField(max_digits=15, decimal_places=2, db_column='flujo_efectivo_inversion', null=True, blank=True)
    flujo_efectivo_financiacion = models.DecimalField(max_digits=15, decimal_places=2, db_column='flujo_efectivo_financiacion', null=True, blank=True)
    flujo_efectivo_total = models.DecimalField(max_digits=15, decimal_places=2, db_column='flujo_efectivo_total', null=True, blank=True)

    # Activos y pasivos
    activos_totales = models.DecimalField(max_digits=18, decimal_places=2, db_column='activos_totales', null=True, blank=True)
    pasivos_totales = models.DecimalField(max_digits=18, decimal_places=2, db_column='pasivos_totales', null=True, blank=True)
    patrimonio = models.DecimalField(max_digits=18, decimal_places=2, db_column='patrimonio', null=True, blank=True)

    # Observaciones
    observaciones = models.TextField(null=True, blank=True)

    class Meta:
        db_table = 'dashboard_finanzas'
        verbose_name_plural = 'Dashboard Finanzas'

    def __str__(self):
        return f"Empresa {self.id_empresa_id} - Producto {self.id_producto_id} - Registro #{self.id_registro}"




from django.db import models

class DashboardCompras(models.Model):
    id_registro = models.AutoField(primary_key=True, db_column='id_registro')

    # Claves foráneas
    id_empresa = models.ForeignKey('Empresa', on_delete=models.PROTECT, db_column='id_empresa')
    id_producto = models.ForeignKey('Producto', on_delete=models.PROTECT, db_column='id_producto', null=True, blank=True)

    # Periodo
    fecha_compra = models.DateField(db_column='fecha_compra', null=True, blank=True)
    mes = models.IntegerField(db_column='mes', null=True, blank=True)
    anio = models.IntegerField(db_column='anio', null=True, blank=True)

    # Información de proveedor
    proveedor = models.CharField(max_length=255, db_column='proveedor', null=True, blank=True)
    tipo_proveedor = models.CharField(max_length=100, db_column='tipo_proveedor', null=True, blank=True)  # nacional, internacional, etc.

    # Detalle de compra
    cantidad_comprada = models.IntegerField(db_column='cantidad_comprada', null=True, blank=True)
    valor_unitario = models.DecimalField(max_digits=15, decimal_places=2, db_column='valor_unitario', null=True, blank=True)
    valor_total = models.DecimalField(max_digits=18, decimal_places=2, db_column='valor_total', null=True, blank=True)

    # Categoría y producto
    nombre_producto = models.CharField(max_length=255, db_column='nombre_producto', null=True, blank=True)
    categoria = models.CharField(max_length=100, db_column='categoria', null=True, blank=True)
    subcategoria = models.CharField(max_length=100, db_column='subcategoria', null=True, blank=True)
    marca = models.CharField(max_length=100, db_column='marca', null=True, blank=True)

    # Condiciones y observaciones
    condiciones_pago = models.CharField(max_length=100, db_column='condiciones_pago', null=True, blank=True)  # crédito, contado, etc.
    tiempo_entrega_dias = models.IntegerField(db_column='tiempo_entrega_dias', null=True, blank=True)
    observaciones = models.TextField(null=True, blank=True)

    class Meta:
        db_table = 'dashboard_compras'
        verbose_name_plural = 'Dashboard Compras'

    def __str__(self):
        return f"Compra #{self.id_registro} - Empresa {self.id_empresa_id} - Producto {self.id_producto_id}"




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



from django.db import models

class DashboardSalesreview(models.Model):
    id_registro = models.AutoField(primary_key=True, db_column='id_registro')

    # Identificadores clave obligatorios
    id_empresa = models.ForeignKey('Empresa', on_delete=models.PROTECT, db_column='id_empresa')
    id_producto = models.ForeignKey('Producto', on_delete=models.PROTECT, db_column='id_producto', null=True, blank=True)

    # Campos solicitados (todos obligatorios)
    mes = models.CharField(max_length=20, db_column='MES', null=False, blank=False)  
    mes_numero = models.IntegerField(db_column='MES#', null=False, blank=False)  
    semana = models.CharField(max_length=10, db_column='SEMANA', null=False, blank=False)  
    dia_compra = models.CharField(max_length=20, db_column='DIA DE COMPRA', null=False, blank=False)  
    fecha_compra = models.DateField(db_column='FECHA DE COMPRA', null=False, blank=False)  
    fecha_envio = models.DateField(db_column='FECHA ENVIO', null=False, blank=False)  
    numero_pedido = models.CharField(max_length=50, db_column='Nº PEDIDO', null=False, blank=False)  
    numero_oc = models.CharField(max_length=50, db_column='Nº OC', null=False, blank=False)  
    estado = models.CharField(max_length=50, db_column='ESTADO', null=False, blank=False)  
    linea = models.CharField(max_length=50, db_column='LINEA', null=False, blank=False)  
    fuente = models.CharField(max_length=50, db_column='FUENTE', null=False, blank=False)  
    sku_enviado = models.CharField(max_length=50, db_column='SKU ENVIADO', null=False, blank=False)  
    categoria = models.CharField(max_length=50, db_column='CATEGORIA', null=False, blank=False)  
    producto = models.CharField(max_length=100, db_column='PRODUCTO', null=False, blank=False)  
    precio_unidad_antes_iva = models.DecimalField(max_digits=12, decimal_places=2, db_column='PRECIO DE LA UNIDAD ANTES DE IVA', null=False, blank=False)  
    unidades = models.IntegerField(db_column='UNIDADES', null=False, blank=False)  
    ingresos_antes_iva = models.DecimalField(max_digits=100, decimal_places=2, db_column='INGRESOS ANTES DE IVA', null=False, blank=False)  

    class Meta:
        db_table = 'dashboard_salesreview'
        verbose_name_plural = 'Dashboard Sales Review'



from django.db import models

class DashboardSalesCorporativo(models.Model):
    id_registro = models.AutoField(primary_key=True, db_column='id_registro')

# Identificadores clave obligatorios
    id_empresa = models.ForeignKey('Empresa', on_delete=models.PROTECT, db_column='id_empresa', null=True, blank=True)
    id_producto = models.ForeignKey('Producto', on_delete=models.PROTECT, db_column='id_producto', null=True, blank=True)


    
    orden_compra = models.CharField(max_length=50, db_column='orden_compra', null=False)
    fecha = models.DateField(db_column='fecha', null=False)
    mes_nombre = models.CharField(max_length=20, db_column='mes_nombre', null=True, blank=True)
    categoria_cliente = models.CharField(max_length=100, db_column='categoria_cliente', null=True, blank=True)
    nombre_cliente = models.CharField(max_length=150, db_column='nombre_cliente', null=True, blank=True)
    categoria_producto = models.CharField(max_length=100, db_column='categoria_producto', null=True, blank=True)
    marca = models.CharField(max_length=100, db_column='marca', null=True, blank=True)
    producto = models.CharField(max_length=150, db_column='producto', null=True, blank=True)
    estado_cotizacion = models.CharField(max_length=10, db_column='estado_cotizacion', null=True, blank=True)
    unidades = models.IntegerField(db_column='unidades', null=True, blank=True)
    precio_unitario = models.DecimalField(max_digits=12, decimal_places=2, db_column='precio_unitario', null=True, blank=True)
    observaciones = models.TextField(db_column='observaciones', null=True, blank=True)

    class Meta:
        db_table = 'dashboard_salescorporativo'
        verbose_name_plural = 'Dashboard Sales Corporativo'




from django.db import models

class DashboardSalesCorporativoMetas(models.Model):
    id_registro = models.AutoField(primary_key=True, db_column='id_registro')

    # Identificadores clave
    id_empresa = models.ForeignKey('Empresa', on_delete=models.PROTECT, db_column='id_empresa', null=True, blank=True)
    id_producto = models.ForeignKey('Producto', on_delete=models.PROTECT, db_column='id_producto', null=True, blank=True)

    # Campos de la meta
    ano = models.IntegerField(db_column='ano', null=False)
    mes = models.CharField(max_length=10, db_column='mes', null=True, blank=True)
    categoria_cliente = models.CharField(max_length=100, db_column='categoria_cliente', null=True, blank=True)
    nombre_cliente = models.CharField(max_length=150, db_column='nombre_cliente', null=True, blank=True)
    categoria_producto = models.CharField(max_length=100, db_column='categoria_producto', null=True, blank=True)
    meta = models.DecimalField(max_digits=14, decimal_places=2, db_column='meta', null=False)

    class Meta:
        db_table = 'dashboard_salescorporativometas'
        verbose_name_plural = 'Dashboard Sales Corporativo Metas'
        ordering = ['-ano', '-mes']




#Modelo para Dashboard ISP Ventas
from django.db import models

class DashboardIspVentas(models.Model):
    id_registro = models.AutoField(primary_key=True, db_column='id_registro')


# Identificadores clave
    id_empresa = models.ForeignKey('Empresa', on_delete=models.PROTECT, db_column='id_empresa', null=True, blank=True)
    id_producto = models.ForeignKey('Producto', on_delete=models.PROTECT, db_column='id_producto', null=True, blank=True)

    # Periodo de referencia
    ano = models.IntegerField(db_column='ano', null=False)
    mes = models.CharField(max_length=15, db_column='mes', null=True, blank=True)
    fecha_registro = models.DateField(db_column='fecha_registro', null=True, blank=True)

    # Datos del cliente
    nombre_cliente = models.CharField(max_length=150, db_column='nombre_cliente', null=True, blank=True)
    categoria_cliente = models.CharField(max_length=100, db_column='categoria_cliente', null=True, blank=True)
    ciudad = models.CharField(max_length=100, db_column='ciudad', null=True, blank=True)
    segmento = models.CharField(max_length=100, db_column='segmento', null=True, blank=True)  # residencial, empresarial, etc.

    # Datos del plan
    nombre_plan = models.CharField(max_length=150, db_column='nombre_plan', null=True, blank=True)
    categoria_plan = models.CharField(max_length=100, db_column='categoria_plan', null=True, blank=True)
    velocidad_mbps = models.DecimalField(max_digits=10, decimal_places=2, db_column='velocidad_mbps', null=True, blank=True)
    precio_mensual = models.DecimalField(max_digits=14, decimal_places=2, db_column='precio_mensual', null=True, blank=True)
    estado_suscripcion = models.CharField(max_length=50, db_column='estado_suscripcion', null=True, blank=True)  # activa, cancelada, suspendida

    # Datos de facturación
    fecha_inicio = models.DateField(db_column='fecha_inicio', null=True, blank=True)
    fecha_fin = models.DateField(db_column='fecha_fin', null=True, blank=True)
    monto_facturado = models.DecimalField(max_digits=14, decimal_places=2, db_column='monto_facturado', null=True, blank=True)
    metodo_pago = models.CharField(max_length=50, db_column='metodo_pago', null=True, blank=True)

    # Observaciones o notas
    observaciones = models.TextField(db_column='observaciones', null=True, blank=True)

    class Meta:
        db_table = 'dashboard_isp_ventas'
        verbose_name_plural = 'Dashboard ISP Ventas'
        ordering = ['-ano', '-mes']




"""
Modelos de los dashboard a vender.
"""


from django.db import models

class DashboardSales(models.Model):
    id_registro = models.AutoField(primary_key=True, db_column='id_registro')

    # Identificadores clave obligatorios
    id_empresa = models.ForeignKey('Empresa', on_delete=models.PROTECT, db_column='id_empresa')
    id_producto = models.ForeignKey('Producto', on_delete=models.PROTECT, db_column='id_producto', null=True, blank=True)

    # General information
    point_of_sale_id = models.CharField(max_length=150, db_column='point_of_sale_id', null=True, blank=True)
    point_of_sale = models.CharField(max_length=150, db_column='point_of_sale', null=True, blank=True)
    channel = models.CharField(max_length=100, db_column='channel', null=True, blank=True)  # Online, physical store, etc.
    city = models.CharField(max_length=100, db_column='city', null=True, blank=True)
    region = models.CharField(max_length=100, db_column='region', null=True, blank=True)

    # Business metrics
    quantity_sold = models.IntegerField(db_column='quantity_sold', null=True, blank=True)
    sales_amount = models.DecimalField(db_column='sales_amount', max_digits=15, decimal_places=2, null=True, blank=True)
    average_ticket = models.DecimalField(db_column='average_ticket', max_digits=10, decimal_places=2, null=True, blank=True)
    promoted_units = models.IntegerField(db_column='promoted_units', null=True, blank=True)
    total_discount = models.DecimalField(db_column='total_discount', max_digits=12, decimal_places=2, null=True, blank=True)
    number_transactions = models.IntegerField(db_column='number_transactions', null=True, blank=True)
    returns = models.IntegerField(db_column='returns', null=True, blank=True)
    return_amount = models.DecimalField(db_column='return_amount', max_digits=12, decimal_places=2, null=True, blank=True)

    # Time
    sale_date = models.DateField(db_column='sale_date', null=True, blank=True)
    month = models.IntegerField(db_column='month', null=True, blank=True)
    year = models.IntegerField(db_column='year', null=True, blank=True)
    weekday = models.CharField(max_length=20, db_column='weekday', null=True, blank=True)
    hour = models.TimeField(db_column='hour', null=True, blank=True)

    # Products
    sku = models.CharField(max_length=100, db_column='sku', null=True, blank=True)
    product_name = models.CharField(max_length=255, db_column='product_name', null=True, blank=True)
    category = models.CharField(max_length=100, db_column='category', null=True, blank=True)
    subcategory = models.CharField(max_length=100, db_column='subcategory', null=True, blank=True)
    brand = models.CharField(max_length=100, db_column='brand', null=True, blank=True)

    # Customer (if applicable)
    customer_type = models.CharField(max_length=100, db_column='customer_type', null=True, blank=True)  # retail, wholesale, etc.
    customer_segment = models.CharField(max_length=100, db_column='customer_segment', null=True, blank=True)
    customer_gender = models.CharField(max_length=20, db_column='customer_gender', null=True, blank=True)
    customer_age = models.IntegerField(db_column='customer_age', null=True, blank=True)

    # Additional indicators
    gross_profit = models.DecimalField(db_column='gross_profit', max_digits=15, decimal_places=2, null=True, blank=True)
    total_cost = models.DecimalField(db_column='total_cost', max_digits=15, decimal_places=2, null=True, blank=True)
    profit_margin = models.DecimalField(db_column='profit_margin', max_digits=5, decimal_places=2, null=True, blank=True)  # In percentage

    # Notes
    notes = models.TextField(null=True, blank=True)

    class Meta:
        db_table = 'dashboard_sales'
        verbose_name_plural = 'Dashboard Sales'

    def __str__(self):
        empresa = self.id_empresa if self.id_empresa else "Sin empresa"
        producto = self.id_producto if self.id_producto else "Sin producto"
        return f"Empresa {empresa} - Producto {producto} - Venta #{self.id_registro}"





from django.db import models

class Ticket(models.Model):
    ESTADOS = [
        ('creada', 'Creada'),
        ('solucionada', 'Solucionada'),
        ('en_solucion', 'Está siendo revisada'),
    ]

    id_ticket = models.AutoField(primary_key=True, db_column='id_ticket')
    id_usuario = models.ForeignKey(Usuario, on_delete=models.PROTECT, db_column='id_usuario')
    correo = models.EmailField(max_length=255, db_column='correo')
    asunto = models.CharField(max_length=255, db_column='asunto')
    descripcion = models.TextField(db_column='descripcion', null=True, blank=True)
    comentario = models.TextField(db_column='comentario', null=True, blank=True)

    estado = models.CharField(max_length=20, choices=ESTADOS, default='creada', db_column='estado')

    fecha_creacion = models.DateTimeField(auto_now_add=True, db_column='fecha_creacion')
    fecha_cierre = models.DateTimeField(null=True, blank=True, db_column='fecha_cierre')

    class Meta:
        db_table = 'tickets'
        verbose_name_plural = 'Tickets'

    def __str__(self):
        return f"{self.asunto} - {self.estado}"




#Modelo para registrar los inicios de sesión de un usuario
from django.db import models
from django.utils import timezone

# asumo que Empresa y Usuario ya están definidos arriba en este mismo archivo
# si no, importa: from .models import Empresa, Usuario (o el path correcto)

class RegistrosSesion(models.Model):
    id_registro = models.AutoField(primary_key=True, db_column='id_registro')
    id_empresa = models.ForeignKey(
        'Empresa',
        on_delete=models.PROTECT,
        db_column='id_empresa',
        related_name='registros_sesiones'
    )
    nombre_empresa = models.CharField(max_length=200, db_column='nombre_empresa', editable=False)

    id_usuario = models.ForeignKey(
        'Usuario',
        on_delete=models.PROTECT,
        db_column='id_usuario',
        related_name='registros_sesiones_usuario'
    )
    nombres = models.CharField(max_length=200, db_column='nombres', editable=False)

    fecha_inicio_sesion = models.DateTimeField(db_column='fecha_inicio_sesion', default=timezone.now)

    class Meta:
        db_table = 'registros_sesion'
        verbose_name_plural = 'Registros de Sesión'

    def save(self, *args, **kwargs):
        """
        Rellena nombre_empresa y nombres desde las FKs si no se han provisto.
        Esto hace que podamos crear registros pasando sólo las FK.
        """
        if self.id_empresa and (not self.nombre_empresa):
            try:
                # id_empresa es una instancia de Empresa
                self.nombre_empresa = getattr(self.id_empresa, 'nombre_empresa', '') or ''
            except Exception:
                self.nombre_empresa = ''

        if self.id_usuario and (not self.nombres):
            try:
                self.nombres = getattr(self.id_usuario, 'nombres', '') or ''
            except Exception:
                self.nombres = ''

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.id_registro} - {self.nombre_empresa} / {self.nombres} - {self.fecha_inicio_sesion}"







 #DASHBOARD CHURN RATE PARA SERVITEL
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


"""
Mira, ahora estos son los campos dame 20 registros donde en las fechas ssolo coloques datos del 2025
, osea en las 3 fechas si hay valores en fecha de baja osea si colocas datos en fecha de baja es pq 
el cliente le debes colocar inactivo osea primero si efectivamente una fecha de contrataciion y 
si está inactivo debe tener fecha de baja si el usuario está activo no debe tener fecha de baja 
debe ser null TIPO_PLAN_CHOICES = [ ('basico', 'Básico'), ('estandar', 'Estándar'), ('premium', 'Premium'),
 ] ESTADO_CLIENTE_CHOICES = [ ('activo', 'Activo'), ('cancelado', 'Cancelado'), ('inactivo', 'Inactivo'),]
 INSERT INTO public.dashboard_churn_rate( id_registro, id_cliente, nombre_cliente, tipo_plan, region, 
 departamento, fecha_contratacion, fecha_baja, fecha_ultima_transaccion, estado_cliente, 
 monto_facturado_mensual, margen_bruto, arpu, numero_quejas, total_reclamos, interacciones_servicio,
 satisfaccion_cliente, valor_percibido, recomendacion_nps, observacion_cliente, id_empresa, id_producto) 
 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?); 
 En Id_empresa colocarás el valor 3 En id_producto colocarás el valor 19


"""
class DashboardChurnRate(models.Model):
    id_registro = models.AutoField(primary_key=True, db_column='id_registro')

    # Identificadores clave obligatorios
    id_empresa = models.ForeignKey(
        'Empresa',
        on_delete=models.PROTECT,
        db_column='id_empresa'
    )
    id_producto = models.ForeignKey(
        'Producto',
        on_delete=models.PROTECT,
        db_column='id_producto',
        null=True,
        blank=True
    )

    # Datos del cliente
    id_cliente = models.IntegerField(db_column='id_cliente', db_index=True)
    nombre_cliente = models.CharField(db_column='nombre_cliente', max_length=255)

    # Categorización
    TIPO_PLAN_CHOICES = [
        ('basico', 'Básico'),
        ('estandar', 'Estándar'),
        ('premium', 'Premium'),
    ]
    tipo_plan = models.CharField(
        db_column='tipo_plan',
        max_length=20,
        choices=TIPO_PLAN_CHOICES,
        null=True,
        blank=True
    )

    region = models.CharField(db_column='region', max_length=100, null=True, blank=True)
    departamento = models.CharField(db_column='departamento', max_length=100, null=True, blank=True)

    # Fechas (solo fecha — DateField)
    fecha_contratacion = models.DateField(db_column='fecha_contratacion', null=True, blank=True)
    fecha_baja = models.DateField(db_column='fecha_baja', null=True, blank=True)
    fecha_ultima_transaccion = models.DateField(db_column='fecha_ultima_transaccion', null=True, blank=True)

    # Estado del cliente
    ESTADO_CLIENTE_CHOICES = [
        ('activo', 'Activo'),
        ('cancelado', 'Cancelado'),
        ('inactivo', 'Inactivo'),
    ]
    estado_cliente = models.CharField(
        db_column='estado_cliente',
        max_length=20,
        choices=ESTADO_CLIENTE_CHOICES,
        null=True,
        blank=True
    )

    # Métricas financieras (usar DecimalField para precisión)
    monto_facturado_mensual = models.DecimalField(
        db_column='monto_facturado_mensual',
        max_digits=14,
        decimal_places=2,
        null=True,
        blank=True
    )
    margen_bruto = models.DecimalField(
        db_column='margen_bruto',
        max_digits=12,
        decimal_places=4,
        null=True,
        blank=True
    )
    arpu = models.DecimalField(
        db_column='arpu',
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True
    )

    # Interacciones y reclamos
    numero_quejas = models.IntegerField(db_column='numero_quejas', default=0)
    total_reclamos = models.IntegerField(db_column='total_reclamos', default=0)
    interacciones_servicio = models.IntegerField(db_column='interacciones_servicio', default=0)

    # Satisfacción y percepciones (validadores para rangos)
    satisfaccion_cliente = models.DecimalField(
        db_column='satisfaccion_cliente',
        max_digits=3,
        decimal_places=1,
        validators=[MinValueValidator(1.0), MaxValueValidator(5.0)],
        null=True,
        blank=True
    )
    valor_percibido = models.DecimalField(
        db_column='valor_percibido',
        max_digits=3,
        decimal_places=1,
        validators=[MinValueValidator(1.0), MaxValueValidator(5.0)],
        null=True,
        blank=True
    )
    recomendacion_nps = models.DecimalField(
        db_column='recomendacion_nps',
        max_digits=3,
        decimal_places=1,
        validators=[MinValueValidator(0.0), MaxValueValidator(10.0)],
        null=True,
        blank=True
    )

    # Observación del cliente (texto libre)
    observacion_cliente = models.TextField(db_column='observacion_cliente', null=True, blank=True)

    class Meta:
        db_table = 'dashboard_churn_rate'
        verbose_name = 'Dashboard Churn Rate'
        verbose_name_plural = 'Dashboard Churn Rates'
        ordering = ['-fecha_ultima_transaccion']

    def __str__(self):
        return f'{self.id_cliente} — {self.nombre_cliente} ({self.estado_cliente or "sin estado"})'







#DASHBOARD ARPU
from django.db import models
from django.contrib.postgres.indexes import GinIndex

class DashboardARPU(models.Model):
    """
    Modelo unico que contiene:
    - campos identificadores obligatorios (id_registro, id_empresa, id_producto)
    - campos para eventos/ingresos atomicos
    - campos para snapshot / suscriptor
    - campos agregados para dashboard (ARPU, MRR, churn, etc)
    - campo doc (JSONB) para breakdowns flexibles y forecast
    """
    id_registro = models.AutoField(primary_key=True, db_column='id_registro')

    # Obligatorios segun tu requerimiento
    id_empresa = models.ForeignKey('Empresa', on_delete=models.PROTECT, db_column='id_empresa', null=True, blank=True)
    id_producto = models.ForeignKey('Producto', on_delete=models.PROTECT, db_column='id_producto', null=True, blank=True)

    # --- Campos basicos de tiempo / cliente / evento (para trazabilidad) ---
    cliente_id = models.CharField(max_length=100, db_column='cliente_id', null=True, blank=True)  # id externo cliente
    fecha_evento = models.DateTimeField(db_column='fecha_evento', null=True, blank=True)  # timestamp del evento si aplica
    periodo_mes = models.DateField(db_column='periodo_mes', null=False)  # primer dia del mes (clave de agregacion)

    # --- Campos para eventos atomicos de ingreso (si quieres guardar un evento junto al registro) ---
    tipo_evento = models.CharField(max_length=50, db_column='tipo_evento', null=True, blank=True)  # factura, pago, ajuste, descuento
    monto_evento = models.DecimalField(max_digits=14, decimal_places=2, db_column='monto_evento', null=True, blank=True)
    moneda = models.CharField(max_length=10, db_column='moneda', default='COP')

    # --- Campos del snapshot / suscriptor (estado mensual por cliente) ---
    estado = models.CharField(max_length=20, db_column='estado', null=True, blank=True)  # activo, suspendido, cancelado
    fecha_alta = models.DateField(db_column='fecha_alta', null=True, blank=True)
    fecha_baja = models.DateField(db_column='fecha_baja', null=True, blank=True)
    tarifa_plan = models.DecimalField(max_digits=12, decimal_places=2, db_column='tarifa_plan', null=True, blank=True)
    velocidad_mbps = models.IntegerField(db_column='velocidad_mbps', null=True, blank=True)
    canal_adquisicion = models.CharField(max_length=50, db_column='canal_adquisicion', null=True, blank=True)

    # --- Campos agregados para dashboard (precalculados) ---
    ingresos_totales = models.DecimalField(max_digits=18, decimal_places=2, db_column='ingresos_totales', null=False, default=0)
    mrr = models.DecimalField(max_digits=18, decimal_places=2, db_column='mrr', null=False, default=0)
    usuarios_promedio = models.IntegerField(db_column='usuarios_promedio', null=False, default=0)
    subs_inicio = models.IntegerField(db_column='subs_inicio', null=True, blank=True)
    subs_final = models.IntegerField(db_column='subs_final', null=True, blank=True)
    arpu = models.DecimalField(max_digits=14, decimal_places=2, db_column='arpu', null=False, default=0)
    churn = models.DecimalField(max_digits=8, decimal_places=6, db_column='churn', null=True, blank=True)  # proporción (ej 0.032)

    # --- Promociones, etiquetas y metadatos ---
    promo_id = models.CharField(max_length=100, db_column='promo_id', null=True, blank=True)
    tags = models.JSONField(db_column='tags', null=True, blank=True)  # lista de tags utiles para filtros, ej ["fibra","zona_norte"]
    metadata = models.JSONField(db_column='metadata', null=True, blank=True)  # libre para datos adicionales

    # --- Documento JSONB flexible que puede contener breakdowns, historico detallado y forecast ---
    doc = models.JSONField(db_column='doc', null=True, blank=True)
    # doc sugerido: { "ingresos_por_fuente": {...}, "kpis": {...}, "promociones":[...], "forecast": {...}, "eventos":[...] }

    created_at = models.DateTimeField(auto_now_add=True, db_column='created_at')
    updated_at = models.DateTimeField(auto_now=True, db_column='updated_at')

    class Meta:
        db_table = 'dashboard_arpu'
        verbose_name_plural = 'Dashboard ISP ARPU'
        ordering = ['-periodo_mes']
        indexes = [
            models.Index(fields=['id_empresa', 'id_producto', 'periodo_mes']),
            models.Index(fields=['id_empresa', 'periodo_mes']),
            GinIndex(fields=['doc'], name='dashboard_arpu_doc_gin'),
        ]

    def __str__(self):
        return f"ARPU {self.id_registro} - emp:{self.id_empresa_id} prod:{self.id_producto_id} periodo:{self.periodo_mes}"























#Formulario de creación

# backend/appdataflowai/models.py
import uuid
from django.db import models

class Formulario(models.Model):
    id_formulario = models.AutoField(primary_key=True)
    empresa = models.ForeignKey('Empresa', on_delete=models.PROTECT, db_column='id_empresa', related_name='formularios')
    usuario = models.ForeignKey('Usuario', on_delete=models.SET_NULL, null=True, blank=True, db_column='id_usuario', related_name='formularios')
    nombre = models.CharField(max_length=255)
    descripcion = models.TextField(null=True, blank=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    slug = models.SlugField(unique=True, blank=True, max_length=120)

    class Meta:
        db_table = 'formularios'
        ordering = ['-fecha_creacion']

    def save(self, *args, **kwargs):
        if not self.slug:
            from django.utils.text import slugify
            base = slugify(self.nombre) or "form"
            self.slug = f"{base}-{uuid.uuid4().hex[:6]}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.nombre} ({self.slug})"


class Pregunta(models.Model):
    TIPO = (
        ('text', 'Texto'),
        ('textarea', 'Área de texto'),
        ('date', 'Fecha'),
        ('int', 'Número entero'),
        ('float', 'Número decimal'),
        ('email', 'Email'),
        ('select', 'Selección'),
        ('checkbox', 'Checkbox (múltiple)'),
    )

    id_pregunta = models.AutoField(primary_key=True)
    formulario = models.ForeignKey(Formulario, on_delete=models.CASCADE, related_name='preguntas')
    texto = models.CharField(max_length=512)
    tipo = models.CharField(max_length=20, choices=TIPO)
    orden = models.PositiveIntegerField(default=0)
    requerido = models.BooleanField(default=False)
    opciones = models.JSONField(null=True, blank=True)  # lista de strings si tipo == select/checkbox

    # NUEVO: reglas de ramificación. Estructura esperada (ejemplo):
    # [ {"when": "Zona Sur", "goto": 1}, {"when": "Zona Norte", "goto": 2}, {"when":"other","goto":"end"} ]
    branching = models.JSONField(null=True, blank=True)

    class Meta:
        db_table = 'preguntas'
        ordering = ['orden']

    def __str__(self):
        return f"{self.texto} ({self.tipo})"


class Respuesta(models.Model):
    id_respuesta = models.AutoField(primary_key=True)
    formulario = models.ForeignKey(Formulario, on_delete=models.CASCADE, related_name='respuestas')
    data = models.JSONField()  # { "id_empresa": 1, "Nombre usuario": "Julian", "Ventas": 5, ... }
    fecha = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'respuestas'
        ordering = ['-fecha']

    def __str__(self):
        return f"Respuesta {self.id_respuesta} - {self.formulario.slug}"










#-----------------------Dashboard Caso de USO Trade Marketing-------------------------


from django.db import models
from decimal import Decimal
import calendar
from datetime import date

# Choices de meses (para dropdown)
MONTH_CHOICES = [
    ('enero', 'enero'), ('febrero', 'febrero'), ('marzo', 'marzo'),
    ('abril', 'abril'), ('mayo', 'mayo'), ('junio', 'junio'),
    ('julio', 'julio'), ('agosto', 'agosto'), ('septiembre', 'septiembre'),
    ('octubre', 'octubre'), ('noviembre', 'noviembre'), ('diciembre', 'diciembre'),
]

class DashboardTradeVentas(models.Model):
    id_registro = models.AutoField(primary_key=True, db_column='id_registro')

    # Identificadores obligatorios
    id_empresa = models.ForeignKey('Empresa', on_delete=models.PROTECT, db_column='id_empresa')
    id_producto = models.ForeignKey('Producto', on_delete=models.PROTECT, db_column='id_producto')

    # Datos de la venta / periodo
    fecha_venta = models.DateField(db_column='fecha_venta', null=True, blank=True)
    sem = models.IntegerField(db_column='sem', null=True, blank=True, help_text='numero de semana de la fecha_venta')
    mes = models.CharField(max_length=15, db_column='mes', null=True, blank=True, help_text='mes en texto derivado de fecha_venta')
    ano = models.IntegerField(db_column='ano', null=True, blank=True, help_text='ano derivado de fecha_venta')

    # Punto de venta y producto
    id_pos = models.CharField(max_length=100, db_column='id_pos', null=True, blank=True)
    punto_de_venta = models.CharField(max_length=150, db_column='punto_de_venta', null=True, blank=True)
    codigo_barras_product = models.CharField(max_length=100, db_column='codigo_barras_product', null=True, blank=True)
    sku = models.CharField(max_length=100, db_column='sku', null=True, blank=True)
    producto = models.CharField(max_length=250, db_column='producto', null=True, blank=True)

    # Valores numericos
    cantidad = models.IntegerField(db_column='cantidad', null=True, blank=True)
    unit_price = models.DecimalField(max_digits=14, decimal_places=4, db_column='unit_price', null=True, blank=True)

    # Campo calculado: cantidad * unit_price
    total_sellthru = models.DecimalField(max_digits=18, decimal_places=4, db_column='total_sellthru', null=True, blank=True)

    # Observaciones u otros
    observaciones = models.TextField(db_column='observaciones', null=True, blank=True)

    class Meta:
        db_table = 'dashboard_trade_ventas'
        verbose_name_plural = 'Dashboard Trade Ventas'
        ordering = ['-ano', '-mes', '-fecha_venta']

    def save(self, *args, **kwargs):
        # Derivar ano, mes, sem si hay fecha_venta
        if self.fecha_venta:
            self.ano = self.fecha_venta.year
            # mes en texto en minuscula
            self.mes = self.fecha_venta.strftime('%B').lower()
            # numero ISO de semana
            self.sem = int(self.fecha_venta.isocalendar()[1])
        # Calcular total_sellthru si hay cantidad y unit_price
        if (self.cantidad is not None) and (self.unit_price is not None):
            # asegurar Decimal
            q = Decimal(self.cantidad)
            p = Decimal(self.unit_price)
            self.total_sellthru = (q * p).quantize(Decimal('0.0001'))
        else:
            self.total_sellthru = None
        super().save(*args, **kwargs)

class DashboardTradeMetas(models.Model):
    id_registro = models.AutoField(primary_key=True, db_column='id_registro')

    # Identificadores obligatorios
    id_empresa = models.ForeignKey('Empresa', on_delete=models.PROTECT, db_column='id_empresa')
    id_producto = models.ForeignKey('Producto', on_delete=models.PROTECT, db_column='id_producto')

    # Periodo y localizacion
    mes = models.CharField(max_length=15, choices=MONTH_CHOICES, db_column='mes', null=True, blank=True)
    ano = models.IntegerField(db_column='ano', null=True, blank=True)
    ciudad = models.CharField(max_length=100, db_column='ciudad', null=True, blank=True)

    # Identificadores de tienda / punto de venta para metas
    ean_pvd = models.CharField(max_length=100, db_column='ean_pvd', null=True, blank=True)
    tienda = models.CharField(max_length=150, db_column='tienda', null=True, blank=True)

    # Metas
    meta = models.DecimalField(max_digits=18, decimal_places=4, db_column='meta', null=True, blank=True, help_text='meta total del mes')
    meta_diaria = models.DecimalField(max_digits=18, decimal_places=4, db_column='meta_diaria', null=True, blank=True, help_text='meta dividida por dias del mes')
    meta_semanal = models.DecimalField(max_digits=18, decimal_places=4, db_column='meta_semanal', null=True, blank=True, help_text='meta dividida por semanas del mes')

    observaciones = models.TextField(db_column='observaciones', null=True, blank=True)

    class Meta:
        db_table = 'dashboard_trade_metas'
        verbose_name_plural = 'Dashboard Trade Metas'
        ordering = ['-ano', 'mes']

    def save(self, *args, **kwargs):
        # Si no hay ano o mes pero hay fecha implicita, no hacemos nada.
        # Calcular meta_diaria y meta_semanal si meta y mes/ano disponibles
        if self.meta is not None and self.ano:
            # determinar dias del mes si mes especificado y valido
            days_in_month = None
            try:
                # buscar indice de mes por texto (enero->1, etc)
                if self.mes:
                    month_name = self.mes.lower()
                    month_map = {
                        'enero': 1, 'febrero': 2, 'marzo': 3, 'abril': 4,
                        'mayo': 5, 'junio': 6, 'julio': 7, 'agosto': 8,
                        'septiembre': 9, 'octubre': 10, 'noviembre': 11, 'diciembre': 12
                    }
                    month_idx = month_map.get(month_name)
                    if month_idx:
                        days_in_month = calendar.monthrange(self.ano, month_idx)[1]
            except Exception:
                days_in_month = None

            # si no se pudo resolver dias del mes, se usa 31 (segun especificacion)
            if not days_in_month:
                days_in_month = 31

            # calcular meta_diaria y meta_semanal (4 semanas por mes por defecto)
            try:
                self.meta_diaria = (Decimal(self.meta) / Decimal(days_in_month)).quantize(Decimal('0.0001'))
                self.meta_semanal = (Decimal(self.meta) / Decimal(4)).quantize(Decimal('0.0001'))
            except Exception:
                self.meta_diaria = None
                self.meta_semanal = None
        else:
            self.meta_diaria = None
            self.meta_semanal = None

        super().save(*args, **kwargs)

class DashboardTradeInventario(models.Model):
    id_registro = models.AutoField(primary_key=True, db_column='id_registro')

    # Identificadores obligatorios
    id_empresa = models.ForeignKey('Empresa', on_delete=models.PROTECT, db_column='id_empresa')
    id_producto = models.ForeignKey('Producto', on_delete=models.PROTECT, db_column='id_producto')

    # Fecha / periodo
    fecha_inventario = models.DateField(db_column='fecha_inventario', null=True, blank=True)
    mes = models.CharField(max_length=15, choices=MONTH_CHOICES, db_column='mes', null=True, blank=True)
    ano = models.IntegerField(db_column='ano', null=True, blank=True)

    # Punto de venta / producto
    codigo_barras_product = models.CharField(max_length=100, db_column='codigo_barras_product', null=True, blank=True)
    punto_de_venta = models.CharField(max_length=150, db_column='punto_de_venta', null=True, blank=True)
    id_pos = models.CharField(max_length=100, db_column='id_pos', null=True, blank=True)
    sku = models.CharField(max_length=100, db_column='sku', null=True, blank=True)
    producto = models.CharField(max_length=250, db_column='producto', null=True, blank=True)

    # Valores
    cantidad = models.IntegerField(db_column='cantidad', null=True, blank=True)
    unit_price = models.DecimalField(max_digits=14, decimal_places=4, db_column='unit_price', null=True, blank=True)

    class Meta:
        db_table = 'dashboard_trade_inventario'
        verbose_name_plural = 'Dashboard Trade Inventario'
        ordering = ['-ano', 'mes', '-fecha_inventario']

    def save(self, *args, **kwargs):
        # derivar ano y mes si hay fecha_inventario
        if self.fecha_inventario:
            self.ano = self.fecha_inventario.year
            self.mes = self.fecha_inventario.strftime('%B').lower()
        super().save(*args, **kwargs)




#Tabla para interacción con el chat

from django.db import models

class DashboardContext(models.Model):
    id_registro = models.AutoField(primary_key=True)

    session_id = models.CharField(max_length=100)

    dashboard_name = models.CharField(max_length=200)
    dashboard_context = models.TextField()

    tables = models.JSONField()
    formularios_id = models.JSONField(blank=True, null=True)

    empresa_id = models.IntegerField()

    def __str__(self):
        return f"{self.dashboard_name} - Empresa {self.empresa_id}"



from django.db import models


# =========================
# TIENDAS
# =========================
class DashDfTiendas(models.Model):
    id_tienda = models.AutoField(primary_key=True)
    id_empresa = models.ForeignKey(
        'Empresa',
        on_delete=models.PROTECT,
        db_column='id_empresa'
    )
    nombre_tienda = models.CharField(max_length=50)
    direccion_tienda = models.CharField(max_length=50)
    horario_tienda = models.CharField(max_length=50)
    ciudad = models.CharField(max_length=50)
    telefono = models.CharField(max_length=50)
    email = models.CharField(max_length=50)
    canal = models.CharField(max_length=50)
    estado = models.BooleanField(default=True)

    class Meta:
        db_table = 'dash_df_tiendas'

    def __str__(self):
        return self.nombre_tienda


# =========================
# PRODUCTOS
# =========================
class DashDfProductos(models.Model):
    id_producto = models.AutoField(primary_key=True)
    id_empresa = models.ForeignKey(
        'Empresa',
        on_delete=models.PROTECT,
        db_column='id_empresa'
    )
    nombre_producto = models.CharField(max_length=50)
    categoria = models.CharField(max_length=50)
    marca = models.CharField(max_length=50)
    valor_producto = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        db_table = 'dash_df_productos'

    def __str__(self):
        return self.nombre_producto


# =========================
# VENTAS
# =========================
class DashDfVentas(models.Model):
    id_registro = models.AutoField(primary_key=True)
    id_empresa = models.ForeignKey(
        'Empresa',
        on_delete=models.PROTECT,
        db_column='id_empresa'
    )
    id_tienda = models.ForeignKey(
        DashDfTiendas,
        on_delete=models.PROTECT,
        db_column='id_tienda'
    )
    id_producto = models.ForeignKey(
        DashDfProductos,
        on_delete=models.PROTECT,
        db_column='id_producto'
    )
    cantidad_vendida = models.IntegerField()
    dinero_vendido = models.DecimalField(max_digits=14, decimal_places=2)
    fecha_venta = models.DateField()

    class Meta:
        db_table = 'dash_df_ventas'


# =========================
# METAS
# =========================
class DashDfMetas(models.Model):
    id_registro = models.AutoField(primary_key=True)
    id_empresa = models.ForeignKey(
        'Empresa',
        on_delete=models.PROTECT,
        db_column='id_empresa'
    )
    id_tienda = models.ForeignKey(
        DashDfTiendas,
        on_delete=models.PROTECT,
        db_column='id_tienda'
    )
    id_producto = models.ForeignKey(
        DashDfProductos,
        on_delete=models.PROTECT,
        db_column='id_producto'
    )
    meta_cantidad = models.IntegerField()
    meta_dinero = models.DecimalField(max_digits=14, decimal_places=2)
    fecha_meta = models.DateField()

    class Meta:
        db_table = 'dash_df_metas'


# =========================
# INVENTARIOS
# =========================
class DashDfInventarios(models.Model):
    id_registro = models.AutoField(primary_key=True)
    id_empresa = models.ForeignKey(
        'Empresa',
        on_delete=models.PROTECT,
        db_column='id_empresa'
    )
    id_tienda = models.ForeignKey(
        DashDfTiendas,
        on_delete=models.PROTECT,
        db_column='id_tienda'
    )
    id_producto = models.ForeignKey(
        DashDfProductos,
        on_delete=models.PROTECT,
        db_column='id_producto'
    )
    inventario_cantidad = models.IntegerField()

    class Meta:
        db_table = 'dash_df_inventarios'








from django.db import models


class OdooSaleFlat(models.Model):
    # --- IDs Odoo ---

    id_empresa = models.ForeignKey(
        'Empresa',
        on_delete=models.PROTECT,
        db_column='id_empresa'
    )

    sale_odoo_id = models.IntegerField()
    partner_odoo_id = models.IntegerField(null=True, blank=True)
    user_odoo_id = models.IntegerField(null=True, blank=True)
    company_odoo_id = models.IntegerField(null=True, blank=True)
    invoice_odoo_id = models.IntegerField(null=True, blank=True)
    product_odoo_id = models.IntegerField(null=True, blank=True)

    # --- Referencias ---
    sale_reference = models.CharField(max_length=100)
    invoice_name = models.CharField(max_length=100, null=True, blank=True)

    # --- Fechas ---
    create_date = models.DateTimeField()
    commitment_date = models.DateField(null=True, blank=True)
    invoice_date = models.DateField(null=True, blank=True)

    # --- Cliente ---
    partner_name = models.CharField(max_length=255)

    # --- Vendedor ---
    user_name = models.CharField(max_length=255, null=True, blank=True)

    # --- Empresa ---
    company_name = models.CharField(max_length=255, null=True, blank=True)

    # --- Canal / fuente ---
    canal = models.CharField(max_length=100, null=True, blank=True)
    orden_fuente = models.CharField(max_length=100, null=True, blank=True)
    fuente = models.CharField(max_length=100, null=True, blank=True)

    # --- Producto ---
    product_name = models.CharField(max_length=255, null=True, blank=True)
    product_brand = models.CharField(max_length=100, null=True, blank=True)

    # --- Cantidades ---
    product_uom_qty = models.FloatField(default=0)
    qty_invoiced = models.FloatField(default=0)
    qty_delivered = models.FloatField(default=0)

    # --- Precios ---
    price_unit = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    price_subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    amount_total = models.DecimalField(max_digits=12, decimal_places=2)

    # --- Estados ---
    sale_state = models.CharField(max_length=50)
    invoice_state = models.CharField(max_length=50, null=True, blank=True)
    invoice_status = models.CharField(max_length=50, null=True, blank=True)

    # --- Otros ---
    cart_quantity = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.sale_reference} - {self.partner_name}"





from decimal import Decimal
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator

# Asumo que el modelo Usuario ya existe en el mismo archivo o importado:
# from .models import Usuario
# (En tu caso Usuario ya lo tienes definido más arriba)

TIPO_CUENTA_CHOICES = [
    ('AH', 'Cuenta de ahorros'),
    ('CO', 'Cuenta corriente'),
    ('OT', 'Otro'),
]

TIPO_IDENTIFICACION_CHOICES = [
    ('CC', 'Cédula de ciudadanía'),
    ('CE', 'Cédula de extranjería'),
    ('TI', 'Tarjeta de identidad'),
    ('NIT', 'NIT'),
    ('PA', 'Pasaporte'),
]

TAMANIO_EMPRESA_CHOICES = [
    ('PE', 'Pequeña'),
    ('ME', 'Mediana'),
    ('GR', 'Grande'),
]

ETAPA_LEAD_CHOICES = [
    ('lead_prospecto', 'lead prospecto'),
    ('lead_prospecto_calificado', 'lead prospecto calificado'),  # opcional
    ('lead_calificado', 'lead calificado'),
    ('lead_demo', 'lead demo'),
    ('propuesta_enviada', 'propuesta enviada'),
    ('lead_ganado', 'lead ganado'),
    ('lead_perdido', 'lead perdido'),
]

class UsuariosBrokers(models.Model):
    id_broker = models.AutoField(primary_key=True, db_column='id_broker')
    id_usuario = models.ForeignKey(
        'Usuario',
        on_delete=models.PROTECT,
        db_column='id_usuario',
        related_name='brokers'
    )
    numero_telefono = models.CharField(max_length=30, db_column='numero_telefono', blank=True)
    pais_residencia = models.CharField(max_length=100, db_column='pais_residencia', blank=True)
    entidad_financiera = models.CharField(max_length=100, db_column='entidad_financiera', blank=True)
    numero_cuenta = models.CharField(max_length=100, db_column='numero_cuenta', blank=True)
    tipo_cuenta = models.CharField(max_length=2, choices=TIPO_CUENTA_CHOICES, db_column='tipo_cuenta', blank=True)
    codigo_swift = models.CharField(max_length=50, db_column='codigo_swift', blank=True)
    tipo_identificacion = models.CharField(max_length=4, choices=TIPO_IDENTIFICACION_CHOICES, db_column='tipo_identificacion', blank=True)
    numero_identificacion = models.CharField(max_length=60, db_column='numero_identificacion', blank=True)

    class Meta:
        db_table = 'usuarios_brokers'
        verbose_name_plural = 'Usuarios Brokers'

    def __str__(self):
        # Muestra el usuario y el id_broker para identificar fácilmente
        return f'Broker {self.id_broker} - Usuario: {self.id_usuario}'


class LeadsBrokers(models.Model):
    id_lead = models.AutoField(primary_key=True, db_column='id_lead')
    id_broker = models.ForeignKey(
        UsuariosBrokers,
        on_delete=models.PROTECT,
        db_column='id_broker',
        related_name='leads'
    )
    nombre_lead = models.CharField(max_length=200, db_column='nombre_lead')
    correo = models.EmailField(max_length=255, db_column='correo', blank=True)
    persona_de_contacto = models.CharField(max_length=200, db_column='persona_de_contacto', blank=True)
    telefono = models.CharField(max_length=30, db_column='telefono', blank=True)
    pais = models.CharField(max_length=100, db_column='pais', blank=True)
    industria = models.CharField(max_length=150, db_column='industria', blank=True)
    tamano_empresa = models.CharField(max_length=2, choices=TAMANIO_EMPRESA_CHOICES, db_column='tamano_empresa', blank=True)
    ticket_estimado = models.DecimalField(max_digits=14, decimal_places=2, db_column='ticket_estimado', null=True, blank=True)  # almacenar en moneda (ej. USD)
    moneda_ticket = models.CharField(max_length=10, db_column='moneda_ticket', default='USD', blank=True)
    probabilidad_cierre = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00')), MaxValueValidator(Decimal('100.00'))],
        db_column='probabilidad_cierre',
        null=True,
        blank=True
    )  # porcentaje 0-100
    campo_etiqueta = models.CharField(max_length=100, db_column='campo_etiqueta', blank=True)
    fuente_lead = models.CharField(max_length=150, db_column='fuente_lead', blank=True)
    comentarios = models.TextField(db_column='comentarios', blank=True)
    etapa = models.CharField(max_length=30, choices=ETAPA_LEAD_CHOICES, db_column='etapa', default='lead_prospecto')

    class Meta:
        db_table = 'leads_brokers'
        verbose_name_plural = 'Leads Brokers'

    def __str__(self):
        return f'{self.nombre_lead} ({self.id_lead})'


class FacturacionLeadsBrokers(models.Model):
    numero_factura = models.IntegerField(primary_key=True, db_column='numero_factura')
    id_broker = models.ForeignKey(
        UsuariosBrokers,
        on_delete=models.PROTECT,
        db_column='id_broker',
        related_name='facturas'
    )
    id_lead = models.ForeignKey(
        LeadsBrokers,
        on_delete=models.PROTECT,
        db_column='id_lead',
        related_name='facturas'
    )
    fecha_facturacion = models.DateField(db_column='fecha_facturacion')
    valor_facturado = models.DecimalField(max_digits=14, decimal_places=2, db_column='valor_facturado')
    # Guardamos la comisión como porcentaje (ej. 20.00 para 20%)
    comision_percent = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00')), MaxValueValidator(Decimal('100.00'))],
        db_column='comision_percent',
        default=Decimal('20.00')
    )

    class Meta:
        db_table = 'facturacion_leads_brokers'
        verbose_name_plural = 'Facturación Leads Brokers'

    def __str__(self):
        return f'Factura {self.numero_factura} - Lead {self.id_lead}'

    @property
    def valor_comision_amount(self):
        """Retorna el valor de la comisión (valor_facturado * comision_percent / 100)."""
        if self.valor_facturado is None or self.comision_percent is None:
            return Decimal('0.00')
        return (self.valor_facturado * (self.comision_percent / Decimal('100.00'))).quantize(Decimal('0.01'))


class PagosBrokersLeads(models.Model):
    id_pago = models.AutoField(primary_key=True, db_column='id_pago')
    fecha_pago = models.DateField(db_column='fecha_pago')
    numero_factura = models.ForeignKey(
        FacturacionLeadsBrokers,
        on_delete=models.PROTECT,
        db_column='numero_factura',
        related_name='pagos'
    )
    valor_pagado = models.DecimalField(max_digits=14, decimal_places=2, db_column='valor_pagado')
    estado = models.BooleanField(default=False, db_column='estado')  # False = pendiente, True = pagado

    class Meta:
        db_table = 'pagos_brokers_leads'
        verbose_name_plural = 'Pagos Brokers Leads'

    def __str__(self):
        return f'Pago {self.id_pago} - Factura {self.numero_factura.numero_factura}'
