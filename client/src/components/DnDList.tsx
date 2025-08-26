import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
import "@/styles/variables.scss";
import "./DnDList.scss";

function Row({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div ref={setNodeRef} style={style} className="row" {...attributes} {...listeners}>
      <span className="grip">⋮⋮</span>
      {children}
    </div>
  );
}

export default function DnDList({ items }: { items: { id: string; label: string }[] }) {
  const [order, setOrder] = useState(items);
  const sensors = useSensors(useSensor(PointerSensor));
  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (over && active.id !== over.id) {
      const oldIndex = order.findIndex((i) => i.id === active.id);
      const newIndex = order.findIndex((i) => i.id === over.id);
      setOrder(arrayMove(order, oldIndex, newIndex));
    }
  };
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={order.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        {order.map((i) => (
          <Row key={i.id} id={i.id}>{i.label}</Row>
        ))}
      </SortableContext>
    </DndContext>
  );
}
