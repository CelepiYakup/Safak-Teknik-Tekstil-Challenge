import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useScheduleStore } from "../../store/useScheduleStore";
import Toast from "../Toast/ToastHost";
import {
  dateToPixels,
  pixelsToDate,
  detectConflicts,
  formatTime,
  formatDate,
  getDurationHours,
  roundToNearestMinutes,
  generateAdaptiveTimeTicks,
} from "../../utils/ganttUtils";
import type { Operation, TimelineViewport, DragState } from "../../types";
import "./GanttChart.scss";

const FIXED_WIDTH = 1605;

const GanttChart: React.FC = () => {
  const {
    workOrders,
    loading,
    toast,
    highlightedWorkOrderId,
    fetchAll,
    updateOperation,
    setHighlight,
    clearToast,
  } = useScheduleStore();

  const [dragState, setDragState] = useState<DragState | null>(null);
  const [selectedOperations, setSelectedOperations] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"day" | "week">("day");

  const rootRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const timelineData = useMemo(() => {
    const allOperations = workOrders.flatMap((wo) => wo.operations);
    const fallbackWidth = FIXED_WIDTH;

    if (allOperations.length === 0) {
      const now = new Date();
      const start = new Date(now);
      start.setHours(8, 0, 0, 0);
      const end = new Date(now);
      end.setHours(18, 0, 0, 0);
      const totalHours = Math.max(1, (end.getTime() - start.getTime()) / 3600000);
      const pixelsPerHour = fallbackWidth / totalHours;
      return {
        operations: [],
        machines: [],
        conflicts: [],
        viewport: {
          startTime: start,
          endTime: end,
          pixelsPerHour,
          viewportWidth: fallbackWidth,
        } as TimelineViewport,
      };
    }

    const times = allOperations.flatMap((op) => [new Date(op.start), new Date(op.end)]);
    const minTime = new Date(Math.min(...times.map((t) => t.getTime())));
    const maxTime = new Date(Math.max(...times.map((t) => t.getTime())));
    const padding = viewMode === "day" ? 2 : 12;
    const startTime = new Date(minTime.getTime() - padding * 3600000);
    const endTime = new Date(maxTime.getTime() + padding * 3600000);
    const totalHours = Math.max(1, (endTime.getTime() - startTime.getTime()) / 3600000);
    const pixelsPerHour = fallbackWidth / totalHours;

    const machines = Array.from(new Set(allOperations.map((op) => op.machineId))).sort();
    const conflicts = detectConflicts(allOperations);

    return {
      operations: allOperations,
      machines,
      conflicts,
      viewport: {
        startTime,
        endTime,
        pixelsPerHour,
        viewportWidth: fallbackWidth,
      },
    };
  }, [workOrders, viewMode]);

  const filteredWorkOrders = useMemo(() => {
    if (!searchTerm) return workOrders;
    const term = searchTerm.toLowerCase();
    return workOrders.filter(
      (wo) =>
        wo.id.toLowerCase().includes(term) ||
        wo.product.toLowerCase().includes(term) ||
        wo.operations.some((op) => op.name.toLowerCase().includes(term))
    );
  }, [workOrders, searchTerm]);

  const timeTicks = useMemo(() => generateAdaptiveTimeTicks(timelineData.viewport, 120), [
    timelineData.viewport,
  ]);

  const machineStats = useMemo(() => {
    const stats: Record<string, { operationCount: number; totalHours: number; utilization: number }> =
      {};
    timelineData.machines.forEach((machineId) => {
      const machineOps = timelineData.operations.filter((op) => op.machineId === machineId);
      const totalHours = machineOps.reduce(
        (sum, op) => sum + getDurationHours(op.start, op.end),
        0
      );
      const timeSpan =
        (timelineData.viewport.endTime.getTime() - timelineData.viewport.startTime.getTime()) /
        3600000;
      stats[machineId] = {
        operationCount: machineOps.length,
        totalHours,
        utilization: Math.min((totalHours / timeSpan) * 100, 100),
      };
    });
    return stats;
  }, [timelineData.operations, timelineData.machines, timelineData.viewport]);

  const handleOperationMouseDown = useCallback((operation: Operation, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const containerRect = rootRef.current?.getBoundingClientRect();
    if (!containerRect || !rootRef.current) return;
    const scrollX = scrollRef.current?.scrollLeft || 0;
    setDragState({
      operation,
      initialX: event.clientX - containerRect.left + scrollX,
      offsetX: event.clientX - rect.left,
      dragStartTime: new Date(operation.start),
    });
    setSelectedOperations(new Set([operation.id]));
  }, []);

  const handleMouseMove = useCallback(
    (event: React.MouseEvent) => {
      if (!dragState || !rootRef.current) return;
      const containerRect = rootRef.current.getBoundingClientRect();
      const scrollX = scrollRef.current?.scrollLeft || 0;
      const currentX = event.clientX - containerRect.left + scrollX;
      const deltaPixels = currentX - dragState.initialX;
      const el = document.querySelector(
        `[data-operation-id="${dragState.operation.id}"]`
      ) as HTMLElement | null;
      if (el) {
        const baseLeft = dateToPixels(new Date(dragState.operation.start), timelineData.viewport);
        const newX = Math.max(0, baseLeft + deltaPixels);
        el.style.left = `${newX}px`;
        el.classList.add("operation-bar--dragging");
      }
    },
    [dragState, timelineData.viewport]
  );

  const handleMouseUp = useCallback(async () => {
    if (!dragState) return;
    const el = document.querySelector(
      `[data-operation-id="${dragState.operation.id}"]`
    ) as HTMLElement | null;
    if (el) el.classList.remove("operation-bar--dragging");
    const rawLeft = parseFloat(el?.style.left || "0");
    const newStartTime = pixelsToDate(rawLeft, timelineData.viewport);
    const roundedStartTime = roundToNearestMinutes(newStartTime);
    const duration = getDurationHours(dragState.operation.start, dragState.operation.end);
    const newEndTime = new Date(roundedStartTime.getTime() + duration * 3600000);
    try {
      await updateOperation(
        dragState.operation.id,
        roundedStartTime.toISOString(),
        newEndTime.toISOString()
      );
    } catch {
      if (el) {
        const originalX = dateToPixels(new Date(dragState.operation.start), timelineData.viewport);
        el.style.left = `${originalX}px`;
      }
    }
    setDragState(null);
  }, [dragState, timelineData.viewport, updateOperation]);

  const handleOperationClick = useCallback(
    (operation: Operation, event: React.MouseEvent) => {
      event.stopPropagation();
      if (!dragState) setHighlight(operation.workOrderId);
    },
    [dragState, setHighlight]
  );

  const handleTimelineClick = useCallback(() => {
    setHighlight(null);
    setSelectedOperations(new Set());
  }, [setHighlight]);

  const getOperationClassName = useCallback(
    (operation: Operation) => {
      const classes = ["operation-bar"];
      if (selectedOperations.has(operation.id)) classes.push("operation-bar--selected");
      if (highlightedWorkOrderId === operation.workOrderId)
        classes.push("operation-bar--highlighted");
      const hasConflict = timelineData.conflicts.some(
        (c) => c.operationId === operation.id || c.conflictWith.includes(operation.id)
      );
      if (hasConflict) classes.push("operation-bar--conflict");
      return classes.join(" ");
    },
    [selectedOperations, highlightedWorkOrderId, timelineData.conflicts]
  );

  if (loading) {
    return (
      <div className="gantt-chart">
        <div className="gantt-chart__loading">
          <div className="gantt-chart__loading-spinner"></div>
          <div>Loading Gantt data...</div>
        </div>
      </div>
    );
  }

  const now = new Date();

  return (
    <div className="gantt-chart" ref={rootRef}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={clearToast} />}

      <div className="gantt-chart__header">
        <h1>Factory Production Schedule</h1>
        <p className="gantt-chart__header-description">
          Click operations to highlight work orders. Drag to reschedule.
        </p>

        <div className="gantt-chart__header-controls">
          <div className="controls">
            <div>
              <button
                className={`controls__button ${viewMode === "day" ? "controls__button--active" : ""}`}
                onClick={() => setViewMode("day")}
              >
                Daily
              </button>
              <button
                className={`controls__button ${viewMode === "week" ? "controls__button--active" : ""}`}
                onClick={() => setViewMode("week")}
              >
                Weekly
              </button>
            </div>
          </div>
        </div>

        {highlightedWorkOrderId && (
          <div className="gantt-chart__header-info">
            <span className="gantt-chart__header-info-text">
              Selected Work Order: {highlightedWorkOrderId}
            </span>
            <button onClick={() => setHighlight(null)} className="gantt-chart__header-info-clear">
              Clear
            </button>
          </div>
        )}
      </div>

      <div className="gantt-chart__main">
        <div className="gantt-chart__sidebar">
          <div className="sidebar__section">
            <div className="sidebar__section-title">Search</div>
            <input
              type="text"
              placeholder="Search work orders, products, or operations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="sidebar__search"
            />
          </div>

          <div className="sidebar__section">
            <div className="sidebar__section-title">Work Orders ({filteredWorkOrders.length})</div>
            <div className="sidebar__work-orders">
              {filteredWorkOrders.map((wo) => (
                <div
                  key={wo.id}
                  className={`work-order-item ${highlightedWorkOrderId === wo.id ? "work-order-item--highlighted" : ""}`}
                  onClick={() => setHighlight(wo.id)}
                >
                  <div className="work-order-item__header">
                    <span className="work-order-item__id">{wo.id}</span>
                    <span className="work-order-item__status">Active</span>
                  </div>
                  <div className="work-order-item__product">{wo.product}</div>
                  <div className="work-order-item__stats">
                    {wo.operations.length} operations • Quantity: {wo.qty}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div
          className="gantt-chart__timeline-container"
          ref={scrollRef}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={handleTimelineClick}
        >
          <div className="timeline">
            <div className="timeline__header">
              <div className="timeline__time-axis">
                <div className="timeline__grid-lines">
                  {timeTicks.map((tick, index) => (
                    <div
                      key={index}
                      className={`timeline__grid-line ${tick.getMinutes() === 0 ? "timeline__grid-line--major" : ""}`}
                      style={{ left: dateToPixels(tick, timelineData.viewport) }}
                    />
                  ))}
                  {now >= timelineData.viewport.startTime && now <= timelineData.viewport.endTime && (
                    <div
                      className="timeline__grid-line timeline__grid-line--now"
                      style={{ left: dateToPixels(now, timelineData.viewport) }}
                    />
                  )}
                </div>

                {timeTicks.map((tick, index) => (
                  <div
                    key={index}
                    className={`timeline__tick ${tick.getMinutes() === 0 ? "timeline__tick--major" : ""}`}
                    style={{ left: dateToPixels(tick, timelineData.viewport) }}
                  >
                    {tick.getMinutes() === 0 ? `${formatTime(tick)} ${formatDate(tick)}` : formatTime(tick)}
                  </div>
                ))}
              </div>
            </div>

            <div className="timeline__body">
              {timelineData.machines.map((machineId) => (
                <div key={machineId} className="machine-lane">
                  <div className="machine-lane__label">
                    <div className="machine-lane__label-content">
                      <h3>{machineId}</h3>
                      <div className="machine-lane__label-content-stats">
                        {machineStats[machineId]?.operationCount || 0} operations •{" "}
                        {Math.round(machineStats[machineId]?.utilization || 0)}% utilization
                      </div>
                    </div>
                  </div>

                  <div className="machine-lane__timeline">
                    {timelineData.operations
                      .filter((op) => op.machineId === machineId)
                      .map((operation) => {
                        const left = dateToPixels(new Date(operation.start), timelineData.viewport);
                        const width =
                          dateToPixels(new Date(operation.end), timelineData.viewport) - left;
                        return (
                          <div
                            key={operation.id}
                            data-operation-id={operation.id}
                            className={getOperationClassName(operation)}
                            style={{ left: `${left}px`, width: `${Math.max(width, 80)}px` }}
                            onMouseDown={(e) => handleOperationMouseDown(operation, e)}
                            onClick={(e) => handleOperationClick(operation, e)}
                          >
                            <div className="operation-bar__content">
                              <div className="operation-bar__content-title">{operation.workOrderId}</div>
                              <div className="operation-bar__content-subtitle">{operation.name}</div>
                            </div>
                            <div className="operation-bar__time-label operation-bar__time-label--start">
                              {formatTime(new Date(operation.start))}
                            </div>
                            <div className="operation-bar__time-label operation-bar__time-label--end">
                              {formatTime(new Date(operation.end))}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GanttChart;
