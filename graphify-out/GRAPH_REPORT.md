# Graph Report - InventarioWeb  (2026-10-14)

## Corpus Check
- 145 files · ~105,106 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 625 nodes · 945 edges · 84 communities (44 shown, 40 thin omitted)
- Extraction: 92% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 70 edges (avg confidence: 0.83)
- Token cost: 72,788 input · 21,700 output

## Community Hubs (Navigation)
- Inventory Application Operations
- Project Governance and Principles
- Dashboard and Localization UI
- Local Preferences Management
- Inventory Type Contracts
- React Best Practices Guide
- Settings Personalization Workflow
- IndexedDB Inventory Repository
- Main Application Data Types
- Dashboard Tables and Charts
- Package Dependencies and Scripts
- Browser TypeScript Configuration
- Vite Build Configuration
- Code128 Barcode Generation
- SDD Planning Skills
- Demo Data and Migration
- Bundler Documentation Patterns
- Accessible Interface Patterns
- Article Detail and Printing
- Label and Technical Sheet Specs
- React State Management Patterns
- Audit Diff Comparison
- JavaScript Data Structure Optimization
- React Transition and Deferred Rendering
- Asset Status Presentation
- Settings and Inventory Clear
- Movement Audit Normalization
- SDD Verification Standards
- JavaScript Iteration Patterns
- Server Authentication and Caching References
- Server Static I/O Patterns
- React Effect Event Patterns
- Parallel API Fetching
- Script Loading and Deferred Work
- React Component Memoization
- RSC Serialization Optimization
- Browser Test Automation
- Playwright Test Server
- Deno Edge Function Configuration
- HTML Language Accessibility
- Grill Me Skill Guidance
- Accessible Modal Interactions
- Archived Supabase Configuration
- TypeScript Project References
- App Initialization Guidance
- Async Flag Evaluation
- Avoid Barrel Imports
- Global Event Listener Optimization
- SWR Data Fetching Guidance
- Static JSX and Regex Optimization
- Noncritical Browser Work
- Long List Rendering Optimization
- Component-Level Parallel Fetching
- Nested Data Fetching
- Apache License Terms
- Frontend Design License
- Favicon Identity Design
- Movement Audit Diff Design
- Barcode Label Print Geometry
- React Advanced Patterns
- Bundle Size Optimization Guide
- Client-Side Data Fetching Guide
- Waterfall Elimination Guide
- JavaScript Runtime Performance
- React Render Optimization
- Rendering Performance Guide
- Server-Side Performance Guide
- React Rule Template
- Strategic Suspense Boundaries
- localStorage Versioning Guidance
- Browser Layout Thrashing
- SVG Animation Optimization
- Explicit Conditional Rendering
- SVG Path Precision
- Component Declaration Best Practice
- WCAG Operable Principle
- WCAG Perceivable Principle
- WCAG Robust Principle
- WCAG Understandable Principle

## God Nodes (most connected - your core abstractions)
1. `translated()` - 34 edges
2. `App()` - 28 edges
3. `ItemModal()` - 19 edges
4. `resolveAssetStatus()` - 17 edges
5. `compilerOptions` - 17 edges
6. `React Best Practices Compiled Guide` - 16 edges
7. `formatNumber()` - 14 edges
8. `compilerOptions` - 14 edges
9. `transactSnapshot()` - 13 edges
10. `updateItem()` - 13 edges

## Surprising Connections (you probably didn't know these)
- `InventarioWeb Portfolio README` --semantically_similar_to--> `InventarioWeb Portfolio Agent Guidance`  [INFERRED] [semantically similar]
  README.md → AGENTS.md
- `SDD Requirements Change Skill` --references--> `InventarioWeb Portfolio Agent Guidance`  [EXTRACTED]
  .agents/skills/sdd-change/SKILL.md → AGENTS.md
- `SDD Specification Audit Skill` --references--> `InventarioWeb Portfolio Agent Guidance`  [EXTRACTED]
  .agents/skills/sdd-clarify/SKILL.md → AGENTS.md
