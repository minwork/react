export class PointerEvent extends MouseEvent {
  public height?: number;
  public isPrimary?: boolean;
  public pointerId?: number;
  public pointerType?: string;
  public pressure?: number;
  public tangentialPressure?: number;
  public tiltX?: number;
  public tiltY?: number;
  public twist?: number;
  public width?: number;

  constructor(type: string, params: PointerEventInit = {}) {
    super(type, params);
    this.pointerId = params.pointerId;
    this.width = params.width;
    this.height = params.height;
    this.pressure = params.pressure;
    this.tangentialPressure = params.tangentialPressure;
    this.tiltX = params.tiltX;
    this.tiltY = params.tiltY;
    this.pointerType = params.pointerType;
    this.isPrimary = params.isPrimary;
  }
  /* c8 ignore next 1 */
}

if (!global.PointerEvent) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  global.PointerEvent = PointerEvent as any;
}
