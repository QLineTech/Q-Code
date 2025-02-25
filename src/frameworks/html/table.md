# Table Generator Documentation

path: `/src/frameworks/html/table.ts`


This module provides a utility function to generate HTML strings for various types of tables, supporting different styles and features such as sortable columns, checkboxes, modals, and more. It is designed to be flexible and reusable across different UI scenarios.

## Function: `generateTableHTML`

### Description
Generates an HTML string for a table based on the provided configuration. Supports multiple table types with customizable styling and features.

### Signature
```typescript
function generateTableHTML(options: TableOptions): string
```

### Parameters
The function accepts a single parameter, `options`, which is an object of type `TableOptions`.

#### `TableOptions` Interface
```typescript
interface TableOptions {
  type: TableType;
  columns: TableColumn[];
  data: TableRow[];
  hasShadow?: boolean;
  rounded?: boolean;
  overflowX?: boolean;
  footer?: { [key: string]: string | number };
  search?: boolean;
  actions?: { label: string; href?: string; className?: string }[];
  checkboxes?: boolean;
}
```

| Property       | Type                                    | Description                                                                 | Required | Default       |
|----------------|-----------------------------------------|-----------------------------------------------------------------------------|----------|---------------|
| `type`         | `TableType`                            | The type of table to generate (e.g., 'default', 'sortable', 'modal').       | Yes      | N/A           |
| `columns`      | `TableColumn[]`                        | Array of column definitions for the table header.                          | Yes      | N/A           |
| `data`         | `TableRow[]`                           | Array of row data to populate the table body.                              | Yes      | N/A           |
| `hasShadow`    | `boolean`                              | Adds a shadow effect to the table container.                               | No       | `false`       |
| `rounded`      | `boolean`                              | Applies rounded corners to the table container.                            | No       | `false`       |
| `overflowX`    | `boolean`                              | Enables horizontal overflow scrolling for the table.                       | No       | `true`        |
| `footer`       | `{ [key: string]: string \| number }`  | Footer data for tables like 'foot-included'. Key matches column keys.      | No       | `undefined`   |
| `search`       | `boolean`                              | Adds a search bar above the table (for 'users' and 'modal' types).         | No       | `false`       |
| `actions`      | `{ label: string; href?: string; className?: string }[]` | Array of action links/buttons for each row.            | No       | `[]`          |
| `checkboxes`   | `boolean`                              | Adds checkboxes to each row and header.                                    | No       | `false`       |

#### `TableType` Type
```typescript
type TableType = 
  | 'default'
  | 'stripped-row'
  | 'stripped-column'
  | 'sortable'
  | 'foot-included'
  | 'horizontal-overflow'
  | 'checkbox-list'
  | 'users'
  | 'inputs-images'
  | 'modal'
  | 'comparison';
```
- Specifies the table style and behavior (e.g., 'default' for a basic table, 'modal' for a table with an edit modal).

#### `TableColumn` Interface
```typescript
interface TableColumn {
  header: string;
  key: string;
  sortable?: boolean;
  width?: string;
  className?: string;
}
```
| Property    | Type      | Description                                              | Required | Default     |
|-------------|-----------|----------------------------------------------------------|----------|-------------|
| `header`    | `string`  | The column header text.                                  | Yes      | N/A         |
| `key`       | `string`  | The key to map data from `TableRow` to this column.      | Yes      | N/A         |
| `sortable`  | `boolean` | Enables sorting icon for this column (for 'sortable' type). | No      | `false`     |
| `width`     | `string`  | CSS width for the column (e.g., 'w-16').                 | No       | `undefined` |
| `className` | `string`  | Custom CSS classes for the column header/cell.           | No       | `undefined` |

#### `TableRow` Interface
```typescript
interface TableRow {
  [key: string]: string | number | { image?: string; text?: string; email?: string } | boolean;
}
```
- A flexible object where keys match `TableColumn.key`. Values can be:
  - `string` or `number`: Simple text content.
  - `{ image?: string; text?: string; email?: string }`: For 'users' or 'modal' types with image and text/email.
  - `boolean`: For 'comparison' type to show check/cross icons.

