
# TextGenerator Documentation
path: `/src/frameworks/html/media.ts`

The `TextGenerator` class provides a set of static methods to generate HTML strings for various text-based UI modules. Each method corresponds to a specific type of heading, paragraph, or blockquote, with customizable parameters while preserving Tailwind CSS styling.

## General Notes
- All methods return a `string` containing the generated HTML.
- Parameters are optional and default to the example content provided in the original HTML snippets.
- Tailwind CSS classes (e.g., `mb-4`, `text-4xl`) are preserved as-is.

---

## Methods

### 1. `headingMark`
Generates a heading with a marked (highlighted) portion.

- **Parameters**: 
  - `options: HeadingOptions` (optional)
    - `text: string` - Main heading text. Default: `"Regain control over your days"`
    - `markText: string` - Text to be marked/highlighted. Default: `"control"`
    - `description: string` - Paragraph text below the heading. Default: `"Here at Flowbite we focus on..."`

- **Usage**:
  ```typescript
  const html = TextGenerator.headingMark({ text: "Take control now", markText: "control" });
  console.log(html);
  ```

- **Expected Output**: HTML string with an `<h1>` containing a `<mark>` element and a `<p>`.

---

### 2. `highlightedHeading`
Generates a heading with a highlighted span.

- **Parameters**: 
  - `options: HeadingOptions` (optional)
    - `text: string` - Main heading text. Default: `"Get back to growth with the world's #1 CRM."`
    - `highlightText: string` - Text to be highlighted. Default: `"the world's #1"`
    - `description: string` - Paragraph text below the heading. Default: `"Here at Flowbite we focus on..."`

- **Usage**:
  ```typescript
  const html = TextGenerator.highlightedHeading({ text: "Boost your skills now", highlightText: "skills" });
  console.log(html);
  ```

- **Expected Output**: HTML string with an `<h1>` containing a `<span>` and a `<p>`.

---

### 3. `secondLevelHeading`
Generates a second-level heading (`<h2>`) with additional content and a link.

- **Parameters**: 
  - `options: HeadingOptions` (optional)
    - `text: string` - Heading text. Default: `"Payments tool for companies"`
    - `description: string` - First paragraph text. Default: `"Start developing with an open-source library..."`
    - `content: string` - Second paragraph text. Default: `"Deliver great service experiences fast..."`
    - `linkText: string` - Link text. Default: `"Read more"`
    - `linkUrl: string` - Link URL. Default: `"#"`

- **Usage**:
  ```typescript
  const html = TextGenerator.secondLevelHeading({ text: "Tools for growth", linkText: "Explore" });
  console.log(html);
  ```

- **Expected Output**: HTML string with an `<h2>`, two `<p>` elements, and an `<a>` link.

---

### 4. `heading`
Generates a basic heading with a button-like link.

- **Parameters**: 
  - `options: HeadingOptions` (optional)
    - `text: string` - Heading text. Default: `"We invest in the world’s potential"`
    - `description: string` - Paragraph text. Default: `"Here at Flowbite we focus on..."`
    - `linkText: string` - Link text. Default: `"Learn more"`
    - `linkUrl: string` - Link URL. Default: `"#"`

- **Usage**:
  ```typescript
  const html = TextGenerator.heading({ text: "Unlock your potential", linkText: "Discover" });
  console.log(html);
  ```

- **Expected Output**: HTML string with an `<h1>`, a `<p>`, and an `<a>` button.

---

### 5. `headingGradient`
Generates a heading with a gradient text portion.

- **Parameters**: 
  - `options: HeadingOptions` (optional)
    - `text: string` - Main heading text. Default: `"Better Data Scalable AI."`
    - `gradientText: string` - Text to apply gradient to. Default: `"Better Data"`
    - `description: string` - Paragraph text. Default: `"Here at Flowbite we focus on..."`

- **Usage**:
  ```typescript
  const html = TextGenerator.headingGradient({ text: "Smart Solutions for All", gradientText: "Smart Solutions" });
  console.log(html);
  ```

- **Expected Output**: HTML string with an `<h1>` containing a gradient `<span>` and a `<p>`.

---

### 6. `headingUnderline`
Generates a heading with an underlined portion.

- **Parameters**: 
  - `options: HeadingOptions` (optional)
    - `text: string` - Main heading text. Default: `"We invest in the world’s potential"`
    - `underlineText: string` - Text to underline. Default: `"world’s potential"`
    - `description: string` - Paragraph text. Default: `"Here at Flowbite we focus on..."`

