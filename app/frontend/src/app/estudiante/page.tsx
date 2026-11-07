"use client";

import { Panel, Pendiente } from "@/components/Panel";

export default function Pagina() {
  return <Panel rol="ESTUDIANTE">{() => <Pendiente titulo="Menú del día" sprint={2} />}</Panel>;
}
