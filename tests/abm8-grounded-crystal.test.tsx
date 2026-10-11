import { expect, test } from "bun:test"
import {
  type InferSchSymbolInput,
  inferSchSymbol,
  toComponentTsx,
} from "../lib"
import { renderInference } from "./fixtures/render-inference"

// Crystal terminals are pads 1 and 3; case-ground pads 2 and 4 must survive fallback instead of disappearing into a two-pin crystal symbol.
// Output: schPinArrangement: {"leftSide":{"pins":["pin1"],"direction":"top-to-bottom"},"rightSide":{"pins":["pin3"],"direction":"top-to-bottom"},"topSide":{"pins":[],"direction":"left-to-right"},"bottomSide":{"pins":["pin2","pin4"],"direction":"left-to-right"}}
test("ABM8 four-pad grounded crystal", async () => {
  const input: InferSchSymbolInput = {
    componentType: "crystal",
    footprint: "crystal",
    pinLabels: {
      pin1: "XTAL1",
      pin2: ["GND", "CASE_GND"],
      pin3: "XTAL2",
      pin4: ["GND", "CASE_GND"],
    },
    pinAttributes: {
      pin1: {
        isPassive: true,
      },
      pin2: {
        requiresGround: true,
      },
      pin3: {
        isPassive: true,
      },
      pin4: {
        requiresGround: true,
      },
    },
  }

  const output = inferSchSymbol(input)
  const tsx = toComponentTsx(output)
  const svg = await renderInference({
    title: "ABM8 four-pad grounded crystal",
    input,
    output,
    tsx,
  })

  await expect(svg).toMatchSvgSnapshot(import.meta.path)
})
