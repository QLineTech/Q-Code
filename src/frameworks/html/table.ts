// ux_table.ts

export type TableType = 
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

interface TableColumn {
  header: string;
  key: string;
  sortable?: boolean;
  width?: string;
  className?: string;
}

interface TableRow {
  [key: string]: string | number | { image?: string; text?: string; email?: string } | boolean;
}

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

export function generateTableHTML(options: TableOptions): string {
  const {
    type,
    columns,
    data,
    hasShadow = false,
    rounded = false,
    overflowX = true,
    footer,
    search = false,
    actions = [],
    checkboxes = false,
  } = options;

  // Container classes
  let containerClasses = 'relative';
  if (overflowX) {containerClasses += ' overflow-x-auto';}
  if (hasShadow) {containerClasses += ' shadow-md';}
  if (rounded) {containerClasses += ' sm:rounded-lg';}

  // Table classes
  const tableClasses = 'w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400';

  // Header classes
  let theadClasses = 'text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400';
  if (type === 'foot-included') {theadClasses = theadClasses.replace('bg-gray-50', 'bg-gray-100');}

  // Build HTML
  let html = `<div class="${containerClasses.trim()}">`;

  // Add search and action bar for specific types
  if (['users', 'modal'].includes(type)) {
    html += `
      <div class="flex items-center justify-between flex-column flex-wrap md:flex-row space-y-4 md:space-y-0 pb-4 bg-white dark:bg-gray-900">
        <div>
          <button id="dropdownActionButton" data-dropdown-toggle="dropdownAction" class="inline-flex items-center text-gray-500 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 font-medium rounded-lg text-sm px-3 py-1.5 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700" type="button">
            <span class="sr-only">Action button</span>
            Action
            <svg class="w-2.5 h-2.5 ms-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
              <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 4 4 4-4"/>
            </svg>
          </button>
          <div id="dropdownAction" class="z-10 hidden bg-white divide-y divide-gray-100 rounded-lg shadow-sm w-44 dark:bg-gray-700 dark:divide-gray-600">
            <ul class="py-1 text-sm text-gray-700 dark:text-gray-200" aria-labelledby="dropdownActionButton">
              <li><a href="#" class="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">Reward</a></li>
              <li><a href="#" class="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">Promote</a></li>
              <li><a href="#" class="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">Activate account</a></li>
            </ul>
            <div class="py-1">
              <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white">Delete User</a>
            </div>
          </div>
        </div>
        <label for="table-search" class="sr-only">Search</label>
        <div class="relative">
          <div class="absolute inset-y-0 rtl:inset-r-0 start-0 flex items-center ps-3 pointer-events-none">
            <svg class="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
              <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
            </svg>
          </div>
          <input type="text" id="table-search-users" class="block p-2 ps-10 text-sm text-gray-900 border border-gray-300 rounded-lg w-80 bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Search for users">
        </div>
      </div>`;
  }

  // For comparison table
  if (type === 'comparison') {
    html = `<div id="detailed-pricing" class="w-full overflow-x-auto"><div class="overflow-hidden min-w-max">`;
    theadClasses = 'grid grid-cols-4 p-4 text-sm font-medium text-gray-900 bg-gray-100 border-t border-b border-gray-200 gap-x-16 dark:bg-gray-800 dark:border-gray-700 dark:text-white';
  }

  html += `<table class="${tableClasses}">`;

  // Header
  html += `<thead class="${theadClasses}">`;
  html += '<tr>';

  if (checkboxes || ['horizontal-overflow', 'users', 'modal', 'checkbox-list'].includes(type)) {
    html += `
      <th scope="col" class="p-4">
        <div class="flex items-center">
          <input id="checkbox-all-search" type="checkbox" class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded-sm focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600">
          <label for="checkbox-all-search" class="sr-only">checkbox</label>
        </div>
      </th>`;
  }

  columns.forEach((col, index) => {
    let thClasses = col.className || 'px-6 py-3';
    if (type === 'stripped-column' && index % 2 === 0) {
      thClasses += ' bg-gray-50 dark:bg-gray-800';
    }
    if (type === 'foot-included' && index === 0) {thClasses += ' rounded-s-lg';}
    if (type === 'foot-included' && index === columns.length - 1) {thClasses += ' rounded-e-lg';}

    if (type === 'sortable' && col.sortable) {
      html += `
        <th scope="col" class="${thClasses}">
          <div class="flex items-center">
            ${col.header}
            <a href="#"><svg class="w-3 h-3 ms-1.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8.574 11.024h6.852a2.075 2.075 0 0 0 1.847-1.086 1.9 1.9 0 0 0-.11-1.986L13.736 2.9a2.122 2.122 0 0 0-3.472 0L6.837 7.952a1.9 1.9 0 0 0-.11 1.986 2.074 2.074 0 0 0 1.847 1.086Zm6.852 1.952H8.574a2.072 2.072 0 0 0-1.847 1.087 1.9 1.9 0 0 0 .11 1.985l3.426 5.05a2.123 2.123 0 0 0 3.472 0l3.427-5.05a1.9 1.9 0 0 0 .11-1.985 2.074 2.074 0 0 0-1.846-1.087Z"/>
            </svg></a>
          </div>
        </th>`;
    } else if (type === 'inputs-images' && index === 0) {
      html += `<th scope="col" class="${thClasses}"><span class="sr-only">Image</span></th>`;
    } else {
      html += `<th scope="col" class="${thClasses}">${col.header}</th>`;
    }
  });

  if (type === 'sortable' && actions.length > 0) {
    html += `<th scope="col" class="px-6 py-3"><span class="sr-only">Edit</span></th>`;
  }

  html += '</tr></thead>';

  // Body
  html += '<tbody>';
  data.forEach((row, rowIndex) => {
    let trClasses = '';
    if (type === 'stripped-row') {
      trClasses = `odd:bg-white odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800 border-b dark:border-gray-700 border-gray-200`;
    } else if (['horizontal-overflow', 'checkbox-list', 'users', 'modal', 'inputs-images'].includes(type)) {
      trClasses = 'bg-white border-b dark:bg-gray-800 dark:border-gray-700 border-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600';
    } else if (type === 'comparison') {
      trClasses = 'grid grid-cols-4 px-4 py-5 text-sm text-gray-700 border-b border-gray-200 gap-x-16 dark:border-gray-700';
    } else {
      trClasses = 'bg-white border-b dark:bg-gray-800 dark:border-gray-700 border-gray-200';
      if (rowIndex === data.length - 1 && type !== 'foot-included') {
        trClasses = 'bg-white dark:bg-gray-800';
      }
    }

    html += `<tr class="${trClasses}">`;

    if (checkboxes || ['horizontal-overflow', 'users', 'modal', 'checkbox-list'].includes(type)) {
      html += `
        <td class="w-4 p-4">
          <div class="flex items-center">
            <input id="checkbox-table-${rowIndex + 1}" type="checkbox" class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded-sm focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600">
            <label for="checkbox-table-${rowIndex + 1}" class="sr-only">checkbox</label>
          </div>
        </td>`;
    }

    columns.forEach((col, colIndex) => {
      const value = row[col.key];
      let tdClasses = col.className || 'px-6 py-4';
      if (type === 'stripped-column' && colIndex % 2 === 0) {
        tdClasses += ' bg-gray-50 dark:bg-gray-800';
      }

      if (colIndex === 0 && !['comparison', 'inputs-images'].includes(type)) {
        html += `
          <th scope="row" class="${tdClasses} font-medium text-gray-900 whitespace-nowrap dark:text-white">
            ${typeof value === 'object' && 'image' in value ? `
              <div class="flex items-center">
                <img class="w-10 h-10 rounded-full" src="${value.image}" alt="${value.text}">
                <div class="ps-3">
                  <div class="text-base font-semibold">${value.text}</div>
                  ${value.email ? `<div class="font-normal text-gray-500">${value.email}</div>` : ''}
                </div>
              </div>` : value}
          </th>`;
      } else if (type === 'inputs-images' && colIndex === 0) {
        html += `
          <td class="p-4">
            <img src="${value}" class="w-16 md:w-32 max-w-full max-h-full" alt="${row[columns[1].key]}">
          </td>`;
      } else if (type === 'inputs-images' && col.key === 'Qty') {
        html += `
          <td class="${tdClasses}">
            <div class="flex items-center">
              <button class="inline-flex items-center justify-center p-1 me-3 text-sm font-medium h-6 w-6 text-gray-500 bg-white border border-gray-300 rounded-full focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700" type="button">
                <span class="sr-only">Quantity button</span>
                <svg class="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 2">
                  <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M1 1h16"/>
                </svg>
              </button>
              <div>
                <input type="number" id="qty-${rowIndex}" class="bg-gray-50 w-14 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block px-2.5 py-1 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" value="${value}" required />
              </div>
              <button class="inline-flex items-center justify-center h-6 w-6 p-1 ms-3 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-full focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700" type="button">
                <span class="sr-only">Quantity button</span>
                <svg class="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 18">
                  <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 1v16M1 9h16"/>
                </svg>
              </button>
            </div>
          </td>`;
      } else if (type === 'comparison') {
        const checkSvg = `
          <svg class="w-3 h-3 text-green-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 12">
            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M1 5.917 5.724 10.5 15 1.5"/>
          </svg>`;
        const crossSvg = `
          <svg class="w-3 h-3 text-red-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
          </svg>`;
        html += `
          <div class="${colIndex === 0 ? 'text-gray-500 dark:text-gray-400' : ''}">
            ${colIndex === 0 ? col.header : typeof value === 'boolean' ? (value ? checkSvg : crossSvg) : value}
          </div>`;
      } else {
        html += `<td class="${tdClasses}">${value}</td>`;
      }
    });

    if (actions.length > 0 && type !== 'comparison') {
      html += `<td class="${type === 'sortable' ? 'px-6 py-4 text-right' : 'px-6 py-4'}">`;
      actions.forEach(action => {
        html += `<a href="${action.href || '#'}" class="${action.className || 'font-medium text-blue-600 dark:text-blue-500 hover:underline'}">${action.label}</a>`;
      });
      html += '</td>';
    }

    html += '</tr>';
  });
  html += '</tbody>';

  // Footer
  if (footer && ['foot-included'].includes(type)) {
    html += `
      <tfoot>
        <tr class="font-semibold text-gray-900 dark:text-white">
          ${Object.entries(footer).map(([key, value], index) => `
            <${index === 0 ? 'th scope="row"' : 'td'} class="px-6 py-3${index === 0 ? ' text-base' : ''}">${value}</${index === 0 ? 'th' : 'td'}>
          `).join('')}
        </tr>
      </tfoot>`;
  }

  html += '</table>';

  // Add modal for modal type
  if (type === 'modal') {
    html += `
      <div id="editUserModal" tabindex="-1" aria-hidden="true" class="fixed top-0 left-0 right-0 z-50 items-center justify-center hidden w-full p-4 overflow-x-hidden overflow-y-auto md:inset-0 h-[calc(100%-1rem)] max-h-full">
        <div class="relative w-full max-w-2xl max-h-full">
          <form class="relative bg-white rounded-lg shadow-sm dark:bg-gray-700">
            <div class="flex items-start justify-between p-4 border-b rounded-t dark:border-gray-600 border-gray-200">
              <h3 class="text-xl font-semibold text-gray-900 dark:text-white">Edit user</h3>
              <button type="button" class="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white" data-modal-hide="editUserModal">
                <svg class="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                  <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
                </svg>
                <span class="sr-only">Close modal</span>
              </button>
            </div>
            <div class="p-6 space-y-6">
              <div class="grid grid-cols-6 gap-6">
                <div class="col-span-6 sm:col-span-3">
                  <label for="first-name" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">First Name</label>
                  <input type="text" name="first-name" id="first-name" class="shadow-xs bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Bonnie" required="">
                </div>
                <div class="col-span-6 sm:col-span-3">
                  <label for="last-name" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Last Name</label>
                  <input type="text" name="last-name" id="last-name" class="shadow-xs bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Green" required="">
                </div>
                <div class="col-span-6 sm:col-span-3">
                  <label for="email" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Email</label>
                  <input type="email" name="email" id="email" class="shadow-xs bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="example@company.com" required="">
                </div>
                <!-- Additional form fields -->
              </div>
            </div>
            <div class="flex items-center p-6 space-x-3 rtl:space-x-reverse border-t border-gray-200 rounded-b dark:border-gray-600">
              <button type="submit" class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">Save all</button>
            </div>
          </form>
        </div>
      </div>`;
  }

  if (type === 'comparison') {
    html += '</div></div>';
  }

  html += '</div>';

  return html;
}

// // Example usage:
// const defaultTable = generateTableHTML({
//   type: 'default',
//   columns: [
//     { header: 'Product name', key: 'product' },
//     { header: 'Color', key: 'color' },
//     { header: 'Category', key: 'category' },
//     { header: 'Price', key: 'price' },
//   ],
//   data: [
//     { product: 'Apple MacBook Pro 17"', color: 'Silver', category: 'Laptop', price: '$2999' },
//     { product: 'Microsoft Surface Pro', color: 'White', category: 'Laptop PC', price: '$1999' },
//     { product: 'Magic Mouse 2', color: 'Black', category: 'Accessories', price: '$99' },
//   ],
// });
