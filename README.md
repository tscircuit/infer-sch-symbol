# @tscircuit/infer-sch-symbol

Infer a schematic box, a builtin symbol, or a custom symbol from physical pin
labels, electrical attributes, and a footprint. Physical package pin numbers are
preserved when generating reusable tscircuit TSX.

```sh
bun add github:tscircuit/infer-sch-symbol
```

```ts
import { inferSchSymbol, toComponentTsx, toDatasheetFields } from "@tscircuit/infer-sch-symbol"

const input = {
  componentType: "diode" as const,
  footprint: "sod123",
  pinLabels: { pin1: ["K", "cathode"], pin2: ["A", "anode"] },
  pinAttributes: { pin1: { isPassive: true }, pin2: { isPassive: true } },
}

const output = inferSchSymbol(input)
const tsx = toComponentTsx(output)
const datasheetFields = toDatasheetFields(output)
// output.kind: "builtin_symbol"
// output.symbolPinMapping: { anode: "pin2", cathode: "pin1" }
```

For that cathode-first package, generated TSX uses a physical chip and a separate
schematic projection:

```tsx
<group subcircuit>
  <chip name="U1" footprint="sod123" pinLabels={{ pin1: ["K", "cathode"], pin2: ["A", "anode"] }} noSchematicRepresentation />
  <schematicsymbol
    name="A"
    displayName="U1"
    chipRef=".U1"
    symbolName="diode_right"
    connections={{ anode: ".U1 > .pin2", cathode: ".U1 > .pin1" }}
  />
</group>
```

Box output supplies `schPinArrangement` to the chip. Custom output supplies a
`symbol={<symbol>…<port />…</symbol>}` expression. `toComponentTsx` returns a
complete default-exported component for all three cases.

## Inputs and output

`pinLabels` accepts numeric physical keys (`pin1` or `1`) and scalar or array
aliases. `pinAttributes` uses the existing tscircuit attributes and accepts
physical keys or label keys. Repeated power, ground, and NC labels remain separate
pins. The footprint supplies a pad inventory and a placement hint for unknown
signals; extra pads remain visible in the fallback box.

Specialized symbols require a verified `componentType`. A footprint and two
passive pins cannot distinguish a resistor, capacitor, inductor, or crystal.
Gate/source/drain labels cannot distinguish NMOS from PMOS. Optional
`terminalRoles` maps semantic roles to physical pins on otherwise unlabeled parts.
`nmos`/`pmos` mean enhancement-mode devices, `capacitor` means unpolarized, and
`pushbutton` means a two-terminal normally open momentary switch.

| Output `kind` | Fields | Examples |
| --- | --- | --- |
| `schematic_box` | `schPinArrangement` | ICs, ambiguous families, unsupported topologies |
| `builtin_symbol` | `symbolName`, `symbolPinMapping` | Passives, diodes, transistors, single opamps |
| `custom_symbol` | `symbolTsx` | Connectors with arbitrary pin counts |

Incomplete or ambiguous builtin mappings fall back to a box without dropping
pins. Multi-unit opamps and four-pad grounded crystals currently use this path.
BGA pin identifiers require a separate adapter; this version supports positive
numeric package pins. Core identifier spelling is handled at the TSX boundary:
for example, `IN1+` displays as `IN1_PLUS` in a box while raw aliases remain in the
inference result. Translated aliases cannot steal a physical pin selector.

`toDatasheetFields` returns canonical snake_case `sch_pin_arrangement`,
`symbol_name`, `symbol_pin_mapping`, and `symbol_tsx`, clearing inactive fields
with `null`. `symbol_tsx` is an expression for `chip.symbol`; it differs from a
complete generated component. API persistence and datasheet-page integration are
separate from this library.

## Development

This repository follows the [handbook bootstrapping guide](https://github.com/tscircuit/handbook/blob/main/guides/bootstrapping-repos.md): source package entrypoint, Bun, disabled lockfiles, Biome, and CI for tests, types, and formatting.

```sh
bun install
bun run typecheck
bun run format:check
bun test
bun run start
```

`bun run start` opens the Cosmos visualizer. `bun run gallery` generates a
standalone gallery plus individual SVG, Circuit JSON, and TSX files in `gallery/`.

Each test file declares its input, inferred output, and generated TSX, renders it
with `@tscircuit/core`, and uses exactly one `toMatchSvgSnapshot` from
`bun-match-svg`. `circuit-to-svg` creates the schematic. The committed SVG shows
the input, output, actual symbol, and rendered physical-pin positions; the visual
snapshot is the sole assertion.

```sh
BUN_UPDATE_SNAPSHOTS=1 bun test
bun test
```

Review snapshots in [tests/__snapshots__](./tests/__snapshots__). The common-part
fixtures include manufacturer reference links; generic footprints demonstrate
rendering and are not validated manufacturing land patterns.
