export function createServerFn(options: any = {}) {
  const fnState = {
    _validator: null as any,
    _handler: null as any,

    inputValidator(validator: any) {
      this._validator = validator;
      return this;
    },

    handler(handlerFn: any) {
      this._handler = handlerFn;

      const callable = async (args: any = {}) => {
        if (this._validator) {
          this._validator(args);
        }
        return this._handler(args);
      };

      return callable;
    }
  };

  return fnState;
}

export function createMiddleware() {
  return {
    server: () => ({})
  };
}

export function createStart() {
  return () => ({});
}
