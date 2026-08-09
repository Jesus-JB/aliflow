-- =============================================================================
-- Aliflow — Esquema de base de datos
-- PostgreSQL 15+
--
-- Entregable 04 del proyecto. Se deriva de:
--   ../02-Modelamiento-Parte-Estatica/b-Diagrama-de-Clases.md   (entidades)
--   ../01-Especificacion-de-Requerimientos/02-Requerimientos-Funcionales.md
--
-- Criterio de este esquema: las reglas de negocio que se PUEDEN expresar como
-- restricción declarativa se expresan acá, no en el código. Una regla que vive
-- solo en la aplicación se rompe la primera vez que alguien escribe por otro
-- camino. Donde no se pudo, está dicho explícitamente y con la razón.
-- =============================================================================

BEGIN;

-- `email` usa CITEXT para que la unicidad no distinga mayúsculas: dos cuentas
-- con el mismo correo en distinta caja serían la misma persona.
CREATE EXTENSION IF NOT EXISTS citext;

-- ─────────────────────────────────────────────────────────────────────────────
-- Tipos enumerados
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TYPE rol_usuario          AS ENUM ('ESTUDIANTE', 'ADMINISTRADOR', 'OPERADOR', 'SUPERADMIN');
CREATE TYPE estado_orden         AS ENUM ('COMPRADO', 'ENTREGADO', 'EXPIRADO');
CREATE TYPE estado_codigo_retiro AS ENUM ('VALIDO', 'UTILIZADO', 'VENCIDO');
CREATE TYPE estado_pago          AS ENUM ('APROBADO', 'PENDIENTE', 'RECHAZADO');
CREATE TYPE estado_cartilla      AS ENUM ('EN_CURSO', 'COMPLETA', 'CANJEADA', 'EXPIRADA');
CREATE TYPE tipo_movimiento      AS ENUM ('RECARGA', 'COMPRA', 'REVERSO', 'AJUSTE');
CREATE TYPE tipo_erp             AS ENUM ('CONTIFICO', 'ALPWIN', 'ODOO', 'OTRO');
CREATE TYPE tipo_evento          AS ENUM ('ACTUALIZAR_STOCK', 'NOTIFICAR_VENTA', 'NOTIFICAR_PAGO');
CREATE TYPE estado_evento        AS ENUM ('PENDIENTE', 'PROCESADO', 'FALLIDO');


-- ═════════════════════════════════════════════════════════════════════════════
-- 1. PROVEEDOR (el local / tenant)
-- ═════════════════════════════════════════════════════════════════════════════

CREATE TABLE proveedor (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_comercial            TEXT        NOT NULL,
    ruc                         VARCHAR(13) NOT NULL UNIQUE,
    fecha_alta                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    activo                      BOOLEAN     NOT NULL DEFAULT TRUE,

    -- RN-05: nunca una constante del sistema. Cada local configura la suya y de
    -- acá sale la expiración del código de retiro y el mensaje al estudiante.
    hora_maxima_retiro          TIME        NOT NULL,

    -- RN-14 / decisión #13: el dinero de cada recarga va DIRECTO a la cuenta de
    -- este proveedor. Aliflow no custodia fondos, solo registra el movimiento.
    -- Cada local necesita su propia cuenta de comercio en la pasarela (R-22).
    cuenta_bancaria_destino     TEXT,
    credenciales_comercio_cifradas TEXT,

    CONSTRAINT proveedor_nombre_no_vacio CHECK (length(btrim(nombre_comercial)) > 0)
);

COMMENT ON TABLE proveedor IS
    'El local de comida (Barú, Caramel Coffee). Es el tenant: casi toda tabla '
    'del dominio se filtra por él (RN-07).';


CREATE TABLE punto_entrega (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proveedor_id  UUID NOT NULL REFERENCES proveedor(id) ON DELETE CASCADE,
    nombre        TEXT NOT NULL,
    ubicacion     TEXT,

    UNIQUE (id, proveedor_id)   -- habilita las FK compuestas de más abajo
);
CREATE INDEX ix_punto_entrega_proveedor ON punto_entrega (proveedor_id);


