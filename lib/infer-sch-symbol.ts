import { fp } from "@tscircuit/footprinter"
import { symbols } from "schematic-symbols"
import type { PinAttributeMap } from "@tscircuit/props"
import { corePinLabels } from "./core-pin-labels"
import type {
  ComponentType,
  InferSchSymbolInput,
  InferredSchSymbol,
  InferenceBase,
  InferenceDiagnostic,
  PhysicalPin,
  BuiltinSymbolInference,
} from "./types"

const canonicalPin = (key: string): PhysicalPin => {
  const match = /^(?:pin)?([1-9]\d*)$/.exec(key)
  if (!match || !Number.isSafeInteger(Number(match[1]))) {
    throw new TypeError(
      `Unsupported physical pin ${JSON.stringify(key)}. This prototype supports positive numeric package pins; BGA identifiers need a physical-pin adapter.`,
    )
  }
  return `pin${Number(match[1])}`
}

const pinNumber = (pin: PhysicalPin) => Number(pin.slice(3))
const normalizedRole = (role: string) =>
  role.toLowerCase().replace(/[\s_]/g, "")
const safeJson = (value: unknown) =>
  JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029")

interface PadPoint {
  /** Footprint-local mm, +X right and +Y top; a point, not a direction. */
  x: number
  y: number
}

function collectPins(input: InferSchSymbolInput) {
  const pinLabels: InferenceBase["pinLabels"] = {}
  const pinAttributes: InferenceBase["pinAttributes"] = {}
  const diagnostics: InferenceDiagnostic[] = []
  const padPoints = new Map<PhysicalPin, PadPoint>()
  const ensurePin = (pin: PhysicalPin) => {
    pinLabels[pin] ??= []
  }

  for (const [key, labels] of Object.entries(input.pinLabels ?? {})) {
    const pin = canonicalPin(key)
    if (pin in pinLabels)
      throw new TypeError(`Duplicate physical pin keys for ${pin}`)
    const aliases = Array.isArray(labels) ? labels : [labels]
    if (aliases.some((label) => typeof label !== "string"))
      throw new TypeError(`Pin labels for ${pin} must be strings`)
    pinLabels[pin] = [
      ...new Set(aliases.filter((label) => label.trim().length > 0)),
    ]
  }

  let footprint = input.footprint?.trim() || undefined
  if (footprint) {
    try {
      for (const pad of fp.string(footprint).circuitJson()) {
        if (pad.type !== "pcb_smtpad" && pad.type !== "pcb_plated_hole")
          continue
        const numericHint = pad.port_hints?.find((hint) =>
          /^(?:pin)?[1-9]\d*$/.test(hint),
        )
        if (!numericHint) continue
        const pin = canonicalPin(numericHint)
        if (
          !(pin in pinLabels) &&
          input.pinLabels &&
          Object.keys(input.pinLabels).length
        ) {
          diagnostics.push({
            code: "unmapped_footprint_pin",
            message: `${pin} occurs in the footprint but has no supplied label; retained as an unlabeled pin.`,
          })
        }
        ensurePin(pin)
        if (!padPoints.has(pin)) {
          if ("x" in pad && "y" in pad)
            padPoints.set(pin, { x: pad.x, y: pad.y })
          else if (pad.shape === "polygon" && pad.points.length) {
            padPoints.set(pin, {
              x:
                pad.points.reduce((sum, point) => sum + point.x, 0) /
                pad.points.length,
              y:
                pad.points.reduce((sum, point) => sum + point.y, 0) /
                pad.points.length,
            })
          }
        }
      }
    } catch (error) {
      diagnostics.push({
        code: "invalid_footprint",
        message: `Could not parse footprint: ${error instanceof Error ? error.message : String(error)}. Preview omits this footprint.`,
      })
      footprint = undefined
    }
  }

  // Label-keyed datasheet attributes are expanded onto physical pins, including
  // repeated VDD/GND labels. Physical identifiers remain distinct.
  for (const [key, attributes] of Object.entries(input.pinAttributes ?? {})) {
    const physicalKey = /^(?:pin)?\d+$/.test(key)
    const pins = physicalKey
      ? [canonicalPin(key)]
      : Object.entries(pinLabels)
          .filter(([, labels]) =>
            labels.some(
              (label) => normalizedRole(label) === normalizedRole(key),
            ),
          )
          .map(([pin]) => pin as PhysicalPin)
    if (!pins.length)
      throw new TypeError(
        `Pin attribute key ${JSON.stringify(key)} matches no physical pin or label`,
      )
    for (const pin of pins) {
      ensurePin(pin)
      const existing = pinAttributes[pin] ?? {}
      for (const attribute of Object.keys(
        attributes,
      ) as (keyof PinAttributeMap)[]) {
        if (
          existing[attribute] !== undefined &&
          JSON.stringify(existing[attribute]) !==
            JSON.stringify(attributes[attribute])
        ) {
          throw new TypeError(`Conflicting ${attribute} attributes for ${pin}`)
        }
      }
      pinAttributes[pin] = { ...existing, ...attributes }
    }
  }
  for (const physical of Object.values(input.terminalRoles ?? {}))
    ensurePin(canonicalPin(physical))
  const physicalPins = (Object.keys(pinLabels) as PhysicalPin[]).sort(
    (a, b) => pinNumber(a) - pinNumber(b),
  )
  if (!physicalPins.length)
    throw new TypeError(
      "At least one physical pin is required through pinLabels, pinAttributes, terminalRoles, or a supported footprint",
    )
  return {
    pinLabels,
    pinAttributes,
    physicalPins,
    footprint,
    diagnostics,
    padPoints,
  }
}

