import { expect, test } from "bun:test"
import {
  type InferSchSymbolInput,
  inferSchSymbol,
  toComponentTsx,
} from "../lib"
import { renderInference } from "./fixtures/render-inference"

// A resistor and a capacitor can have identical package and terminal metadata; the part family disambiguates this example.
// Output: resistor_right; {"pin1":"pin1","pin2":"pin2"}
test("0603 resistor", async () => {
  const input: InferSchSymbolInput = {
    componentType: "resistor",
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
    title: "0603 resistor",
    input,
    output,
    tsx,
  })

  await expect(svg).toMatchSvgSnapshot(import.meta.path)
})