-- ═════════════════════════════════════════════════════════════════════════════
-- 2. USUARIOS — tabla base + tablas hijas
--
-- El Super-Admin es el ÚNICO rol sin local, y esa distinción del diagrama de
-- clases se preserva estructuralmente: no tiene fila en usuario_proveedor, así
-- que la base de datos misma hace imposible asignarle un local.
-- ═════════════════════════════════════════════════════════════════════════════

CREATE TABLE usuario (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_completo TEXT        NOT NULL,
    email           CITEXT      NOT NULL UNIQUE,
    rol             rol_usuario NOT NULL,
    fecha_registro  TIMESTAMPTZ NOT NULL DEFAULT now(),
    activo          BOOLEAN     NOT NULL DEFAULT TRUE,

    -- RNF-P-17. NULL para el Estudiante: se autentica con Google OAuth y su
    -- contraseña nunca pasa por Aliflow (RF-01, criterio 4).
    password_hash   TEXT,

    UNIQUE (id, rol),           -- habilita las FK compuestas por rol

    CONSTRAINT usuario_password_segun_rol CHECK (
        (rol = 'ESTUDIANTE' AND password_hash IS NULL)
        OR (rol <> 'ESTUDIANTE' AND password_hash IS NOT NULL)
    )
);


CREATE TABLE estudiante (
    usuario_id           UUID PRIMARY KEY REFERENCES usuario(id) ON DELETE CASCADE,
    rol                  rol_usuario NOT NULL DEFAULT 'ESTUDIANTE',
    codigo_institucional TEXT NOT NULL UNIQUE,

    -- Amarra esta fila al rol correcto: no se puede colgar un estudiante de un
    -- usuario que sea Operador.
    FOREIGN KEY (usuario_id, rol) REFERENCES usuario(id, rol),
    CONSTRAINT estudiante_rol_correcto CHECK (rol = 'ESTUDIANTE')
);


CREATE TABLE usuario_proveedor (
    usuario_id       UUID PRIMARY KEY REFERENCES usuario(id) ON DELETE CASCADE,
    rol              rol_usuario NOT NULL,
    proveedor_id     UUID NOT NULL REFERENCES proveedor(id) ON DELETE CASCADE,
    punto_entrega_id UUID,

    FOREIGN KEY (usuario_id, rol) REFERENCES usuario(id, rol),

    -- El punto de entrega tiene que ser del MISMO local (RN-07).
    FOREIGN KEY (punto_entrega_id, proveedor_id)
        REFERENCES punto_entrega(id, proveedor_id),

    CONSTRAINT usuario_proveedor_rol_valido CHECK (rol IN ('ADMINISTRADOR', 'OPERADOR')),

    -- Solo el Operador trabaja en un punto de entrega concreto.
    CONSTRAINT punto_entrega_solo_operador CHECK (
        rol = 'OPERADOR' OR punto_entrega_id IS NULL
    )
);
CREATE INDEX ix_usuario_proveedor_proveedor ON usuario_proveedor (proveedor_id);

COMMENT ON TABLE usuario_proveedor IS
    'Administrador y Operador. El Super-Admin NO tiene fila acá: es el único '
    'rol sin local, y así la base impide asignárselo.';


-- ═════════════════════════════════════════════════════════════════════════════
-- 3. MENÚ E INVENTARIO RESERVADO
-- ═════════════════════════════════════════════════════════════════════════════

CREATE TABLE plato (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proveedor_id UUID    NOT NULL REFERENCES proveedor(id) ON DELETE CASCADE,
    nombre       TEXT    NOT NULL,
    descripcion  TEXT,
    precio       NUMERIC(10,2) NOT NULL,
    activo       BOOLEAN NOT NULL DEFAULT TRUE,

    -- Espejo informativo de lo que reporta el ERP del local. NO decide si
    -- Aliflow puede vender — eso lo decide el cupo reservado (RN-02).
    stock_erp    INTEGER NOT NULL DEFAULT 0,

    version      INTEGER NOT NULL DEFAULT 0,

    UNIQUE (id, proveedor_id),  -- habilita la FK compuesta de orden_detalle

    CONSTRAINT plato_precio_positivo CHECK (precio > 0),          -- RF-13
    CONSTRAINT plato_nombre_no_vacio CHECK (length(btrim(nombre)) > 0),
    CONSTRAINT plato_stock_no_negativo CHECK (stock_erp >= 0)
);
CREATE INDEX ix_plato_proveedor_activo ON plato (proveedor_id, activo);


