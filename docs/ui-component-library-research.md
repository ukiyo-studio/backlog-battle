# UI Component Library Research

Researched: May 20, 2026

## Goal

Backlog Battle should feel lighthearted and game-like without becoming visually noisy or hard to use. The product loop is simple: create backlog categories, add items, run head-to-head battles, and review rankings. The UI system should make those flows fast to build across iOS, Android, and web while leaving room for a playful tournament aesthetic.

The technical design currently recommends Expo, React Native, React Native Web, TypeScript, and Expo Router. That means the safest UI choice is a React Native-compatible component system, not a web-only React component library.

## Short Recommendation

Use **React Native Reusables + NativeWind** as the starting UI foundation, then create a small Backlog Battle theme layer inspired by **8bitcn**.

This gives us shadcn-like copy-paste ownership, Expo compatibility, React Native Web support, and enough styling control to create pixel borders, arcade buttons, bracket cards, health bars, XP-style progress, and playful battle screens.

Do not use 8bitcn directly as the core mobile UI library. Use it as visual reference, or potentially for a future web-only marketing/docs surface.

## What Matters For This App

- Works in Expo across iOS, Android, and web.
- Supports form-heavy CRUD flows without custom-building every input, sheet, dialog, and tab.
- Lets us own and customize component source instead of depending on opaque black-box styling.
- Can support a playful 8-bit skin without sacrificing accessibility.
- Has enough primitives for auth, category lists, item editors, battle matchups, result screens, settings, and reminders.
- Does not require a complex native setup before the MVP proves the core loop.

## Library Options

### 1. React Native Reusables

