import type { SchematicPinArrangement } from "@tscircuit/props"
import type { InferredSchSymbol, PhysicalPin } from "./types"

export interface DatasheetSymbolFields {
  sch_pin_arrangement: SchematicPinArrangement | null
  symbol_name: string | null
  symbol_pin_mapping: Record<string, PhysicalPin> | null
  symbol_tsx: string | null
}

/**
 * Produce JSON-safe datasheet fields. Inactive fields are explicitly null so
 * switching representation clears any previously stored symbol metadata.
 */
export const toDatasheetFields = (
  result: InferredSchSymbol,
): DatasheetSymbolFields => {
  const fields: DatasheetSymbolFields = {
    sch_pin_arrangement: null,
    symbol_name: null,
    symbol_pin_mapping: null,
    symbol_tsx: null,
  }

  switch (result.kind) {
    case "schematic_box":
      fields.sch_pin_arrangement = JSON.parse(
        JSON.stringify(result.schPinArrangement),
      )
      break
    case "builtin_symbol":
      fields.symbol_name = result.symbolName
      fields.symbol_pin_mapping = { ...result.symbolPinMapping }
      break
    case "custom_symbol":
      fields.symbol_tsx = result.symbolTsx
      break
  }

  return fields
}
