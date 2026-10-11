import type { InferenceBase, PhysicalPin } from "./types"

/** Core pinLabels are selector identifiers and only allow letters, digits, and
 * underscores. Preserve raw datasheet aliases in the inference; translate them
 * at the TSX boundary so core never silently drops a physical pin's label.
 */
export function corePinLabels(
  result: Pick<InferenceBase, "pinLabels" | "physicalPins">,
): Record<PhysicalPin, string[]> {
  const renderedByRaw = new Map<string, string>()
  const rawByRendered = new Map<string, string>()
  for (const pin of result.physicalPins) {
    rawByRendered.set(pin, `physical:${pin}`)
    rawByRendered.set(pin.slice(3), `physical:${pin}`)
  }
  const renderAlias = (raw: string, pin: PhysicalPin) => {
    if (raw === pin || raw === pin.slice(3)) return raw
    const resemblesPhysicalPin = /^(?:pin)?\d+$/.test(raw)
    const lookupKey = JSON.stringify([raw, resemblesPhysicalPin ? pin : null])
    const existing = renderedByRaw.get(lookupKey)
    if (existing) return existing
    let rendered = (resemblesPhysicalPin ? `label_${raw}` : raw)
      .replace(/\+/g, "_PLUS")
      .replace(/[-−]/g, "_MINUS")
      .replace(
        /[^A-Za-z0-9_]/gu,
        (char) => `_u${char.codePointAt(0)!.toString(16)}_`,
      )
    while (rawByRendered.has(rendered) && rawByRendered.get(rendered) !== raw)
      rendered += "_alias"
    renderedByRaw.set(lookupKey, rendered)
    rawByRendered.set(rendered, raw)
    return rendered
  }
  // Reserve existing valid names before translating punctuation, so an IN_PLUS
  // alias cannot collide with the separately spelled IN+ signal.
  for (const labels of Object.values(result.pinLabels)) {
    for (const label of labels)
      if (/^[A-Za-z0-9_]+$/.test(label) && !/^(?:pin)?\d+$/.test(label)) {
        renderedByRaw.set(JSON.stringify([label, null]), label)
        rawByRendered.set(label, label)
      }
  }
  return Object.fromEntries(
    result.physicalPins.map((pin) => [
      pin,
      result.pinLabels[pin].length
        ? result.pinLabels[pin].map((label) => renderAlias(label, pin))
        : [pin],
    ]),
  ) as Record<PhysicalPin, string[]>
}
