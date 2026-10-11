import { expect, test } from "bun:test"
import {
  type InferSchSymbolInput,
  inferSchSymbol,
  toComponentTsx,
} from "../lib"
import { renderInference } from "./fixtures/render-inference"

// An unpolarized ceramic capacitor with two interchangeable passive terminals.
// Output: capacitor_right; {"pin1":"pin1","pin2":"pin2"}
test("0603 ceramic capacitor", async () => {
  const input: InferSchSymbolInput = {
    componentType: "capacitor",
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
    title: "0603 ceramic capacitor",
    input,
    output,
    tsx,
  })

  await expect(svg).toMatchSvgSnapshot(import.meta.path)
})
