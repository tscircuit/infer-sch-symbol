import { expect, test } from "bun:test"
import {
  type InferSchSymbolInput,
  inferSchSymbol,
  toComponentTsx,
} from "../lib"
import { renderInference } from "./fixtures/render-inference"

// Eight physical pins represent two amplifier units and shared rails. A single triangle cannot represent all of them, so the prototype must retain all pins in its fallback box.
// Output: schPinArrangement: {"leftSide":{"pins":["pin2","pin3","pin5","pin6"],"direction":"top-to-bottom"},"rightSide":{"pins":["pin1","pin7"],"direction":"top-to-bottom"},"topSide":{"pins":["pin8"],"direction":"left-to-right"},"bottomSide":{"pins":["pin4"],"direction":"left-to-right"}}
test("LM358 dual op amp", async () => {
  const input: InferSchSymbolInput = {
    componentType: "opamp",
    footprint: "soic8",
    pinLabels: {
      pin1: "OUT1",
      pin2: "IN1-",
      pin3: "IN1+",
      pin4: ["V-", "VEE"],
      pin5: "IN2+",
      pin6: "IN2-",
      pin7: "OUT2",
      pin8: ["V+", "VCC"],
    },
    pinAttributes: {
      pin1: {
        isOutput: true,
      },
      pin2: {
        isInput: true,
      },
      pin3: {
        isInput: true,
      },
      pin4: {
        requiresPower: true,
      },
      pin5: {
        isInput: true,
      },
      pin6: {
        isInput: true,
      },
      pin7: {
        isOutput: true,
      },
      pin8: {
        requiresPower: true,
      },
    },
  }

  const output = inferSchSymbol(input)
  const tsx = toComponentTsx(output)
  const svg = await renderInference({
    title: "LM358 dual op amp",
    input,
    output,
    tsx,
  })

  await expect(svg).toMatchSvgSnapshot(import.meta.path)
})
