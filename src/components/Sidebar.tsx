import type { AppPreferences } from "../types";
import { formatNumber } from "../i18n";
import type { TranslationKey } from "../i18n";
import { Icon } from "./AppPrimitives";
import type { IconName } from "./AppPrimitives";
import { translated } from "../lib/appPresentation";

type Page = "dashboard" | "inventory" | "categories" | "movements" | "settings" | "category-detail";
export function Sidebar({ page, onPage, itemCount, categoryCount, language }: { page: Page; onPage: (page: Page) => void; itemCount: number; categoryCount: number; language: AppPreferences["language"] }) {
  const activePage = page === "category-detail" ? "categories" : page;
  const links: Array<{ key: Exclude<Page, "category-detail">; labelKey: TranslationKey; icon: IconName }> = [
    { key: "dashboard", labelKey: "dashboard", icon: "dashboard" },
    { key: "inventory", labelKey: "articles", icon: "box" },
    { key: "categories", labelKey: "categories", icon: "layers" },
    { key: "movements", labelKey: "movements", icon: "clock" },
    { key: "settings", labelKey: "settings", icon: "settings" },
  ];
  const t = (key: TranslationKey) => translated(language, key);
  return <aside className="sidebar">
    <a className="brand" href="#inicio" onClick={(event) => { event.preventDefault(); onPage("dashboard"); }}>
      <span className="brand-symbol"><Icon name="layers" size={19} /></span><span>{t("internalControl")}</span>
    </a>
    <div className="workspace-select"><span className="workspace-mark">I</span><span><strong>InventarioWeb</strong><small>{t("appDescription")}</small></span><Icon name="chevron" size={15} /></div>
    <div className="nav-label">{t("menu")}</div>
    <nav className="side-nav" aria-label={t("mainNavigation")}>
      {links.map((link) => {
        const label = t(link.labelKey);
        return <button key={link.key} className={`nav-link ${activePage === link.key ? "active" : ""}`} aria-label={label} aria-current={activePage === link.key ? "page" : undefined} title={label} onClick={() => onPage(link.key)}>
          <Icon name={link.icon} size={18} /><span>{label}</span>{link.key === "inventory" ? <span className="nav-count">{formatNumber(itemCount, language)}</span> : link.key === "categories" ? <span className="nav-count">{formatNumber(categoryCount, language)}</span> : null}
        </button>;
      })}
    </nav>
    <div className="sidebar-spacer" />
    <div className="sidebar-note"><span className="note-icon"><Icon name="spark" size={16} /></span><strong>{t("controlOrganized")}</strong><p>{t("inventoryDescription")}</p></div>
  </aside>;
}