type BuiltinDefinition = {
  symbolName: string
  roles?: Record<string, string[]>
}
const builtinDefinitions: Partial<Record<ComponentType, BuiltinDefinition>> = {
  resistor: { symbolName: "resistor_right" },
  capacitor: { symbolName: "capacitor_right" },
  inductor: { symbolName: "inductor_right" },
  crystal: { symbolName: "crystal_right" },
  diode: {
    symbolName: "diode_right",
    roles: { anode: ["a", "anode"], cathode: ["k", "c", "cathode"] },
  },
  led: {
    symbolName: "led_right",
    roles: { anode: ["a", "anode"], cathode: ["k", "c", "cathode"] },
  },
  npn: {
    symbolName: "npn_bipolar_transistor_down",
    roles: {
      base: ["b", "base"],
      collector: ["c", "collector"],
      emitter: ["e", "emitter"],
    },
  },
  pnp: {
    symbolName: "pnp_bipolar_transistor_down",
    roles: {
      base: ["b", "base"],
      collector: ["c", "collector"],
      emitter: ["e", "emitter"],
    },
  },
  nmos: {
    symbolName: "n_channel_e_mosfet_transistor_horz",
    roles: {
      gate: ["g", "gate"],
      drain: ["d", "drain"],
      source: ["s", "source"],
    },
  },
  pmos: {
    symbolName: "p_channel_e_mosfet_transistor_horz",
    roles: {
      gate: ["g", "gate"],
      drain: ["d", "drain"],
      source: ["s", "source"],
    },
  },
  opamp: {
    symbolName: "opamp_with_power_right",
    roles: {
      inp1: ["in+", "inplus", "noninverting", "noninvertinginput", "inp1"],
      inp2: ["in-", "inminus", "inverting", "invertinginput", "inp2"],
      out: ["out", "output"],
      "V+": ["v+", "vcc", "vdd", "vs+"],
      "V-": ["v-", "vee", "vss", "gnd", "vs-"],
    },
  },
  pushbutton: { symbolName: "push_button_normally_open_momentary_right" },
}

function tryBuiltin(
  input: InferSchSymbolInput,
  base: InferenceBase,
): BuiltinSymbolInference | undefined {
  const definition =
    input.componentType && builtinDefinitions[input.componentType]
  if (!definition) return
  const symbol = symbols[definition.symbolName as keyof typeof symbols]
  if (!symbol)
    throw new Error(`Missing builtin symbol ${definition.symbolName}`)
  const symbolPinMapping: Record<string, PhysicalPin> = {}
  if (!definition.roles) {
    if (base.physicalPins.length !== 2 || symbol.ports.length !== 2) return
    // Only unpolarized two-terminal families reach this branch. Drawing pin
    // order is independent of package numbering (e.g. physical pins 3 and 7).
    symbol.ports.forEach((port, index) => {
      symbolPinMapping[
        `pin${port.labels.find((label) => /^\d+$/.test(label))}`
      ] = base.physicalPins[index]
    })
  } else {
    for (const [terminal, aliases] of Object.entries(definition.roles)) {
      const normalizedAliases = [terminal, ...aliases].map(normalizedRole)
      const explicitRoles = Object.entries(input.terminalRoles ?? {})
        .filter(([role]) => normalizedAliases.includes(normalizedRole(role)))
        .map(([, pin]) => canonicalPin(pin))
      const matchingPins = explicitRoles.length
        ? [...new Set(explicitRoles)]
        : base.physicalPins.filter((pin) =>
            base.pinLabels[pin].some((label) =>
              normalizedAliases.includes(normalizedRole(label)),
            ),
          )
      if (matchingPins.length !== 1) return
      symbolPinMapping[terminal] = matchingPins[0]
    }
    if (Object.keys(symbolPinMapping).length !== symbol.ports.length) return
  }
  const mappedPins = new Set(Object.values(symbolPinMapping))
  if (
    mappedPins.size !== Object.keys(symbolPinMapping).length ||
    mappedPins.size !== base.physicalPins.length
  )
    return
  return {
    ...base,
    kind: "builtin_symbol",
    confidence: "explicit",
    symbolName: definition.symbolName,
    symbolPinMapping,
  }
}

/** Generate a generic connector when arbitrary pin count needs a custom symbol.
 * Coordinates are symbol-local mm, +X right/+Y up, right-handed; ports are points.
 */
