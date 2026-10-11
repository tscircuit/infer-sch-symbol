import { expect, test } from "bun:test"
import {
  type InferSchSymbolInput,
  inferSchSymbol,
  toComponentTsx,
} from "../lib"
import { renderInference } from "./fixtures/render-inference"

// Physical pins 1/2/3 are gate/source/drain. Gate, source, and drain labels alone cannot determine channel polarity.
// Output: p_channel_e_mosfet_transistor_horz; {"gate":"pin1","drain":"pin3","source":"pin2"}
test("BSS84 P-channel MOSFET", async () => {
  const input: InferSchSymbolInput = {
    componentType: "pmos",
    footprint: "sot23",
    pinLabels: {
      pin1: ["G", "gate"],
      pin2: ["S", "source"],
      pin3: ["D", "drain"],
    },
    pinAttributes: {
      pin1: {
        isInput: true,
      },
    },
  }

  const output = inferSchSymbol(input)
  const tsx = toComponentTsx(output)
  const svg = await renderInference({
    title: "BSS84 P-channel MOSFET",
    input,
    output,
    tsx,
  })

  await expect(svg).toMatchSvgSnapshot(import.meta.path)
})
