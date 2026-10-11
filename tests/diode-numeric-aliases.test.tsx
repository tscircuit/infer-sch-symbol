import { expect, test } from "bun:test"
import {
  type InferSchSymbolInput,
  inferSchSymbol,
  toComponentTsx,
} from "../lib"
import { renderInference } from "./fixtures/render-inference"

// Numeric and canonical aliases cannot steal physical selectors: anode remains pin2, cathode pin1.
// Output: diode_right; {"anode":"pin2","cathode":"pin1"}
test("Diode aliases cannot reverse physical polarity", async () => {
  const input: InferSchSymbolInput = {
    componentType: "diode",
    footprint: "sod123",
    pinLabels: {
      pin1: ["K", "pin2", "2"],
      pin2: ["A", "pin1", "1"],
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
    title: "Diode aliases cannot reverse physical polarity",
    input,
    output,
    tsx,
  })

  await expect(svg).toMatchSvgSnapshot(import.meta.path)
})
