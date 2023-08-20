type EmptyCallback = () => void;
export type IntervalHookCallback = (ticks?: number) => void;
export type IntervalHookFinishCallback = () => void;
export type IntervalHookStartMethod = EmptyCallback;
export type IntervalHookStopMethod = (triggerFinishCallback?: boolean) => void;
export type IntervalHookIsActiveMethod = () => boolean;

export interface IntervalHookOptions {
  onFinish?: IntervalHookFinishCallback;
  autoStart?: boolean;
  immediate?: boolean;
  selfCorrecting?: boolean;
}

export type IntervalHookResult = {
  start: IntervalHookStartMethod;
  stop: IntervalHookStopMethod;
  isActive: IntervalHookIsActiveMethod;
};
