import { expect, test } from "bun:test"
import {
  type InferSchSymbolInput,
  inferSchSymbol,
  toComponentTsx,
} from "../lib"
import { renderInference } from "./fixtures/render-inference"

// An abstract straight header with no protocol or power-role evidence; preserve the original physical pin order.
// Output: custom connector symbol with one port per physical pin
test("Four-pin generic connector", async () => {
  const input: InferSchSymbolInput = {
    componentType: "connector",
    footprint: "pinrow4",
    pinLabels: {
      pin1: "1",
      pin2: "2",
      pin3: "3",
      pin4: "4",
    },
    pinAttributes: {
      pin1: {
        isPassive: true,
      },
      pin2: {
        isPassive: true,
      },
      pin3: {
        isPassive: true,
      },
      pin4: {
        isPassive: true,
      },
    },
  }

  const output = inferSchSymbol(input)
  const tsx = toComponentTsx(output)
  const svg = await renderInference({
    title: "Four-pin generic connector",
    input,
    output,
    tsx,
  })

  await expect(svg).toMatchSvgSnapshot(import.meta.path)
})
