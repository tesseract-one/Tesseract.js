
export interface TesseractPluginFactory<T> {
  (tesseract: TesseractModule): T
}

export class TesseractModule {
  public static plugins: { [name: string]: any; } = {}

  static addPlugin<T>(prop: string, factory: TesseractPluginFactory<T>) {
    Object.defineProperty(this.prototype, prop, {
      get(): T {
        if (!this.plugins[prop]) {
          this.plugins[prop] = factory(this)
        }
        return this.plugins[prop]
      }
    })
  }
}

export const Tesseract = new TesseractModule()