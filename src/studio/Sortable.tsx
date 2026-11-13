"use client";

import { Reorder, useDragControls } from "motion/react";
import { checkpoint } from "@/lib/store";
import { DragHandle, MoveButtons } from "./ui";

/**
 * A drag-reorderable list, backed by `motion`'s `Reorder` — drag the handle, or use the
 * ↑/↓ buttons (keyboard and touch both work without a drag gesture). One undo checkpoint per
 * grab, not per frame, so Ctrl/⌘ Z undoes a whole drag in one step.
 */
export function SortableList<T>({
  items,
  keyOf,
  onReorder,
  onRemove,
  renderItem,
  minItems = 0,
}: {
  items: T[];
  keyOf: (item: T, index: number) => string;
  onReorder: (items: T[]) => void;
  onRemove?: (index: number) => void;
  renderItem: (item: T, index: number) => React.ReactNode;
  minItems?: number;
}) {
  return (
    <Reorder.Group axis="y" values={items} onReorder={onReorder} className="grid grid-cols-1 gap-2">
      {items.map((item, i) => (
        <Row key={keyOf(item, i)} item={item} index={i} length={items.length} items={items} onReorder={onReorder} onRemove={onRemove && items.length > minItems ? () => onRemove(i) : undefined}>
          {renderItem(item, i)}
        </Row>
      ))}
    </Reorder.Group>
  );
}

function Row<T>({ item, index, length, items, onReorder, onRemove, children }: { item: T; index: number; length: number; items: T[]; onReorder: (items: T[]) => void; onRemove?: () => void; children: React.ReactNode }) {
  const controls = useDragControls();
  const move = (to: number) => {
    if (to < 0 || to >= length) return;
    checkpoint();
    const next = items.slice();
    const [moved] = next.splice(index, 1);
    next.splice(to, 0, moved);
    onReorder(next);
  };
  return (
    <Reorder.Item value={item} dragListener={false} dragControls={controls} className="flex items-start gap-1.5 rounded-xl border border-st-border bg-st-panel p-3">
      <DragHandle onPointerDown={(e) => { checkpoint(); controls.start(e); }} />
      <div className="min-w-0 flex-1">{children}</div>
      <MoveButtons index={index} length={length} onMove={move} onRemove={onRemove} />
    </Reorder.Item>
  );
}
