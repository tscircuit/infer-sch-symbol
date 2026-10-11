import type { InferredSchSymbol } from "./types"
import { corePinLabels } from "./core-pin-labels"

/** Serialize a JSX expression value without allowing HTML script termination. */
const jsxJson = (value: object | string): string =>
  JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029")

/**
 * Create a reusable tscircuit component with package pins preserved. The
 * subcircuit scopes physical-pin selectors when several components are used.
 * Custom symbol JSX must come from the inference template, not arbitrary code.
 */
export const toComponentTsx = (result: InferredSchSymbol): string => {
  const labels = corePinLabels(result)
  const chipProps = [
    'name="U1"',
    "schX={0}",
    "schY={0}",
    `pinLabels={${jsxJson(labels)}}`,
    `pinAttributes={${jsxJson(result.pinAttributes)}}`,
  ]

  if (result.footprint !== undefined) {
    chipProps.push(`footprint={${jsxJson(result.footprint)}}`)
  }

  let schematicProjection = ""
  switch (result.kind) {
    case "schematic_box": {
      chipProps.push(`schPinArrangement={${jsxJson(result.schPinArrangement)}}`)
      const sidePins = (
        side: "leftSide" | "rightSide" | "topSide" | "bottomSide",
      ) => {
        const definition = result.schPinArrangement[side]
        return Array.isArray(definition) ? definition : (definition?.pins ?? [])
      }
      const longestLabel = (
        side: "leftSide" | "rightSide" | "topSide" | "bottomSide",
      ) =>
        Math.max(
          0,
          ...sidePins(side).map((pin) => {
            const key = String(pin).startsWith("pin")
              ? String(pin)
              : `pin${pin}`
            return labels[key as keyof typeof labels]?.[0]?.length ?? key.length
          }),
        )
      // Core's minimum box sizes can put vertical rail names over horizontal
      // signal labels. Reserve a center channel for top/bottom labels and enough
      // interior height for both rail names. Schematic dimensions are in mm.
      const width =
        2 *
          Math.max(longestLabel("leftSide"), longestLabel("rightSide")) *
          0.18 +
        Math.max(
          1.2,
          (Math.max(sidePins("topSide").length, sidePins("bottomSide").length) -
            1) *
            0.6 +
            0.8,
        )
      const height = Math.max(
        1.2,
        (longestLabel("topSide") + longestLabel("bottomSide")) * 0.18 + 0.8,
        (Math.max(sidePins("leftSide").length, sidePins("rightSide").length) -
          1) *
          0.6 +
          0.8,
      )
      chipProps.push(
        `schWidth={${Number(width.toFixed(3))}}`,
        `schHeight={${Number(height.toFixed(3))}}`,
      )
      break
    }
    case "builtin_symbol": {
      chipProps.push("noSchematicRepresentation")
      const connections = Object.fromEntries(
        Object.entries(result.symbolPinMapping).map(
          ([terminal, physicalPin]) => [terminal, `.U1 > .${physicalPin}`],
        ),
      )
      schematicProjection = `
      <schematicsymbol
        name="A"
        displayName="U1"
        chipRef=".U1"
        schX={0}
        schY={0}
        symbolName={${jsxJson(result.symbolName)}}
        connections={${jsxJson(connections)}}
      />`
      break
    }
    case "custom_symbol":
      chipProps.push(`symbol={${result.symbolTsx}}`)
      break
  }

  return `export default function InferredDatasheetComponent() {
  return (
    <group subcircuit>
      <chip
        ${chipProps.join("\n        ")}
      />${schematicProjection}
    </group>
  )
}
`
}
