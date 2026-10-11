import { expect, test } from "bun:test"
import {
  type InferSchSymbolInput,
  inferSchSymbol,
  toComponentTsx,
} from "../lib"
import { renderInference } from "./fixtures/render-inference"

// A two-terminal passive crystal with an explicitly known family; neither terminal has polarity.
// Output: crystal_right; {"pin1":"pin1","pin2":"pin2"}
test("HC49 two-pin quartz crystal", async () => {
  const input: InferSchSymbolInput = {
    componentType: "crystal",
    pinLabels: {
      pin1: "XTAL1",
      pin2: "XTAL2",
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
    title: "HC49 two-pin quartz crystal",
    input,
    output,
    tsx,
  })

  await expect(svg).toMatchSvgSnapshot(import.meta.path)
})
