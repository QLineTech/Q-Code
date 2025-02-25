# Timeline Generator Documentation

path: `/src/frameworks/html/timeline.ts`

This module provides functionality to generate HTML strings for various timeline layouts using TypeScript. It supports four distinct timeline types: Detailed, Stepper, Activity Log, and Grouped timelines.

## Main Function

### `generateTimeline`

Generates an HTML string for a specified timeline type.

#### Parameters
- **`type: TimelineType`**
  - **Description**: Specifies the type of timeline to generate.
  - **Type**: `'detailed' | 'stepper' | 'activity' | 'grouped'`
  - **Required**: Yes

- **`items: (DetailedTimelineItem | StepperTimelineItem | ActivityLogItem | GroupedTimelineItem)[]`**
  - **Description**: Array of timeline items specific to the chosen type.
  - **Type**: Array of objects (type varies by timeline type; see below)
  - **Required**: Yes

- **`options: object`**
  - **Description**: Optional styling customizations.
  - **Type**: 
    ```typescript
    {
      borderColor?: string;  // e.g., 'gray-200'
      bgColor?: string;      // e.g., 'white'
      textColor?: string;    // e.g., 'gray-900'
      spacing?: string;      // e.g., 'mb-10'
    }
    ```
  - **Default**: 
    ```typescript
    {
      borderColor: 'gray-200',
      bgColor: 'white',
      textColor: 'gray-900',
      spacing: 'mb-10'
    }
    ```
  - **Required**: No

#### Return Type
- **Type**: `string`
- **Description**: HTML string representing the timeline.

#### Usage Example
```typescript
const detailedItems = [
  {
    date: 'February 2022',
    title: 'Application UI code',
    description: 'Over 20+ pages...',
    link: { url: '#', text: 'Learn more' }
  }
];

const html = generateTimeline('detailed', detailedItems, {
  borderColor: 'blue-200',
  spacing: 'mb-8'
});
console.log(html);
```

---

## Item Types

### `DetailedTimelineItem`
For the 'detailed' timeline type.

#### Properties
- **`date: string`** - Date/time of the event (e.g., 'February 2022')
- **`title: string`** - Main title (e.g., 'Application UI code')
- **`description?: string`** - Optional description text
- **`link?: { url: string; text: string }`** - Optional link with URL and text

### `StepperTimelineItem`
For the 'stepper' timeline type.

#### Properties
- **`date: string`** - Date/time of the event
- **`title: string`** - Main title
- **`description?: string`** - Optional description text

### `ActivityLogItem`
For the 'activity' timeline type.

#### Properties
- **`date: string`** - Date/time of the event (e.g., 'just now')
- **`title: string`** - Main activity description (can include HTML)
- **`description?: string`** - Optional description text
- **`imageUrl: string`** - URL of the profile image
- **`comment?: string`** - Optional comment text

### `GroupedTimelineItem`
For the 'grouped' timeline type.

#### Properties
- **`date: string`** - Group date (e.g., 'January 13th, 2022')
- **`events: Array`** - Array of event objects:
  - **`imageUrl: string`** - URL of the profile image
  - **`description: string`** - Main event description (can include HTML)
  - **`subDescription?: string`** - Optional sub-description
  - **`isPublic?: boolean`** - Optional visibility flag (true for public, false for private)

---

## Helper Functions (Internal)
These are internal functions called by `generateTimeline`. They are not exported but are part of the implementation:

1. **`generateDetailedTimeline`**
   - Params: `(items: DetailedTimelineItem[], borderColor: string, bgColor: string, textColor: string, spacing: string)`
   - Returns: `string`

2. **`generateStepperTimeline`**
   - Params: `(items: StepperTimelineItem[], borderColor: string, bgColor: string, textColor: string, spacing: string)`
   - Returns: `string`

3. **`generateActivityTimeline`**
   - Params: `(items: ActivityLogItem[], borderColor: string, bgColor: string, textColor: string, spacing: string)`
   - Returns: `string`

4. **`generateGroupedTimeline`**
   - Params: `(items: GroupedTimelineItem[], borderColor: string, bgColor: string, textColor: string)`
   - Returns: `string`

---

## Exported Types and Functions
- **`TimelineType`**: Type alias for timeline types
- **`generateTimeline`**: Main function to generate timelines

---

## Notes
- All generated HTML uses Tailwind CSS classes and maintains dark mode support.
- The `items` array must match the expected type for the chosen timeline.
- Optional parameters in `options` fall back to sensible defaults if not provided.
- HTML strings are safe for direct insertion into a webpage (assuming proper sanitization if user input is involved).

