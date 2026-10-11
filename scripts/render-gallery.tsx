import { RootCircuit } from "@tscircuit/core"
import { convertCircuitJsonToSchematicSvg } from "circuit-to-svg"
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises"
import { dirname, join, resolve } from "node:path"
import { pathToFileURL } from "node:url"
import { createElement, type ComponentType } from "react"
import ts from "typescript"
import { commonParts } from "../fixtures/common-parts"
import { inferSchSymbol } from "../lib"
import { toComponentTsx } from "../lib/to-component-tsx"
import type { InferSchSymbolInput, InferredSchSymbol } from "../lib/types"

export interface CommonPartFixture {
  id: string
  title: string
  description: string
  sourceUrl?: string
  input: InferSchSymbolInput
}

type CircuitJson = ReturnType<RootCircuit["getCircuitJson"]>
type CircuitRecord = Record<string, unknown>

export interface RenderedCommonPart {
  fixture: CommonPartFixture
  inference: InferredSchSymbol
  componentTsx: string
  circuitJson: CircuitJson
  svg: string
  renderDiagnostics: CircuitRecord[]
}

/** Compile the exported component and render it with the published core. */
export async function renderCommonPart(
  fixture: CommonPartFixture,
  options: { pcbEnabled?: boolean } = {},
): Promise<RenderedCommonPart> {
  const inference = inferSchSymbol(fixture.input)
  const componentTsx = toComponentTsx(inference)
  const compiled = ts.transpileModule(componentTsx, {
    fileName: `${fixture.id}.tsx`,
    reportDiagnostics: true,
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      jsx: ts.JsxEmit.React,
      jsxFactory: "__GalleryReact.createElement",
      jsxFragmentFactory: "__GalleryReact.Fragment",
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

  // Keep the temporary module below the package so normal dependency resolution
  // uses this prototype's pinned node_modules, then remove it after rendering.
  const temporaryDirectory = await mkdtemp(join(import.meta.dir, ".render-"))
  try {
    const modulePath = join(temporaryDirectory, "component.mjs")
    await writeFile(
      modulePath,
      `import * as __GalleryReact from "react";\n${compiled.outputText}`,
    )
    const module = await import(pathToFileURL(modulePath).href)
    if (typeof module.default !== "function") {
      throw new Error("Generated TSX must default-export a component function")
    }
    const circuit = new RootCircuit({
      platform: { pcbDisabled: !options.pcbEnabled, routingDisabled: true },
    })
    circuit.add(
      createElement(
        "board",
        { width: "20mm", height: "20mm" },
        createElement(module.default as ComponentType),
      ),
    )
    await circuit.renderUntilSettled()
    const circuitJson = circuit.getCircuitJson()
    const renderDiagnostics = circuitJson.filter((record) =>
      /_(?:error|warning)$/.test(record.type),
    ) as unknown as CircuitRecord[]
    const svg = convertCircuitJsonToSchematicSvg(circuitJson, {
      width: 900,
      height: 520,
      grid: false,
      includeVersion: false,
      showErrorsInTextOverlay: false,
      shouldDrawWarnings: false,
    })
    return {
      fixture,
      inference,
      componentTsx,
      circuitJson,
      svg,
      renderDiagnostics,
    }
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true })
  }
}

const escapeHtml = (value: unknown) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")

const pretty = (value: unknown) => JSON.stringify(value, null, 2)
const codeBlock = (value: string) =>
  `<pre><code>${escapeHtml(value)}</code></pre>`
const kindNames: Record<InferredSchSymbol["kind"], string> = {
  schematic_box: "Schematic box",
  builtin_symbol: "Builtin symbol",
  custom_symbol: "Custom symbol",
}

function sourceLink(fixture: CommonPartFixture): string {
  if (!fixture.sourceUrl) return ""
  try {
    const url = new URL(fixture.sourceUrl)
    if (url.protocol !== "https:" && url.protocol !== "http:") return ""
    return `<a href="${escapeHtml(url.href)}" target="_blank" rel="noopener noreferrer">Manufacturer reference ↗</a>`
  } catch {
    return ""
  }
}

function countType(records: CircuitJson, type: string): number {
  return records.filter((record) => record.type === type).length
}

