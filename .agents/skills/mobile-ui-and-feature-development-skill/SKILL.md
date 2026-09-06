---
name: ui-and-feature-development-skill
description: Covers the project's UI architecture, component hierarchy, navigation, shared components, styling conventions, hooks, and feature composition. Use this skill when implementing screens, components, or user-facing features.
disable-model-invocation: false
---

Use the [@pishkar-mobile](zed:///agent/skill?name=pishkar-mobile&source=pishkar&path=%2FUsers%2Famir%2FDocuments%2Fpishkar%2F.agents%2Fskills%2Fpishkar-mobile%2FSKILL.md) workflow first. This skill focuses only on building user-facing UI that matches the existing mobile codebase.

# UI Development

## Scope

Use this skill when implementing or changing screens, screen-local components, shared UI components, chat message renderers, navigation UI, user-facing hooks, or UI state composition in `mobile/src/`.

Assume high-level architecture, modules, and API contracts are documented elsewhere. Read only the relevant source files before editing.

## Component Hierarchy

- App shell: `App.tsx` owns providers, status bar, navigation, toast, and safe-area wrapping.
- Screens live under `mobile/src/screens/{ScreenName}/`.
- Screen-local components live in `screens/{ScreenName}/components/`.
- Cross-screen primitives live in `mobile/src/components/`.
- Global UI modals and wrappers live in `mobile/src/common/commonUI/` and `mobile/src/common/providers/`.

Keep feature-specific UI close to the screen unless it is clearly reusable across multiple screens.

## Shared Components

Prefer the design-system primitives from `mobile/src/components`:

```ts
import { Button, View, Text, Image, ScrollView, IconButton } from '../../components';
import MaterialIcon from '../../components/MaterialIcon';
```

Use bare React Native primitives only when a local component needs platform behavior that the shared primitive does not expose, such as `TextInput`, `KeyboardAvoidingView`, or specific touchable behavior.

## Screen Organization

Every full screen should follow the existing folder pattern:

```text
screens/ScreenName/
  ScreenName.tsx
  Header.tsx
  index.js
  components/
```

Keep route-specific header logic in `Header.tsx`. Keep screen composition and event handlers in the screen component. Extract repeated or dense UI blocks into `components/` once they have their own props and behavior.

## Navigation

Use typed React Navigation from `mobile/src/navigation/Routes.ts`.

- Add new routes to `RootStackParamList`.
- Register the screen in the stack object.
- Use `useNavigation<NavigationProp>()` in React components.
- Use `navigateWithRef()` only outside the React tree.

Only pass stable route params. Do not pass functions or large objects through navigation.

## Feature Composition

Build screens from these layers:

1. Read UI state from Zustand selectors.
2. Read server state through existing React Query hooks.
3. Compose screen-local derived state with `useMemo` only when it avoids repeated filtering or expensive work.
4. Dispatch store actions from event handlers.
5. Render with shared primitives and screen-local components.

Avoid putting API calls directly in presentational components. Keep user feedback close to the action that triggers it.

## Styling Conventions

- Read theme from Zustand: `const theme = useStore(state => state.currentTheme)`.
- Read direction from Zustand: `const isRTL = useStore(state => state.isRTL)`.
- Define `StyleSheet.create()` inside the component so styles can close over theme and direction.
- Use theme tokens for colors, spacing, radius, typography, and elevation.
- Keep layouts RTL-aware with conditional `flexDirection`, `textAlign`, and absolute side keys.
- Do not hardcode colors unless the token does not exist and the value is highly local, such as a shadow color.
- Prefer stable dimensions for toolbars, buttons, cards, grids, inputs, and badges so text changes do not shift layout.

## Theme Usage

Use:

- `theme.colors.primary` for primary actions.
- `theme.colors.onPrimary` for text/icons on primary backgrounds.
- `theme.colors.background` for page or white card surfaces.
- `theme.colors.surface` for secondary surfaces.
- `theme.colors.inputColor` for soft tinted input/stat blocks.
- `theme.colors.textPrimary` and `theme.colors.textSecondary` for text hierarchy.
- `theme.colors.border` for neutral borders.

Do not use `useTheme()` for app styling; the store theme is the local convention.

## Hooks

Use existing hooks before creating new ones. Put reusable hooks in `mobile/src/hooks/`.

UI hooks should:

- Return plain values and event handlers.
- Avoid direct rendering.
- Avoid owning navigation unless navigation is the purpose of the hook.
- Clean up timers, subscriptions, and listeners.

## State Usage Within UI

Use Zustand selectors instead of reading the whole store:

```ts
const messages = useStore(state => state.messages);
const updateMessage = useStore(state => state.updateMessage);
```

Keep ephemeral UI state local with `useState`, such as input text, expanded rows, modal visibility, and selected tabs. Persist only state that must survive app restarts.

## Rendering Patterns

- Chat messages are rendered by `screens/chat/components/renderChatMessage.tsx`.
- Interactive chat message types store their payload in `types/Chat.ts`.
- The action router in `src/actions/handlers.ts` converts server `ToolResponse` objects into persisted assistant messages.
- `Chat.tsx` wires callbacks from `ChatMessage` into `handleSend()` when tapping a UI control should continue the conversation.

When adding a chat message type:

1. Add the `MessageType` union value in `types/Chat.ts`.
2. Add a typed payload interface and optional payload field to `Message`.
3. Add a `handelActions()` branch that validates the payload and stores the assistant message.
4. Add a render case in `renderBubbleContent()`.
5. Wire callbacks from `Chat.tsx` when the UI has actionable controls.
6. Add a sample in `messageTypeTest.ts` when local visual inspection is useful.

For `CARD_VIEW`, use `cardViewPayload` with `type: 'DOCTOR_PROFILE'` for doctor appointment cards. The card renderer should avoid an empty text bubble when `message.text` is empty, and should use accessible touch targets for booking actions.

## Reusable UI Abstractions

Create a shared abstraction only when at least two screens need it or when it matches an existing design-system primitive. Otherwise keep it screen-local.

Good candidates:

- Repeated list rows with the same icon, label, value, and action pattern.
- Repeated modal shells.
- Repeated chat message widgets.
- Repeated settings section layouts.

Avoid generic wrappers that hide simple React Native layout.

## Accessibility

- Add `accessibilityRole` and `accessibilityLabel` to icon-only buttons and custom touch targets.
- Keep touch targets at least 44x44.
- Preserve readable text contrast using theme tokens.
- Use `numberOfLines` and `ellipsizeMode` for compact cards and rows.
- Do not rely on color alone for status; pair status with icon or text.
- Keep OTP and numeric inputs clear for screen readers.

## Performance

- Avoid expensive filtering or mapping in hot render paths; memoize derived lists when needed.
- Keep chat message components stable and scoped.
- Avoid inline heavy objects in large lists when they cause repeated work.
- Use bounded text and image dimensions in cards.
- Do not fetch remote data from render functions.
- Keep temporary chat placeholders removable once the real assistant response arrives.

## Best Practices

- Match existing Persian copy style and RTL-first behavior.
- Prefer the smallest change that fits the current screen architecture.
- Keep API concerns out of visual components.
- Do not introduce a new global state slice for local UI state.
- Verify TypeScript for changed files.
- Run formatting before finishing.
- Mention any repo-level verification failures that are unrelated to the change.