CREATE TABLE inventario_reservado (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plato_id       UUID    NOT NULL REFERENCES plato(id) ON DELETE CASCADE,
    fecha_vigencia DATE    NOT NULL,
    cupo_asignado  INTEGER NOT NULL DEFAULT 0,
    cupo_consumido INTEGER NOT NULL DEFAULT 0,

    -- RN-11: el bloqueo optimista vive acá, no en el ERP. Se probó delegarlo a
    -- Odoo por RPC y falló bajo concurrencia real (demo-odoo/README.md §7).
    version        INTEGER NOT NULL DEFAULT 0,

    UNIQUE (plato_id, fecha_vigencia),

    CONSTRAINT cupo_asignado_no_negativo  CHECK (cupo_asignado  >= 0),
    CONSTRAINT cupo_consumido_no_negativo CHECK (cupo_consumido >= 0),

    -- RF-16 y RF-21: imposible sobrevender, e imposible reducir el cupo por
    -- debajo de lo ya vendido. Es la restricción que elimina la sobreventa.
    CONSTRAINT cupo_no_sobrevendido CHECK (cupo_consumido <= cupo_asignado)
);

COMMENT ON CONSTRAINT cupo_no_sobrevendido ON inventario_reservado IS
    'RN-02: Aliflow vende contra este cupo y nunca contra stock_erp. Con esta '
    'restricción la sobreventa es imposible por diseño, no por sincronización.';


-- ═════════════════════════════════════════════════════════════════════════════
-- 4. BILLETERA — saldo POR ESTABLECIMIENTO, como libro de movimientos
--
-- Decisión #13 (8-ago-2026): el saldo pertenece al local, no al estudiante.
-- Se recarga para un local y solo se gasta ahí (RN-13). Aliflow no custodia
-- fondos: el dinero va de la pasarela a la cuenta del proveedor (RN-14).
-- ═════════════════════════════════════════════════════════════════════════════

CREATE TABLE saldo_establecimiento (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    estudiante_id UUID NOT NULL REFERENCES estudiante(usuario_id) ON DELETE CASCADE,
    proveedor_id  UUID NOT NULL REFERENCES proveedor(id)          ON DELETE RESTRICT,

    -- Caché del saldo: se mantiene al día con los movimientos. La verdad son
    -- los movimientos; esto evita sumarlos en cada consulta de menú.
    monto_actual  NUMERIC(10,2) NOT NULL DEFAULT 0,
    version       INTEGER       NOT NULL DEFAULT 0,

    UNIQUE (estudiante_id, proveedor_id),   -- un saldo por par estudiante-local
    UNIQUE (id, estudiante_id),             -- habilita la FK compuesta de orden

    CONSTRAINT saldo_no_negativo CHECK (monto_actual >= 0)
);

COMMENT ON TABLE saldo_establecimiento IS
    'RN-13: un saldo por (estudiante, local). No existe saldo único ni '
    'transferencia entre locales — mover dinero entre cuentas de terceros es '
    'lo que el acta §3.9 prohíbe. Costo asumido: R-21, saldo fragmentado.';


CREATE TABLE recarga (
    id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    saldo_establecimiento_id UUID NOT NULL REFERENCES saldo_establecimiento(id),

    -- RF-08: toda recarga tiene establecimiento destino obligatorio.
    proveedor_destino_id   UUID NOT NULL REFERENCES proveedor(id),

    -- RF-09: los siete campos que exige el acta §2.1.
    monto_total            NUMERIC(10,2) NOT NULL,
    fecha_hora             TIMESTAMPTZ   NOT NULL DEFAULT now(),
    numero_operacion       TEXT          NOT NULL,
    estado_transaccion     estado_pago   NOT NULL,
    id_pasarela            TEXT          NOT NULL,
    usuario_id             UUID          NOT NULL REFERENCES usuario(id),

    CONSTRAINT recarga_monto_positivo CHECK (monto_total > 0),

    -- RF-08, criterio 5: reprocesar la misma confirmación no acredita dos veces.
    CONSTRAINT recarga_operacion_unica UNIQUE (id_pasarela, numero_operacion)
);
CREATE INDEX ix_recarga_proveedor_fecha ON recarga (proveedor_destino_id, fecha_hora);


