from django.db import models

class Categoria(models.Model):
    id_categoria = models.IntegerField(primary_key=True, db_column='id_categoria')
    descripcion_categoria = models.CharField(max_length=150, db_column='descripcion_categoria')

    class Meta:
        db_table = 'categoria'
        verbose_name_plural = 'Categorias'

    def __str__(self):
        return self.descripcion_categoria


class Estado(models.Model):
    id_estado = models.IntegerField(primary_key=True, db_column='id_estado')
    estado = models.CharField(max_length=50, db_column='estado')

    class Meta:
        db_table = 'estados'
        verbose_name_plural = 'Estados'

    def __str__(self):
        return self.estado
    
class TipoPlan(models.Model):
    id_plan = models.IntegerField(primary_key=True, db_column='id_plan')
    tipo_plan = models.CharField(max_length=50, db_column='producto')

    class Meta:
        db_table = 'planes'
        verbose_name_plural = 'Planes'

    def __str__(self):
        return self.tipo_plan



class PermisoAcceso(models.Model):
        id_permiso_acceso = models.IntegerField(primary_key=True, db_column='id_permiso_acceso')
        rol = models.CharField(max_length=50, db_column='Rol')

        class Meta:
            db_table = 'permisos_acceso'
            verbose_name_plural = 'Permisos Acceso'

        def __str__(self):
            return self.rol






class Empresa(models.Model):
    id_empresa = models.IntegerField(primary_key=True, db_column='id_empresa')
    id_categoria = models.ForeignKey(Categoria, on_delete=models.PROTECT, db_column='id_categoria') 
    id_plan = models.ForeignKey(TipoPlan, on_delete=models.PROTECT, db_column='id_plan')
    id_estado = models.ForeignKey(Estado, on_delete=models.PROTECT, db_column='id_estado')
    nombre_empresa = models.CharField(max_length=200, db_column='nombre_empresa')
    direccion = models.CharField(max_length=200, db_column='Direccion')
    fecha_registros = models.DateField(db_column='Fecha_registros')
    telefono = models.CharField(max_length=20, db_column='Telefono')
    ciudad = models.CharField(max_length=100, db_column='Ciudad')
    pais = models.CharField(max_length=100, db_column='pais')

    # Nuevos campos
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
    id_empresa = models.ForeignKey(Empresa, on_delete=models.CASCADE, db_column='id_empresa', related_name='pagos')
    ingreso = models.DecimalField(max_digits=50, decimal_places=2, db_column='ingreso')
    fecha_hora_pago = models.DateTimeField(db_column='fecha_hora_pago')

    class Meta:
        db_table = 'pagos'
        verbose_name_plural = 'Pagos'

    def __str__(self):
        return f'Pago #{self.id_pago} - {self.id_empresa.nombre_empresa}'

class Usuario(models.Model):
    id_usuario = models.BigIntegerField(primary_key=True, db_column='id_usuario')
    id_empresa = models.ForeignKey(Empresa, on_delete=models.PROTECT, db_column='id_empresa')
    id_permiso_acceso = models.ForeignKey(PermisoAcceso, on_delete=models.PROTECT, db_column='id_permiso_acceso')
    nombres = models.CharField(max_length=200, db_column='nombres')
    apellidos = models.CharField(max_length=200, null=True, blank=True, db_column='apellidos')
    correo = models.EmailField(max_length=255, db_column='correo', unique=True)
    contrasena = models.CharField(max_length=255, db_column='contrasena')  
    estado = models.BooleanField(default=True)

    class Meta:
        db_table = 'usuarios'
        verbose_name_plural = 'Usuarios'

    def __str__(self):
        return self.nombres


class Producto(models.Model):
    id_producto = models.IntegerField(primary_key=True, db_column='id_producto')
    producto = models.CharField(max_length=200, db_column='producto')
    tipo_producto = models.CharField(max_length=30, db_column='tipo_producto', null=True, blank=True)
    id_estado = models.ForeignKey(Estado, on_delete=models.PROTECT, db_column='id_estado')
    Url = models.URLField(max_length=500, db_column='Url')
    iframe = models.CharField(max_length=500, db_column='iframe')

    class Meta:
        db_table = 'productos'
        verbose_name_plural = 'Productos'

    def __str__(self):
        return self.producto


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