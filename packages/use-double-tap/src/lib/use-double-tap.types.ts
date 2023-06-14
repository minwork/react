import { MouseEventHandler } from 'react';

type EmptyCallback = () => void;

export type CallbackFunction<Target = Element> = MouseEventHandler<Target> | EmptyCallback;
export type DoubleTapCallback<Target = Element> = CallbackFunction<Target> | null;

export interface DoubleTapOptions<Target = Element> {
  onSingleTap?: CallbackFunction<Target>;
}

export type DoubleTapResult<Target, Callback> = Callback extends CallbackFunction<Target>
  ? {
      onClick: CallbackFunction<Target>;
    }
  : Callback extends null
  ? Record<string, never>
  : never;
