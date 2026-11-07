"use client";

import { Panel, Pendiente } from "@/components/Panel";

export default function Pagina() {
  return <Panel rol="OPERADOR">{() => <Pendiente titulo="Validación de códigos de retiro" sprint={4} />}</Panel>;
}
