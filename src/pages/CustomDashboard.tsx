// src/pages/CustomDashboard.tsx
import { useState, useCallback, useMemo } from "react";
import { ResponsiveGridLayout } from "react-grid-layout";
import type { Layout } from "react-grid-layout";
import {
  Plus,
  Lock,
  Unlock,
  GripVertical,
  X,
  BarChart3,
  LayoutDashboard,
} from "lucide-react";
import { doc, setDoc, onSnapshot, DocumentData } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useUser } from "@/contexts/UserContext";
import { cn } from "@/lib/utils";
import AddWidgetModal from "@/components/dashboard/AddWidgetModel";
import {
  WidgetRenderer,
  WIDGET_REGISTRY,
  WidgetDefinition,
  CATEGORY_META,
} from "@/components/dashboard/widgetRegistry";
import { DateRange } from "@/lib/analytics";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A positioned widget instance on the custom dashboard grid.
 */
interface DashboardWidget {
  /** Unique instance ID (e.g. "win-rate-1710000000000") */
  id: string;
  /** Registry widget ID (e.g. "win-rate") */
  widgetId: string;
  /** react-grid-layout position snapshot */
  layout: WidgetLayout;
}

interface WidgetLayout {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
}

interface SavedLayout {
  widgets: DashboardWidget[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const COLS = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 };
const ROW_HEIGHT = 80;
const DATE_RANGES: { label: string; value: DateRange }[] = [
  { label: "1M",  value: "1M" },
  { label: "3M",  value: "3M" },
  { label: "6M",  value: "6M" },
  { label: "YTD", value: "YTD" },
  { label: "1Y",  value: "1Y" },
  { label: "ALL", value: "ALL" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Firestore Persistence Helpers
// ─────────────────────────────────────────────────────────────────────────────

const layoutDocPath = (userId: string, accountId: string) =>
  `users/${userId}/dashboardLayouts/${accountId}`;

/** One-shot Firestore read wrapped in a Promise for React Query. */
const fetchLayout = (userId: string, accountId: string): Promise<DashboardWidget[]> =>
  new Promise((resolve, reject) => {
    const ref = doc(db, layoutDocPath(userId, accountId));
    const unsub = onSnapshot(ref, (snap) => {
      unsub();
      if (snap.exists()) {
        const data = snap.data() as DocumentData;
        resolve((data as SavedLayout).widgets ?? []);
      } else {
        resolve([]);
      }
    }, reject);
  });

const saveLayout = async (
  userId: string,
  accountId: string,
  widgets: DashboardWidget[]
): Promise<void> => {
  await setDoc(doc(db, layoutDocPath(userId, accountId)), {
    widgets,
    updatedAt: new Date(),
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// Custom Dashboard Page
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Custom Dashboard — a fully configurable analytics workspace.
 * Users can add/remove/drag/resize widgets; layout is persisted
 * to Firestore scoped per user × account.
 */
export default function CustomDashboard() {
  const { activeAccount } = useWorkspace();
  const { user }          = useUser();

  const userId    = user?.uid ?? "";
  const accountId = activeAccount?.id ?? "";

  // Local UI state ────────────────────────────────────────────────────────────
  const [isAddOpen,  setIsAddOpen]  = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [dateRange,  setDateRange]  = useState<DateRange>("1M");

  // React Query — layout ──────────────────────────────────────────────────────
  const { data: widgets = [], refetch } = useQuery<DashboardWidget[]>({
    queryKey: ["custom-dashboard-layout", userId, accountId],
    queryFn: () =>
      userId && accountId ? fetchLayout(userId, accountId) : Promise.resolve([]),
    enabled: !!userId && !!accountId,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  const { mutate: persist } = useMutation({
    mutationFn: (updated: DashboardWidget[]) =>
      saveLayout(userId, accountId, updated),
    onError: () => toast.error("Failed to save layout"),
  });

  // Layouts object for react-grid-layout ──────────────────────────────────────
  const layouts = useMemo(
    () => ({ lg: widgets.map((w): Layout => ({ ...w.layout })) }),
    [widgets]
  );

  // Handlers ──────────────────────────────────────────────────────────────────

  /**
   * Adds a new widget instance to the grid from the AddWidget modal.
   * @param def - The widget definition from WIDGET_REGISTRY.
   */
  const handleAddWidget = useCallback(
    (def: WidgetDefinition) => {
      const instanceId = `${def.id}-${Date.now()}`;
      const newWidget: DashboardWidget = {
        id: instanceId,
        widgetId: def.id,
        layout: {
          i:    instanceId,
          x:    0,
          y:    Infinity, // react-grid-layout places it at the bottom
          w:    def.defaultW,
          h:    def.defaultH,
          minW: def.minW ?? 2,
          minH: def.minH ?? 2,
          maxW: def.maxW ?? 12,
        },
      };
      const updated = [...widgets, newWidget];
      persist(updated);
      refetch();
      setIsAddOpen(false);
    },
    [widgets, persist, refetch]
  );

  /**
   * Removes a widget instance by ID.
   * @param instanceId - The DashboardWidget.id to remove.
   */
  const handleRemoveWidget = useCallback(
    (instanceId: string) => {
      persist(widgets.filter((w) => w.id !== instanceId));
      refetch();
    },
    [widgets, persist, refetch]
  );

  /**
   * Syncs updated positions back to state after drag/resize.
   * Uses both currentLayout + allLayouts for correctness across breakpoints.
   */
  const handleLayoutChange = useCallback(
    (currentLayout: Layout[]) => {
      const updated = widgets.map((w) => {
        const found = currentLayout.find((l) => l.i === w.id);
        if (!found) return w;
        const { i, x, y, w: width, h } = found;
        return { ...w, layout: { ...w.layout, i, x, y, w: width, h } };
      });
      persist(updated);
    },
    [widgets, persist]
  );

  // Derived state ─────────────────────────────────────────────────────────────
  const existingWidgetIds = widgets.map((w) => w.widgetId);
  const hasWidgets        = widgets.length > 0;

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 sm:px-6 lg:px-8 pt-6 pb-4 gap-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <LayoutDashboard size={16} className="text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Custom Dashboard</h1>
            <p className="text-xs text-muted-foreground">
              {hasWidgets
                ? `${widgets.length} widget${widgets.length > 1 ? "s" : ""}`
                : "No widgets yet"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Date Range Tabs */}
          <div className="flex items-center gap-1 bg-secondary/60 rounded-xl p-1">
            {DATE_RANGES.map((r) => (
              <button
                key={r.value}
                onClick={() => setDateRange(r.value)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                  dateRange === r.value
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Edit Mode Toggle */}
          <button
            onClick={() => setIsEditMode((v) => !v)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-all",
              isEditMode
                ? "bg-primary/10 border-primary/30 text-primary"
                : "bg-secondary/50 border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {isEditMode ? <Unlock size={14} /> : <Lock size={14} />}
            {isEditMode ? "Editing" : "Edit"}
          </button>

          {/* Add Widget */}
          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus size={14} />
            Add Widget
          </button>
        </div>
      </div>

      {/* ── Edit Mode Banner ── */}
      {isEditMode && (
        <div className="mx-4 sm:mx-6 lg:mx-8 mt-4 px-4 py-2.5 rounded-xl bg-primary/5 border border-primary/20 flex items-center gap-2">
          <GripVertical size={14} className="text-primary" />
          <p className="text-xs text-primary font-medium">
            Edit mode — drag to rearrange, resize from corners, or ✕ to remove widgets.
          </p>
        </div>
      )}

      {/* ── Grid Content ── */}
      <div className="px-4 sm:px-6 lg:px-8 py-4">
        {!hasWidgets ? (
          <EmptyState onAdd={() => setIsAddOpen(true)} />
        ) : (
          <ResponsiveGridLayout
            className="layout"
            layouts={layouts}
            cols={COLS}
            rowHeight={ROW_HEIGHT}
            isDraggable={isEditMode}
            isResizable={isEditMode}
            onLayoutChange={handleLayoutChange}
            margin={[16, 16]}
            containerPadding={[0, 0]}
            draggableHandle=".drag-handle"
            width={1200} /* Required by ResponsiveGridLayout for SSR */
          >
            {widgets.map((widget) => {
              const def  = WIDGET_REGISTRY.find((r) => r.id === widget.widgetId);
              const Icon = def?.icon;

              return (
                <div
                  key={widget.id}
                  className={cn(
                    "bg-card rounded-2xl border border-border overflow-hidden flex flex-col transition-shadow duration-200",
                    isEditMode && "ring-1 ring-primary/20 shadow-lg"
                  )}
                >
                  {/* Widget Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 flex-shrink-0">
                    <div className="flex items-center gap-2">
                      {isEditMode && (
                        <div className="drag-handle cursor-grab active:cursor-grabbing p-1 rounded-md hover:bg-muted transition-colors">
                          <GripVertical size={12} className="text-muted-foreground" />
                        </div>
                      )}
                      {Icon && (
                        <div
                          className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
                          style={{
                            backgroundColor: def
                              ? `${CATEGORY_META[def.category].color}20`
                              : undefined,
                          }}
                        >
                          <Icon
                            size={11}
                            style={{ color: def ? CATEGORY_META[def.category].color : "currentColor" }}
                          />
                        </div>
                      )}
                      <span className="text-xs font-semibold text-foreground truncate max-w-[160px]">
                        {def?.name ?? widget.widgetId}
                      </span>
                    </div>

                    {isEditMode && (
                      <button
                        onClick={() => handleRemoveWidget(widget.id)}
                        className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all flex-shrink-0"
                        aria-label={`Remove ${def?.name ?? widget.widgetId} widget`}
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>

                  {/* Widget Body */}
                  <div className="flex-1 p-4 min-h-0">
                    <WidgetRenderer widgetId={widget.widgetId} dateRange={dateRange} />
                  </div>
                </div>
              );
            })}
          </ResponsiveGridLayout>
        )}
      </div>

      {/* ── Add Widget Modal ── */}
      <AddWidgetModal
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onAdd={handleAddWidget}
        existingWidgetIds={existingWidgetIds}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Empty State
// ─────────────────────────────────────────────────────────────────────────────

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
        <BarChart3 size={28} className="text-primary" />
      </div>
      <h2 className="text-xl font-semibold text-foreground mb-2">Build Your Dashboard</h2>
      <p className="text-sm text-muted-foreground max-w-sm mb-8">
        Add widgets to track the metrics that matter most to your trading style.
        All data is live and updates automatically.
      </p>
      <button
        onClick={onAdd}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        <Plus size={16} />
        Add Your First Widget
      </button>
    </div>
  );
}
