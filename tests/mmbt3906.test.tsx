import { expect, test } from "bun:test"
import {
  type InferSchSymbolInput,
  inferSchSymbol,
  toComponentTsx,
} from "../lib"
import { renderInference } from "./fixtures/render-inference"

// The base/emitter/collector pinout matches MMBT3904, but the explicit part family establishes opposite transistor polarity.
// Output: pnp_bipolar_transistor_down; {"base":"pin1","collector":"pin3","emitter":"pin2"}
test("MMBT3906 PNP transistor", async () => {
  const input: InferSchSymbolInput = {
    componentType: "pnp",
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
    title: "MMBT3906 PNP transistor",
    input,
    output,
    tsx,
  })

  await expect(svg).toMatchSvgSnapshot(import.meta.path)
})
