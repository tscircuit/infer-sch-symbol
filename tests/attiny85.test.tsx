import { expect, test } from "bun:test"
import {
  type InferSchSymbolInput,
  inferSchSymbol,
  toComponentTsx,
} from "../lib"
import { renderInference } from "./fixtures/render-inference"

// An 8-pin MCU with multiplexed GPIO aliases. Capabilities describe available functions without claiming that any function is configured.
// Output: schPinArrangement: {"leftSide":{"pins":[],"direction":"top-to-bottom"},"rightSide":{"pins":["pin1","pin2","pin3","pin5","pin6","pin7"],"direction":"top-to-bottom"},"topSide":{"pins":["pin8"],"direction":"left-to-right"},"bottomSide":{"pins":["pin4"],"direction":"left-to-right"}}
test("ATtiny85 microcontroller", async () => {
  const input: InferSchSymbolInput = {
    componentType: "ic",
    footprint: "soic8",
    pinLabels: {
      pin1: ["PB5", "RESET", "ADC0"],
      pin2: ["PB3", "ADC3"],
      pin3: ["PB4", "ADC2"],
      pin4: "GND",
      pin5: ["PB0", "MOSI", "DI", "SDA"],
      pin6: ["PB1", "MISO", "DO"],
      pin7: ["PB2", "SCK", "USCK", "SCL", "ADC1"],
      pin8: "VCC",
    },
    pinAttributes: {
      pin1: {
        isBidirectional: true,
        isGpio: true,
        canUseInternalPullup: true,
      },
      pin2: {
        isBidirectional: true,
        isGpio: true,
        canUseInternalPullup: true,
      },
      pin3: {
        isBidirectional: true,
        isGpio: true,
        canUseInternalPullup: true,
      },
      pin4: {
        requiresGround: true,
      },
      pin5: {
        isBidirectional: true,
        isGpio: true,
        canUseInternalPullup: true,
        capabilities: ["i2c_sda"],
      },
      pin6: {
        isBidirectional: true,
        isGpio: true,
        canUseInternalPullup: true,
      },
      pin7: {
        isBidirectional: true,
        isGpio: true,
        canUseInternalPullup: true,
        capabilities: ["i2c_scl"],
      },
      pin8: {
        requiresPower: true,
      },
    },
  }

  const output = inferSchSymbol(input)
  const tsx = toComponentTsx(output)
  const svg = await renderInference({
    title: "ATtiny85 microcontroller",
    input,
    output,
    tsx,
  })

  await expect(svg).toMatchSvgSnapshot(import.meta.path)
})
