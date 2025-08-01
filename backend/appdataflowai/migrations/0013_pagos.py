# Generated by Django 5.2.4 on 2025-07-22 19:52

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('appdataflowai', '0012_usuario_apellidos'),
    ]

    operations = [
        migrations.CreateModel(
            name='Pagos',
            fields=[
                ('id_pago', models.AutoField(db_column='id_pago', primary_key=True, serialize=False)),
                ('ingreso', models.DecimalField(db_column='ingreso', decimal_places=2, max_digits=50)),
                ('fecha_hora_pago', models.DateTimeField(db_column='fecha_hora_pago')),
                ('id_empresa', models.ForeignKey(db_column='id_empresa', on_delete=django.db.models.deletion.CASCADE, related_name='pagos', to='appdataflowai.empresa')),
            ],
            options={
                'verbose_name_plural': 'Pagos',
                'db_table': 'pagos',
            },
        ),
    ]
