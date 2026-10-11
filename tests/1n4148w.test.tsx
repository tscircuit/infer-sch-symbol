import { expect, test } from "bun:test"
import {
  type InferSchSymbolInput,
  inferSchSymbol,
  toComponentTsx,
} from "../lib"
import { renderInference } from "./fixtures/render-inference"

// SOD-123 pad 1 is cathode and pad 2 is anode. The inferred symbol must preserve this reversed physical numbering.
// Output: diode_right; {"anode":"pin2","cathode":"pin1"}
test("1N4148W switching diode", async () => {
  const input: InferSchSymbolInput = {
    componentType: "diode",
    footprint: "sod123",
    pinLabels: {
      pin1: ["K", "cathode"],
      pin2: ["A", "anode"],
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
    title: "1N4148W switching diode",
    input,
    output,
    tsx,
  })

  await expect(svg).toMatchSvgSnapshot(import.meta.path)
})