- `SDD Constitution Skill` --references--> `InventarioWeb Portfolio Agent Guidance`  [EXTRACTED]
  .agents/skills/sdd-constitution/SKILL.md → AGENTS.md
- `SDD Atomic Implementation Skill` --references--> `InventarioWeb Portfolio Agent Guidance`  [EXTRACTED]
  .agents/skills/sdd-implement/SKILL.md → AGENTS.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **POUR Accessibility Principles** — agents_skills_accessibility_pour_principles, agents_skills_accessibility_perceivable_principle, agents_skills_accessibility_operable_principle, agents_skills_accessibility_understandable_principle, agents_skills_accessibility_robust_principle [EXTRACTED 1.00]
- **Skills Participating in the SDD Workflow** — agents_skills_sdd_skill_sdd, agents_skills_sdd_change_skill_sdd_change, agents_skills_sdd_clarify_skill_sdd_clarify, agents_skills_sdd_constitution_skill_sdd_constitution, agents_skills_sdd_coordinator_skill_sdd_coordinator, agents_skills_sdd_implement_skill_sdd_implement, agents_skills_sdd_plan_skill_sdd_plan, agents_skills_sdd_spec_skill_sdd_spec, agents_skills_sdd_status_skill_sdd_status, agents_skills_sdd_tasks_skill_sdd_tasks [INFERRED 0.85]
- **React Best Practices Documentation Set** — _agents_skills_vercel_react_best_practices_agents_document, _agents_skills_vercel_react_best_practices_readme_document, _agents_skills_vercel_react_best_practices_skill_document [INFERRED 0.85]
- **Eliminating Waterfalls async rules** — _agents_skills_vercel_react_best_practices_rules__sections_eliminating_waterfalls, _agents_skills_vercel_react_best_practices_rules_async_api_routes_prevent_waterfall_chains_in_api_routes, _agents_skills_vercel_react_best_practices_rules_async_cheap_condition_before_await_check_cheap_conditions_before_async_flags, _agents_skills_vercel_react_best_practices_rules_async_defer_await_defer_await_until_needed, _agents_skills_vercel_react_best_practices_rules_async_dependencies_dependency_based_parallelization, _agents_skills_vercel_react_best_practices_rules_async_parallel_promise_all___for_independent_operations, _agents_skills_vercel_react_best_practices_rules_async_suspense_boundaries_strategic_suspense_boundaries [EXTRACTED 1.00]
- **Bundle Size Optimization rules** — _agents_skills_vercel_react_best_practices_rules__sections_bundle_size_optimization, _agents_skills_vercel_react_best_practices_rules_bundle_analyzable_paths_prefer_statically_analyzable_paths, _agents_skills_vercel_react_best_practices_rules_bundle_barrel_imports_avoid_barrel_file_imports, _agents_skills_vercel_react_best_practices_rules_bundle_conditional_conditional_module_loading, _agents_skills_vercel_react_best_practices_rules_bundle_defer_third_party_defer_non_critical_third_party_libraries, _agents_skills_vercel_react_best_practices_rules_bundle_dynamic_imports_dynamic_imports_for_heavy_components, _agents_skills_vercel_react_best_practices_rules_bundle_preload_preload_based_on_user_intent [EXTRACTED 1.00]
- **Client-Side Data Fetching rules** — _agents_skills_vercel_react_best_practices_rules__sections_client_side_data_fetching, _agents_skills_vercel_react_best_practices_rules_client_event_listeners_deduplicate_global_event_listeners, _agents_skills_vercel_react_best_practices_rules_client_localstorage_schema_version_and_minimize_localstorage_data, _agents_skills_vercel_react_best_practices_rules_client_passive_event_listeners_use_passive_event_listeners_for_scrolling_performance, _agents_skills_vercel_react_best_practices_rules_client_swr_dedup_use_swr_for_automatic_deduplication [EXTRACTED 1.00]
- **Caching and indexing repeated lookups** — _agents_skills_vercel_react_best_practices_rules_js_cache_function_results_cache_repeated_function_calls, _agents_skills_vercel_react_best_practices_rules_js_cache_storage_cache_storage_api_calls, _agents_skills_vercel_react_best_practices_rules_js_index_maps_build_index_maps_for_repeated_lookups, _agents_skills_vercel_react_best_practices_rules_js_set_map_lookups_use_set_map_for_o_1_lookups [INFERRED 0.85]
- **Reduce array traversal and intermediate work** — _agents_skills_vercel_react_best_practices_rules_js_combine_iterations_combine_multiple_array_iterations, _agents_skills_vercel_react_best_practices_rules_js_early_exit_early_return_from_functions, _agents_skills_vercel_react_best_practices_rules_js_flatmap_filter_use_flatmap_to_map_and_filter_in_one_pass, _agents_skills_vercel_react_best_practices_rules_js_length_check_first_early_length_check_for_array_comparisons, _agents_skills_vercel_react_best_practices_rules_js_min_max_loop_use_loop_for_min_max_instead_of_sort [INFERRED 0.85]
- **Movement audit detail and lifecycle audit evolution** — specs_001_movement_diff_spec_document, specs_001_movement_diff_plan_document, specs_004_ciclo_vida_activos_spec_document, specs_004_ciclo_vida_activos_plan_versioned_status_audit_plan [INFERRED 0.85]
- **Local Code 128-B printing workflows** — specs_002_impresion_etiquetas_spec_document, specs_002_impresion_etiquetas_plan_document, specs_003_ficha_tecnica_spec_document, specs_003_ficha_tecnica_spec_letter_technical_sheet [EXTRACTED 1.00]
- **Portfolio design and implementation governance** — docs_constitution_document, docs_figma_brief_document, _codex_agents_coordinator_document, specs_004_ciclo_vida_activos_spec_document [INFERRED 0.75]
- **Asset Status Transition and Audit Flow** — specs_004_ciclo_vida_activos_spec_valid_transition_matrix, specs_004_ciclo_vida_activos_spec_versioned_movement_audit, specs_004_ciclo_vida_activos_spec_transition_reason [EXTRACTED 1.00]
- **Local Preferences and Explicit Inventory Clear** — specs_005_ajustes_personalizacion_spec_local_preferences_contract, specs_005_ajustes_personalizacion_spec_preference_reset_vs_inventory_clear, specs_005_ajustes_personalizacion_spec_cross_tab_inventory_invalidation [EXTRACTED 1.00]
- **Bilingual Presentation Across App and Printed Outputs** — specs_006_localizacion_bilingue_spec_bilingual_language_selection, specs_006_localizacion_bilingue_spec_locale_aware_formatting, specs_006_localizacion_bilingue_spec_localized_print_documents, specs_006_localizacion_bilingue_spec_inventory_data_integrity [EXTRACTED 1.00]

