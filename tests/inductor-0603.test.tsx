import { expect, test } from "bun:test"
import {
  type InferSchSymbolInput,
  inferSchSymbol,
  toComponentTsx,
} from "../lib"
import { renderInference } from "./fixtures/render-inference"

// A two-terminal inductor; the footprint alone does not distinguish it from the resistor or capacitor examples.
// Output: inductor_right; {"pin1":"pin1","pin2":"pin2"}
test("0603 chip inductor", async () => {
  const input: InferSchSymbolInput = {
    componentType: "inductor",
    footprint: "0603",
    pinLabels: {
      pin1: "1",
      pin2: "2",
    },
    pinAttributes: {
      pin1: {
        isPassive: true,
      },
      pin2: {
        isPassive: true,
      },
    },
  }

  const output = inferSchSymbol(input)
  const tsx = toComponentTsx(output)
  const svg = await renderInference({
    title: "0603 chip inductor",
    input,
    output,
    tsx,
  })

  await expect(svg).toMatchSvgSnapshot(import.meta.path)
})
