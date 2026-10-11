import { expect, test } from "bun:test"
import {
  type InferSchSymbolInput,
  inferSchSymbol,
  toComponentTsx,
} from "../lib"
import { renderInference } from "./fixtures/render-inference"

// A two-terminal 0603 LED with physical pad 1 cathode and pad 2 anode.
// Output: led_right; {"anode":"pin2","cathode":"pin1"}
test("APT1608LSECK red LED", async () => {
  const input: InferSchSymbolInput = {
    componentType: "led",
    footprint: "0603",
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
    title: "APT1608LSECK red LED",
    input,
    output,
    tsx,
  })

  await expect(svg).toMatchSvgSnapshot(import.meta.path)
})