CREATE TABLE metodo_pago (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    estudiante_id    UUID NOT NULL REFERENCES estudiante(usuario_id) ON DELETE CASCADE,
    tipo_tarjeta     TEXT NOT NULL,
    ultimos_cuatro   CHAR(4) NOT NULL,
    token_pasarela   TEXT NOT NULL,
    predeterminado   BOOLEAN NOT NULL DEFAULT FALSE,

    CONSTRAINT ultimos_cuatro_numericos CHECK (ultimos_cuatro ~ '^[0-9]{4}$')
);

-- RN-06 / RNF-P-18: acá NO hay ni puede haber número completo de tarjeta ni
-- código de seguridad. Solo tipo, últimos cuatro y el token de la pasarela.
-- Es lo que mantiene a Aliflow fuera del alcance de PCI-DSS (RNF-E-03).
COMMENT ON TABLE metodo_pago IS
    'Solo tipo, últimos cuatro dígitos y token. Nunca el número completo ni el '
    'CVV: los datos bancarios reales los custodia la pasarela.';


CREATE TABLE pago (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recarga_id              UUID REFERENCES recarga(id),
    metodo_pago_id          UUID REFERENCES metodo_pago(id),
    monto                   NUMERIC(10,2) NOT NULL,
    estado                  estado_pago   NOT NULL,
    fecha_hora              TIMESTAMPTZ   NOT NULL DEFAULT now(),
    id_transaccion_pasarela TEXT          NOT NULL UNIQUE,

    -- RF-08, criterio 2: solo un pago aprobado genera recarga.
    CONSTRAINT pago_recarga_solo_si_aprobado CHECK (
        (estado = 'APROBADO' AND recarga_id IS NOT NULL)
        OR (estado <> 'APROBADO' AND recarga_id IS NULL)
    )
);


CREATE TABLE comprobante_recarga (
    id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recarga_id             UUID NOT NULL UNIQUE REFERENCES recarga(id) ON DELETE CASCADE,
    fecha_emision          TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- RN-09 / RNF-E-01: Aliflow NUNCA emite un documento con validez
    -- tributaria. La factura la emite el ERP del local, en la compra.
    sin_validez_tributaria BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT comprobante_recarga_nunca_fiscal CHECK (sin_validez_tributaria)
);


-- ═════════════════════════════════════════════════════════════════════════════
-- 5. ÓRDENES
-- ═════════════════════════════════════════════════════════════════════════════

