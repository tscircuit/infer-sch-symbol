import { expect, test } from "bun:test"
import {
  type InferSchSymbolInput,
  inferSchSymbol,
  toComponentTsx,
} from "../lib"
import { renderInference } from "./fixtures/render-inference"

// Two vertically separated pads have no electrical direction hints. Their physical placement should put pin1 on the top side and pin2 on the bottom side.
// Output: schPinArrangement: {"leftSide":{"pins":[],"direction":"top-to-bottom"},"rightSide":{"pins":[],"direction":"top-to-bottom"},"topSide":{"pins":["pin1"],"direction":"left-to-right"},"bottomSide":{"pins":["pin2"],"direction":"left-to-right"}}
test("Vertical pads guide fallback box placement", async () => {
  const input: InferSchSymbolInput = {
    componentType: "ic",
    footprint: "pinrow2_rows2",
    pinLabels: {
      pin1: "NORTH",
      pin2: "SOUTH",
    },
  }

  const output = inferSchSymbol(input)
  const tsx = toComponentTsx(output)
  const svg = await renderInference({
    title: "Vertical pads guide fallback box placement",
    input,
    output,
    tsx,
  })

  await expect(svg).toMatchSvgSnapshot(import.meta.path)
})
