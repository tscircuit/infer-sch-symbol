import { useState } from "react"
import { commonParts } from "../fixtures/common-parts"
import { inferSchSymbol, toComponentTsx } from "../lib"

const snapshots = import.meta.glob<string>(
  "../tests/__snapshots__/*.snap.svg",
  { query: "?raw", import: "default", eager: true },
)

export default function CommonSymbols() {
  const [selectedId, setSelectedId] = useState(commonParts[0].id)
  const fixture =
    commonParts.find((part) => part.id === selectedId) ?? commonParts[0]
  const output = inferSchSymbol(fixture.input)
  const svg = snapshots[`../tests/__snapshots__/${fixture.id}.snap.svg`]

  return (
    <main
      style={{
        padding: 24,
        maxWidth: 1400,
        margin: "0 auto",
        fontFamily: "system-ui, sans-serif",
        color: "#172b4d",
      }}
    >
      <h1>Schematic symbol inference</h1>
      <p>
        Select a common part to inspect its input, inferred symbol, and
        generated TSX. The preview is the committed SVG snapshot rendered by
        tscircuit core and circuit-to-svg.
      </p>
      <label>
        Part{" "}
        <select
          value={selectedId}
          onChange={(event) => setSelectedId(event.target.value)}
          style={{ padding: 8, fontSize: 16 }}
        >
          {commonParts.map((part) => (
            <option key={part.id} value={part.id}>
              {part.title}
            </option>
          ))}
        </select>
      </label>
      <p>{fixture.description}</p>
      {svg ? (
        <img
          src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`}
          alt={`${fixture.title} input, output, and schematic symbol`}
          style={{ display: "block", width: "100%", background: "white" }}
        />
      ) : (
        <p>Run BUN_UPDATE_SNAPSHOTS=1 bun test to create the preview.</p>
      )}
      <details>
        <summary>Input</summary>
        <pre style={{ overflow: "auto" }}>
          {JSON.stringify(fixture.input, null, 2)}
        </pre>
      </details>
      <details>
        <summary>Inference output</summary>
        <pre style={{ overflow: "auto" }}>
          {JSON.stringify(output, null, 2)}
        </pre>
      </details>
      <details>
        <summary>Generated TSX</summary>
        <pre style={{ overflow: "auto" }}>{toComponentTsx(output)}</pre>
      </details>
      <p>
        <a href={fixture.sourceUrl} target="_blank" rel="noreferrer">
          Manufacturer datasheet
        </a>
      </p>
    </main>
  )
}
