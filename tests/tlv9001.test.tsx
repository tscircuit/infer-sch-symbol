import { expect, test } from "bun:test"
import {
  type InferSchSymbolInput,
  inferSchSymbol,
  toComponentTsx,
} from "../lib"
import { renderInference } from "./fixtures/render-inference"

// SOT-23-5: OUT=1, V−=2, IN+=3, IN−=4, V+=5. Supply pins remain present in the triangle symbol.
// Output: opamp_with_power_right; {"inp1":"pin3","inp2":"pin4","out":"pin1","V+":"pin5","V-":"pin2"}
test("TLV9001 single op amp", async () => {
  const input: InferSchSymbolInput = {
    componentType: "opamp",
    footprint: "sot23_5",
    pinLabels: {
      pin1: ["OUT", "output"],
      pin2: ["V-", "VEE"],
      pin3: ["IN+", "noninverting"],
      pin4: ["IN-", "inverting"],
      pin5: ["V+", "VCC"],
    },
    pinAttributes: {
      pin1: {
        isOutput: true,
      },
      pin2: {
        requiresPower: true,
      },
      pin3: {
        isInput: true,
      },
      pin4: {
        isInput: true,
      },
      pin5: {
        requiresPower: true,
      },
    },
  }

  const output = inferSchSymbol(input)
  const tsx = toComponentTsx(output)
  const svg = await renderInference({
    title: "TLV9001 single op amp",
    input,
    output,
    tsx,
  })

  await expect(svg).toMatchSvgSnapshot(import.meta.path)
})
