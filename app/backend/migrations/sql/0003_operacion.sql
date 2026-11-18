-- =============================================================================
-- Sprints 2 a 5 — menú, compra, retiro y fidelidad. Lo que el esquema del
-- entregable 04 no traía y la construcción sí necesita.
-- =============================================================================

-- 1. Ícono del plato. El prototipo y la propuesta de marca muestran cada plato
--    con una ilustración; mientras no haya fotos, un emoji cumple ese papel.
--    Es opcional y puramente visual.
ALTER TABLE plato ADD COLUMN emoji TEXT;

-- 2. El panel del local consulta las órdenes del día por hora (RF-18 y la
--    analítica en vivo). Sin este índice, cada actualización del panel recorre
--    todas las órdenes del local.
CREATE INDEX ix_orden_proveedor_fecha ON orden (proveedor_id, fecha_hora DESC);

-- 3. El historial de saldo del estudiante y el canje buscan por estudiante.
CREATE INDEX ix_cartilla_estudiante ON cartilla (estudiante_id);
