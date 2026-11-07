-- =============================================================================
-- Sprint 1 — lo que el esquema del entregable 04 no traía y la construcción sí
-- necesita. Cada cambio dice por qué.
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Sesiones del lado del servidor (RF-04 criterio 3, RF-05)
--
-- Se usan tokens opacos en vez de JWT: un JWT no se puede invalidar antes de
-- que expire, y RF-05 exige que tras cerrar sesión el token deje de aceptarse
-- y RF-04 que revocar una cuenta corte sus sesiones en la siguiente petición.
-- Solo se guarda el SHA-256 del token: si la tabla se filtra, no sirve para
-- entrar.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE sesion (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id        UUID        NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    token_hash        BYTEA       NOT NULL UNIQUE,
    creada_en         TIMESTAMPTZ NOT NULL DEFAULT now(),
    ultima_actividad  TIMESTAMPTZ NOT NULL DEFAULT now(),
    revocada_en       TIMESTAMPTZ,
    ip                INET,
    agente_usuario    TEXT,

    CONSTRAINT sesion_hash_sha256 CHECK (octet_length(token_hash) = 32)
);
CREATE INDEX ix_sesion_usuario_activa ON sesion (usuario_id) WHERE revocada_en IS NULL;


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. El código institucional deja de ser obligatorio al registrarse
--
-- RF-02 crea el perfil en el primer ingreso con Google, y Google entrega
-- nombre y correo, no la matrícula. Exigirlo NOT NULL obligaría a inventar un
-- valor o a bloquear el primer ingreso con un formulario que la especificación
-- no pide. Sigue siendo UNIQUE: si existe, no se repite.
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE estudiante ALTER COLUMN codigo_institucional DROP NOT NULL;


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Antigüedad del stock sincronizado (RN-02, RF-51 — doble verificación)
--
-- El acta 1.2 acordó que la disponibilidad vendible es el mínimo entre el cupo
-- y el stock del ERP, y que si ese stock es más viejo que el umbral acordado la
-- validación cae al cupo. Para saber si está vencido hay que saber cuándo se
-- sincronizó. El diagrama de clases ya lo tenía (Plato.stockSincronizadoEn);
-- el DDL no.
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE plato ADD COLUMN stock_sincronizado_en TIMESTAMPTZ;
COMMENT ON COLUMN plato.stock_sincronizado_en IS
    'Momento de la última lectura de stock_erp. NULL o más viejo que el umbral '
    'del local ⇒ la validación de venta usa solo el cupo (RN-02).';
