import type { PinAttributeMap, SchematicPinArrangement } from "@tscircuit/props"

export type PhysicalPin = `pin${number}`

export type ComponentType =
  | "resistor"
  | "capacitor"
  | "inductor"
  | "diode"
  | "led"
  | "npn"
  | "pnp"
  | "nmos"
  | "pmos"
  | "opamp"
  | "crystal"
  | "connector"
  | "ic"
  | "pushbutton"

export interface InferSchSymbolInput {
  /** Physical pin keys (pin1 or 1); every alias is preserved. */
  pinLabels?: Record<string, string | string[]>
  /** Existing tscircuit electrical attributes, keyed by physical pin or alias. */
  pinAttributes?: Record<string, PinAttributeMap>
  /** Footprinter DSL; used for pad inventory and fallback layout, never part type. */
  footprint?: string
  /** Verified family hint. NMOS/PMOS here mean enhancement-mode devices. */
  componentType?: ComponentType
  /** Explicit semantic terminal to physical pin mapping, for unlabeled parts. */
  terminalRoles?: Record<string, string>
}

export interface InferenceDiagnostic {
  code:
    | "ambiguous_family"
    | "unsupported_topology"
    | "invalid_footprint"
    | "unmapped_footprint_pin"
  message: string
}

export interface InferenceBase {
  pinLabels: Record<PhysicalPin, string[]>
  pinAttributes: Partial<Record<PhysicalPin, PinAttributeMap>>
  physicalPins: PhysicalPin[]
  footprint?: string
  diagnostics: InferenceDiagnostic[]
  /** Confidence in family selection, not correctness of the supplied datasheet. */
  confidence: "explicit" | "fallback"
}

export interface SchematicBoxInference extends InferenceBase {
  kind: "schematic_box"
  schPinArrangement: SchematicPinArrangement
}

export interface BuiltinSymbolInference extends InferenceBase {
  kind: "builtin_symbol"
  symbolName: string
  /** Drawing terminal names to physical pin identifiers. Never drawing pin numbers as package numbers. */
  symbolPinMapping: Record<string, PhysicalPin>
}

export interface CustomSymbolInference extends InferenceBase {
  kind: "custom_symbol"
  /** JSX expression for chip.symbol; no imports or executable component code. */
  symbolTsx: string
  template: "connector"
}

export type InferredSchSymbol =
  | SchematicBoxInference
  | BuiltinSymbolInference
  | CustomSymbolInference
