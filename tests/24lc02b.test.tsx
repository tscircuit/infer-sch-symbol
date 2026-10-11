import { expect, test } from "bun:test"
import {
  type InferSchSymbolInput,
  inferSchSymbol,
  toComponentTsx,
} from "../lib"
import { renderInference } from "./fixtures/render-inference"

// SOIC-8: unused package pads A0/A1/A2=1/2/3, VSS=4, SDA=5, SCL=6, WP=7, VCC=8. Unlike larger 24LCxx parts, 24LC02B does not use pins 1–3 as address inputs; SDA is bidirectional and supports an open-drain output.
// Output: schPinArrangement: {"leftSide":{"pins":["pin6","pin7","pin1","pin2","pin3"],"direction":"top-to-bottom"},"rightSide":{"pins":["pin5"],"direction":"top-to-bottom"},"topSide":{"pins":["pin8"],"direction":"left-to-right"},"bottomSide":{"pins":["pin4"],"direction":"left-to-right"}}
test("24LC02B I²C EEPROM", async () => {
  const input: InferSchSymbolInput = {
    componentType: "ic",
    footprint: "soic8",
    pinLabels: {
      pin1: ["A0", "NC"],
      pin2: ["A1", "NC"],
      pin3: ["A2", "NC"],
      pin4: ["VSS", "GND"],
      pin5: "SDA",
      pin6: "SCL",
      pin7: "WP",
      pin8: "VCC",
    },
    pinAttributes: {
      pin4: {
        requiresGround: true,
      },
      pin5: {
        isBidirectional: true,
        capabilities: ["i2c_sda"],
        canUseOpenDrain: true,
        needsExternalPullup: true,
      },
      pin6: {
        isInput: true,
        capabilities: ["i2c_scl"],
      },
      pin7: {
        isInput: true,
      },
      pin8: {
        requiresPower: true,
      },
    },
  }

  const output = inferSchSymbol(input)
  const tsx = toComponentTsx(output)
  const svg = await renderInference({
    title: "24LC02B I²C EEPROM",
    input,
    output,
    tsx,
  })

  await expect(svg).toMatchSvgSnapshot(import.meta.path)
})
