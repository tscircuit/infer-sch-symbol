import { expect, test } from "bun:test"
import {
  type InferSchSymbolInput,
  inferSchSymbol,
  toComponentTsx,
} from "../lib"
import { renderInference } from "./fixtures/render-inference"

// Numeric aliases cannot steal another physical pin; the rendered top-to-bottom sequence stays 1,2,3,4.
// Output: custom connector symbol with one port per physical pin
test("Connector aliases preserve physical pin order", async () => {
  const input: InferSchSymbolInput = {
    componentType: "connector",
    footprint: "pinrow4",
    pinLabels: {
      pin1: ["FIRST", "pin2", "2"],
      pin2: ["SECOND", "pin1", "1"],
      pin3: ["THIRD", "pin4", "4"],
      pin4: ["FOURTH", "pin3", "3"],
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
    title: "Connector aliases preserve physical pin order",
    input,
    output,
    tsx,
  })

  await expect(svg).toMatchSvgSnapshot(import.meta.path)
})
