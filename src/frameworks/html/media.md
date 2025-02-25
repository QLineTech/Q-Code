# Media Generator Documentation
path: `/src/frameworks/html/media.ts`

This module provides utilities to generate HTML strings for media elements (videos and images) with customizable options.

## Functions

### 1. `MediaGenerator.video(options: VideoOptions): string`
Generates an HTML string for a video element.

#### Parameters
- **`options: VideoOptions`** - Object containing video configuration
  - `src: string` - **Required**. The URL/path to the video file.
  - `alt?: string` - Optional. Alternative text (not typically used for videos but included for consistency).
  - `className?: string` - Optional. CSS classes for the video element. Default: `"w-full"`.
  - `width?: string | number` - Optional. Width of the video element.
  - `height?: string | number` - Optional. Height of the video element.
  - `autoplay?: boolean` - Optional. If true, video plays automatically. Default: `false`.
  - `muted?: boolean` - Optional. If true, video is muted. Default: `false`.
  - `controls?: boolean` - Optional. If true, shows video controls. Default: `true`.
  - `type?: string` - Optional. MIME type of the video. Default: `"video/mp4"`.

#### Returns
- `string` - HTML string representing the video element.

#### Usage
```typescript
// Basic video
const basicVideo = MediaGenerator.video({
  src: "/docs/videos/flowbite.mp4"
});

// Autoplay muted video
const mutedAutoVideo = MediaGenerator.video({
  src: "/docs/videos/flowbite.mp4",
  autoplay: true,
  muted: true,
  className: "w-full h-auto"
});
```

---

### 2. `MediaGenerator.image(options: ImageOptions): string`
Generates an HTML string for an image element with optional features like captions, effects, and links.

#### Parameters
- **`options: ImageOptions`** - Object containing image configuration
  - `src: string` - **Required**. The URL/path to the image file.
  - `alt?: string` - Optional. Alternative text for accessibility. Default: `"image description"`.
  - `className?: string` - Optional. CSS classes for the image. Default: `"h-auto max-w-full"`.
  - `width?: string | number` - Optional. Width of the image.
  - `height?: string | number` - Optional. Height of the image.
  - `caption?: string` - Optional. Text for image caption (wraps image in `<figure>`).
  - `rounded?: boolean | 'full' | 'lg'` - Optional. Controls border radius:
    - `true`: Adds `rounded-lg`
    - `'full'`: Adds `rounded-full`
    - `'lg'`: Adds `rounded-lg`
  - `grayscale?: boolean` - Optional. If true, applies grayscale filter with hover effect.
  - `blur?: boolean` - Optional. If true, applies blur effect with hover removal.
  - `link?: string` - Optional. If provided, wraps image in an anchor tag and adds card-like styling.

#### Returns
- `string` - HTML string representing the image element (or figure/card depending on options).

#### Usage
```typescript
// Basic image
const basicImage = MediaGenerator.image({
  src: "/docs/images/example.jpg"
});

// Image with caption
const captionedImage = MediaGenerator.image({
  src: "/docs/images/example.jpg",
  caption: "Beautiful scenery",
  rounded: true
});

// Circle image
const circleImage = MediaGenerator.image({
  src: "/docs/images/profile.jpg",
  rounded: "full",
  width: 96,
  height: 96
});

// Image card with link
const imageCard = MediaGenerator.image({
  src: "/docs/images/card.jpg",
  link: "#",
  caption: "Click to learn more"
});

// Grayscale hover effect
const grayscaleImage = MediaGenerator.image({
  src: "/docs/images/art.jpg",
  grayscale: true,
  rounded: "lg"
});
```

---

## Types

### `BaseMediaOptions`
Base interface for common media options:
```typescript
interface BaseMediaOptions {
  src: string;
  alt?: string;
  className?: string;
  width?: string | number;
  height?: string | number;
}
```

### `VideoOptions`
Extends `BaseMediaOptions`:
```typescript
interface VideoOptions extends BaseMediaOptions {
  autoplay?: boolean;
  muted?: boolean;
  controls?: boolean;
  type?: string;
}
```

### `ImageOptions`
Extends `BaseMediaOptions`:
```typescript
interface ImageOptions extends BaseMediaOptions {
  caption?: string;
  rounded?: boolean | 'full' | 'lg';
  grayscale?: boolean;
  blur?: boolean;
  link?: string;
}
```

---

## Notes
- All generated HTML is trimmed of excess whitespace.
- Default classes and behaviors match the examples provided (e.g., `w-full` for videos, `h-auto max-w-full` for images).
- The `rounded` parameter allows flexibility between simple rounding (`true` or `'lg'`) and circular images (`'full'`).
- Effects like `grayscale` and `blur` include hover transitions by default.
- When using `link` with images, a card-like structure is created with a caption positioned at the bottom.
