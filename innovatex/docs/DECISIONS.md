# Architectural & Design Decisions

- **Design Aesthetic**: Adopted Linear/Vercel/GitHub minimal dark palette (`#09090b` base, `#27272a` borders) with zero neon glow or sci-fi elements.
- **Backend / Python Integrity**: Hard constraint maintained — strictly 0 modifications to backend and pythonservices APIs, routes, or models.
- **Typography**: Replaced all decorative serif fonts (Newsreader, Fraunces) with standard Inter for UI and JetBrains Mono for telemetry/code.
- **Component Styling**: Standardized CSS class utilities in `index.css` (`btn-primary`, `btn-secondary`, `panel`, `card`, `badge-*`, `chip`) rather than bespoke inline styles.
- **Layout Shell**: App layout standardized around unified `Sidebar` + `ProtectedRoute` + `CommandPalette` (`Cmd+K`).
- **Data Integrity**: Dashboard uses live contest API data alongside real metrics; eliminated fake placeholder labels.
