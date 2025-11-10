-- Comandos SETVAL para todas las tablas con AutoField
SELECT setval('categoria_id_categoria_seq', (SELECT MAX(id_categoria) FROM categoria));
SELECT setval('areas_id_area_seq', (SELECT MAX(id_area) FROM areas));
SELECT setval('estados_id_estado_seq', (SELECT MAX(id_estado) FROM estados));
SELECT setval('planes_id_plan_seq', (SELECT MAX(id_plan) FROM planes));
SELECT setval('permisos_acceso_id_permiso_acceso_seq', (SELECT MAX(id_permiso_acceso) FROM permisos_acceso));
SELECT setval('empresas_id_empresa_seq', (SELECT MAX(id_empresa) FROM empresas));
SELECT setval('pagos_id_pago_seq', (SELECT MAX(id_pago) FROM pagos));
SELECT setval('usuarios_id_usuario_seq', (SELECT MAX(id_usuario) FROM usuarios));
SELECT setval('productos_id_producto_seq', (SELECT MAX(id_producto) FROM productos));
SELECT setval('dashboard_ventas_loop_id_registro_seq', (SELECT MAX(id_registro) FROM dashboard_ventas_loop));
SELECT setval('dashboard_ventas_coltrade_id_registro_seq', (SELECT MAX(id_registro) FROM dashboard_ventas_coltrade));
SELECT setval('dashboard_ventas_dataflow_id_registro_seq', (SELECT MAX(id_registro) FROM dashboard_ventas_dataflow));
SELECT setval('dashboard_finanzas_id_registro_seq', (SELECT MAX(id_registro) FROM dashboard_finanzas));
SELECT setval('dashboard_compras_id_registro_seq', (SELECT MAX(id_registro) FROM dashboard_compras));
SELECT setval('dashboard_ventas_id_registro_seq', (SELECT MAX(id_registro) FROM dashboard_ventas));
SELECT setval('dashboard_salesreview_id_registro_seq', (SELECT MAX(id_registro) FROM dashboard_salesreview));
SELECT setval('dashboard_sales_id_registro_seq', (SELECT MAX(id_registro) FROM dashboard_sales));
SELECT setval('tickets_id_ticket_seq', (SELECT MAX(id_ticket) FROM tickets));

-- Comandos SETVAL corregidos para tablas de relación
SELECT setval('detalle_producto_herramientas_id_seq', (SELECT MAX(id) FROM detalle_producto_herramientas));
SELECT setval('detalle_producto_id_seq', (SELECT MAX(id) FROM detalle_producto));
SELECT setval('detalle_producto_vendido_id_seq', (SELECT MAX(id) FROM detalle_producto_vendido));
SELECT setval('detalle_empresa_dashboard_id_seq', (SELECT MAX(id) FROM detalle_empresa_dashboard));




DASHBOARD

SELECT setval(
  pg_get_serial_sequence('public.dashboard_churn_kpi','id_registro'),
  COALESCE((SELECT MAX(id_registro) FROM public.dashboard_churn_kpi), 0) + 1,
  false
);