## Communities (84 total, 40 thin omitted)

### Community 0 - "Inventory Application Operations"
Cohesion: 0.11
Nodes (42): App(), clearInventory(), mutate(), refresh(), removeCategory(), removeItem(), saveCategory(), saveItem() (+34 more)

### Community 1 - "Project Governance and Principles"
Cohesion: 0.07
Nodes (34): Approval-gated SDD phases, Coordinador SDD — InventarioWeb Portfolio, One atomic implementation task per phase, Bilingual interface and English identifiers, Design brief and verification alignment, Constitución — InventarioWeb Portfolio, Fixed React, TypeScript, and Vite stack, Local IndexedDB data preservation (+26 more)

### Community 2 - "Dashboard and Localization UI"
Cohesion: 0.10
Nodes (31): compactDisplayValueLabel(), compactRegisteredValueLabel(), DashboardPage(), ASSET_STATUS_KEYS, AssetStatusPresentation, convertUsdAmount(), CurrencyRates, DEFAULT_DATE_OPTIONS (+23 more)

### Community 3 - "Local Preferences Management"
Cohesion: 0.09
Nodes (30): getSystemTheme(), useAppPreferences(), updatePreferences(), createDefaultAppPreferences(), DEFAULT_APP_PREFERENCES, DEFAULT_CRC_PER_USD, DEFAULT_EUR_PER_USD, isAppLanguage() (+22 more)

