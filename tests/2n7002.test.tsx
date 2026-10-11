import { expect, test } from "bun:test"
import {
  type InferSchSymbolInput,
  inferSchSymbol,
  toComponentTsx,
} from "../lib"
import { renderInference } from "./fixtures/render-inference"

// SOT-23 gate/source/drain are physical pins 1/2/3. The same package is also used by the P-channel and BJT examples.
// Output: n_channel_e_mosfet_transistor_horz; {"gate":"pin1","drain":"pin3","source":"pin2"}
test("2N7002 N-channel MOSFET", async () => {
  const input: InferSchSymbolInput = {
    componentType: "nmos",
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
    title: "2N7002 N-channel MOSFET",
    input,
    output,
    tsx,
  })

  await expect(svg).toMatchSvgSnapshot(import.meta.path)
})