### Return Value
- **Type**: `string`
- **Description**: An HTML string representing the fully constructed table.

---

## Usage Examples

### 1. Default Table
```typescript
const defaultTable = generateTableHTML({
  type: 'default',
  columns: [
    { header: 'Product name', key: 'product' },
    { header: 'Color', key: 'color' },
    { header: 'Category', key: 'category' },
    { header: 'Price', key: 'price' },
  ],
  data: [
    { product: 'Apple MacBook Pro 17"', color: 'Silver', category: 'Laptop', price: '$2999' },
    { product: 'Microsoft Surface Pro', color: 'White', category: 'Laptop PC', price: '$1999' },
    { product: 'Magic Mouse 2', color: 'Black', category: 'Accessories', price: '$99' },
  ],
});
```
**Output**: A basic table with no additional features like shadow or actions.

---

### 2. Sortable Table with Actions
```typescript
const sortableTable = generateTableHTML({
  type: 'sortable',
  columns: [
    { header: 'Product name', key: 'product' },
    { header: 'Color', key: 'color', sortable: true },
    { header: 'Category', key: 'category', sortable: true },
    { header: 'Price', key: 'price', sortable: true },
  ],
  data: [
    { product: 'Apple MacBook Pro 17"', color: 'Silver', category: 'Laptop', price: '$2999' },
    { product: 'Microsoft Surface Pro', color: 'White', category: 'Laptop PC', price: '$1999' },
  ],
  actions: [{ label: 'Edit', href: '#', className: 'font-medium text-blue-600 dark:text-blue-500 hover:underline' }],
  hasShadow: true,
  rounded: true,
});
```
**Output**: A table with sortable columns (with sort icons) and an "Edit" action link per row.

---

### 3. Users Table with Checkboxes and Search
```typescript
const usersTable = generateTableHTML({
  type: 'users',
  columns: [
    { header: 'Name', key: 'name' },
    { header: 'Position', key: 'position' },
    { header: 'Status', key: 'status' },
    { header: 'Action', key: 'action' },
  ],
  data: [
    {
      name: { image: '/images/profile-1.jpg', text: 'Neil Sims', email: 'neil.sims@flowbite.com' },
      position: 'React Developer',
      status: 'Online',
    },
    {
      name: { image: '/images/profile-2.jpg', text: 'Bonnie Green', email: 'bonnie@flowbite.com' },
      position: 'Designer',
      status: 'Online',
    },
  ],
  actions: [{ label: 'Edit user', href: '#', className: 'font-medium text-blue-600 dark:text-blue-500 hover:underline' }],
  checkboxes: true,
  search: true,
  hasShadow: true,
  rounded: true,
});
```
**Output**: A table with user images, emails, checkboxes, a search bar, and action buttons.

---

### 4. Comparison Table
```typescript
const comparisonTable = generateTableHTML({
  type: 'comparison',
  columns: [
    { header: 'Tailwind CSS code', key: 'feature' },
    { header: 'Community Edition', key: 'community' },
    { header: 'Developer Edition', key: 'developer' },
    { header: 'Designer Edition', key: 'designer' },
  ],
  data: [
    { feature: 'Basic components', community: true, developer: true, designer: true },
    { feature: 'Application UI', community: false, developer: true, designer: false },
    { feature: 'Marketing UI', community: false, developer: true, designer: false },
  ],
});
```
**Output**: A comparison table with checkmarks for `true` and crosses for `false`.

---

## Expected Types
- **`TableType`**: A string literal union defining the supported table types.
- **`TableColumn`**: An object with required `header` and `key`, optional `sortable`, `width`, and `className`.
- **`TableRow`**: A dynamic object with keys matching `TableColumn.key`, supporting strings, numbers, objects (for images/text), or booleans (for comparison).
- **Return**: A `string` containing valid HTML markup.

---

## Notes
- The function assumes Tailwind CSS classes are available in the environment for styling.
- For types like `'modal'`, additional modal HTML is included but requires external JavaScript/CSS (e.g., Flowbite) to handle modal toggling.
- Customize the output by adjusting the `options` object to fit your specific use case.

