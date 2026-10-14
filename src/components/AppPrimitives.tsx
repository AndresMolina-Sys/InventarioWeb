import { useEffect, useId, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { AppPreferences } from "../types";
import { formatNumber, presentAssetStatus } from "../i18n";
import { resolveAssetStatus } from "../lib/inventoryRepository";
import { translated } from "../lib/appPresentation";

export type IconName = "dashboard" | "box" | "search" | "plus" | "download" | "chevron" | "edit" | "trash" | "view" | "close" | "check" | "spark" | "clock" | "alert" | "layers" | "currency" | "settings";
export type TablePageSize = NonNullable<AppPreferences["tablePageSize"]>;

export function useTablePagination<T>(rows: T[], pageSize: TablePageSize, resetKey = "") {
  const [currentPage, setCurrentPage] = useState(1);
  const pageCount = Math.max(1, pageSize === "all" ? 1 : Math.ceil(rows.length / pageSize));
  const pageLength = pageSize === "all" ? rows.length : pageSize;
  const safePage = Math.min(currentPage, pageCount);
  const firstIndex = pageSize === "all" ? 0 : (safePage - 1) * pageLength;
  const visibleRows = pageSize === "all" ? rows : rows.slice(firstIndex, firstIndex + pageLength);
  const rangeStart = rows.length === 0 ? 0 : firstIndex + 1;
  const rangeEnd = Math.min(firstIndex + pageLength, rows.length);
  const previousState = useRef({ pageSize, resetKey, rowCount: rows.length });

  useEffect(() => {
    const shouldReset = previousState.current.pageSize !== pageSize || previousState.current.resetKey !== resetKey;
    const rowsShrank = rows.length < previousState.current.rowCount;
    previousState.current = { pageSize, resetKey, rowCount: rows.length };
    if (shouldReset) setCurrentPage(1);
    else if (rowsShrank) setCurrentPage((page) => Math.min(page, pageCount));
  }, [pageCount, pageSize, resetKey, rows.length]);

  return { currentPage: safePage, pageCount, rangeStart, rangeEnd, rows: visibleRows, setCurrentPage };
}

export function TablePaginationControls({ page, pageCount, onPageChange, language }: {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  language: AppPreferences["language"];
}) {
  return <nav className="movement-pagination" aria-label={translated(language, "pageLabel")}>
    <button className="movement-page-button" type="button" aria-label={translated(language, "previousPage")} onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page === 1}><Icon name="chevron" size={15} className="rotate-left" /></button>
    <span aria-live="polite">{translated(language, "movementPageCount", { page: formatNumber(page, language), pages: formatNumber(pageCount, language) })}</span>
    <button className="movement-page-button" type="button" aria-label={translated(language, "nextPage")} onClick={() => onPageChange(Math.min(pageCount, page + 1))} disabled={page === pageCount}><Icon name="chevron" size={15} /></button>
  </nav>;
}

export function Icon({ name, size = 18, className }: { name: IconName; size?: number; className?: string }) {
  return <svg aria-hidden="true" className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{iconPaths[name]}</svg>;
}

const iconPaths: Record<IconName, ReactNode> = {
  dashboard: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /></>,
  box: <><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" /><path d="m4.3 7.7 7.7 4.4 7.7-4.4M12 21v-8.9M8 5.3l8 4.5" /></>,
  search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></>,
  plus: <><path d="M12 5v14M5 12h14" /></>,
  download: <><path d="M12 3v12m0 0 4-4m-4 4-4-4" /><path d="M5 17v3h14v-3" /></>,
  chevron: <path d="m9 18 6-6-6-6" />,
  edit: <><path d="m15 5 4 4M4 20l4-.9L19.1 8a2.1 2.1 0 0 0-3-3L5 16.1 4 20Z" /></>,
  trash: <><path d="M4 7h16m-10 4v5m4-5v5M6 7l1 13h10l1-13M9 7V4h6v3" /></>,
  view: <><path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z" /><circle cx="12" cy="12" r="2.5" /></>,
  close: <><path d="m6 6 12 12M18 6 6 18" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  spark: <><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" /><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  alert: <><path d="M10.3 4.8 2.8 18a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 4.8a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4m0 4h.01" /></>,
  layers: <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 12 9 5 9-5M3 16l9 5 9-5" /></>,
  currency: <><circle cx="12" cy="12" r="9" /><path d="M15 8.5c-.5-.7-1.5-1.1-3-1.1-1.6 0-2.6.7-2.6 1.8 0 3 5.2 1.2 5.2 4.1 0 1.1-1 2-2.7 2-1.4 0-2.5-.4-3.2-1.2M12 6v12" /></>,
  settings: <><path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" /><path d="m19.4 15 .1.1a1.7 1.7 0 0 1-2.4 2.4l-.1-.1a1.7 1.7 0 0 0-2.9 1.2v.2a1.7 1.7 0 0 1-3.4 0v-.2a1.7 1.7 0 0 0-2.9-1.2l-.1.1a1.7 1.7 0 0 1-2.4-2.4l.1-.1a1.7 1.7 0 0 0-1.2-2.9H4a1.7 1.7 0 0 1 0-3.4h.2a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a1.7 1.7 0 0 1 2.4-2.4l.1.1a1.7 1.7 0 0 0 2.9-1.2V2a1.7 1.7 0 0 1 3.4 0v.2a1.7 1.7 0 0 0 2.9 1.2l.1-.1a1.7 1.7 0 0 1 2.4 2.4l-.1.1a1.7 1.7 0 0 0 1.2 2.9h.2a1.7 1.7 0 0 1 0 3.4h-.2a1.7 1.7 0 0 0-1.2 2.9Z" /></>,
};

