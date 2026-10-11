import { expect, test } from "bun:test"
import {
  type InferSchSymbolInput,
  inferSchSymbol,
  toComponentTsx,
} from "../lib"
import { renderInference } from "./fixtures/render-inference"

// Drawing terminal pin1 maps to package pin3; drawing terminal pin2 maps to package pin7.
// Output: resistor_right; {"pin1":"pin3","pin2":"pin7"}
test("Resistor with non-contiguous physical pins", async () => {
  const input: InferSchSymbolInput = {
    componentType: "resistor",
    pinLabels: {
      pin7: "B",
      pin3: "A",
    },
  }

  const output = inferSchSymbol(input)
  const tsx = toComponentTsx(output)
  const svg = await renderInference({
    title: "Resistor with non-contiguous physical pins",
    input,
    output,
    tsx,
  })

  await expect(svg).toMatchSvgSnapshot(import.meta.path)
})
