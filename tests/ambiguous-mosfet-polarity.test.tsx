import { expect, test } from "bun:test"
import {
  type InferSchSymbolInput,
  inferSchSymbol,
  toComponentTsx,
} from "../lib"
import { renderInference } from "./fixtures/render-inference"

// Gate/source/drain roles do not distinguish NMOS from PMOS; retain a box.
// Output: schPinArrangement: {"leftSide":{"pins":["pin1","pin2"],"direction":"top-to-bottom"},"rightSide":{"pins":["pin3"],"direction":"top-to-bottom"},"topSide":{"pins":[],"direction":"left-to-right"},"bottomSide":{"pins":[],"direction":"left-to-right"}}
test("MOSFET terminals without channel polarity", async () => {
  const input: InferSchSymbolInput = {
    footprint: "sot23",
    pinLabels: {
      pin1: "G",
      pin2: "S",
      pin3: "D",
    },
    pinAttributes: {
      G: {
        isInput: true,
      },
    },
  }

  const output = inferSchSymbol(input)
  const tsx = toComponentTsx(output)
  const svg = await renderInference({
    title: "MOSFET terminals without channel polarity",
    input,
    output,
    tsx,
  })

  await expect(svg).toMatchSvgSnapshot(import.meta.path)
})
