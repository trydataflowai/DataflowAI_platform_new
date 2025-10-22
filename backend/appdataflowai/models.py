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

    # Nuevo campo para links Power BI u otros
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
