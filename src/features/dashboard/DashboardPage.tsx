import { useEffect, useMemo, useState } from "react";
import type { AppPreferences, Category, InventoryItem, InventoryMovement } from "../../types";
import { formatCalendarDate, formatCurrency, formatDate, formatGreeting, formatNumber, sumAndConvertUsdCosts } from "../../i18n";
import type { TranslationKey, TranslationParameters } from "../../i18n";
import { EmptyState, Icon } from "../../components/AppPrimitives";
import type { IconName } from "../../components/AppPrimitives";
import { compactDisplayValueLabel, dateLabel, translated } from "../../lib/appPresentation";
import type { DisplayFormatting } from "../../lib/appPresentation";
type WeeklyActivityDay = {
  dateKey: string;
  label: string;
  longLabel: string;
  count: number;
  isToday: boolean;
};

function localDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function buildWeeklyActivity(movements: InventoryMovement[], language: AppPreferences["language"], formatting: DisplayFormatting): WeeklyActivityDay[] {
  const today = new Date();
  const weekdayKeys: TranslationKey[] = ["weekdaySunday", "weekdayMonday", "weekdayTuesday", "weekdayWednesday", "weekdayThursday", "weekdayFriday", "weekdaySaturday"];
  const todayKey = localDateKey(today);
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6 + index);
    return {
      dateKey: localDateKey(date),
      label: `${translated(language, weekdayKeys[date.getDay()])} ${formatNumber(date.getDate(), language, { useGrouping: false })}`,
      longLabel: `${formatDate(date, language, { weekday: "long" })} ${dateLabel(date, language, formatting)}`,
      count: 0,
      isToday: localDateKey(date) === todayKey,
    };
  });
  const counts = new Map(days.map((day) => [day.dateKey, 0]));

  for (const movement of movements) {
    const timestamp = Date.parse(movement.occurredAt);
    if (!Number.isFinite(timestamp)) continue;
    const key = localDateKey(new Date(timestamp));
    if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return days.map((day) => ({ ...day, count: counts.get(day.dateKey) ?? 0 }));
}

function ActivityChart({ movements, language, formatting }: { movements: InventoryMovement[]; language: AppPreferences["language"]; formatting: DisplayFormatting }) {
  const t = (key: TranslationKey, parameters?: TranslationParameters) => translated(language, key, parameters);
  const days = useMemo(() => buildWeeklyActivity(movements, language, formatting), [movements, formatting, language]);
  const maximum = Math.max(1, ...days.map((day) => day.count));
  const yTicks = (maximum <= 3
    ? Array.from({ length: maximum + 1 }, (_, index) => maximum - index)
    : [maximum, Math.floor(maximum / 2), 0]
  ).map((value) => ({
    value,
    position: `${value / maximum * 100}%`,
  }));
  const total = days.reduce((sum, day) => sum + day.count, 0);
  const weekSuffix = t("movementsThisWeek").replace(t("movementPlural"), "").trim();
  const activitySummary = days.map((day) => t("recentMovementSummary", {
    date: day.longLabel,
    count: formatNumber(day.count, language),
    movementLabel: t(day.count === 1 ? "movementSingular" : "movementPlural"),
  })).join(". ");

  return <section className="panel movement-chart-panel activity-chart-panel" aria-labelledby="activity-chart-title">
    <div className="panel-heading">
      <div><h2 id="activity-chart-title">{t("recentActivity")}</h2><p>{t("recentActivityDescription")}</p></div>
      <span className="panel-icon"><Icon name="clock" size={18} /></span>
    </div>
    {total === 0 && <p className="chart-empty-note">{t("noRecentMovements")}</p>}
    <div className="chart-area" role="img" aria-label={t("activityChartAccessibleName", { summary: activitySummary })}>
      <div className="chart-y-labels" aria-hidden="true">{yTicks.map((tick) => <span key={tick.value} style={{ bottom: tick.position }}>{formatNumber(tick.value, language)}</span>)}</div>
      <div className="chart-plot" aria-hidden="true">
        {yTicks.map((tick) => <span className="chart-gridline" key={tick.value} style={{ bottom: tick.position }} />)}
        <div className="chart-bars">
          {days.map((day) => <div className="chart-column" key={day.dateKey}>
            <span className="bar-count-label" aria-hidden="true" style={{ bottom: `calc(${day.count / maximum * 100}% + 6px)` }}>{formatNumber(day.count, language)}</span>
            <div className="bar-rail"><span className={`bar-fill${day.count === 0 ? " inactive" : day.isToday ? " current" : ""}`} style={{ height: `${day.count / maximum * 100}%` }} /></div>
          </div>)}
        </div>
      </div>
      <div className="chart-x-labels" aria-hidden="true">{days.map((day) => <span key={day.dateKey}>{day.label}</span>)}</div>
    </div>
    <div className="chart-legend"><span className="legend-dot" /><span>{t("activityByDay")}</span><strong className="chart-total">{formatNumber(total, language)} {t(total === 1 ? "movementSingular" : "movementPlural")} {weekSuffix}</strong></div>
  </section>;
}

