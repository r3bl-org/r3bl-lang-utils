/*
 * Copyright (c) 2022 R3BL LLC. All rights reserved.
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

import { getLog } from "console-testing-library"; // https://www.npmjs.com/package/console-testing-library
import { ColorConsole, Formatter, printHeader, StyledColorConsole, Styles, TextColor, _also } from "../index"

test("TextColor builder works", () => {
  {
    const styleBuilder = TextColor.builder.red.bgWhite
    const builtStyle = styleBuilder.build()
    expect(builtStyle("text")).toEqual("[47m[31mtext[39m[49m")
    expect(builtStyle.applyFormatting("text")).toEqual("[47m[31mtext[39m[49m")
  }
  
  {
    const style = TextColor.builder.red.bgWhite.build()
    expect(style("text")).toEqual("[47m[31mtext[39m[49m")
    expect(style.applyFormatting("text")).toEqual("[47m[31mtext[39m[49m")
  }
})

test("create works", () => {
  _also("create test", it => {
    ColorConsole.create(Styles.Primary)(it).consoleLog()
    expect(getLog().log).toEqual(Formatter.primaryFn(it))
  })
})

test("Primary style works", () => {
  _also("primary color", it => {
    StyledColorConsole.Primary(it).consoleLog()
    expect(getLog().log).toEqual(Formatter.primaryFn(it))
  })
})

test("Secondary style works", () => {
  _also("secondary color", it => {
    StyledColorConsole.Secondary(it).consoleLog()
    expect(getLog().log).toEqual(Formatter.secondaryFn(it))
  })
})

test("printHeader works with long text", () => {
  _also("Very long test string.", it => {
    printHeader(it.repeat(10))
    expect(getLog().log).toContain(it)
  })
})

test("printHeader works with short text", () => {
  _also("Short test string!🌈", it => {
    printHeader(it)
    expect(getLog().log).toContain(it)
  })
})