function connectorSymbolTsx(base: InferenceBase): string {
  const portAliases = corePinLabels(base)
  const spacing = 0.6
  const height = Math.max(1.2, (base.physicalPins.length + 1) * spacing)
  const longestLabel = Math.max(
    0,
    ...base.physicalPins.map(
      (pin) =>
        portAliases[pin].find((alias) => !/^(?:pin)?\d+$/.test(alias))
          ?.length ?? 0,
    ),
  )
  const bodyWidth = Math.max(1.2, longestLabel * 0.14 + 0.6)
  const bodyCenterX = Number((-0.55 + bodyWidth / 2).toFixed(4))
  const rows = base.physicalPins.map((pin, index) => {
    const y = Number(
      (((base.physicalPins.length - 1) / 2 - index) * spacing).toFixed(4),
    )
    // Core draws the primary pin alias beside the port stem. Add only the
    // physical number above the wire, keeping aliases out of duplicate text.
    return `  <port name={${safeJson(pin)}} pinNumber={${pinNumber(pin)}} aliases={${safeJson(portAliases[pin])}} schX={-1.05} schY={${y}} direction="left" schStemLength={0.7} />\n  <schematiccircle center={{ x: -0.44, y: ${y} }} radius={0.08} isFilled={false} strokeWidth={0.04} />\n  <schematictext text={${safeJson(String(pinNumber(pin)))}} schX={-0.85} schY={${Number((y + 0.14).toFixed(4))}} fontSize={0.16} />`
  })
  return `<symbol width={${Number((bodyWidth + 1).toFixed(4))}} height={${Number((height + 0.6).toFixed(4))}}>\n  <schematictext text="{NAME}" schX={${bodyCenterX}} schY={${Number((height / 2 + 0.2).toFixed(4))}} fontSize={0.24} />\n  <schematicrect schX={${bodyCenterX}} schY={0} width={${Number(bodyWidth.toFixed(4))}} height={${Number((height - 0.2).toFixed(4))}} strokeWidth={0.04} />\n${rows.join("\n")}\n</symbol>`
}

function inferBox(
  base: InferenceBase,
  padPoints: Map<PhysicalPin, PadPoint>,
): InferredSchSymbol {
  const left: PhysicalPin[] = [],
    right: PhysicalPin[] = [],
    top: PhysicalPin[] = [],
    bottom: PhysicalPin[] = []
  const unknown: PhysicalPin[] = []
  for (const pin of base.physicalPins) {
    const attributes = base.pinAttributes[pin] ?? {}
    if (attributes.requiresGround || attributes.providesGround) bottom.push(pin)
    else if (attributes.requiresPower) {
      const negativeRail = base.pinLabels[pin].some((label) =>
        /^(?:v-|v−|vee|vss|vs-)$/i.test(label),
      )
      ;(negativeRail ? bottom : top).push(pin)
    } else if (
      attributes.providesPower ||
      attributes.isOutput ||
      attributes.isBidirectional ||
      attributes.isGpio
    )
      right.push(pin)
    else if (attributes.isInput) left.push(pin)
    else unknown.push(pin)
  }
  for (const pin of unknown) {
    const point = padPoints.get(pin)
    // Use physical placement only for signals with no electrical layout hint.
    // Never interpret location as polarity, direction, or internal connectivity.
    if (point && point.x !== 0) (point.x < 0 ? left : right).push(pin)
    else (left.length <= right.length ? left : right).push(pin)
  }
  const schPinArrangement = {
    leftSide: { pins: left, direction: "top-to-bottom" as const },
    rightSide: { pins: right, direction: "top-to-bottom" as const },
    topSide: { pins: top, direction: "left-to-right" as const },
    bottomSide: { pins: bottom, direction: "left-to-right" as const },
  }
  return {
    ...base,
    kind: "schematic_box",
    confidence: "fallback",
    schPinArrangement,
  }
}

/** Infer a schematic representation without guessing electrically significant
 * family or polarity. Numeric physical pins are retained one-for-one.
 */
export function inferSchSymbol(input: InferSchSymbolInput): InferredSchSymbol {
  if (
    input.componentType &&
    ![...Object.keys(builtinDefinitions), "connector", "ic"].includes(
      input.componentType,
    )
  )
    throw new TypeError(
      `Unsupported componentType ${JSON.stringify(input.componentType)}`,
    )
  const { padPoints, ...collected } = collectPins(input)
  const base: InferenceBase = { ...collected, confidence: "fallback" }
  if (input.componentType === "connector") {
    return {
      ...base,
      kind: "custom_symbol",
      confidence: "explicit",
      template: "connector",
      symbolTsx: connectorSymbolTsx(base),
    }
  }
  const builtin = tryBuiltin(input, base)
  if (builtin) return builtin
  if (!input.componentType) {
    base.diagnostics.push({
      code: "ambiguous_family",
      message:
        "Electrical attributes and footprint do not uniquely identify the symbol family. Supply a verified componentType for a specialized symbol.",
    })
  } else if (input.componentType !== "ic") {
    base.diagnostics.push({
      code: "unsupported_topology",
      message: `No complete, unambiguous ${input.componentType} terminal mapping covers every physical pin. Using a box; no pins were discarded.`,
    })
  }
  return inferBox(base, padPoints)
}