### Community 4 - "Inventory Type Contracts"
Cohesion: 0.07
Nodes (28): CategoryDraft, CreatedInventoryMovement, CreatedMovementV2, DeletedInventoryMovement, DeletedMovementV2, HistoricalInventoryMovement, InventoryMovement, InventoryMovementAuditField (+20 more)

### Community 5 - "React Best Practices Guide"
Cohesion: 0.08
Nodes (26): Compiled Guide Abstract Claim: 40+ Rules, Advanced Patterns, better-all Dependency-Based Parallelization, Bundle Size Optimization, Client-Side Data Fetching, React Best Practices Compiled Guide, Eliminating Waterfalls, JavaScript Performance (+18 more)

### Community 6 - "Settings Personalization Workflow"
Cohesion: 0.10
Nodes (26): Settings and Personalization Technical Plan, Local Currency and Date-Time Formatters, Local Preference Repository Architecture, Transactional Inventory Clear, Cross-Tab Inventory Invalidation After Clear, Currency and Date-Time Presentation Preferences, Settings and Personalization Specification, Local Browser Preferences (+18 more)

### Community 7 - "IndexedDB Inventory Repository"
Cohesion: 0.09
Nodes (24): ALLOWED_ASSET_STATUS_TRANSITIONS, ASSET_LIFECYCLE_STATUSES, AuditableItem, INITIAL_ASSET_LIFECYCLE_STATUSES, InitialAssetLifecycleStatus, invalidationListeners, InventoryInvalidation, InventoryInvalidationListener (+16 more)

### Community 8 - "Main Application Data Types"
Cohesion: 0.08
Nodes (21): ASSET_STATUS_FILTER_OPTIONS, ASSET_STATUS_KEYS, AssetStatusFilter, ClearInventoryResult, DEFAULT_DISPLAY_FORMATTING, DisplayFormatting, EffectiveTheme, IconName (+13 more)

### Community 9 - "Dashboard Tables and Charts"
Cohesion: 0.16
Nodes (22): ActivityChart(), exportCsv(), buildWeeklyActivity(), CategoriesPage(), CategoryDetailPage(), CategoryModal(), dateLabel(), historicalMovementValueLabel() (+14 more)

### Community 10 - "Package Dependencies and Scripts"
Cohesion: 0.09
Nodes (22): dependencies, react, react-dom, devDependencies, @types/react, @types/react-dom, typescript, vite (+14 more)

### Community 11 - "Browser TypeScript Configuration"
Cohesion: 0.09
Nodes (22): DOM, DOM.Iterable, ES2022, src, compilerOptions, allowImportingTsExtensions, jsx, lib (+14 more)

### Community 12 - "Vite Build Configuration"
Cohesion: 0.11
Nodes (17): ES2023, vite.config.ts, compilerOptions, allowImportingTsExtensions, lib, module, moduleDetection, moduleResolution (+9 more)

### Community 13 - "Code128 Barcode Generation"
Cohesion: 0.13
Nodes (17): CODE128_BAR_HEIGHT_MM, CODE128_LABEL_HEIGHT_MM, CODE128_LABEL_WIDTH_MM, CODE128_MODULE_WIDTH_MM, CODE128_PATTERNS, CODE128_QUIET_ZONE_MODULES, CODE128_TECHNICAL_SHEET_MAX_WIDTH_MM, Code128BarSegment (+9 more)

### Community 14 - "SDD Planning Skills"
Cohesion: 0.14
Nodes (17): InventarioWeb Portfolio Agent Guidance, Feature Planning Skill, SDD Requirements Change Skill, SDD Specification Audit Skill, SDD Constitution Skill, SDD Coordinator Invocation Policy, SDD Coordinator Skill, SDD Atomic Implementation Skill (+9 more)

### Community 15 - "Demo Data and Migration"
Cohesion: 0.21
Nodes (11): buildDemoItems(), clearLegacySnapshots(), createSampleSnapshot(), defaultCategories, LegacyInventoryItem, normalizeSnapshot(), readLegacySnapshot(), testArticles (+3 more)

