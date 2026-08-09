-- =============================================================================
-- Aliflow — Pruebas de las restricciones del esquema
--
-- No prueban la aplicación: prueban que la BASE DE DATOS impide lo que dice
-- impedir. Cada bloque de la primera parte DEBE fallar; si alguno pasa, esa
-- regla de negocio no está protegida y vive solo en el código.
--
-- Ejecutado contra PostgreSQL 16.14 el 9-ago-2026: 10 de 10 rechazadas.
--
-- Uso:
--   createdb aliflow_test
--   psql -d aliflow_test -f esquema.sql
--   psql -d aliflow_test -f pruebas-restricciones.sql
-- =============================================================================


-- ── Datos base ───────────────────────────────────────────────────────────────
INSERT INTO proveedor (id, nombre_comercial, ruc, hora_maxima_retiro) VALUES
  ('11111111-1111-1111-1111-111111111111','Barú','0999999999001','14:00'),
  ('22222222-2222-2222-2222-222222222222','Caramel Coffee','0988888888001','16:30');

INSERT INTO usuario (id, nombre_completo, email, rol, password_hash) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001','Estudiante Uno','e1@uees.edu.ec','ESTUDIANTE',NULL),
  ('aaaaaaaa-0000-0000-0000-000000000002','Super Admin','sa@aliflow.ec','SUPERADMIN','hash'),
  ('aaaaaaaa-0000-0000-0000-000000000003','Operador Baru','op@baru.ec','OPERADOR','hash');
INSERT INTO estudiante (usuario_id, codigo_institucional) VALUES ('aaaaaaaa-0000-0000-0000-000000000001','U001');
INSERT INTO usuario_proveedor (usuario_id, rol, proveedor_id) VALUES ('aaaaaaaa-0000-0000-0000-000000000003','OPERADOR','11111111-1111-1111-1111-111111111111');

INSERT INTO plato (id, proveedor_id, nombre, precio) VALUES
  ('bbbbbbbb-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','Seco de pollo',3.50),
  ('bbbbbbbb-0000-0000-0000-000000000002','22222222-2222-2222-2222-222222222222','Café mediano',1.50);
INSERT INTO inventario_reservado (plato_id, fecha_vigencia, cupo_asignado, cupo_consumido)
  VALUES ('bbbbbbbb-0000-0000-0000-000000000001', CURRENT_DATE, 5, 0);

INSERT INTO saldo_establecimiento (id, estudiante_id, proveedor_id, monto_actual) VALUES
  ('cccccccc-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111',12.40);

INSERT INTO orden (id, estudiante_id, proveedor_id, saldo_establecimiento_id, subtotal, hora_maxima_retiro)
  VALUES ('dddddddd-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','cccccccc-0000-0000-0000-000000000001',3.50,'14:00');

\echo '════ Cada prueba DEBE fallar. Si alguna pasa, la regla no está protegida ════'

\echo '\n1· RN-01 — orden con plato de OTRO local:'
INSERT INTO orden_detalle (orden_id, plato_id, proveedor_id, cantidad, precio_unitario)
  VALUES ('dddddddd-0000-0000-0000-000000000001','bbbbbbbb-0000-0000-0000-000000000002','22222222-2222-2222-2222-222222222222',1,1.50);

\echo '\n2· Super-Admin con local asignado:'
INSERT INTO usuario_proveedor (usuario_id, rol, proveedor_id)
  VALUES ('aaaaaaaa-0000-0000-0000-000000000002','SUPERADMIN','11111111-1111-1111-1111-111111111111');

\echo '\n3· Sobreventa — consumir más cupo del asignado:'
UPDATE inventario_reservado SET cupo_consumido = 6 WHERE cupo_asignado = 5;

\echo '\n4· Estudiante con contraseña (debe usar OAuth):'
INSERT INTO usuario (nombre_completo, email, rol, password_hash) VALUES ('X','x@uees.edu.ec','ESTUDIANTE','hash');

