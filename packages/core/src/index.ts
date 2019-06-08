
export interface TesseractPluginFactory<T> {
  (tesseract: TesseractModule): T
}

export class TesseractModule {
  public static plugins: { [name: string]: any; } = {}

  static addPlugin<T>(prop: string, factory: TesseractPluginFactory<T>) {
    const self = this
    Object.defineProperty(this.prototype, prop, {
      get(): T {
        if (!self.plugins[prop]) {
          self.plugins[prop] = factory(this)
        }
        return self.plugins[prop]
      }
    })
  }
}

export const Tesseract = new TesseractModule()