import type { Metadata, Viewport } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";

import { C } from "@/lib/tokens";

// Propuesta de marca: Poppins para títulos y logo, Inter para el cuerpo, la
// app y los precios.
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Aliflow · Pide antes. Sin filas.",
  description:
    "Pide y paga tu almuerzo del campus antes de salir de clase, y retíralo sin hacer fila.",
};

export const viewport: Viewport = { themeColor: C.navy };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${inter.variable} ${poppins.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        {/* En el ambiente de prueba, que nadie lo confunda con el servicio real. */}
        {process.env.NEXT_PUBLIC_ALIFLOW_DEMO === "1" && (
          <div
            className="px-4 py-1.5 text-center text-xs font-medium"
            style={{ background: C.warnBg, color: C.warnText }}
          >
            Ambiente de demostración · los pagos son simulados y los datos pueden borrarse
          </div>
        )}
        {children}
      </body>
    </html>
  );
}
