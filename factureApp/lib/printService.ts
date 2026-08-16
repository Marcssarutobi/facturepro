"use client"

import axiosInstance from "@/lib/axiosInstance"

// Nom de l'imprimante tel qu'il apparaît dans Windows/Mac (Panneau de config > Imprimantes).
// À terme, remplace cette constante par une valeur stockée par organisation.
const DEFAULT_PRINTER_NAME = "POS-80"

/**
 * qz-tray utilise `window` et `WebSocket`, indisponibles côté serveur (SSR).
 * On l'importe donc dynamiquement, uniquement au moment de l'appel.
 */
async function getQz() {
  const qz = (await import("qz-tray")).default
  return qz
}

/**
 * Vérifie si QZ Tray tourne sur le poste du client.
 */
export async function isQzTrayAvailable(): Promise<boolean> {
  try {
    const qz = await getQz()
    if (!qz.websocket.isActive()) {
      await qz.websocket.connect()
    }
    return true
  } catch (err) {
    console.warn("QZ Tray non détecté :", err)
    return false
  }
}

/**
 * Envoie le ticket ESC/POS (avec bloc e-MCF si la facture est normalisée)
 * directement à l'imprimante, sans dialogue d'impression.
 */
async function printInvoiceReceipt(invoiceId: number, printerName: string = DEFAULT_PRINTER_NAME): Promise<void> {
  const res = await axiosInstance.get(`/invoices/${invoiceId}/print-ticket`)
  const base64Ticket: string = res.data.data

  const qz = await getQz()
  if (!qz.websocket.isActive()) {
    await qz.websocket.connect()
  }

  const config = qz.configs.create(printerName)
  const printData = [{ type: "raw", format: "base64", data: base64Ticket }]

  await qz.print(config, printData)
}

export type PrintOutcome = "printed" | "fallback" | "error"

/**
 * Point d'entrée utilisé à la création d'une facture : imprime automatiquement
 * le ticket. Si QZ Tray n'est pas détecté, ouvre le PDF classique à la place.
 * Ne lève jamais d'exception : la création de la facture ne doit jamais être
 * bloquée par un problème d'impression.
 */
export async function autoPrintReceipt(invoiceId: number, printerName?: string): Promise<PrintOutcome> {
  try {
    const available = await isQzTrayAvailable()

    if (available) {
      await printInvoiceReceipt(invoiceId, printerName)
      return "printed"
    }

    const res = await axiosInstance.get(`/invoices/${invoiceId}/pdf`, { responseType: "blob" })
    const blob = new Blob([res.data], { type: "application/pdf" })
    const url = window.URL.createObjectURL(blob)
    window.open(url, "_blank")
    return "fallback"
  } catch (err) {
    console.error("Erreur d'impression du ticket :", err)
    return "error"
  }
}