export function AssetStatusBadge({ status, language = "es" }: { status: string | null | undefined; language?: AppPreferences["language"] }) {
  const resolved = presentAssetStatus(status, language);
  if (resolved.kind === "unknown") {
    const label = `${resolved.label} — ${resolved.rawValue}`;
    return <span className="asset-status-badge is-unknown" aria-label={translated(language, "unknownStatusAccessible", { value: resolved.rawValue })} title={resolved.rawValue}>{label}</span>;
  }
  return <span className={`asset-status-badge is-${resolveAssetStatus(status).value}`} aria-label={translated(language, "canonicalStatusAccessible", { value: resolved.label })}>{resolved.label}</span>;
}

export function EmptyState({ title, text }: { title: string; text: string }) {
  return <div className="empty-state"><span className="empty-icon"><Icon name="box" size={21} /></span><strong>{title}</strong><p>{text}</p></div>;
}

export function LoadingScreen({ language }: { language: AppPreferences["language"] }) {
  return <div className="loading-screen" lang={language}><span className="loading-mark"><Icon name="layers" size={20} /></span><span>{translated(language, "loadingRegistry")}</span></div>;
}

export function ModalFrame({ title, subtitle, onClose, children, className = "", badge, closeLabel = "Cerrar", manageFocus = false, hideHeaderClose = false, dismissOnBackdrop = true, initialFocusRef }: {
  title: string;
  subtitle: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  badge?: ReactNode;
  closeLabel?: string;
  manageFocus?: boolean;
  hideHeaderClose?: boolean;
  dismissOnBackdrop?: boolean;
  initialFocusRef?: { current: HTMLElement | null };
}) {
  const dialogRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  const titleId = useId();
  onCloseRef.current = onClose;

  useEffect(() => {
    if (manageFocus) return;
    function dismissOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", dismissOnEscape);
    return () => window.removeEventListener("keydown", dismissOnEscape);
  }, [manageFocus, onClose]);

  useEffect(() => {
    if (!manageFocus) return;

    const dialog = dialogRef.current;
    if (!previouslyFocusedElementRef.current && document.activeElement instanceof HTMLElement) {
      previouslyFocusedElementRef.current = document.activeElement;
    }
    (initialFocusRef?.current ?? closeButtonRef.current)?.focus();

    function containKeyboardNavigation(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab" || !dialog) return;

      const focusableElements = Array.from(dialog.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )).filter((element) => element.getAttribute("aria-hidden") !== "true" && element.getClientRects().length > 0);
      if (focusableElements.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      if (focusableElements.length === 1) {
        event.preventDefault();
        focusableElements[0].focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;
      if (event.shiftKey && (activeElement === firstElement || !dialog.contains(activeElement))) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && (activeElement === lastElement || !dialog.contains(activeElement))) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    document.addEventListener("keydown", containKeyboardNavigation);
    return () => {
      document.removeEventListener("keydown", containKeyboardNavigation);
      if (dialog && !dialog.isConnected) {
        const previouslyFocusedElement = previouslyFocusedElementRef.current;
        if (previouslyFocusedElement?.isConnected) {
          window.requestAnimationFrame(() => previouslyFocusedElement.focus());
        }
      }
    };
  }, [initialFocusRef, manageFocus]);

  return <div className="modal-backdrop" onMouseDown={(event) => { if (dismissOnBackdrop && event.target === event.currentTarget) onClose(); }}>
    <section ref={dialogRef} className={`modal-card ${className}`} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}>
      <header className="modal-heading"><div>{badge ?? <span className="modal-mark"><Icon name="box" size={18} /></span>}<div><h2 id={titleId}>{title}</h2><p>{subtitle}</p></div></div>{!hideHeaderClose && <button ref={closeButtonRef} className="quiet-icon" onClick={onClose} aria-label={closeLabel}><Icon name="close" size={19} /></button>}</header>
      {children}
    </section>
  </div>;
}
