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

import { _callIfTruthy } from "./misc-utils"
import { _also } from "./kotlin-lang-utils"

const DEBUG = false

export class Timer {
  // Properties.

  private timerId?: NodeJS.Timeout

  // Backing fields for getter and/or setters.

  private _tickFn?: TimerTickFn
  private _stopFn?: TimerTickFn
  private _counter: Counter = new Counter()

  constructor(readonly name: string, readonly delayMs: number, readonly durationMs: number = -1) {}

  // State management delegated to TimerReducer.

  private dispatch = (action?: TimerReducer.Actions): TimerReducer.State =>
    _also(TimerReducer.reducerFn(this, this.state, action), (newState) => {
      this.state = newState
    })

  private state: TimerReducer.State = this.dispatch()

  start() {
    this.dispatch({ type: "start", startTime: Date.now() })
  }

  stop() {
    this.dispatch({ type: "stop", stopTime: Date.now() })
  }

  // Logic to start / stop the timer.

  _actuallyStartTimer() {
    const { name, durationMs, state, counter, delayMs } = this

    DEBUG && console.log(name ?? "Timer", "start called, timerId = ", this.timerId)

    const doTickAndAutoStopCheck = () => {
      if (durationMs > 0 && Date.now() - state.startTime >= durationMs) {
        this.stop()
      } else {
        _callIfTruthy(this._tickFn, (it) => it(this))
        counter.increment()
      }
    }

    this.timerId = setInterval(doTickAndAutoStopCheck, delayMs)

    DEBUG && console.log(name ?? "Timer", "started, timerId = ", this.timerId)
  }

  _actuallyStopTimer() {
    const { name } = this
    DEBUG && console.log(name ?? "Timer", "stop called, timerId = ", this.timerId)

    if (this.timerId) {
      clearInterval(this.timerId)
      this.timerId = undefined
    }

    _callIfTruthy(this._stopFn, (it) => it(this))

    DEBUG && console.log(name ?? "Timer", "stopped, timerId = ", this.timerId)
  }

  // Misc methods.

  toString(): string {
    const { counter, delayMs, name } = this
    return `name: ${name}, delay: ${delayMs}ms, counter:${counter.value}`
  }

  get isStopped(): boolean {
    return this.state.runtimeStatus === "stopped"
  }

  get isRunning(): boolean {
    return this.state.runtimeStatus === "running"
  }

  get isCreatedAndNotStarted(): boolean {
    return this.state.runtimeStatus === "created_not_started"
  }

  get currentCount(): number {
    return this.counterValue
  }

  get counterValue(): number {
    return this.counter.value
  }

  get counter(): Counter {
    return this._counter
  }

  set counter(value: Counter) {
    this._counter = value
  }

  set stopFn(value: TimerTickFn) {
    this._stopFn = value
  }

  set onStop(value: TimerTickFn) {
    this.stopFn = value
  }

  set tickFn(value: TimerTickFn) {
    this._tickFn = value
  }

  set onTick(value: TimerTickFn) {
    this.tickFn = value
  }

  startTicking(): this {
    this.start()
    return this
  }

  stopTicking(): this {
    this.stop()
    return this
  }
}

export type TimerTickFn = (timer: Timer) => void

export const TimerErrors = {
  CantStartAlreadyRunning: new Error("Timer can't start since its already running"),
  CantStopSinceNotStarted: new Error("Timer has been created, not started, can't be stopped"),
  CantStartSinceAlreadyStopped: new Error("Timer can't start, already stopped, make a new one"),
  CantStopSinceAlreadyStopped: new Error("Timer can't stopped, already stopped, make a new one"),
}

export class Counter {
  private count: number

  constructor(startCount = 0) {
    this.count = startCount
  }

  get value(): number {
    return this.count
  }

  increment = () => this.count++

  getAndIncrement = () => {
    const { count: oldCount } = this
    this.count++
    return oldCount
  }
}

namespace TimerReducer {
  interface StartAction {
    type: "start"
    startTime: number
  }
  interface StopAction {
    type: "stop"
    stopTime: number
  }
  export type Actions = StartAction | StopAction

  export interface State {
    runtimeStatus: LifecycleStage
    startTime: number
    stopTime: number
  }
  type LifecycleStage = "created_not_started" | "running" | "stopped"

  type ReducerFnType = (timer: Timer, currentState?: State, action?: Actions) => State

  /**
   * @throws TimerErrors
   */
  export const reducerFn: ReducerFnType = (
    timer: Timer,
    currentState?: State,
    action?: Actions
  ): State => {
    if (!currentState)
      return {
        runtimeStatus: "created_not_started",
        startTime: 0,
        stopTime: 0,
      }

    const { runtimeStatus } = currentState
    const {
      CantStartSinceAlreadyStopped: StartErr,
      CantStartAlreadyRunning: StartErr2,
      CantStopSinceAlreadyStopped: StopErr2,
      CantStopSinceNotStarted: StopErr,
    } = TimerErrors

    if (action)
      switch (action.type) {
        case "start":
          if (runtimeStatus === "created_not_started") return startFn(timer, currentState, action)
          if (runtimeStatus === "stopped") throw StartErr
          if (runtimeStatus === "running") throw StartErr2
          break
        case "stop":
          if (runtimeStatus === "created_not_started") throw StopErr
          if (runtimeStatus === "stopped") throw StopErr2
          if (runtimeStatus === "running") return stopFn(timer, currentState, action)
          break
      }

    return currentState
  }

  function stopFn(timer: Timer, currentState: State, action: StopAction): State {
    timer._actuallyStopTimer()
    return { ...currentState, runtimeStatus: "stopped", stopTime: action.stopTime }
  }

  function startFn(timer: Timer, currentState: State, action: StartAction): State {
    timer._actuallyStartTimer()
    return {
      ...currentState,
      runtimeStatus: "running",
      startTime: action.startTime,
    }
  }
}
