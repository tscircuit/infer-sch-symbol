import { expect, test } from "bun:test"
import {
  type InferSchSymbolInput,
  inferSchSymbol,
  toComponentTsx,
} from "../lib"
import { renderInference } from "./fixtures/render-inference"

// A general-purpose IC box groups input signals, output signals, and supply pins while retaining the datasheet pin numbers.
// Output: schPinArrangement: {"leftSide":{"pins":["pin2","pin4","pin5","pin6"],"direction":"top-to-bottom"},"rightSide":{"pins":["pin3","pin7"],"direction":"top-to-bottom"},"topSide":{"pins":["pin8"],"direction":"left-to-right"},"bottomSide":{"pins":["pin1"],"direction":"left-to-right"}}
test("NE555 timer", async () => {
  const input: InferSchSymbolInput = {
    componentType: "ic",
    footprint: "soic8",
    pinLabels: {
      pin1: "GND",
      pin2: "TRIG",
      pin3: "OUT",
      pin4: ["RESET", "RESET_N"],
      pin5: ["CONT", "CONTROL"],
      pin6: "THRES",
      pin7: "DISCH",
      pin8: "VCC",
    },
    pinAttributes: {
      pin1: {
        requiresGround: true,
      },
      pin2: {
        isInput: true,
      },
      pin3: {
        isOutput: true,
      },
      pin4: {
        isInput: true,
      },
      pin5: {
        isInput: true,
      },
      pin6: {
        isInput: true,
      },
      pin7: {
        isOutput: true,
        canUseOpenCollector: true,
      },
      pin8: {
        requiresPower: true,
      },
    },
  }

  const output = inferSchSymbol(input)
  const tsx = toComponentTsx(output)
  const svg = await renderInference({
    title: "NE555 timer",
    input,
    output,
    tsx,
  })

  await expect(svg).toMatchSvgSnapshot(import.meta.path)
})
