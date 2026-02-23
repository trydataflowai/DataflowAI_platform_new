INSERT INTO public.dashboard_salescorporativo (
  id_registro, orden_compra, fecha, mes_nombre, categoria_cliente, nombre_cliente,
  categoria_producto, marca, producto, estado_cotizacion, unidades, precio_unitario,
  observaciones, id_empresa, id_producto
)
SELECT
  56 + gs.n,

  LEFT('OC-' || (10000 + gs.n),10),

  current_date - (gs.n % 180),

  LEFT(to_char(current_date - (gs.n % 180), 'Mon'),10),

  LEFT((ARRAY['Gobierno','Empresa','PYME','Educacion'])[(gs.n % 4) + 1],10),

  'Cliente ' || (gs.n % 80),

  LEFT((ARRAY['Computo','Accesorios','Redes','Seguridad','Oficina'])[(gs.n % 5) + 1],10),

  LEFT((ARRAY['HP','Dell','Lenovo','Cisco','Samsung'])[(gs.n % 5) + 1],10),

  'Producto ' || (gs.n % 60),

  LEFT((ARRAY['Aprobada','Pendiente','Rechazada','Negociacion'])[(gs.n % 4) + 1],10),

  1 + (gs.n % 200),

  round((random()*4000000 + 50000)::numeric,2),

  'Demo',

  2,
  15

FROM generate_series(1,200) gs(n);
