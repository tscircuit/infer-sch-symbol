import { mkdtemp, rm, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { pathToFileURL } from "node:url"
import { RootCircuit } from "@tscircuit/core"
import { convertCircuitJsonToSchematicSvg } from "circuit-to-svg"
import { type ComponentType, createElement } from "react"
import ts from "typescript"
import type { InferredSchSymbol, InferSchSymbolInput } from "../../lib"

const escapeXml = (value: unknown): string =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")

const wrap = (lines: string[], width = 63): string[] =>
  lines.flatMap((line) => {
    const result: string[] = []
    let remaining = line
    while (remaining.length > width) {
      const lastSpace = remaining.lastIndexOf(" ", width)
      const end = lastSpace > width / 2 ? lastSpace : width
      result.push(remaining.slice(0, end))
      remaining = remaining.slice(end).trimStart()
    }
    return [...result, remaining]
  })

const textLines = (lines: string[], x: number, y: number): string =>
  lines
    .map(
      (line, index) =>
        `<text x="${x}" y="${y + index * 19}" font-family="monospace" font-size="12" fill="#263645">${escapeXml(line)}</text>`,
    )
    .join("\n")

const inputLines = (input: InferSchSymbolInput): string[] => {
  const lines = [
    `componentType: ${input.componentType ?? "(not supplied)"}`,
    `footprint: ${input.footprint ?? "(not supplied)"}`,
    "pinLabels:",
    ...Object.entries(input.pinLabels ?? {}).map(
      ([pin, labels]) => `  ${pin}: ${JSON.stringify(labels)}`,
    ),
    "pinAttributes:",
    ...Object.entries(input.pinAttributes ?? {}).map(
      ([pin, attributes]) => `  ${pin}: ${JSON.stringify(attributes)}`,
    ),
  ]
  if (input.terminalRoles) {
    lines.push(
      "terminalRoles:",
      ...Object.entries(input.terminalRoles).map(
        ([role, pin]) => `  ${role}: ${pin}`,
      ),
    )
  }
  return wrap(lines)
}

const outputLines = (output: InferredSchSymbol): string[] => {
  const lines = [
    `kind: ${output.kind}`,
    `confidence: ${output.confidence}`,
    `physicalPins: ${output.physicalPins.join(", ")}`,
  ]
  switch (output.kind) {
    case "builtin_symbol":
      lines.push(
        `symbolName: ${output.symbolName}`,
        "symbolPinMapping:",
        ...Object.entries(output.symbolPinMapping).map(
          ([role, pin]) => `  ${role} -> ${pin}`,
        ),
      )
      break
    case "schematic_box":
      lines.push(
        "schPinArrangement:",
        ...Object.entries(output.schPinArrangement).map(
          ([side, arrangement]) => {
            if (Array.isArray(arrangement))
              return `  ${side}: [${arrangement.join(", ")}]`
            if (typeof arrangement === "object" && arrangement !== null) {
              return `  ${side}: [${arrangement.pins.join(", ")}] (${arrangement.direction})`
            }
            return `  ${side}: ${String(arrangement)}`
          },
        ),
      )
      break
    case "custom_symbol":
      lines.push(
        `symbolTsx: <symbol> (${output.template} template)`,
        "  <schematicrect> body + one <port> per physical pin",
      )
      break
  }
  lines.push(
    "diagnostics:",
    ...(output.diagnostics.length
      ? output.diagnostics.map(({ code, message }) => `  ${code}: ${message}`)
      : ["  (none)"]),
  )
  return wrap(lines)
}

/** Render generated TSX, then frame the actual schematic with its input/output. */
export async function renderInference({
  title,
  input,
  output,
  tsx,
}: {
  title: string
  input: InferSchSymbolInput
  output: InferredSchSymbol
  tsx: string
}): Promise<string> {
  const compiled = ts.transpileModule(tsx, {
    fileName: "inferred-component.tsx",
    reportDiagnostics: true,
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      jsx: ts.JsxEmit.React,
      jsxFactory: "React.createElement",
      jsxFragmentFactory: "React.Fragment",
    },
  })
  const errors = (compiled.diagnostics ?? []).filter(
    (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error,
  )
  if (errors.length) {
    throw new Error(
      errors
        .map((error) =>
          ts.flattenDiagnosticMessageText(error.messageText, "\n"),
        )
        .join("\n"),
    )
  }

  // The temporary module stays inside this package for dependency resolution.
  const temporaryDirectory = await mkdtemp(join(import.meta.dir, ".render-"))
  try {
    const modulePath = join(temporaryDirectory, "component.mjs")
    await writeFile(
      modulePath,
      `import * as React from "react";\n${compiled.outputText}`,
    )
    const { default: Component } = (await import(
      pathToFileURL(modulePath).href
    )) as {
      default: ComponentType
    }
    const circuit = new RootCircuit({
      platform: { pcbDisabled: true, routingDisabled: true },
    })
    circuit.add(
      createElement(
        "board",
        { width: "20mm", height: "20mm" },
        createElement(Component),
      ),
    )
    await circuit.renderUntilSettled()
    const circuitJson = circuit.getCircuitJson()
    const schematic = convertCircuitJsonToSchematicSvg(circuitJson, {
      width: 570,
      height: 410,
      grid: false,
      includeVersion: false,
      showErrorsInTextOverlay: true,
      shouldDrawWarnings: true,
    })

    // Connectivity comes from core's rendered records, not from the inferred map.
    const sourcePorts = circuitJson
      .filter((record) => record.type === "source_port")
      .sort((a, b) => (a.pin_number ?? 0) - (b.pin_number ?? 0))
    const schematicPorts = circuitJson.filter(
      (record) => record.type === "schematic_port",
    )
    const renderedPins = sourcePorts.flatMap((sourcePort) => {
      const ports = schematicPorts.filter(
        (record) => record.source_port_id === sourcePort.source_port_id,
      )
      return ports.length
        ? ports.map(
            (port) =>
              `pin${sourcePort.pin_number} -> (${port.center.x.toFixed(3)}, ${port.center.y.toFixed(3)}) mm`,
          )
        : [`pin${sourcePort.pin_number} -> MISSING SCHEMATIC PORT`]
    })
    const unlinkedPorts = schematicPorts.filter(
      (record) =>
        !sourcePorts.some(
          (port) => port.source_port_id === record.source_port_id,
        ),
    )
    renderedPins.push(
      `Unlinked schematic ports: ${unlinkedPorts.length}`,
      ...circuitJson
        .filter((record) => /_error$/.test(record.type))
        .map((record) => `RENDER ERROR: ${record.type}`),
    )
    const warnings = circuitJson
      .filter((record) => /_warning$/.test(record.type))
      .map((record) =>
        record.type
          .replace(/^(source|schematic)_/, "")
          .replace(/_warning$/, ""),
      )
    renderedPins.push(
      `Render warnings (${warnings.length}): ${warnings.join(", ") || "none"}`,
    )

    const inputs = inputLines(input)
    const outputs = outputLines(output)
    const pins = wrap(renderedPins)
    const outputTop = 147 + inputs.length * 19
    const height = Math.max(
      720,
      outputTop + 42 + outputs.length * 19,
      602 + pins.length * 19,
    )

    return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="${height}" viewBox="0 0 1200 ${height}">
<rect width="1200" height="${height}" fill="#ffffff"/>
<text x="28" y="38" font-family="sans-serif" font-size="22" font-weight="600" fill="#142d40">${escapeXml(title)}</text>
<text x="28" y="62" font-family="sans-serif" font-size="12" fill="#566978">inferSchSymbol → toComponentTsx → @tscircuit/core → circuit-to-svg</text>
<line x1="598" y1="82" x2="598" y2="${height - 24}" stroke="#dce4eb"/>
<text x="28" y="104" font-family="sans-serif" font-size="14" font-weight="600" fill="#245b83">INPUT</text>
${textLines(inputs, 28, 130)}
<text x="28" y="${outputTop}" font-family="sans-serif" font-size="14" font-weight="600" fill="#245b83">OUTPUT</text>
${textLines(outputs, 28, outputTop + 26)}
<text x="622" y="104" font-family="sans-serif" font-size="14" font-weight="600" fill="#245b83">GENERATED TSX / RENDERED SCHEMATIC</text>
${schematic.replace("<svg ", '<svg x="614" y="123" ')}
<text x="622" y="562" font-family="sans-serif" font-size="14" font-weight="600" fill="#245b83">RENDERED PHYSICAL PIN → SCHEMATIC POSITION</text>
${textLines(pins, 622, 588)}
</svg>`
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true })
  }
}
