import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

import { C } from "@/lib/tokens";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Aliflow",
  description: "Pedido anticipado y pago de almuerzos en el campus de la UEES",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${geistSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        {/* En el ambiente de prueba, que nadie lo confunda con el servicio real. */}
        {process.env.NEXT_PUBLIC_ALIFLOW_DEMO === "1" && (
          <div className="px-4 py-1.5 text-center text-xs font-medium" style={{ background: C.warnBg, color: C.warnText }}>
            Ambiente de demostración · los datos son de prueba y pueden borrarse
          </div>
        )}
        {children}
      </body>
    </html>
  );
}
