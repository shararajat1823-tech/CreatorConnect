import { InjectionToken } from '@angular/core';

/** The Express response for the current SSR request (server only; null in browser). */
export interface ServerResponseLike {
  status(code: number): unknown;
}

export const RESPONSE = new InjectionToken<ServerResponseLike | null>('EXPRESS_RESPONSE');
