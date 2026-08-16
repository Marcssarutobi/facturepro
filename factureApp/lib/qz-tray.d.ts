declare module "qz-tray" {
  interface QzWebsocket {
    isActive(): boolean
    connect(options?: Record<string, unknown>): Promise<void>
  }

  interface QzPrinters {
    find(): Promise<string[]>
  }

  interface QzConfigs {
    create(printer: string, options?: Record<string, unknown>): unknown
  }

  interface Qz {
    websocket: QzWebsocket
    printers: QzPrinters
    configs: QzConfigs
    print(config: unknown, data: unknown[]): Promise<void>
  }

  const qz: Qz
  export default qz
}