### Community 16 - "Bundler Documentation Patterns"
Cohesion: 0.18
Nodes (11): esbuild API Documentation, Next.js Dynamic Imports Documentation, Next.js Output Documentation, Prefer Statically Analyzable Paths, Rollup Dynamic Import Vars Plugin, Vite Features Documentation, Webpack Dependency Management Guide, Conditional Module Loading (+3 more)

### Community 17 - "Accessible Interface Patterns"
Cohesion: 0.18
Nodes (11): ARIA Tabs Pattern, Accessible Error Handling Pattern, Form Labels Pattern, Live Regions and Notifications Pattern, Modal Focus Trap Pattern, POUR Accessibility Principles, Accessibility Code Patterns, WCAG 2.2 Quick Reference (+3 more)

### Community 18 - "Article Detail and Printing"
Cohesion: 0.22
Nodes (9): code128BlockMessage(), hasNonBlankText(), ItemDetailModal(), openTechnicalSheetPreview(), optionalTextLabel(), prepareTechnicalSheetPreview(), technicalSheetBlockMessage(), technicalSheetCostLabel() (+1 more)

### Community 19 - "Label and Technical Sheet Specs"
Cohesion: 0.22
Nodes (9): Especificación: impresión de etiquetas para artículos, Printable local Code 128-B article label, Tareas — Impresión de etiquetas, Plan técnico — Ficha técnica y acta de resguardo, Reuse the local Code 128-B generator for Letter, Ficha técnica y acta de resguardo, Immutable preview with handwritten signature areas, Letter-size technical sheet and handover record (+1 more)

### Community 20 - "React State Management Patterns"
Cohesion: 0.29
Nodes (8): Narrow Effect Dependencies, Calculate Derived State During Rendering, React You Might Not Need an Effect, Subscribe to Derived State, Use Functional setState Updates, Put Interaction Logic in Event Handlers, React guidance on moving logic to event handlers, Split Combined Hook Computations

### Community 21 - "Audit Diff Comparison"
Cohesion: 0.25
Nodes (8): auditCostsMatch(), auditFieldChange(), auditValuesMatch(), calculateInventoryMovementChanges(), normalizeAuditCost(), normalizeAuditSnapshot(), normalizeAuditText(), normalizeOptionalAuditText()

### Community 22 - "JavaScript Data Structure Optimization"
Cohesion: 0.33
Nodes (7): Cache Repeated Function Calls, Cache Property Access in Loops, Cache Storage API Calls, Build Index Maps for Repeated Lookups, Use Set/Map for O(1) Lookups, Prevent Hydration Mismatch Without Flickering, Suppress Expected Hydration Mismatches

### Community 23 - "React Transition and Deferred Rendering"
Cohesion: 0.33
Nodes (7): Use useTransition Over Manual Loading States, React useTransition documentation, Defer State Reads to Usage Point, Use Transitions for Non-Urgent Updates, Use useDeferredValue for Expensive Derived Renders, React useDeferredValue documentation, Use useRef for Transient Values

### Community 24 - "Asset Status Presentation"
Cohesion: 0.43
Nodes (7): AssetStatusBadge(), costLabel(), movementAuditValueLabel(), movementAuditValueLabelV2(), MovementDetailContent(), movementStatusValueLabel(), presentAssetStatus()

### Community 26 - "Movement Audit Normalization"
Cohesion: 0.33
Nodes (7): isCompleteAuditSnapshot(), isCompleteAuditSnapshotV2(), normalizeAuditChanges(), normalizeAuditChangesV2(), normalizeHistoricalAuditSnapshot(), normalizeMovement(), normalizeSnapshot()

### Community 27 - "SDD Verification Standards"
Cohesion: 0.33
Nodes (6): Build Validation, Chrome DevTools Visual, Interaction, and Accessibility Validation, Completion Criteria, SDD Validation Skill, Requirement-by-Requirement Audit, Strict Closure Rule

### Community 28 - "JavaScript Iteration Patterns"
Cohesion: 0.33
Nodes (6): Combine Multiple Array Iterations, Early Return from Functions, Use flatMap to Map and Filter in One Pass, Early Length Check for Array Comparisons, Use Loop for Min/Max Instead of Sort, Use toSorted() Instead of sort() for Immutability