export function DashboardPage({ items, categories, movements, categoryName, language, formatting, showRecentActivityChart, showCategoryChart, showRegisteredValue, displayCurrency, crcPerUsd, eurPerUsd, onViewInventory, onViewCategories }: {
  items: InventoryItem[];
  categories: Category[];
  movements: InventoryMovement[];
  categoryName: Map<string, string>;
  language: AppPreferences["language"];
  formatting: DisplayFormatting;
  showRecentActivityChart: boolean;
  showCategoryChart: boolean;
  showRegisteredValue: boolean;
  displayCurrency: NonNullable<AppPreferences["displayCurrency"]>;
  crcPerUsd: number;
  eurPerUsd: number;
  onViewInventory: () => void;
  onViewCategories: () => void;
}) {
  const t = (key: TranslationKey, parameters?: TranslationParameters) => translated(language, key, parameters);
  const [recentPage, setRecentPage] = useState(1);
  const [categoryViewMode, setCategoryViewMode] = useState<"percentage" | "count">("percentage");
  const categoryTotals = categories.map((category) => ({
    ...category,
    count: items.filter((item) => item.categoryId === category.id).length,
  })).sort((a, b) => b.count - a.count);
  const maxCategoryCount = Math.max(1, ...categoryTotals.map((category) => category.count));
  const recentItems = [...items].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt) || a.id.localeCompare(b.id));
  const recentPageSize = 5;
  const recentPageCount = Math.max(1, Math.ceil(recentItems.length / recentPageSize));
  const currentRecentPage = Math.min(recentPage, recentPageCount);
  const firstRecentIndex = (currentRecentPage - 1) * recentPageSize;
  const visibleRecentItems = recentItems.slice(firstRecentIndex, firstRecentIndex + recentPageSize);
  useEffect(() => setRecentPage(1), [items]);
  const registeredCosts = items.map((item) => item.cost !== null && Number.isFinite(item.cost) && item.cost >= 0 ? item.cost : null);
  const registeredValue = sumAndConvertUsdCosts(registeredCosts, displayCurrency, { crcPerUsd, eurPerUsd });
  const fullRegisteredValue = formatCurrency(registeredValue, displayCurrency, language);
  const useCompactRegisteredValue = fullRegisteredValue.length > 10;
  const registeredValueStat = {
    label: t("registeredValue"),
    value: useCompactRegisteredValue ? compactDisplayValueLabel(registeredValue, displayCurrency, language) : fullRegisteredValue,
    detail: t("capturedCostsSum"),
    icon: "currency" as const,
    color: "green",
    currency: true,
    exactValue: fullRegisteredValue,
    compact: useCompactRegisteredValue,
  };
  const stats: Array<{ label: string; value: string; detail: string; icon: IconName; color: string; currency?: boolean; exactValue?: string; compact?: boolean }> = [
    { label: t("registeredArticles"), value: formatNumber(items.length, language), detail: t("currentRegister"), icon: "box", color: "violet" },
    { label: t("categories"), value: formatNumber(categories.length, language), detail: t("toClassifyArticles"), icon: "layers", color: "blue" },
    ...(showRegisteredValue ? [registeredValueStat] : []),
  ];
  return <section className="page-content">
    <div className="page-heading dashboard-heading">
      <div><div className="eyebrow">{formatDate(new Date(), language, { weekday: "long" })} · {formatCalendarDate(new Date(), language, formatting.dateFormat)}</div><h1>{formatGreeting(new Date().getHours(), language)} <span className="wave">✦</span></h1><p>{t("dashboardDescription")}</p></div>
      <div className="dashboard-actions"><button className="button button-outline" onClick={onViewCategories}><Icon name="layers" size={17} />{t("view")} {t("categories")}</button><button className="button button-primary" onClick={onViewInventory}><Icon name="box" size={17} />{t("view")} {t("articles")}</button></div>
    </div>

    <div className="stats-grid stats-grid-internal" style={stats.length === 2 ? { gridTemplateColumns: "repeat(2, minmax(0, 1fr))" } : undefined}>
      {stats.map((stat) => <article className="stat-card" key={stat.label} style={stats.length === 2 ? { gridColumn: "auto" } : undefined}>
        <div className="stat-top"><span>{stat.label}</span><span className={`stat-icon ${stat.color}`}><Icon name={stat.icon} size={17} /></span></div>
        <strong
          className={`stat-value${stat.currency ? " stat-value-currency" : ""}`}
          aria-label={stat.exactValue}
          title={stat.compact ? stat.exactValue : undefined}
          tabIndex={stat.compact ? 0 : undefined}
        >{stat.value}</strong><span className="stat-detail">{stat.detail}</span>
      </article>)}
    </div>

    <div className="dashboard-grid internal-dashboard-grid" data-show-activity-chart={showRecentActivityChart} data-show-category-chart={showCategoryChart}>
      {showRecentActivityChart && <ActivityChart movements={movements} language={language} formatting={formatting} />}
      <section className="panel recent-panel">
        <div className="panel-heading">
          <div className="recent-panel-heading-main">
            <h2>{t("recentEntries")}</h2>
            <p>{t("recentlyAddedArticles")}</p>
          </div>
          <div className="recent-heading-tools">
            {recentItems.length > recentPageSize && <nav className="recent-pagination" aria-label={t("recentItemsPagination")}>
              <button className="quiet-icon recent-page-button" aria-label={t("previousPage")} title={t("previousEntries")} onClick={() => setRecentPage((page) => Math.max(1, Math.min(page, recentPageCount) - 1))} disabled={currentRecentPage === 1}><Icon name="chevron" size={15} className="rotate-left" /></button>
              <span className="sr-only" aria-live="polite">{t("movementPageCount", { page: formatNumber(currentRecentPage, language), pages: formatNumber(recentPageCount, language) })}</span>
              <button className="quiet-icon recent-page-button" aria-label={t("nextPage")} title={t("moreEntries")} onClick={() => setRecentPage((page) => Math.min(recentPageCount, Math.min(page, recentPageCount) + 1))} disabled={currentRecentPage === recentPageCount}><Icon name="chevron" size={15} /></button>
            </nav>}
            <span className="panel-icon"><Icon name="clock" size={18} /></span>
          </div>
        </div>
        {recentItems.length > 0 ? <div className="recent-list">
          {visibleRecentItems.map((item) => <div className="recent-row article-recent-row" key={item.id}>
            <span className="product-avatar avatar-violet">{item.name.slice(0, 1)}</span>
            <span className="recent-copy"><strong>{item.name}</strong><small>{categoryName.get(item.categoryId) ?? t("noCategory")} · {dateLabel(item.createdAt, language, formatting)}</small></span>
          </div>)}
        </div> : <EmptyState title={t("noArticlesYet")} text={t("articlesWillAppear")} />}
      </section>
      {showCategoryChart && <section className="panel category-panel">
        <div className="panel-heading category-panel-heading">
          <div className="category-heading-copy"><h2>{t("articlesByCategory")}</h2><p>{t("categoryItemsCountDescription")}</p></div>
          <div className="category-heading-tools">
            <div className="category-view-toggle" role="group" aria-label={t("categoryChartMode")}>
              <button type="button" aria-label={t("showPercentages")} aria-pressed={categoryViewMode === "percentage"} onClick={() => setCategoryViewMode("percentage")}>%</button>
              <button type="button" aria-label={t("showArticleCount")} aria-pressed={categoryViewMode === "count"} onClick={() => setCategoryViewMode("count")}>#</button>
            </div>
            <span className="panel-icon" aria-hidden="true"><Icon name="layers" size={18} /></span>
          </div>
        </div>
        <div className="category-list">
          {categoryTotals.map((category, index) => {
            const percentage = items.length > 0 ? category.count / items.length * 100 : 0;
            const barWidth = categoryViewMode === "percentage" ? percentage : category.count / maxCategoryCount * 100;
            const displayValue = categoryViewMode === "percentage"
              ? `${formatNumber(percentage, language, { maximumFractionDigits: 1 })}%`
              : formatNumber(category.count, language);
            return <div className="category-item" key={category.id}>
              <div className="category-label"><span className={`category-mark mark-${index % 4}`}>{category.name.slice(0, 1)}</span><span className="category-name">{category.name}<small>{t(category.count === 1 ? "categoryCountSingular" : "categoryCountPlural", { count: formatNumber(category.count, language) })}</small></span><strong>{displayValue}</strong></div>
              <div className="category-track"><span className={`category-progress progress-${index % 4}`} style={{ width: `${barWidth}%` }} /></div>
            </div>;
          })}
          {categoryTotals.length === 0 && <EmptyState title={t("noCategoriesYet")} text={t("categoriesWillAppear")} />}
        </div>
      </section>}
    </div>
  </section>;
}
