import { expect, test } from "bun:test"
import { inferSchSymbol } from "../lib"

test("opamp builtin symbol resolves Unicode minus (U+2212), hyphenated role names, and trimmed/case-insensitive pin keys", () => {
  const result = inferSchSymbol({
    componentType: "opamp",
    pinLabels: {
      PIN1: [" OUT "],
      " Pin2 ": ["V\u2212"],
      " 3 ": ["non-inverting input"],
      pin4: ["IN\u2212", "inverting-input"],
      Pin5: ["V+"],
    },
    pinAttributes: {
      OUT: { isOutput: true },
      "V-": { requiresPower: true },
      "IN-": { isInput: true },
      "non-inverting input": { isInput: true },
      "V+": { requiresPower: true },
    },
  })

  expect(result.kind).toBe("builtin_symbol")
  if (result.kind === "builtin_symbol") {
    expect(result.symbolName).toBe("opamp_with_power_right")
    expect(result.symbolPinMapping).toEqual({
      inp1: "pin3",
      inp2: "pin4",
      out: "pin1",
      "V+": "pin5",
      "V-": "pin2",
    })
  }
  expect(result.pinLabels.pin1).toEqual(["OUT"])
  expect(result.pinAttributes.pin2).toEqual({ requiresPower: true })
  expect(result.pinAttributes.pin4).toEqual({ isInput: true })
})

test("inferBox routes VS\u2212 (Unicode minus) power pin to bottomSide", () => {
  const result = inferSchSymbol({
    componentType: "ic",
    pinLabels: {
      pin1: ["IN"],
      pin2: ["OUT"],
      pin3: ["VS+"],
      pin4: ["VS\u2212"],
    },
    pinAttributes: {
      pin1: { isInput: true },
      pin2: { isOutput: true },
      pin3: { requiresPower: true },
      "VS-": { requiresPower: true },
    },
  })

  expect(result.kind).toBe("schematic_box")
  if (result.kind === "schematic_box") {
    expect(result.schPinArrangement).toEqual({
      leftSide: { pins: ["pin1"], direction: "top-to-bottom" },
      rightSide: { pins: ["pin2"], direction: "top-to-bottom" },
      topSide: { pins: ["pin3"], direction: "left-to-right" },
      bottomSide: { pins: ["pin4"], direction: "left-to-right" },
    })
  }
})