### Community 29 - "Server Authentication and Caching References"
Cohesion: 0.33
Nodes (6): Next.js authentication guide, Authenticate Server Actions Like API Routes, node-lru-cache project documentation, Cross-Request LRU Caching, Per-Request Deduplication with React.cache(), React cache documentation

### Community 30 - "Server Static I/O Patterns"
Cohesion: 0.40
Nodes (5): Hoist Static I/O to Module Level, Module-level static I/O caching, Vercel Fluid Compute, Avoid Shared Module State for Request Data, Request-scoped server render state

### Community 31 - "React Effect Event Patterns"
Cohesion: 0.50
Nodes (4): Do Not Put Effect Events in Dependency Arrays, React useEffectEvent: Effect Event in Deps, Store Event Handlers in Refs, useEffectEvent for Stable Callback Refs

### Community 32 - "Parallel API Fetching"
Cohesion: 0.50
Nodes (4): Prevent Waterfall Chains in API Routes, better-all Library, Dependency-Based Parallelization, Promise.all() for Independent Operations

### Community 33 - "Script Loading and Deferred Work"
Cohesion: 0.50
Nodes (4): MDN Script element documentation, Use defer or async on Script Tags, Next.js after() API reference, Use after() for Non-Blocking Operations

### Community 34 - "React Component Memoization"
Cohesion: 0.50
Nodes (4): Use Lazy State Initialization, Extract to Memoized Components, Extract Default Non-primitive Parameter Value from Memoized Component to Constant, Do not wrap a simple expression with a primitive result type in useMemo

### Community 35 - "RSC Serialization Optimization"
Cohesion: 0.50
Nodes (4): Avoid Duplicate Serialization in RSC Props, Reference-based RSC serialization deduplication, Minimize Serialization at RSC Boundaries, Minimal Server/Client boundary payload

### Community 36 - "Browser Test Automation"
Cohesion: 0.50
Nodes (4): Web Application Testing, Wait for network idle before inspecting dynamic applications, Native Python Playwright workflow, Reconnaissance-then-action browser workflow

### Community 37 - "Playwright Test Server"
Cohesion: 0.67
Nodes (3): is_server_ready(), main(), Wait for server to be ready by polling the port.

### Community 39 - "HTML Language Accessibility"
Cohesion: 0.67
Nodes (3): WCAG Page Language Criterion 3.1.1, HTML Application Shell, Spanish HTML Page Language

### Community 40 - "Grill Me Skill Guidance"
Cohesion: 0.67
Nodes (3): Grill Me Invocation Policy, Grilling Skill Tool, Grill Me Skill

## Ambiguous Edges - Review These
- `Compiled Guide Abstract Claim: 40+ Rules` → `Skill Summary Claim: 70 Rules`  [AMBIGUOUS]
  .agents/skills/vercel-react-best-practices/SKILL.md · relation: conceptually_related_to

## Knowledge Gaps
- **239 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+234 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **40 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Compiled Guide Abstract Claim: 40+ Rules` and `Skill Summary Claim: 70 Rules`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `SettingsPage()` connect `Settings and Inventory Clear` to `Main Application Data Types`, `Dashboard Tables and Charts`, `Dashboard and Localization UI`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **Why does `App()` connect `Inventory Application Operations` to `Dashboard and Localization UI`, `Local Preferences Management`, `IndexedDB Inventory Repository`, `Main Application Data Types`, `Dashboard Tables and Charts`?**
  _High betweenness centrality (0.007) - this node is a cross-community bridge._
- **Why does `ItemModal()` connect `Inventory Application Operations` to `Main Application Data Types`, `Dashboard Tables and Charts`?**
  _High betweenness centrality (0.005) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _239 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Inventory Application Operations` be split into smaller, more focused modules?**
  _Cohesion score 0.10887949260042283 - nodes in this community are weakly interconnected._
- **Should `Project Governance and Principles` be split into smaller, more focused modules?**
  _Cohesion score 0.0748663101604278 - nodes in this community are weakly interconnected._