- **Usage**:
  ```typescript
  const html = TextGenerator.headingUnderline({ text: "Grow your business", underlineText: "business" });
  console.log(html);
  ```

- **Expected Output**: HTML string with an `<h1>` containing an underlined `<span>` and a `<p>`.

---

### 7. `paragraph`
Generates a basic two-paragraph section.

- **Parameters**: 
  - `options: ParagraphOptions` (optional)
    - `text: string` - First paragraph text. Default: `"Track work across the enterprise..."`
    - `content: string` - Second paragraph text. Default: `"Deliver great service experiences fast..."`

- **Usage**:
  ```typescript
  const html = TextGenerator.paragraph({ text: "Collaborate effectively" });
  console.log(html);
  ```

- **Expected Output**: HTML string with two `<p>` elements.

---

### 8. `paragraphLeading`
Generates a paragraph with a leading (larger text) first paragraph.

- **Parameters**: 
  - `options: ParagraphOptions` (optional)
    - `text: string` - First paragraph text (leading). Default: `"Deliver great service experiences fast..."`
    - `content: string` - Second paragraph text. Default: `"Track work across the enterprise..."`

- **Usage**:
  ```typescript
  const html = TextGenerator.paragraphLeading({ text: "Start now" });
  console.log(html);
  ```

- **Expected Output**: HTML string with a leading `<p>` and a regular `<p>`.

---

### 9. `paragraphFirstLetter`
Generates a paragraph with a styled first letter.

- **Parameters**: 
  - `options: ParagraphOptions` (optional)
    - `text: string` - First paragraph text (with first-letter styling). Default: `"Track work across the enterprise..."`
    - `content: string` - Second paragraph text. Default: `"Deliver great service experiences fast..."`

- **Usage**:
  ```typescript
  const html = TextGenerator.paragraphFirstLetter({ text: "Begin your journey" });
  console.log(html);
  ```

- **Expected Output**: HTML string with a `<p>` featuring first-letter styling and a regular `<p>`.

---

### 10. `paragraphColumns`
Generates a paragraph section with a grid of columns (1, 2, or 3).

- **Parameters**: 
  - `options: ParagraphOptions` (optional)
    - `text: string` - First and column paragraph text. Default: `"Track work across the enterprise..."`
    - `content: string` - Column and final paragraph text. Default: `"Deliver great service experiences fast..."`
    - `columns: 1 | 2 | 3` - Number of columns. Default: `2`

- **Usage**:
  ```typescript
  const html = TextGenerator.paragraphColumns({ columns: 3, text: "Teamwork" });
  console.log(html);
  ```

- **Expected Output**: HTML string with a `<p>`, a `<div>` grid with specified columns, and a final `<p>`.

---

### 11. `blockquote`
Generates a paragraph section with a blockquote.

- **Parameters**: 
  - `options: BlockquoteOptions` (optional)
    - `text: string` - Text before blockquote. Default: `"Does your user know how to exit..."`
    - `quoteText: string` - Blockquote text. Default: `"Flowbite is just awesome..."`
    - `content: string` - Text after blockquote. Default: `"First of all you need to understand..."`

- **Usage**:
  ```typescript
  const html = TextGenerator.blockquote({ quoteText: "Great product!" });
  console.log(html);
  ```

- **Expected Output**: HTML string with a `<p>`, a `<blockquote>`, and another `<p>`.

---

### 12. `blockquoteIcon`
Generates a standalone blockquote with an optional icon.

- **Parameters**: 
  - `options: BlockquoteOptions` (optional)
    - `quoteText: string` - Blockquote text. Default: `"Flowbite is just awesome..."`

- **Usage**:
  ```typescript
  const html = TextGenerator.blockquoteIcon({ quoteText: "Incredible tool!" });
  console.log(html);
  ```

- **Expected Output**: HTML string with a `<blockquote>` containing an SVG icon and a `<p>`.

---

## Interfaces
- **`BaseOptions`**:
  - `text?: string`
  - `content?: string`
  - `description?: string`
  - `linkText?: string`
  - `linkUrl?: string`

- **`HeadingOptions`** extends `BaseOptions`:
  - `highlightText?: string`
  - `markText?: string`
  - `gradientText?: string`
  - `underlineText?: string`

- **`ParagraphOptions`** extends `BaseOptions`:
  - `columns?: 1 | 2 | 3`
  - `leading?: boolean`
  - `firstLetter?: boolean`

- **`BlockquoteOptions`** extends `BaseOptions`:
  - `quoteText?: string`
  - `withIcon?: boolean`
