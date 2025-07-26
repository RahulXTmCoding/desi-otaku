import 'fabric';

declare module 'fabric' {
  namespace fabric {
    interface Object {
      name?: string;
    }
  }
}