\echo '\n5· Dos códigos VÁLIDOS iguales en el mismo local:'
INSERT INTO codigo_retiro (orden_id, proveedor_id, valor, fecha_compra, fecha_expiracion)
  VALUES ('dddddddd-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','123456',CURRENT_DATE, now());
INSERT INTO orden (id, estudiante_id, proveedor_id, saldo_establecimiento_id, subtotal, hora_maxima_retiro)
  VALUES ('dddddddd-0000-0000-0000-000000000002','aaaaaaaa-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','cccccccc-0000-0000-0000-000000000001',3.00,'14:00');
INSERT INTO codigo_retiro (orden_id, proveedor_id, valor, fecha_compra, fecha_expiracion)
  VALUES ('dddddddd-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111','123456',CURRENT_DATE, now());

\echo '\n6· Movimiento de saldo que no cuadra:'
INSERT INTO movimiento_saldo (saldo_establecimiento_id, tipo, monto, saldo_anterior, saldo_posterior, orden_id)
  VALUES ('cccccccc-0000-0000-0000-000000000001','COMPRA',-3.50, 12.40, 99.00,'dddddddd-0000-0000-0000-000000000001');

\echo '\n7· RF-56 — modificar un movimiento ya registrado:'
INSERT INTO movimiento_saldo (saldo_establecimiento_id, tipo, monto, saldo_anterior, saldo_posterior, orden_id)
  VALUES ('cccccccc-0000-0000-0000-000000000001','COMPRA',-3.50, 12.40, 8.90,'dddddddd-0000-0000-0000-000000000001');
UPDATE movimiento_saldo SET monto = -1.00;

\echo '\n8· Dos sellos por la misma orden (reintento de entrega):'
INSERT INTO programa_fidelidad (id, proveedor_id, sellos_requeridos, descripcion_premio)
  VALUES ('eeeeeeee-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111',8,'Almuerzo gratis');
INSERT INTO cartilla (id, programa_id, estudiante_id) VALUES ('ffffffff-0000-0000-0000-000000000001','eeeeeeee-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000001');
INSERT INTO sello (cartilla_id, orden_id) VALUES ('ffffffff-0000-0000-0000-000000000001','dddddddd-0000-0000-0000-000000000001');
INSERT INTO sello (cartilla_id, orden_id) VALUES ('ffffffff-0000-0000-0000-000000000001','dddddddd-0000-0000-0000-000000000001');

\echo '\n9· Canje que no descuenta el 100%:'
INSERT INTO orden (estudiante_id, proveedor_id, subtotal, descuento, motivo_descuento, es_canje, hora_maxima_retiro)
  VALUES ('aaaaaaaa-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111',3.50,1.00,'Premio',TRUE,'14:00');

\echo '\n10· Comprobante con validez tributaria:'
INSERT INTO comprobante_compra (orden_id, monto_total, sin_validez_tributaria)
  VALUES ('dddddddd-0000-0000-0000-000000000001',3.50,FALSE);

\echo '\n════ Ahora lo que SÍ debe funcionar ════'
\echo '\n11· Canje con descuento del 100% y sin saldo:'
INSERT INTO orden (estudiante_id, proveedor_id, subtotal, descuento, motivo_descuento, es_canje, hora_maxima_retiro)
  VALUES ('aaaaaaaa-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111',3.50,3.50,'Premio de fidelidad',TRUE,'14:00');
\echo '12· El total se calcula solo:'
SELECT 'total = ' || total || ' (subtotal 3.50 - descuento 3.50)' FROM orden WHERE es_canje;
\echo '13· Reverso de un movimiento:'
INSERT INTO movimiento_saldo (saldo_establecimiento_id, tipo, monto, saldo_anterior, saldo_posterior, movimiento_revertido_id, motivo)
  SELECT 'cccccccc-0000-0000-0000-000000000001','REVERSO',3.50,8.90,12.40,id,'Orden vencida' FROM movimiento_saldo WHERE tipo='COMPRA' LIMIT 1;
SELECT 'movimientos registrados: ' || count(*) FROM movimiento_saldo;
