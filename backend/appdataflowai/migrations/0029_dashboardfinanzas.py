# Generated by Django 5.2.4 on 2025-07-31 22:23

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('appdataflowai', '0028_remove_dashboardventasdataflow_id_empresa_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='DashboardFinanzas',
            fields=[
                ('id_registro', models.AutoField(db_column='id_registro', primary_key=True, serialize=False)),
                ('fecha_registro', models.DateField(blank=True, db_column='fecha_registro', null=True)),
                ('mes', models.IntegerField(blank=True, db_column='mes', null=True)),
                ('anio', models.IntegerField(blank=True, db_column='anio', null=True)),
                ('ingresos_operacionales', models.DecimalField(blank=True, db_column='ingresos_operacionales', decimal_places=2, max_digits=15, null=True)),
                ('ingresos_no_operacionales', models.DecimalField(blank=True, db_column='ingresos_no_operacionales', decimal_places=2, max_digits=15, null=True)),
                ('ingresos_totales', models.DecimalField(blank=True, db_column='ingresos_totales', decimal_places=2, max_digits=15, null=True)),
                ('costo_ventas', models.DecimalField(blank=True, db_column='costo_ventas', decimal_places=2, max_digits=15, null=True)),
                ('gastos_operacionales', models.DecimalField(blank=True, db_column='gastos_operacionales', decimal_places=2, max_digits=15, null=True)),
                ('otros_gastos', models.DecimalField(blank=True, db_column='otros_gastos', decimal_places=2, max_digits=15, null=True)),
                ('total_egresos', models.DecimalField(blank=True, db_column='total_egresos', decimal_places=2, max_digits=15, null=True)),
                ('utilidad_bruta', models.DecimalField(blank=True, db_column='utilidad_bruta', decimal_places=2, max_digits=15, null=True)),
                ('utilidad_neta', models.DecimalField(blank=True, db_column='utilidad_neta', decimal_places=2, max_digits=15, null=True)),
                ('margen_neto', models.DecimalField(blank=True, db_column='margen_neto', decimal_places=2, max_digits=5, null=True)),
                ('flujo_efectivo_operaciones', models.DecimalField(blank=True, db_column='flujo_efectivo_operaciones', decimal_places=2, max_digits=15, null=True)),
                ('flujo_efectivo_inversion', models.DecimalField(blank=True, db_column='flujo_efectivo_inversion', decimal_places=2, max_digits=15, null=True)),
                ('flujo_efectivo_financiacion', models.DecimalField(blank=True, db_column='flujo_efectivo_financiacion', decimal_places=2, max_digits=15, null=True)),
                ('flujo_efectivo_total', models.DecimalField(blank=True, db_column='flujo_efectivo_total', decimal_places=2, max_digits=15, null=True)),
                ('activos_totales', models.DecimalField(blank=True, db_column='activos_totales', decimal_places=2, max_digits=18, null=True)),
                ('pasivos_totales', models.DecimalField(blank=True, db_column='pasivos_totales', decimal_places=2, max_digits=18, null=True)),
                ('patrimonio', models.DecimalField(blank=True, db_column='patrimonio', decimal_places=2, max_digits=18, null=True)),
                ('observaciones', models.TextField(blank=True, null=True)),
                ('id_empresa', models.ForeignKey(db_column='id_empresa', on_delete=django.db.models.deletion.PROTECT, to='appdataflowai.empresa')),
                ('id_producto', models.ForeignKey(blank=True, db_column='id_producto', null=True, on_delete=django.db.models.deletion.PROTECT, to='appdataflowai.producto')),
            ],
            options={
                'verbose_name_plural': 'Dashboard Finanzas',
                'db_table': 'dashboard_finanzas',
            },
        ),
    ]
