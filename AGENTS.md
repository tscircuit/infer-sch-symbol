# Repository guidance

- Use Bun. Follow the tscircuit handbook's source-package bootstrapping conventions.
- Run `bun run typecheck`, `bun run format:check`, and `bun test` before pushing.
- Keep exactly one test and one visual SVG snapshot per test file.
- Declare the input and inferred output clearly in the test. Generate the symbol
  or pin-arrangement TSX, render it through `@tscircuit/core`, and convert it with
  `circuit-to-svg`.
- The only test assertion is `expect(svg).toMatchSvgSnapshot(import.meta.path)`.
  Show input/output and physical pin mappings in the SVG so it can be reviewed
  visually. Do not add numeric, structural, or string assertions.
- Commit `tests/__snapshots__/*.snap.svg`. After updating snapshots, inspect their
  rendered images and rerun tests without snapshot updates.
- Preserve every physical pin. Ambiguous family or incomplete builtin mappings
  produce a box rather than guessing polarity or dropping package pins.
- Keep lockfiles, generated galleries, browser exports, and `node_modules` ignored.
