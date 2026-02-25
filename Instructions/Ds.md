# Shadcn Migration Context

## Task
Replace all Moon Design System (@heathmont/*) with shadcn/ui. Dark mode only.

## Setup (already done or do first)
- shadcn init: Style: Default, Base color: Zinc, CSS variables: Yes
- tailwind.config.ts: darkMode: ["class"]
- html element has "dark" class applied

## Component Map
Moon Button         → shadcn Button          (npx shadcn@latest add button)
Moon Input          → shadcn Input           (npx shadcn@latest add input)
Moon Select         → shadcn Select          (npx shadcn@latest add select)
Moon Modal          → shadcn Dialog          (npx shadcn@latest add dialog)
Moon Table          → shadcn Table           (npx shadcn@latest add table)
Moon Card           → shadcn Card            (npx shadcn@latest add card)
Moon Badge          → shadcn Badge           (npx shadcn@latest add badge)
Moon Checkbox       → shadcn Checkbox        (npx shadcn@latest add checkbox)
Moon Avatar         → shadcn Avatar          (npx shadcn@latest add avatar)
Moon Tooltip        → shadcn Tooltip         (npx shadcn@latest add tooltip)
Moon Tabs           → shadcn Tabs            (npx shadcn@latest add tabs)
Moon Progress       → shadcn Progress        (npx shadcn@latest add progress)
Moon Alert          → shadcn Alert           (npx shadcn@latest add alert)
Moon Dropdown       → shadcn DropdownMenu    (npx shadcn@latest add dropdown-menu)
Moon Popover        → shadcn Popover         (npx shadcn@latest add popover)

## Token Map
Moon background     → bg-background
Moon card bg        → bg-card
Moon text primary   → text-foreground
Moon text secondary → text-muted-foreground
Moon primary        → bg-primary / text-primary-foreground
Moon border         → border-border
Moon accent         → bg-accent / text-accent-foreground
Moon destructive    → bg-destructive / text-destructive-foreground
Moon muted          → bg-muted / text-muted-foreground

## Icons
All Moon icons → lucide-react
import { IconName } from "lucide-react"

## Rules
- ONLY change imports, classNames, component names
- NEVER touch logic, handlers, state, or API calls
- Zero @heathmont/* imports must remain after each file
- Confirm dark mode renders correctly after each file

## Order
1. /components/ui/ (primitives first)
2. Layout components
3. Pages one by one
4. App.tsx last (classNames only)

## Done Checklist Per File
[ ] Zero @heathmont imports
[ ] shadcn equivalent used
[ ] Dark mode correct
[ ] Logic unchanged
```

---

Short, scannable, and covers everything the AI needs. Start every prompt with:
```
Read SHADCN_MIGRATION.md, then restyle [filename] only.