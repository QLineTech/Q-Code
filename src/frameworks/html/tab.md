# Tabs Generator Documentation
path: `/src/frameworks/html/tab.ts`



This module provides a TypeScript function to generate HTML strings for various tab layouts using Tailwind CSS classes. The function supports multiple tab styles and allows customization through parameters.

## Function: `generateTabs`

Generates an HTML string for a tab component based on the specified type and options.

### Signature
```typescript
function generateTabs(
  items: TabItem[],
  type: 'underline' | 'icons' | 'pills' | 'vertical' | 'full-width' | 'interactive',
  options?: TabOptions
): string
```

### Parameters

1. **`items: TabItem[]`**  
   - **Description**: An array of tab items to render.
   - **Type**: `TabItem[]` (see `TabItem` interface below).
   - **Required**: Yes.
   - **Expected**: Each item represents a single tab with properties like text, active state, and optional icon.

2. **`type: 'underline' | 'icons' | 'pills' | 'vertical' | 'full-width' | 'interactive'`**  
   - **Description**: Specifies the style of the tabs to generate.
   - **Type**: Union of string literals.
   - **Required**: Yes.
   - **Options**:
     - `'underline'`: Tabs with an underline effect for the active tab.
     - `'icons'`: Tabs with optional icons next to text.
     - `'pills'`: Rounded pill-style tabs.
     - `'vertical'`: Vertical layout with a content placeholder.
     - `'full-width'`: Full-width tabs with a mobile dropdown fallback.
     - `'interactive'`: Tabs with interactivity attributes for JavaScript frameworks.

3. **`options?: TabOptions`**  
   - **Description**: Optional configuration for customizing the appearance of the tabs.
   - **Type**: `TabOptions` (see `TabOptions` interface below).
   - **Required**: No (defaults to `{ color: 'gray', size: 'sm', spacing: 2, borderColor: 'gray-200' }`).
   - **Expected**: An object with optional properties to tweak styling.

### Return Value
- **Type**: `string`
- **Description**: An HTML string representing the tab component in the specified style.

---

## Interfaces

### `TabItem`
Defines the structure of a single tab.

```typescript
interface TabItem {
  text: string;           // The label displayed on the tab
  href?: string;          // Optional URL for the tab link (defaults to '#')
  active?: boolean;       // Indicates if the tab is active (highlighted)
  disabled?: boolean;     // Indicates if the tab is disabled (non-clickable)
  icon?: string;          // Optional SVG path or full SVG string for an icon
}
```

- **Expected Types**:
  - `text`: `string` (required)
  - `href`: `string | undefined` (optional)
  - `active`: `boolean | undefined` (optional)
  - `disabled`: `boolean | undefined` (optional)
  - `icon`: `string | undefined` (optional, used in 'icons' and 'vertical' types)

### `TabOptions`
Defines customization options for the tab component.

```typescript
interface TabOptions {
  color?: string;         // Base color for text and borders (e.g., 'gray', 'blue')
  size?: 'sm' | 'md' | 'lg'; // Size of text and padding
  spacing?: number;       // Margin-right between tabs (Tailwind units)
  borderColor?: string;   // Specific border color (e.g., 'gray-200', 'blue-600')
}
```

- **Expected Types**:
  - `color`: `string | undefined` (defaults to `'gray'`)
  - `size`: `'sm' | 'md' | 'lg' | undefined` (defaults to `'sm'`)
  - `spacing`: `number | undefined` (defaults to `2`)
  - `borderColor`: `string | undefined` (defaults to `${color}-200`)

---

## Usage Examples

### 1. Underline Tabs
```typescript
const items: TabItem[] = [
  { text: 'Profile', active: true },
  { text: 'Dashboard' },
  { text: 'Settings' },
  { text: 'Disabled', disabled: true },
];

const html = generateTabs(items, 'underline', { color: 'blue', size: 'md' });
console.log(html);
```

### 2. Tabs with Icons
```typescript
const items: TabItem[] = [
  { text: 'Profile', icon: '<path d="M10 0a10 10 0 1 0 10 10..."/>' },
  { text: 'Dashboard', active: true },
];

const html = generateTabs(items, 'icons', { spacing: 4 });
console.log(html);
```

### 3. Pills Tabs
```typescript
const items: TabItem[] = [
  { text: 'Tab 1', active: true },
  { text: 'Tab 2' },
  { text: 'Tab 3' },
];

const html = generateTabs(items, 'pills');
console.log(html);
```

### 4. Vertical Tabs
```typescript
const items: TabItem[] = [
  { text: 'Profile', active: true, icon: '<path d="M10 0a10 10 0 1 0 10 10..."/>' },
  { text: 'Settings' },
];

const html = generateTabs(items, 'vertical', { size: 'lg', borderColor: 'blue-500' });
console.log(html);
```

### 5. Full-Width Tabs
```typescript
const items: TabItem[] = [
  { text: 'Profile', active: true },
  { text: 'Dashboard' },
];

const html = generateTabs(items, 'full-width');
console.log(html);
```

### 6. Interactive Tabs
```typescript
const items: TabItem[] = [
  { text: 'Profile', active: true },
  { text: 'Dashboard' },
  { text: 'Settings' },
];

const html = generateTabs(items, 'interactive', { color: 'gray', spacing: 3 });
console.log(html);
```

---

## Notes
- The generated HTML uses Tailwind CSS classes for styling, consistent with the provided examples.
- For `'icons'` and `'vertical'` types, the `icon` property should contain valid SVG content (e.g., `<path>` elements or a full `<svg>` string).
- The `'interactive'` type includes ARIA attributes and data attributes for JavaScript-driven tab switching (requires additional client-side scripting to function fully).
- Default values in `options` ensure the function works without customization, but tweaking them allows for varied appearances.