CREATE TABLE orden (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    estudiante_id UUID NOT NULL REFERENCES estudiante(usuario_id),
    proveedor_id  UUID NOT NULL REFERENCES proveedor(id),

    -- RN-13: la compra descuenta del saldo de ESTE local. La FK compuesta con
    -- estudiante_id impide gastar el saldo de otra persona.
    -- NULL solo en un canje: el premio lo regala el local y no se paga con
    -- saldo (RF-35), así que no debe exigir que el estudiante tenga uno.
    saldo_establecimiento_id UUID,

    fecha_hora    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    estado        estado_orden NOT NULL DEFAULT 'COMPRADO',

    -- RN-12: el canje NO es una venta de $0. Conserva el precio del plato y le
    -- aplica un descuento del 100% rotulado, para que el local pueda ver
    -- cuánto le costaron los premios (RF-38, criterio 3).
    es_canje         BOOLEAN NOT NULL DEFAULT FALSE,
    subtotal         NUMERIC(10,2) NOT NULL,
    descuento        NUMERIC(10,2) NOT NULL DEFAULT 0,
    motivo_descuento TEXT,
    total            NUMERIC(10,2) GENERATED ALWAYS AS (subtotal - descuento) STORED,

    -- Se copia del proveedor al comprar: si el local cambia su horario después,
    -- no altera órdenes ya emitidas.
    hora_maxima_retiro TIME NOT NULL,

    operador_id   UUID REFERENCES usuario_proveedor(usuario_id),
    entregado_en  TIMESTAMPTZ,

    UNIQUE (id, proveedor_id),   -- habilita la FK compuesta de orden_detalle

    FOREIGN KEY (saldo_establecimiento_id, estudiante_id)
        REFERENCES saldo_establecimiento(id, estudiante_id),

    CONSTRAINT orden_subtotal_no_negativo CHECK (subtotal >= 0),

    -- Una compra normal siempre sale de un saldo; un canje, nunca.
    CONSTRAINT orden_saldo_segun_tipo CHECK (
        (NOT es_canje AND saldo_establecimiento_id IS NOT NULL)
        OR es_canje
    ),
    CONSTRAINT orden_descuento_valido     CHECK (descuento >= 0 AND descuento <= subtotal),
    CONSTRAINT orden_descuento_con_motivo CHECK (descuento = 0 OR motivo_descuento IS NOT NULL),

    -- Un canje se cobra siempre con descuento del 100%.
    CONSTRAINT canje_descuento_total CHECK (NOT es_canje OR descuento = subtotal),

    -- RF-26: entregada ⇒ hay operador y marca de tiempo.
    CONSTRAINT entrega_completa CHECK (
        (estado = 'ENTREGADO' AND operador_id IS NOT NULL AND entregado_en IS NOT NULL)
        OR (estado <> 'ENTREGADO' AND entregado_en IS NULL)
    )
);
CREATE INDEX ix_orden_proveedor_estado ON orden (proveedor_id, estado);
CREATE INDEX ix_orden_estudiante_fecha ON orden (estudiante_id, fecha_hora DESC);


CREATE TABLE orden_detalle (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    orden_id        UUID NOT NULL,
    plato_id        UUID NOT NULL,
    proveedor_id    UUID NOT NULL,
    cantidad        INTEGER       NOT NULL,
    precio_unitario NUMERIC(10,2) NOT NULL,

    -- RN-01, y esta es la parte importante: la regla "una orden nunca mezcla
    -- platos de locales distintos" queda garantizada por la BASE DE DATOS, no
    -- por el código. Las dos FK compuestas comparten proveedor_id, así que un
    -- plato de otro local simplemente no tiene dónde encajar.
    FOREIGN KEY (orden_id, proveedor_id) REFERENCES orden(id, proveedor_id) ON DELETE CASCADE,
    FOREIGN KEY (plato_id, proveedor_id) REFERENCES plato(id, proveedor_id),

    CONSTRAINT detalle_cantidad_positiva CHECK (cantidad > 0),
    CONSTRAINT detalle_precio_no_negativo CHECK (precio_unitario >= 0)
);
CREATE INDEX ix_orden_detalle_orden ON orden_detalle (orden_id);


CREATE TABLE codigo_retiro (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    orden_id         UUID NOT NULL UNIQUE REFERENCES orden(id) ON DELETE CASCADE,

    -- Desnormalizado a propósito: lo necesita el índice parcial de unicidad.
    proveedor_id     UUID NOT NULL REFERENCES proveedor(id),

    valor            CHAR(6) NOT NULL,
    fecha_compra     DATE    NOT NULL,
    fecha_expiracion TIMESTAMPTZ NOT NULL,
    estado           estado_codigo_retiro NOT NULL DEFAULT 'VALIDO',

    CONSTRAINT codigo_seis_digitos CHECK (valor ~ '^[0-9]{6}$')
);

-- Unicidad ACOTADA: seis dígitos solo alcanzan si se exige unicidad entre los
-- códigos VIGENTES de un mismo local — no global ni histórica. Con ~10⁶
-- combinaciones y unas pocas decenas de códigos vivos por local, la colisión es
-- rara y la generación reintenta. Ver riesgo R-15.
CREATE UNIQUE INDEX ux_codigo_vigente_por_local
    ON codigo_retiro (proveedor_id, valor)
    WHERE estado = 'VALIDO';