function physicalMappingTable(rendered: RenderedCommonPart): string {
  const records = rendered.circuitJson as unknown as CircuitRecord[]
  const sourcePorts = records.filter((record) => record.type === "source_port")
  const schematicPorts = records.filter(
    (record) => record.type === "schematic_port",
  )
  const rows = sourcePorts.map((port) => {
    const labels = Array.isArray(port.port_hints)
      ? port.port_hints.join(", ")
      : port.name
    const schematicIds = schematicPorts
      .filter((schematic) => schematic.source_port_id === port.source_port_id)
      .map((schematic) => schematic.schematic_port_id)
      .join(", ")
    return `<tr><td>${escapeHtml(port.pin_number ?? port.name)}</td><td>${escapeHtml(labels)}</td><td>${escapeHtml(schematicIds || "No rendered schematic port")}</td></tr>`
  })
  return `<div class="table-scroll"><table><thead><tr><th>Physical pin</th><th>Source labels</th><th>Rendered schematic port</th></tr></thead><tbody>${rows.join("")}</tbody></table></div>`
}

function inlineSvg(svg: string, id: string): string {
  let result = svg.replace(/^\s*<\?xml[^>]*>\s*/, "")
  const rootElement = result.match(/<svg\b[^>]*>/)?.[0]
  if (rootElement && !/\bviewBox=/.test(rootElement)) {
    const width = rootElement.match(/\bwidth="([\d.]+)"/)?.[1]
    const height = rootElement.match(/\bheight="([\d.]+)"/)?.[1]
    if (width && height) {
      result = result.replace("<svg", `<svg viewBox="0 0 ${width} ${height}"`)
    }
  }
  // Each standalone SVG may use the same marker IDs. Give every inline drawing
  // its own namespace so the gallery displays the same result as its SVG file.
  const ids = [...svg.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1])
  for (const svgId of new Set(ids)) {
    const prefixedId = `${id}-${svgId}`
    result = result
      .replaceAll(`id="${svgId}"`, `id="${prefixedId}"`)
      .replaceAll(`url(#${svgId})`, `url(#${prefixedId})`)
      .replaceAll(`href="#${svgId}"`, `href="#${prefixedId}"`)
  }
  return result
}

function renderCard(rendered: RenderedCommonPart): string {
  const { fixture, inference, componentTsx, circuitJson, renderDiagnostics } =
    rendered
  const diagnosticCount =
    inference.diagnostics.length + renderDiagnostics.length
  const diagnosticList = inference.diagnostics.length
    ? `<ul class="diagnostics">${inference.diagnostics.map((diagnostic) => `<li><strong>${escapeHtml(diagnostic.code)}</strong>: ${escapeHtml(diagnostic.message)}</li>`).join("")}</ul>`
    : '<p class="muted">No inference diagnostics.</p>'
  return `<article class="example" id="${escapeHtml(fixture.id)}" data-kind="${escapeHtml(inference.kind)}">
  <div class="example-heading"><div><p class="example-id">${escapeHtml(fixture.id)}</p><h2>${escapeHtml(fixture.title)}</h2></div><span class="kind ${escapeHtml(inference.kind)}">${kindNames[inference.kind]}</span></div>
  <p class="description">${escapeHtml(fixture.description)}</p>
  <div class="preview" role="img" aria-label="${escapeHtml(fixture.title)} schematic symbol">${inlineSvg(rendered.svg, fixture.id)}</div>
  <p class="render-stats">${countType(circuitJson, "source_port")} physical ports · ${countType(circuitJson, "schematic_port")} schematic ports · ${escapeHtml(inference.confidence)} selection</p>
  <div class="links"><a href="${escapeHtml(fixture.id)}.svg">SVG</a><a href="${escapeHtml(fixture.id)}.circuit.json">Circuit JSON</a><a href="${escapeHtml(fixture.id)}.tsx">TSX</a>${sourceLink(fixture)}</div>
  <details><summary>Input</summary>${codeBlock(pretty(fixture.input))}</details>
  <details><summary>Inference result</summary>${codeBlock(pretty(inference))}</details>
  <details><summary>Generated component TSX</summary>${codeBlock(componentTsx)}</details>
  <details><summary>Physical pin mapping</summary>${physicalMappingTable(rendered)}</details>
  <details${inference.diagnostics.length ? " open" : ""}><summary>Diagnostics (${diagnosticCount})</summary>${diagnosticList}${renderDiagnostics.length ? codeBlock(pretty(renderDiagnostics)) : '<p class="muted">No renderer errors or warnings.</p>'}</details>
</article>`
}

