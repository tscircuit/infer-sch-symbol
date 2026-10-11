import { expect, test } from "bun:test"
import {
  type InferSchSymbolInput,
  inferSchSymbol,
  toComponentTsx,
} from "../lib"
import { renderInference } from "./fixtures/render-inference"

// SOT-223: GND=1, VOUT=2, VIN=3; physical tab pad 4 is also VOUT. Preserve both output pads, even though they share an electrical role.
// Output: schPinArrangement: {"leftSide":{"pins":[],"direction":"top-to-bottom"},"rightSide":{"pins":["pin2","pin4"],"direction":"top-to-bottom"},"topSide":{"pins":["pin3"],"direction":"left-to-right"},"bottomSide":{"pins":["pin1"],"direction":"left-to-right"}}
test("AMS1117-3.3 regulator", async () => {
  const input: InferSchSymbolInput = {
    componentType: "ic",
    footprint: "sot223_4",
    pinLabels: {
      pin1: "GND",
      pin2: "VOUT",
      pin3: "VIN",
      pin4: ["VOUT", "TAB"],
    },
    pinAttributes: {
      pin1: {
        requiresGround: true,
      },
      pin2: {
        providesPower: true,
      },
      pin3: {
        requiresPower: true,
      },
      pin4: {
        providesPower: true,
      },
    },
  }

  const output = inferSchSymbol(input)
  const tsx = toComponentTsx(output)
  const svg = await renderInference({
    title: "AMS1117-3.3 regulator",
    input,
    output,
    tsx,
  })

  await expect(svg).toMatchSvgSnapshot(import.meta.path)
})
