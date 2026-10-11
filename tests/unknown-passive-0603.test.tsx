import { expect, test } from "bun:test"
import {
  type InferSchSymbolInput,
  inferSchSymbol,
  toComponentTsx,
} from "../lib"
import { renderInference } from "./fixtures/render-inference"

// Exactly the same labels, attributes, and footprint as the resistor/capacitor/inductor examples, but no family evidence. A box or explicit ambiguity is the safe result.
// Output: schPinArrangement: {"leftSide":{"pins":["pin1"],"direction":"top-to-bottom"},"rightSide":{"pins":["pin2"],"direction":"top-to-bottom"},"topSide":{"pins":[],"direction":"left-to-right"},"bottomSide":{"pins":[],"direction":"left-to-right"}}
test("Unknown 0603 passive", async () => {
  const input: InferSchSymbolInput = {
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
    title: "Unknown 0603 passive",
    input,
    output,
    tsx,
  })

  await expect(svg).toMatchSvgSnapshot(import.meta.path)
})
