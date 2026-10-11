import { expect, test } from "bun:test"
import {
  type InferSchSymbolInput,
  inferSchSymbol,
  toComponentTsx,
} from "../lib"
import { renderInference } from "./fixtures/render-inference"

// A two-terminal diode drawing cannot cover all three package pads; preserve the unlabeled third pin.
// Output: schPinArrangement: {"leftSide":{"pins":["pin1","pin2"],"direction":"top-to-bottom"},"rightSide":{"pins":["pin3"],"direction":"top-to-bottom"},"topSide":{"pins":[],"direction":"left-to-right"},"bottomSide":{"pins":[],"direction":"left-to-right"}}
test("Extra SOT-23 pad requires a complete box", async () => {
  const input: InferSchSymbolInput = {
    componentType: "diode",
    footprint: "sot23",
    pinLabels: {
      pin1: "K",
      pin2: "A",
    },
  }

  const output = inferSchSymbol(input)
  const tsx = toComponentTsx(output)
  const svg = await renderInference({
    title: "Extra SOT-23 pad requires a complete box",
    input,
    output,
    tsx,
  })

  await expect(svg).toMatchSvgSnapshot(import.meta.path)
})
