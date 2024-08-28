import { FC, ReactNode, useRef } from 'react';
import { LongPressEventType, LongPressOptions, LongPressReactEvents, useLongPress } from 'use-long-press';
import { Button } from '@mui/material';
import { useSnackbar } from 'notistack';

export interface LongPressButtonProps {
  /**
   * Button text
   */
  children?: string;
  /**
   * Any value passed to result of `useLongPress` returned in callbacks inside `meta` param
   */
  context?: unknown;
  /**
   * Period of time that must elapse after detecting click or tap in order to trigger _callback_
   * @default 400
   */
  threshold?: number;
  /**
   * If `event.persist()` should be called on react event
   * @default false
   */
  captureEvent?: boolean;
  /**
   * Which type of events should be detected ('mouse' | 'touch' | 'pointer'). For TS use *LongPressEventType* enum.
   * @see LongPressEventType
   * @default LongPressEventType.Pointer
   */
  detect?: LongPressEventType;
  /**
   * Function to filter incoming events. Function should return `false` for events that will be ignored (e.g. right mouse clicks)
   * @param {Object} event React event coming from handlers
   * @see LongPressReactEvents
   */
  filterEvents?: (event: LongPressReactEvents) => boolean;
  /**
   * If long press should be canceled on mouse / touch / pointer move. Possible values:
   * - `false`: [default] Disable cancelling on movement
   * - `true`: Enable cancelling on movement and use default 25px threshold
   * - `number`: Set a specific tolerance value in pixels (square side size inside which movement won't cancel long press)
   * @default false
   */
  cancelOnMovement?: boolean | number;
  /**
   * If long press should be canceled when moving mouse / touch / pointer outside the element to which it was bound.
   *
   * Works for mouse and pointer events, touch events will be supported in the future.
   * @default true
   */
  cancelOutsideElement?: boolean;
}

export const LongPressButton: FC<LongPressButtonProps> = ({
  context,
  children,
  cancelOnMovement,
  threshold,
  ...options
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const timer = useRef(Date.now());
  const moveThrottle = useRef(Date.now());
  const handlers = useLongPress(
    () => {
      enqueueSnackbar(`Long pressed after ${threshold} ms`, { variant: 'success' });
    },
    {
      ...options,
      threshold,
      cancelOnMovement,
      onStart: (event, meta) => {
        timer.current = Date.now();
        enqueueSnackbar(`'onStart' callback called with: ${JSON.stringify(meta)}`, { variant: 'info' });
      },
      onMove: cancelOnMovement
        ? (event, meta) => {
            if (Date.now() - moveThrottle.current >= 700) {
              enqueueSnackbar(`'onMove' callback called with: ${JSON.stringify(meta)}`);
              moveThrottle.current = Date.now();
            }
          }
        : undefined,
      onCancel: (event, meta) => {
        enqueueSnackbar(
          `'onCancel' callback called after ${Date.now() - timer.current}ms with: ${JSON.stringify(meta)}`,
          { variant: 'error' }
        );
      },
      onFinish: (event, meta) => {
        enqueueSnackbar(
          `'onFinish' callback called after ${Date.now() - timer.current}ms with: ${JSON.stringify(meta)}`,
          { variant: 'info' }
        );
      },
    }
  );

  return (
    <Button {...handlers(context)} sx={{ px: 12, py: 6, fontSize: '3rem' }} variant={'contained'}>
      {children ?? 'Long press me'}
    </Button>
  );
};
