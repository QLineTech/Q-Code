# Toast Generator Documentation
path: `/src/frameworks/html/toast.ts`

## Overview
The `toast.ts` module provides a utility function `generateToast` to create HTML strings for various toast notification types. It supports multiple styles, colors, and positions with customizable content.

---

## Function: `generateToast`

### Description
Generates an HTML string for a toast notification based on the provided options.

### Signature
```typescript
function generateToast(options: ToastOptions): string
```

### Parameters
The function accepts a single parameter, `options`, which is an object of type `ToastOptions`.

#### `ToastOptions` Interface
```typescript
interface ToastOptions {
  id?: string;              // Optional unique identifier for the toast
  type: ToastType;          // Required type of toast
  message: string;          // Required main content of the toast
  position?: Position;      // Optional position on screen
  color?: Color;            // Optional color for icons (defaults to 'blue')
  imageUrl?: string;        // Optional URL for avatar image
  sender?: string;          // Optional sender name for detailed toasts
  timestamp?: string;       // Optional timestamp for notifications
  undoLink?: string;        // Optional URL for undo action
  buttonText?: string;      // Optional text for action button (defaults to 'Reply')
}
```

#### Expected Types
- **`ToastType`**:
  ```typescript
  type ToastType = 'default' | 'success' | 'danger' | 'warning' | 'undo' | 'message' | 'notification' | 'interactive';
  ```
  Defines the style and structure of the toast.

- **`Position`**:
  ```typescript
  type Position = 'top-left' | 'top-right' | 'bottom-right' | 'bottom-left';
  ```
  Specifies where the toast appears on the screen.

- **`Color`**:
  ```typescript
  type Color = 'blue' | 'green' | 'red' | 'orange';
  ```
  Determines the color scheme of the icon.

- All other properties (`id`, `message`, `imageUrl`, `sender`, `timestamp`, `undoLink`, `buttonText`) are standard TypeScript `string` types and are optional except for `message`.

### Return Value
- **Type**: `string`
- **Description**: An HTML string representing the toast notification, ready to be inserted into the DOM.

---

## Usage Examples

### 1. Simple Success Toast
```typescript
const successToast = generateToast({
  type: 'success',
  message: 'Item moved successfully.',
  color: 'green',
  position: 'top-right'
});
console.log(successToast);
// Output: HTML string for a green success toast positioned at top-right
```

### 2. Undo Toast
```typescript
const undoToast = generateToast({
  type: 'undo',
  message: 'Conversation archived.',
  undoLink: '#undo-action',
  position: 'bottom-left'
});
console.log(undoToast);
// Output: HTML string for an undo toast with a link, positioned at bottom-left
```

### 3. Detailed Notification
```typescript
const notification = generateToast({
  type: 'notification',
  message: 'commented on your photo',
  sender: 'Bonnie Green',
  imageUrl: '/images/profile-picture-3.jpg',
  timestamp: 'a few seconds ago',
  position: 'bottom-right'
});
console.log(notification);
// Output: HTML string for a detailed notification with avatar and timestamp
```

### 4. Interactive Toast
```typescript
const interactiveToast = generateToast({
  type: 'interactive',
  message: 'A new software version is available.',
  sender: 'Update available',
  buttonText: 'Update',
  color: 'blue',
  position: 'top-left'
});
console.log(interactiveToast);
// Output: HTML string for an interactive toast with buttons, positioned at top-left
```

---

## Notes
- The `id` is auto-generated if not provided, using a random string.
- The `color` defaults to `'blue'` if not specified for toast types that use icons.
- The `buttonText` defaults to `'Reply'` for toasts with action buttons if not specified.
- Invalid `type` values will throw an error with the message: `Unsupported toast type: ${type}`.
- The generated HTML maintains Tailwind CSS classes for styling, consistent with the original examples.
