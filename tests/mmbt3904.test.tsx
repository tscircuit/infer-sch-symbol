import { expect, test } from "bun:test"
import {
  type InferSchSymbolInput,
  inferSchSymbol,
  toComponentTsx,
} from "../lib"
import { renderInference } from "./fixtures/render-inference"

// SOT-23 physical pins 1/2/3 are base/emitter/collector; these numbers differ from the schematic symbol's role order.
// Output: npn_bipolar_transistor_down; {"base":"pin1","collector":"pin3","emitter":"pin2"}
test("MMBT3904 NPN transistor", async () => {
  const input: InferSchSymbolInput = {
    componentType: "npn",
    footprint: "sot23",
    pinLabels: {
      pin1: ["B", "base"],
      pin2: ["E", "emitter"],
      pin3: ["C", "collector"],
    },
  }

  const output = inferSchSymbol(input)
  const tsx = toComponentTsx(output)
  const svg = await renderInference({
    title: "MMBT3904 NPN transistor",
    input,
    output,
    tsx,
  })

  await expect(svg).toMatchSvgSnapshot(import.meta.path)
})