CREATE INDEX ix_codigo_valor ON codigo_retiro (valor) WHERE estado = 'VALIDO';


CREATE TABLE comprobante_compra (
    id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    orden_id               UUID NOT NULL UNIQUE REFERENCES orden(id) ON DELETE CASCADE,
    fecha_emision          TIMESTAMPTZ   NOT NULL DEFAULT now(),
    monto_total            NUMERIC(10,2) NOT NULL,
    sin_validez_tributaria BOOLEAN       NOT NULL DEFAULT TRUE,

    CONSTRAINT comprobante_compra_nunca_fiscal CHECK (sin_validez_tributaria)
);


-- ═════════════════════════════════════════════════════════════════════════════
-- 6. MOVIMIENTOS DE SALDO — libro append-only
--
-- RF-56: ningún movimiento de dinero se elimina ni se modifica. Una corrección
-- es un movimiento compensatorio (REVERSO), nunca un UPDATE.
--
-- Esto además deja resuelta por adelantado la decisión abierta sobre qué pasa
-- con el dinero de una orden vencida: sea cual sea la respuesta, es un
-- movimiento más y no un cambio de esquema.
-- ═════════════════════════════════════════════════════════════════════════════

CREATE TABLE movimiento_saldo (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    saldo_establecimiento_id UUID NOT NULL REFERENCES saldo_establecimiento(id),
    tipo                     tipo_movimiento NOT NULL,

    -- Positivo acredita, negativo descuenta. El signo tiene que ser coherente
    -- con el tipo, y eso lo verifica la restricción de abajo.
    monto                    NUMERIC(10,2) NOT NULL,
    saldo_anterior           NUMERIC(10,2) NOT NULL,
    saldo_posterior          NUMERIC(10,2) NOT NULL,

    recarga_id               UUID REFERENCES recarga(id),
    orden_id                 UUID REFERENCES orden(id),
    movimiento_revertido_id  UUID REFERENCES movimiento_saldo(id),

    motivo                   TEXT,
    creado_en                TIMESTAMPTZ NOT NULL DEFAULT now(),
    creado_por               UUID REFERENCES usuario(id),

    CONSTRAINT movimiento_monto_no_cero CHECK (monto <> 0),
    CONSTRAINT movimiento_cuadra        CHECK (saldo_posterior = saldo_anterior + monto),
    CONSTRAINT movimiento_saldo_no_negativo CHECK (saldo_posterior >= 0),

    CONSTRAINT movimiento_signo_coherente CHECK (
        (tipo = 'RECARGA' AND monto > 0 AND recarga_id IS NOT NULL)
        OR (tipo = 'COMPRA'  AND monto < 0 AND orden_id IS NOT NULL)
        OR (tipo = 'REVERSO' AND movimiento_revertido_id IS NOT NULL)
        OR (tipo = 'AJUSTE'  AND motivo IS NOT NULL)
    ),

    -- Una compra descuenta una sola vez, aunque se reintente la transacción.
    CONSTRAINT movimiento_una_compra_por_orden UNIQUE (orden_id)
);
CREATE INDEX ix_movimiento_saldo_fecha ON movimiento_saldo (saldo_establecimiento_id, creado_en DESC);


-- La regla de "histórico sin borrado" se hace cumplir, no se pide por favor.
CREATE OR REPLACE FUNCTION impedir_modificacion_movimiento() RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION
        'movimiento_saldo es append-only (RF-56): una corrección se registra '
        'como movimiento REVERSO, nunca modificando o borrando el original.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tg_movimiento_saldo_inmutable
    BEFORE UPDATE OR DELETE ON movimiento_saldo
    FOR EACH ROW EXECUTE FUNCTION impedir_modificacion_movimiento();


-- ═════════════════════════════════════════════════════════════════════════════
-- 7. FIDELIDAD
-- ═════════════════════════════════════════════════════════════════════════════

