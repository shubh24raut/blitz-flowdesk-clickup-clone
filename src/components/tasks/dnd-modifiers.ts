import type { Modifier } from "@dnd-kit/core";

/** Locks dragging to the Y axis (avoids pulling in @dnd-kit/modifiers for one helper). */
export const restrictToVerticalAxisModifier: Modifier = ({ transform }) => ({ ...transform, x: 0 });
