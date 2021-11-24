/*
 * Copyright 2021 R3BL LLC. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

// Module re-exports: https://www.typescriptlang.org/docs/handbook/modules.html
export * from "./counter"
export * from "./externals"
export * from "./timer-impl"

import { Timer } from "./externals"
import { TimerImpl } from "./timer-impl"

/** Factory function to create an object that implements (external) Timer interface. */
export const createTimer = (name: string, delay: number, duration?: number): Timer => {
  return new TimerImpl(name, delay, duration)
}
