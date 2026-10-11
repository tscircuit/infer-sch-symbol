import type { PinAttributeMap } from "@tscircuit/props"
import type { InferSchSymbolInput } from "../lib/types"

export interface CommonPartFixture {
  id: string
  title: string
  description: string
  sourceUrl: string
  input: InferSchSymbolInput
}

const passive: PinAttributeMap = { isPassive: true }
const supply: PinAttributeMap = { requiresPower: true }
const ground: PinAttributeMap = { requiresGround: true }
const input: PinAttributeMap = { isInput: true }
const output: PinAttributeMap = { isOutput: true }
const gpio: PinAttributeMap = {
  isBidirectional: true,
  isGpio: true,
  canUseInternalPullup: true,
}

/**
 * Physical pad numbers are the keys; aliases describe electrical roles.
 * Part families are explicit evidence rather than guesses from the package.
 * No voltage, pin mode, or operating-state defaults are invented here.
 */
export const commonParts: CommonPartFixture[] = [
  {
    id: "resistor-0603",
    title: "0603 resistor",
    description:
      "A resistor and a capacitor can have identical package and terminal metadata; the part family disambiguates this example.",
    sourceUrl: "https://www.vishay.com/docs/20035/dcrcwe3.pdf",
    input: {
      componentType: "resistor",
      footprint: "0603",
      pinLabels: { pin1: "1", pin2: "2" },
      pinAttributes: { pin1: passive, pin2: passive },
    },
  },
  {
    id: "capacitor-0603",
    title: "0603 ceramic capacitor",
    description:
      "An unpolarized ceramic capacitor with two interchangeable passive terminals.",
    sourceUrl:
      "https://product.tdk.com/system/files/dam/doc/product/capacitor/ceramic/mlcc/catalog/mlcc_commercial_general_en.pdf",
    input: {
      componentType: "capacitor",
      footprint: "0603",
      pinLabels: { pin1: "1", pin2: "2" },
      pinAttributes: { pin1: passive, pin2: passive },
    },
  },
  {
    id: "inductor-0603",
    title: "0603 chip inductor",
    description:
      "A two-terminal inductor; the footprint alone does not distinguish it from the resistor or capacitor examples.",
    sourceUrl: "https://www.bourns.com/docs/product-datasheets/CW1608.pdf",
    input: {
      componentType: "inductor",
      footprint: "0603",
      pinLabels: { pin1: "1", pin2: "2" },
      pinAttributes: { pin1: passive, pin2: passive },
    },
  },
  {
    id: "1n4148w",
    title: "1N4148W switching diode",
    description:
      "SOD-123 pad 1 is cathode and pad 2 is anode. The inferred symbol must preserve this reversed physical numbering.",
    sourceUrl: "https://www.diodes.com/assets/Datasheets/ds30086.pdf",
    input: {
      componentType: "diode",
      footprint: "sod123",
      pinLabels: { pin1: ["K", "cathode"], pin2: ["A", "anode"] },
      pinAttributes: { pin1: passive, pin2: passive },
    },
  },
  {
    id: "led-0603",
    title: "APT1608LSECK red LED",
    description:
      "A two-terminal 0603 LED with physical pad 1 cathode and pad 2 anode.",
    sourceUrl:
      "https://www.kingbrightusa.com/images/catalog/SPEC/APT1608LSECK.pdf",
    input: {
      componentType: "led",
      footprint: "0603",
      pinLabels: { pin1: ["K", "cathode"], pin2: ["A", "anode"] },
      pinAttributes: { pin1: passive, pin2: passive },
    },
  },
  {
    id: "2n7002",
    title: "2N7002 N-channel MOSFET",
    description:
      "SOT-23 gate/source/drain are physical pins 1/2/3. The same package is also used by the P-channel and BJT examples.",
    sourceUrl: "https://assets.nexperia.com/documents/data-sheet/2N7002.pdf",
    input: {
      componentType: "nmos",
      footprint: "sot23",
      pinLabels: {
        pin1: ["G", "gate"],
        pin2: ["S", "source"],
        pin3: ["D", "drain"],
      },
      pinAttributes: { pin1: input },
    },
  },
  {
    id: "bss84",
    title: "BSS84 P-channel MOSFET",
    description:
      "Physical pins 1/2/3 are gate/source/drain. Gate, source, and drain labels alone cannot determine channel polarity.",
    sourceUrl: "https://assets.nexperia.com/documents/data-sheet/BSS84.pdf",
    input: {
      componentType: "pmos",
      footprint: "sot23",
      pinLabels: {
        pin1: ["G", "gate"],
        pin2: ["S", "source"],
        pin3: ["D", "drain"],
      },
      pinAttributes: { pin1: input },
    },
  },
  {
    id: "mmbt3904",
    title: "MMBT3904 NPN transistor",
    description:
      "SOT-23 physical pins 1/2/3 are base/emitter/collector; these numbers differ from the schematic symbol's role order.",
    sourceUrl: "https://www.onsemi.com/pdf/datasheet/mmbt3904lt1-d.pdf",
    input: {
      componentType: "npn",
      footprint: "sot23",
      pinLabels: {
        pin1: ["B", "base"],
        pin2: ["E", "emitter"],
        pin3: ["C", "collector"],
      },
    },
  },
  {
    id: "mmbt3906",
    title: "MMBT3906 PNP transistor",
    description:
      "The base/emitter/collector pinout matches MMBT3904, but the explicit part family establishes opposite transistor polarity.",
    sourceUrl: "https://www.onsemi.com/pdf/datasheet/mmbt3906lt1-d.pdf",
    input: {
      componentType: "pnp",
      footprint: "sot23",
      pinLabels: {
        pin1: ["B", "base"],
        pin2: ["E", "emitter"],
        pin3: ["C", "collector"],
      },
    },
  },
  {
    id: "tlv9001",
    title: "TLV9001 single op amp",
    description:
      "SOT-23-5: OUT=1, V−=2, IN+=3, IN−=4, V+=5. Supply pins remain present in the triangle symbol.",
    sourceUrl: "https://www.ti.com/lit/ds/symlink/tlv9001.pdf",
    input: {
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
        pin1: output,
        pin2: supply,
        pin3: input,
        pin4: input,
        pin5: supply,
      },
    },
  },
  {
    id: "ams1117-3v3",
    title: "AMS1117-3.3 regulator",
    description:
      "SOT-223: GND=1, VOUT=2, VIN=3; physical tab pad 4 is also VOUT. Preserve both output pads, even though they share an electrical role.",
    sourceUrl: "http://www.advanced-monolithic.com/pdf/ds1117.pdf",
    input: {
      componentType: "ic",
      footprint: "sot223_4",
      pinLabels: {
        pin1: "GND",
        pin2: "VOUT",
        pin3: "VIN",
        pin4: ["VOUT", "TAB"],
      },
      pinAttributes: {
        pin1: ground,
        pin2: { providesPower: true },
        pin3: supply,
        pin4: { providesPower: true },
      },
    },
  },
  {
    id: "ne555",
    title: "NE555 timer",
    description:
      "A general-purpose IC box groups input signals, output signals, and supply pins while retaining the datasheet pin numbers.",
    sourceUrl: "https://www.ti.com/lit/ds/symlink/ne555.pdf",
    input: {
      componentType: "ic",
      footprint: "soic8",
      pinLabels: {
        pin1: "GND",
        pin2: "TRIG",
        pin3: "OUT",
        pin4: ["RESET", "RESET_N"],
        pin5: ["CONT", "CONTROL"],
        pin6: "THRES",
        pin7: "DISCH",
        pin8: "VCC",
      },
      pinAttributes: {
        pin1: ground,
        pin2: input,
        pin3: output,
        pin4: input,
        pin5: input,
        pin6: input,
        pin7: { isOutput: true, canUseOpenCollector: true },
        pin8: supply,
      },
    },
  },
  {
    id: "24lc02b",
    title: "24LC02B I²C EEPROM",
    description:
      "SOIC-8: unused package pads A0/A1/A2=1/2/3, VSS=4, SDA=5, SCL=6, WP=7, VCC=8. Unlike larger 24LCxx parts, 24LC02B does not use pins 1–3 as address inputs; SDA is bidirectional and supports an open-drain output.",
    sourceUrl: "https://ww1.microchip.com/downloads/en/DeviceDoc/20001709L.pdf",
    input: {
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
        pin4: ground,
        pin5: {
          isBidirectional: true,
          capabilities: ["i2c_sda"],
          canUseOpenDrain: true,
          needsExternalPullup: true,
        },
        pin6: { isInput: true, capabilities: ["i2c_scl"] },
        pin7: input,
        pin8: supply,
      },
    },
  },
  {
    id: "attiny85",
    title: "ATtiny85 microcontroller",
    description:
      "An 8-pin MCU with multiplexed GPIO aliases. Capabilities describe available functions without claiming that any function is configured.",
    sourceUrl:
      "https://ww1.microchip.com/downloads/en/DeviceDoc/Atmel-2586-AVR-8-bit-Microcontroller-ATtiny25-ATtiny45-ATtiny85_Datasheet.pdf",
    input: {
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
        pin1: gpio,
        pin2: gpio,
        pin3: gpio,
        pin4: ground,
        pin5: { ...gpio, capabilities: ["i2c_sda"] },
        pin6: gpio,
        pin7: { ...gpio, capabilities: ["i2c_scl"] },
        pin8: supply,
      },
    },
  },
  {
    id: "unknown-passive-0603",
    title: "Unknown 0603 passive",
    description:
      "Exactly the same labels, attributes, and footprint as the resistor/capacitor/inductor examples, but no family evidence. A box or explicit ambiguity is the safe result.",
    sourceUrl: "https://github.com/tscircuit/footprinter",
    input: {
      footprint: "0603",
      pinLabels: { pin1: "1", pin2: "2" },
      pinAttributes: { pin1: passive, pin2: passive },
    },
  },
  {
    id: "crystal-2-pin",
    title: "HC49 two-pin quartz crystal",
    description:
      "A two-terminal passive crystal with an explicitly known family; neither terminal has polarity.",
    sourceUrl: "https://abracon.com/Resonators/abls.pdf",
    input: {
      componentType: "crystal",
      pinLabels: { pin1: "XTAL1", pin2: "XTAL2" },
      pinAttributes: { pin1: passive, pin2: passive },
    },
  },
  {
    id: "abm8-grounded-crystal",
    title: "ABM8 four-pad grounded crystal",
    description:
      "Crystal terminals are pads 1 and 3; case-ground pads 2 and 4 must survive fallback instead of disappearing into a two-pin crystal symbol.",
    sourceUrl: "https://abracon.com/Resonators/ABM8.pdf",
    input: {
      componentType: "crystal",
      footprint: "crystal",
      pinLabels: {
        pin1: "XTAL1",
        pin2: ["GND", "CASE_GND"],
        pin3: "XTAL2",
        pin4: ["GND", "CASE_GND"],
      },
      pinAttributes: {
        pin1: passive,
        pin2: ground,
        pin3: passive,
        pin4: ground,
      },
    },
  },
  {
    id: "lm358-dual-opamp",
    title: "LM358 dual op amp",
    description:
      "Eight physical pins represent two amplifier units and shared rails. A single triangle cannot represent all of them, so the prototype must retain all pins in its fallback box.",
    sourceUrl: "https://www.ti.com/lit/ds/symlink/lm358.pdf",
    input: {
      componentType: "opamp",
      footprint: "soic8",
      pinLabels: {
        pin1: "OUT1",
        pin2: "IN1-",
        pin3: "IN1+",
        pin4: ["V-", "VEE"],
        pin5: "IN2+",
        pin6: "IN2-",
        pin7: "OUT2",
        pin8: ["V+", "VCC"],
      },
      pinAttributes: {
        pin1: output,
        pin2: input,
        pin3: input,
        pin4: supply,
        pin5: input,
        pin6: input,
        pin7: output,
        pin8: supply,
      },
    },
  },
  {
    id: "header-4-pin",
    title: "Four-pin generic connector",
    description:
      "An abstract straight header with no protocol or power-role evidence; preserve the original physical pin order.",
    sourceUrl: "https://github.com/tscircuit/footprinter",
    input: {
      componentType: "connector",
      footprint: "pinrow4",
      pinLabels: { pin1: "1", pin2: "2", pin3: "3", pin4: "4" },
      pinAttributes: {
        pin1: passive,
        pin2: passive,
        pin3: passive,
        pin4: passive,
      },
    },
  },
]