CREATE TABLE programa_fidelidad (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- RN-08: el programa cuelga del LOCAL, no de la plataforma. El premio lo
    -- absorbe el local, así que cada uno define el suyo — o no tiene ninguno.
    proveedor_id          UUID NOT NULL UNIQUE REFERENCES proveedor(id) ON DELETE CASCADE,

    -- RN-05: configuración, no constantes. Los dos valores que Negocios todavía
    -- no definió (cuántos sellos, qué premio) se cargan acá sin tocar código.
    sellos_requeridos     INTEGER NOT NULL,
    descripcion_premio    TEXT    NOT NULL,
    max_sellos_por_dia    INTEGER NOT NULL DEFAULT 1,
    vigencia_cartilla_dias INTEGER,          -- NULL = la cartilla no caduca
    activo                BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT sellos_requeridos_positivo CHECK (sellos_requeridos > 0),   -- RF-32
    CONSTRAINT max_sellos_por_dia_positivo CHECK (max_sellos_por_dia > 0),
    CONSTRAINT vigencia_positiva CHECK (vigencia_cartilla_dias IS NULL OR vigencia_cartilla_dias > 0)
);


CREATE TABLE cartilla (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    programa_id       UUID NOT NULL REFERENCES programa_fidelidad(id) ON DELETE CASCADE,
    estudiante_id     UUID NOT NULL REFERENCES estudiante(usuario_id) ON DELETE CASCADE,
    sellos_acumulados INTEGER NOT NULL DEFAULT 0,
    estado            estado_cartilla NOT NULL DEFAULT 'EN_CURSO',
    fecha_inicio      TIMESTAMPTZ NOT NULL DEFAULT now(),
    fecha_expiracion  TIMESTAMPTZ,

    CONSTRAINT sellos_acumulados_no_negativo CHECK (sellos_acumulados >= 0)
);

-- Una sola cartilla EN_CURSO por estudiante y programa. Las canjeadas o
-- expiradas quedan en el histórico, por eso el índice es parcial.
CREATE UNIQUE INDEX ux_cartilla_en_curso
    ON cartilla (programa_id, estudiante_id)
    WHERE estado IN ('EN_CURSO', 'COMPLETA');