Source: [React Native Reusables GitHub](https://github.com/founded-labs/react-native-reusables)

React Native Reusables describes itself as bringing shadcn/ui to React Native, using NativeWind or Uniwind. Its repository explicitly lists React Native Web, Expo, Radix UI, shadcn, and NativeWind as topics, and it is MIT licensed.

Why it fits:

- Closest match to the desired shadcn-style workflow.
- Designed for React Native instead of browser-only React.
- Copy-paste component ownership matches shadcn's philosophy.
- Works naturally with Expo and NativeWind.
- Good fit for building our own themed `Button`, `Card`, `Input`, `Dialog`, `Sheet`, `Tabs`, `Progress`, and `Toast` components.

Risks:

- Still younger than long-running libraries like React Native Paper.
- We need to verify component behavior on native and web early, especially modal/sheet/select behavior.
- The 8-bit aesthetic will still be our responsibility.

Verdict:

Best default for the MVP if we want shadcn-like ergonomics and visual ownership.

### 2. 8bitcn

Sources: [8bitcn components](https://www.8bitcn.com/docs/components), [8bitcn GitHub](https://github.com/TheOrcDev/8bitcn-ui)

8bitcn is a retro 8-bit component collection built on top of the shadcn ecosystem. Its component list includes standard UI pieces like buttons, cards, inputs, dialogs, selects, sheets, tabs, tooltips, and toasts, plus highly relevant game-like pieces such as health bars, mana bars, XP bars, enemy health displays, inventory items, and retro theme controls.

Why it fits:

- The visual direction is almost exactly aligned with a fun backlog battle product.
- Components like health bars, XP bars, enemy health displays, and item slots map well to battle progress and tournament UI.
- The components are open source and copy-paste oriented.
- Strong inspiration source for a playful design system.

Risks:

- It is primarily a web React/shadcn library, not a React Native library.
- shadcn/ui depends on web-oriented primitives and patterns that do not transfer cleanly to native mobile.
- Using it directly could push us toward DOM-specific screens or Expo DOM/webview workarounds, which would complicate a cross-platform MVP.

Verdict:

Use as art direction and component inspiration. Do not make it the native app foundation.

### 3. NativeCN

Source: [NativeCN docs](https://www.nativecn.xyz/)

NativeCN is a React Native component library inspired by shadcn/ui. It uses a NativeWind-first approach and offers copy-paste customizable components with dark mode and theme presets.

Why it fits:

- React Native-first.
- shadcn-inspired.
- NativeWind-based, which keeps styling close to the React Native Reusables direction.
- Copy-paste model gives us ownership.

Risks:

- Smaller ecosystem footprint than React Native Reusables.
- Need to inspect component depth and maintenance before choosing it as the primary library.

Verdict:

Worth a prototype comparison if React Native Reusables has gaps, but not the first choice.

### 4. gluestack-ui

Sources: [gluestack homepage](https://gluestack.io/), [gluestack components](https://v5.gluestack.io/ui/docs/components/all-components)

gluestack is a more complete React and React Native component library. It supports Expo and React Native, has a broad component set, and uses NativeWind in its current direction.

Why it fits:

- Mature component coverage.
- Expo and React Native support.
- Good coverage for sheets, actionsheets, modals, forms, tabs, toasts, skeletons, sliders, tables, and responsive layouts.
- More batteries included than a smaller shadcn-style kit.

Risks:

- More framework/library surface area to buy into.
- May feel less like "we own the components" than shadcn-style copy-paste kits.
- Retro/pixel styling will require customization.

Verdict:

Good fallback if we prioritize broad production-ready primitives over shadcn-like ownership.

### 5. Tamagui

Sources: [Tamagui introduction](https://tamagui.dev/docs/intro/introduction), [Tamagui Expo guide](https://tamagui.dev/docs/guides/expo)

Tamagui is a universal React/React Native styling and component system with an optimizing compiler and Expo setup path.

Why it fits:

- Strong universal app story.
- Good performance ambitions for native and web.
- Rich theming and responsive design capabilities.

Risks:

- More setup and conceptual overhead than the MVP probably needs.
- The compiler and configuration can become a project decision, not just a component decision.
- Retro styling is possible, but not built in.

Verdict:

Powerful, but likely too heavy for this MVP unless we decide universal web/native polish is the top priority.

### 6. React Native Paper

Source: [React Native Paper](https://callstack.github.io/react-native-paper/)

React Native Paper is a mature Material Design component library for React Native.

Why it fits:

- Stable and widely used.
- Strong baseline coverage.
- Good accessibility and native mobile ergonomics.

Risks:

- Material Design aesthetic works against the desired playful 8-bit direction.
- Heavier visual override work.
- Less aligned with shadcn/copy-paste ownership.

Verdict:

Safe, but not the right personality for Backlog Battle.

### 7. Web shadcn/ui

Source: [shadcn/ui components](https://ui.shadcn.com/docs/components)

shadcn/ui has excellent web components and a copy-paste design philosophy. It is the source of the ecosystem direction we like.

Why it fits:

- Excellent component model for web.
- Large ecosystem and many compatible registries, including 8bitcn.
- Great for web-only admin, landing, docs, or marketing surfaces.

Risks:

- Not a native mobile component library.
- Direct use in Expo native would require DOM/webview compromises.

Verdict:

Use for reference and maybe future web-only surfaces, not for the core Expo native app.

## Recommended UI Architecture

Use a layered approach:

```text
app screens
  -> feature components
    -> Backlog Battle themed UI components
      -> React Native Reusables primitives
      -> NativeWind tokens/utilities
```

Suggested folders:

```text
src/
  components/
    ui/
      button.tsx
      card.tsx
      input.tsx
      dialog.tsx
      sheet.tsx
      tabs.tsx
      progress.tsx
      toast.tsx
      pixel-frame.tsx
      battle-meter.tsx
      matchup-card.tsx
  theme/
    colors.ts
    typography.ts
    spacing.ts
    shadows.ts
```

The `ui/` components should be boring to consume but playful to look at. Feature screens should not hand-code pixel borders or color rules directly.

## Visual Direction

Backlog Battle should borrow the feeling of 8bitcn, not copy every retro convention.

Recommended style:

- Pixel-inspired borders on primary cards and battle controls.
- Bold, readable type with an optional pixel display font only for labels, badges, and battle moments.
- Bright but controlled colors: avoid making the whole app one saturated arcade panel.
- Tournament metaphors: rounds, challengers, winner badges, progress meters, bracket hints.
- Game UI elements used functionally: XP bar for battle progress, health-bar-like comparison states, badges for item status.
- Simple motion: matchup entrance, winner selection, round complete state.

Avoid:

- Tiny pixel fonts for body text.
- Heavy CRT effects, scanlines, or flicker.
- Overusing cards inside cards.
- Making CRUD screens look like a game HUD when they need to be efficient.
- Building the core native app around web-only shadcn or 8bitcn components.

## MVP Component Needs

Core app:

- Button
- Icon button
- Text
- Heading
- Input
- Textarea
- Select
- Checkbox or switch
- Card
- List item
- Dialog
- Sheet
- Tabs
- Toast
- Empty state
- Progress
- Badge
- Skeleton/loading state

Backlog Battle-specific:

- Matchup card
- Challenger item panel
- Battle progress meter
- Round indicator
- Winner banner
- Ranking row
- Category tile
- Status badge
- Reminder frequency control

## Prototype Plan

Before committing the whole app to a UI stack, build a small Expo prototype with:

1. NativeWind installed and configured.
2. React Native Reusables `Button`, `Card`, `Input`, `Dialog` or `Sheet`, `Tabs`, and `Progress`.
3. A Backlog Battle theme layer that adds pixel borders, arcade colors, and readable typography.
4. One battle matchup screen on mobile and web.
5. One category management screen to check boring CRUD ergonomics.

Success criteria:

- Works on iOS, Android, and web without platform-specific rewrites.
- Battle screen feels fun and distinct.
- Category and item forms remain readable and efficient.
- Components are easy to customize from local source.
- No early dependency forces custom native configuration beyond what Expo development builds can handle.

## Decision

Recommended decision for now:

**Choose React Native Reusables + NativeWind as the component foundation, with custom Backlog Battle pixel-themed wrappers inspired by 8bitcn.**

Keep 8bitcn in the design reference set, especially for game-like components such as health bars, XP bars, enemy health displays, item slots, retro cards, and button treatments. If a future web-only surface is built separately from the Expo app, 8bitcn may be a good direct dependency there.

## References

- [React Native Reusables](https://github.com/founded-labs/react-native-reusables)
- [8bitcn components](https://www.8bitcn.com/docs/components)
- [8bitcn GitHub](https://github.com/TheOrcDev/8bitcn-ui)
- [NativeCN](https://www.nativecn.xyz/)
- [gluestack-ui](https://gluestack.io/)
- [Tamagui Expo guide](https://tamagui.dev/docs/guides/expo)
- [shadcn/ui components](https://ui.shadcn.com/docs/components)
- [Expo guide: using third-party libraries](https://docs.expo.dev/workflow/using-libraries/)