function failedCard(fixture: CommonPartFixture, error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  return `<article class="example failure" id="${escapeHtml(fixture.id)}" data-kind="failed"><p class="example-id">${escapeHtml(fixture.id)}</p><h2>${escapeHtml(fixture.title)}</h2><p class="description">${escapeHtml(fixture.description)}</p><p class="failure-label">Rendering failed</p>${codeBlock(message)}${sourceLink(fixture)}</article>`
}

function galleryHtml(
  rendered: RenderedCommonPart[],
  cards: string[],
  failed: number,
): string {
  const counts = Object.fromEntries(
    Object.keys(kindNames).map((kind) => [
      kind,
      rendered.filter((part) => part.inference.kind === kind).length,
    ]),
  )
  const rendererWarnings = rendered
    .flatMap((part) => part.renderDiagnostics)
    .filter((diagnostic) => String(diagnostic.type).endsWith("_warning")).length
  const rendererErrors = rendered
    .flatMap((part) => part.renderDiagnostics)
    .filter((diagnostic) => String(diagnostic.type).endsWith("_error")).length
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Schematic symbol inference — tscircuit</title>
<style>
:root{font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#17332d;background:#f4f7f4;font-synthesis:none}*{box-sizing:border-box}body{margin:0}main{max-width:1480px;margin:0 auto;padding:56px 32px 72px}a{color:#08755f;text-underline-offset:3px}header{max-width:940px;margin-bottom:28px}.eyebrow{font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:#52766b;font-weight:700}h1{font-size:clamp(32px,5vw,52px);line-height:1.1;letter-spacing:-.04em;margin:12px 0 18px}.intro{font-size:18px;line-height:1.55;color:#50665f}.note{background:#e5eee7;border-left:3px solid #68a88b;padding:14px 18px;line-height:1.55;border-radius:0 8px 8px 0;font-size:14px}.summary{display:flex;flex-wrap:wrap;gap:10px;margin:24px 0}.summary span{padding:8px 12px;border:1px solid #d0dfd5;border-radius:7px;font-size:13px;background:#fff}.filters{display:flex;flex-wrap:wrap;gap:8px;margin:24px 0}.filters button{font:inherit;font-size:13px;padding:9px 15px;border:1px solid #cadbd1;background:#fff;color:#34574a;border-radius:30px;cursor:pointer}.filters button[aria-pressed=true]{background:#173f33;color:#fff;border-color:#173f33}.gallery{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px}.example{min-width:0;padding:26px;background:#fff;border:1px solid #d8e3dc;border-radius:14px;box-shadow:0 3px 16px #244b3510}.example[hidden]{display:none}.example-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:14px}.example-id{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:11px;color:#617d6c;letter-spacing:.03em;margin:0 0 7px}h2{font-size:21px;line-height:1.25;margin:0;letter-spacing:-.02em}.kind{white-space:nowrap;padding:5px 9px;border-radius:5px;font-size:11px;font-weight:650;background:#eef2ef;color:#52665c}.builtin_symbol{background:#e1f3e9;color:#246b45}.custom_symbol{background:#e9e7f9;color:#65578d}.schematic_box{background:#e9f0fa;color:#446891}.description{font-size:14px;line-height:1.55;color:#5b6c63;min-height:44px;margin:14px 0 18px}.preview{background:#fafbf9;border:1px solid #e5ebe3;border-radius:9px;overflow:hidden;min-height:250px;display:flex;align-items:center;justify-content:center}.preview svg{display:block;width:100%;height:auto;max-height:360px}.render-stats{font-size:12px;color:#607469;line-height:1.5;margin:12px 0}.links{display:flex;flex-wrap:wrap;gap:16px;font-size:12px;margin:14px 0 20px}details{border-top:1px solid #e7eee8;padding:12px 0}details:last-child{padding-bottom:0}summary{cursor:pointer;font-size:13px;font-weight:650;color:#365844}pre{overflow:auto;max-height:400px;padding:14px;border-radius:7px;background:#f3f6f2;color:#34473c;line-height:1.55;font-size:11px;margin:12px 0 0;white-space:pre}code{font-family:ui-monospace,SFMono-Regular,Consolas,monospace}.muted{font-size:12px;line-height:1.5;color:#6b7c70;margin:12px 0 0}.diagnostics{font-size:12px;line-height:1.55;color:#765f32;margin:12px 0 0;padding-left:18px}.diagnostics li+li{margin-top:6px}.table-scroll{overflow:auto}table{font-size:11px;border-collapse:collapse;width:100%;margin:12px 0 0;text-align:left}th,td{padding:7px 9px;border-bottom:1px solid #e5ece5;vertical-align:top}th{color:#526b59;background:#f3f6f2}.failure-label{color:#9d3e30}.failure{border-color:#eac8c0}footer{margin-top:30px;font-size:12px;line-height:1.6;color:#6b7c70}@media(max-width:980px){.gallery{grid-template-columns:1fr}}@media(max-width:520px){main{padding:32px 16px}.example{padding:20px}.example-heading{display:block}.kind{display:inline-block;margin-top:10px}.description{min-height:0}.preview{min-height:200px}.intro{font-size:16px}}
</style></head><body><main>
<header><p class="eyebrow">tscircuit · feasibility prototype</p><h1>Schematic symbol inference</h1><p class="intro">Common parts inferred from physical pins, electrical attributes, and a footprint. Every drawing below comes from generated TSX rendered by tscircuit core and circuit-to-svg.</p><p class="note">Specialized symbols require correct component-family hints and terminal mappings. Pin attributes and a footprint alone cannot distinguish many part families; uncertain inputs fall back to a schematic box. Manufacturer references are provided for review and were not fetched by this prototype. This gallery does not modify the datasheets API.</p></header>
<div class="summary"><span>${rendered.length} rendered examples</span><span>${counts.builtin_symbol} builtin symbols</span><span>${counts.schematic_box} schematic boxes</span><span>${counts.custom_symbol} custom symbols</span><span>${rendererErrors} renderer errors</span><span>${rendererWarnings} renderer warnings</span>${failed ? `<span>${failed} rendering failures</span>` : ""}</div>
<nav class="filters" aria-label="Filter symbols"><button data-filter="all" aria-pressed="true">All examples</button><button data-filter="builtin_symbol" aria-pressed="false">Builtin symbols</button><button data-filter="schematic_box" aria-pressed="false">Schematic boxes</button><button data-filter="custom_symbol" aria-pressed="false">Custom symbols</button></nav>
<section class="gallery" aria-label="Rendered examples">${cards.join("\n")}</section>
<footer>Inspect each example's input, inference result, generated TSX, and physical pin mapping. Circuit JSON and standalone SVG files are available next to this page. Inference confidence describes selection evidence; it does not verify a manufacturer datasheet.</footer>
</main><script>
for(const button of document.querySelectorAll('[data-filter]'))button.addEventListener('click',()=>{for(const candidate of document.querySelectorAll('[data-filter]'))candidate.setAttribute('aria-pressed',String(candidate===button));for(const example of document.querySelectorAll('[data-kind]'))example.hidden=button.dataset.filter!=='all'&&example.dataset.kind!==button.dataset.filter});
</script></body></html>`
}

export async function writeGallery(outputDirectory: string): Promise<void> {
  const galleryDirectory = resolve(outputDirectory)
  await mkdir(galleryDirectory, { recursive: true })
  const rendered: RenderedCommonPart[] = []
  const cards: string[] = []
  let failed = 0
  for (const fixture of commonParts) {
    if (!/^[a-z0-9][a-z0-9_-]*$/i.test(fixture.id)) {
      throw new Error(`Invalid fixture file identifier: ${fixture.id}`)
    }
    try {
      const part = await renderCommonPart(fixture)
      rendered.push(part)
      cards.push(renderCard(part))
      await Promise.all([
        writeFile(join(galleryDirectory, `${fixture.id}.svg`), part.svg),
        writeFile(
          join(galleryDirectory, `${fixture.id}.circuit.json`),
          `${pretty(part.circuitJson)}\n`,
        ),
        writeFile(
          join(galleryDirectory, `${fixture.id}.tsx`),
          part.componentTsx,
        ),
      ])
      console.log(
        `${fixture.id}: ${part.inference.kind}; ${countType(part.circuitJson, "source_port")} physical ports, ${countType(part.circuitJson, "schematic_port")} schematic ports; ${part.renderDiagnostics.length} renderer diagnostics`,
      )
    } catch (error) {
      failed++
      cards.push(failedCard(fixture, error))
      console.error(`${fixture.id}:`, error)
    }
  }
  await writeFile(
    join(galleryDirectory, "index.html"),
    galleryHtml(rendered, cards, failed),
  )
  console.log(`Gallery written to ${join(galleryDirectory, "index.html")}`)
  if (failed) throw new Error(`${failed} example(s) could not be rendered`)
}

if (import.meta.main) {
  await writeGallery(
    process.argv[2] ?? join(dirname(import.meta.dir), "gallery"),
  )
}