CREATE TABLE sello (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cartilla_id UUID NOT NULL REFERENCES cartilla(id) ON DELETE CASCADE,

    -- RN-08 / RF-33 criterio 2: un sello por orden, garantizado por el modelo.
    -- Si la confirmación de entrega se reintenta —fallo de red, doble clic del
    -- Operador— la segunda inserción falla y no se acredita dos veces.
    orden_id    UUID NOT NULL UNIQUE REFERENCES orden(id) ON DELETE CASCADE,

    fecha       DATE NOT NULL DEFAULT CURRENT_DATE,
    creado_en   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_sello_cartilla_fecha ON sello (cartilla_id, fecha);


CREATE TABLE canje (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cartilla_id      UUID NOT NULL UNIQUE REFERENCES cartilla(id),
    orden_id         UUID NOT NULL UNIQUE REFERENCES orden(id),
    premio_entregado TEXT NOT NULL,
    fecha_hora       TIMESTAMPTZ NOT NULL DEFAULT now(),
    operador_id      UUID REFERENCES usuario_proveedor(usuario_id)
);


-- ═════════════════════════════════════════════════════════════════════════════
-- 8. INTEGRACIÓN CON ERP — patrón Outbox
-- ═════════════════════════════════════════════════════════════════════════════

CREATE TABLE integracion_erp (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proveedor_id                UUID NOT NULL UNIQUE REFERENCES proveedor(id) ON DELETE CASCADE,
    tipo_erp                    tipo_erp NOT NULL,

    -- RNF-P-19: cifradas y no legibles desde ninguna interfaz.
    credenciales_cifradas       TEXT,
    endpoint                    TEXT,
    ultima_sincronizacion_exitosa TIMESTAMPTZ
);


CREATE TABLE evento_sincronizacion (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proveedor_id   UUID NOT NULL REFERENCES proveedor(id) ON DELETE CASCADE,
    tipo_evento    tipo_evento   NOT NULL,
    payload        JSONB         NOT NULL,
    estado         estado_evento NOT NULL DEFAULT 'PENDIENTE',
    intentos       INTEGER       NOT NULL DEFAULT 0,

    -- RNF-P-12: reprocesar un evento no duplica su efecto en el ERP.
    id_idempotencia TEXT NOT NULL UNIQUE,

    orden_id       UUID REFERENCES orden(id),
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT now(),
    procesado_en   TIMESTAMPTZ,
    ultimo_error   TEXT,

    CONSTRAINT intentos_no_negativos CHECK (intentos >= 0)
);

-- El worker toma los pendientes en orden de llegada; el índice parcial evita
-- recorrer el histórico ya procesado, que crece sin límite.
CREATE INDEX ix_evento_pendiente
    ON evento_sincronizacion (proveedor_id, fecha_creacion)
    WHERE estado IN ('PENDIENTE', 'FALLIDO');


-- ═════════════════════════════════════════════════════════════════════════════
-- 9. AUDITORÍA
-- ═════════════════════════════════════════════════════════════════════════════

CREATE TABLE registro_auditoria (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id       UUID REFERENCES usuario(id),
    rol              rol_usuario,
    accion           TEXT NOT NULL,
    entidad_afectada TEXT NOT NULL,
    entidad_id       UUID,
    detalle          JSONB,
    fecha_hora       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_auditoria_entidad ON registro_auditoria (entidad_afectada, entidad_id);
CREATE INDEX ix_auditoria_usuario_fecha ON registro_auditoria (usuario_id, fecha_hora DESC);

-- RF-54 criterio 2: los registros de auditoría no son editables ni eliminables
-- desde ninguna interfaz del sistema.
CREATE OR REPLACE FUNCTION impedir_modificacion_auditoria() RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION
        'registro_auditoria es inmutable (RF-54): una bitácora que se puede '
        'editar no sirve como bitácora.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tg_auditoria_inmutable
    BEFORE UPDATE OR DELETE ON registro_auditoria
    FOR EACH ROW EXECUTE FUNCTION impedir_modificacion_auditoria();


COMMIT;

-- =============================================================================
-- Reglas que NO se pudieron expresar declarativamente, y por qué
-- =============================================================================
--
-- 1. TOPE DE SELLOS POR DÍA (RN-08).
--    Sería un UNIQUE (cartilla_id, fecha), pero max_sellos_por_dia es
--    CONFIGURABLE por local (RF-32): un local podría poner 2. Una restricción
--    fija contradiría esa configurabilidad. Se verifica en la transacción de
--    entrega, contando sellos del día contra el valor del programa.
--    Lo que SÍ garantiza la base es que una orden nunca genere dos sellos
--    (sello.orden_id UNIQUE), que es el caso de reintento y el más probable.
--
-- 2. AISLAMIENTO ENTRE LOCALES (RN-07).
--    Las FK compuestas cubren los cruces estructurales (orden_detalle, punto de
--    entrega del operador), pero el filtrado por local de cada consulta es
--    responsabilidad del backend. Se recomienda activar Row Level Security por
--    proveedor_id cuando el motor lo permita, para que deje de depender de que
--    ninguna consulta se olvide del WHERE.
--
-- 3. EXPIRACIÓN DEL CÓDIGO Y DE LA ORDEN (RN-03, RF-29).
--    Es una transición de estado disparada por el paso del tiempo, no una
--    restricción. La ejecuta una tarea programada al cierre de cada día.
--
-- 4. monto_actual COMO CACHÉ.
--    La verdad son los movimientos. monto_actual se actualiza en la misma
--    transacción que inserta el movimiento y se puede verificar con:
--        SELECT s.id FROM saldo_establecimiento s
--        LEFT JOIN (SELECT saldo_establecimiento_id, SUM(monto) t
--                   FROM movimiento_saldo GROUP BY 1) m ON m.saldo_establecimiento_id = s.id
--        WHERE s.monto_actual <> COALESCE(m.t, 0);
--    Esa consulta debe devolver cero filas siempre. Conviene correrla en la
--    conciliación periódica (RNF-O-11).
-- =============================================================================
