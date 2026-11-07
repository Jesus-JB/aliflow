"use client";

import { Panel, Pendiente } from "@/components/Panel";

export default function Pagina() {
  return <Panel rol="SUPERADMIN">{() => <Pendiente titulo="Consola de plataforma" sprint={6} />}</Panel>;
}
