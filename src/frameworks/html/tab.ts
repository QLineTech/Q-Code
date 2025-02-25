// tabs.ts

interface TabItem {
    text: string;
    href?: string;
    active?: boolean;
    disabled?: boolean;
    icon?: string; // SVG string or path reference
  }
  
  interface TabOptions {
    color?: string; // e.g., 'blue', 'gray', etc.
    size?: 'sm' | 'md' | 'lg';
    spacing?: number; // margin-right in pixels
    borderColor?: string; // e.g., 'gray-200', 'blue-600'
  }
  
  const sizeClasses = {
    sm: 'text-sm p-4',
    md: 'text-md p-6',
    lg: 'text-lg p-8',
  };
  
  export function generateTabs(
    items: TabItem[],
    type: 'underline' | 'icons' | 'pills' | 'vertical' | 'full-width' | 'interactive',
    options: TabOptions = {}
  ): string {
    const {
      color = 'gray',
      size = 'sm',
      spacing = 2,
      borderColor = `${color}-200`,
    } = options;
  
    const baseTextClass = `font-medium text-${color}-500 dark:text-${color}-400`;
    const sizeClass = sizeClasses[size];
    const spacingClass = `me-${spacing}`;
  
    switch (type) {
      case 'underline':
        return `
  <div class="${sizeClass} text-center border-b border-${borderColor} dark:border-${color}-700">
      <ul class="flex flex-wrap -mb-px">
          ${items
            .map(
              (item, index) => `
          <li class="${spacingClass}">
              <a href="${item.href || '#'}" class="inline-block p-4 border-b-2 ${
                item.active
                  ? `text-blue-600 border-blue-600 dark:text-blue-500 dark:border-blue-500`
                  : item.disabled
                  ? 'text-gray-400 cursor-not-allowed dark:text-gray-500'
                  : 'border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'
              } rounded-t-lg${item.active ? ' active' : ''}${
                item.disabled ? '' : ' group'
              }" ${item.active ? 'aria-current="page"' : ''}>
                  ${item.text}
              </a>
          </li>`
            )
            .join('')}
      </ul>
  </div>`;
  
      case 'icons':
        return `
  <div class="border-b border-${borderColor} dark:border-${color}-700">
      <ul class="flex flex-wrap -mb-px ${sizeClass} text-center ${baseTextClass}">
          ${items
            .map(
              (item, index) => `
          <li class="${spacingClass}">
              <a href="${item.href || '#'}" class="inline-flex items-center justify-center p-4 border-b-2 ${
                item.active
                  ? `text-blue-600 border-blue-600 dark:text-blue-500 dark:border-blue-500`
                  : item.disabled
                  ? 'text-gray-400 cursor-not-allowed dark:text-gray-500'
                  : 'border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'
              } rounded-t-lg${item.active ? ' active' : ''}${
                item.disabled ? '' : ' group'
              }" ${item.active ? 'aria-current="page"' : ''}>
                  ${
                    item.icon
                      ? `<svg class="w-4 h-4 me-2 ${
                          item.active
                            ? 'text-blue-600 dark:text-blue-500'
                            : 'text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-300'
                        }" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor">${item.icon}</svg>`
                      : ''
                  }${item.text}
              </a>
          </li>`
            )
            .join('')}
      </ul>
  </div>`;
  
      case 'pills':
        return `
  <ul class="flex flex-wrap ${sizeClass} text-center ${baseTextClass}">
      ${items
        .map(
          (item, index) => `
      <li class="${spacingClass}">
          <a href="${item.href || '#'}" class="inline-block px-4 py-3 ${
            item.active
              ? 'text-white bg-blue-600'
              : item.disabled
              ? 'text-gray-400 cursor-not-allowed dark:text-gray-500'
              : 'hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-white'
          } rounded-lg${item.active ? ' active' : ''}" ${
            item.active ? 'aria-current="page"' : ''
          }>
              ${item.text}
          </a>
      </li>`
        )
        .join('')}
  </ul>`;
  
      case 'vertical':
        return `
  <div class="md:flex">
      <ul class="flex-column space-y-${spacing} ${sizeClass} ${baseTextClass} md:me-4 mb-4 md:mb-0">
          ${items
            .map(
              (item, index) => `
          <li>
              <a href="${item.href || '#'}" class="inline-flex items-center px-4 py-3 ${
                item.active
                  ? 'text-white bg-blue-700 dark:bg-blue-600'
                  : item.disabled
                  ? 'text-gray-400 cursor-not-allowed bg-gray-50 dark:bg-gray-800 dark:text-gray-500'
                  : 'hover:text-gray-900 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 dark:hover:text-white'
              } rounded-lg w-full${item.active ? ' active' : ''}" ${
                item.active ? 'aria-current="page"' : ''
              }>
                  ${
                    item.icon
                      ? `<svg class="w-4 h-4 me-2 ${
                          item.active
                            ? 'text-white'
                            : 'text-gray-500 dark:text-gray-400'
                        }" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor">${item.icon}</svg>`
                      : ''
                  }${item.text}
              </a>
          </li>`
            )
            .join('')}
      </ul>
      <div class="p-6 bg-gray-50 text-medium text-gray-500 dark:text-gray-400 dark:bg-gray-800 rounded-lg w-full">
          <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">${
            items.find((item) => item.active)?.text || items[0].text
          } Tab</h3>
          <p class="mb-2">This is some placeholder content for the ${
            items.find((item) => item.active)?.text || items[0].text
          } tab's associated content.</p>
          <p>The tab JavaScript swaps classes to control the content visibility and styling.</p>
      </div>
  </div>`;
  
      case 'full-width':
        return `
  <div class="sm:hidden">
      <label for="tabs" class="sr-only">Select your tab</label>
      <select id="tabs" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">
          ${items.map((item) => `<option>${item.text}</option>`).join('')}
      </select>
  </div>
  <ul class="hidden ${sizeClass} text-center ${baseTextClass} rounded-lg shadow-sm sm:flex dark:divide-${color}-700">
      ${items
        .map(
          (item, index) => `
      <li class="w-full focus-within:z-10">
          <a href="${item.href || '#'}" class="inline-block w-full p-4 ${
            item.active
              ? `text-gray-900 bg-gray-100 dark:bg-${color}-700 dark:text-white`
              : 'bg-white hover:text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:hover:text-white dark:hover:bg-gray-700'
          } ${
            index === 0
              ? 'rounded-s-lg'
              : index === items.length - 1
              ? 'rounded-e-lg border-s-0'
              : 'border-r'
          } border-${borderColor} focus:ring-4 focus:ring-blue-300 focus:outline-none" ${
            item.active ? 'aria-current="page"' : ''
          }>
              ${item.text}
          </a>
      </li>`
        )
        .join('')}
  </ul>`;
  
      case 'interactive':
        return `
  <div class="mb-4 border-b border-${borderColor} dark:border-${color}-700">
      <ul class="flex flex-wrap -mb-px ${sizeClass} text-center" id="default-tab" data-tabs-toggle="#default-tab-content" role="tablist">
          ${items
            .map(
              (item, index) => `
          <li class="${spacingClass}" role="presentation">
              <button class="inline-block p-4 border-b-2 rounded-t-lg ${
                item.active
                  ? 'border-blue-600 text-blue-600 dark:text-blue-500 dark:border-blue-500'
                  : 'hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'
              }" id="${item.text.toLowerCase()}-tab" data-tabs-target="#${item.text.toLowerCase()}" type="button" role="tab" aria-controls="${item.text.toLowerCase()}" aria-selected="${
                item.active ? 'true' : 'false'
              }">
                  ${item.text}
              </button>
          </li>`
            )
            .join('')}
      </ul>
  </div>
  <div id="default-tab-content">
      ${items
        .map(
          (item) => `
      <div class="${
        item.active ? '' : 'hidden'
      } p-4 rounded-lg bg-gray-50 dark:bg-gray-800" id="${item.text.toLowerCase()}" role="tabpanel" aria-labelledby="${item.text.toLowerCase()}-tab">
          <p class="text-sm text-gray-500 dark:text-gray-400">This is some placeholder content the <strong class="font-medium text-gray-800 dark:text-white">${item.text} tab's associated content</strong>. Clicking another tab will toggle the visibility of this one for the next.</p>
      </div>`
        )
        .join('')}
  </div>`;
  
      default:
        return '';
    }
  }
  
  // Example usage:
  const tabItems: TabItem[] = [
    { text: 'Profile', active: true, icon: '<path d="M10 0a10 10 0 1 0 10 10A10.011 10.011 0 0 0 10 0Zm0 5a3 3 0 1 1 0 6 3 3 0 0 1 0-6Zm0 13a8.949 8.949 0 0 1-4.951-1.488A3.987 3.987 0 0 1 9 13h2a3.987 3.987 0 0 1 3.951 3.512A8.949 8.949 0 0 1 10 18Z"/>' },
    { text: 'Dashboard', href: '#dashboard' },
    { text: 'Settings' },
    { text: 'Contacts' },
    { text: 'Disabled', disabled: true },
  ];
  
  const options: TabOptions = {
    color: 'gray',
    size: 'sm',
    spacing: 2,
    borderColor: 'gray-200',
  };
  
  // console.log(generateTabs(tabItems, 'underline', options));
  // console.log(generateTabs(tabItems, 'icons', options));
  // console.log(generateTabs(tabItems, 'pills', options));
  // console.log(generateTabs(tabItems, 'vertical', options));
  // console.log(generateTabs(tabItems, 'full-width', options));
  // console.log(generateTabs(tabItems, 'interactive', options));