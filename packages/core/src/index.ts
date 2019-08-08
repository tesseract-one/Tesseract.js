
export interface TesseractPluginFactory<T> {
  (tesseract: TesseractModule): T
}

export class TesseractModule {
  public static plugins: { [name: string]: any; } = {}

  static addPlugin<P extends keyof TesseractModule>(prop: P, factory: TesseractPluginFactory<TesseractModule[P]>) {
    const self = this
    Object.defineProperty(this.prototype, prop, {
      get(): TesseractModule[P] {
        if (!self.plugins[prop]) {
          self.plugins[prop] = factory(this)
        }
        return self.plugins[prop]
      }
    })
  }
}

export const Tesseract = new TesseractModule()