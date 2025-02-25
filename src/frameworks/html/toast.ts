// toast.ts

type ToastType = 
  | 'default' 
  | 'success' 
  | 'danger' 
  | 'warning' 
  | 'undo' 
  | 'message' 
  | 'notification' 
  | 'interactive';

type Position = 
  | 'top-left' 
  | 'top-right' 
  | 'bottom-right' 
  | 'bottom-left';

type Color = 
  | 'blue' 
  | 'green' 
  | 'red' 
  | 'orange';

interface ToastOptions {
  id?: string;
  type: ToastType;
  message: string;
  position?: Position;
  color?: Color;
  imageUrl?: string;
  sender?: string;
  timestamp?: string;
  undoLink?: string;
  buttonText?: string;
}

const iconSvgs: Record<Color, string> = {
  blue: `<svg class="w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 20">
    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.147 15.085a7.159 7.159 0 0 1-6.189 3.307A6.713 6.713 0 0 1 3.1 15.444c-2.679-4.513.287-8.737.888-9.548A4.373 4.373 0 0 0 5 1.608c1.287.953 6.445 3.218 5.537 10.5 1.5-1.122 2.706-3.01 2.853-6.14 1.433 1.049 3.993 5.395 1.757 9.117Z"/>
  </svg>`,
  green: `<svg class="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
    <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z"/>
  </svg>`,
  red: `<svg class="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
    <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 11.793a1 1 0 1 1-1.414 1.414L10 11.414l-2.293 2.293a1 1 0 0 1-1.414-1.414L8.586 10 6.293 7.707a1 1 0 0 1 1.414-1.414L10 8.586l2.293-2.293a1 1 0 0 1 1.414 1.414L11.414 10l2.293 2.293Z"/>
  </svg>`,
  orange: `<svg class="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
    <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM10 15a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm1-4a1 1 0 0 1-2 0V6a1 1 0 0 1 2 0v5Z"/>
  </svg>`
};

const closeButton = (id: string) => `
  <button type="button" class="ms-auto -mx-1.5 -my-1.5 bg-white text-gray-400 hover:text-gray-900 rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 hover:bg-gray-100 inline-flex items-center justify-center h-8 w-8 dark:text-gray-500 dark:hover:text-white dark:bg-gray-800 dark:hover:bg-gray-700" data-dismiss-target="#${id}" aria-label="Close">
    <span class="sr-only">Close</span>
    <svg class="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
      <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
    </svg>
  </button>
`;

const positionClasses: Record<Position, string> = {
  'top-left': 'fixed top-5 left-5',
  'top-right': 'fixed top-5 right-5',
  'bottom-right': 'fixed bottom-5 right-5',
  'bottom-left': 'fixed bottom-5 left-5'
};

export function generateToast(options: ToastOptions): string {
  const {
    id = `toast-${Math.random().toString(36).substr(2, 9)}`,
    type,
    message,
    position,
    color = 'blue',
    imageUrl,
    sender,
    timestamp,
    undoLink,
    buttonText = 'Reply'
  } = options;

  const baseClasses = `w-full max-w-xs p-4 text-gray-500 bg-white rounded-lg shadow-sm dark:text-gray-400 dark:bg-gray-800 ${position ? positionClasses[position] : ''}`;
  const iconClasses = `inline-flex items-center justify-center shrink-0 w-8 h-8 text-${color}-500 bg-${color}-100 rounded-lg dark:bg-${color}-800 dark:text-${color}-200`;

  switch (type) {
    case 'default':
    case 'success':
    case 'danger':
    case 'warning':
      return `
        <div id="${id}" class="flex items-center ${baseClasses}" role="alert">
          <div class="${iconClasses}">
            ${iconSvgs[color]}
            <span class="sr-only">${color} icon</span>
          </div>
          <div class="ms-3 text-sm font-normal">${message}</div>
          ${closeButton(id)}
        </div>
      `;

    case 'undo':
      return `
        <div id="${id}" class="flex items-center ${baseClasses}" role="alert">
          <div class="text-sm font-normal">${message}</div>
          <div class="flex items-center ms-auto space-x-2 rtl:space-x-reverse">
            ${undoLink ? `<a class="text-sm font-medium text-blue-600 p-1.5 hover:bg-blue-100 rounded-lg dark:text-blue-500 dark:hover:bg-gray-700" href="${undoLink}">Undo</a>` : ''}
            ${closeButton(id)}
          </div>
        </div>
      `;

    case 'message':
      return `
        <div id="${id}" class="${baseClasses}" role="alert">
          <div class="flex">
            ${imageUrl ? `<img class="w-8 h-8 rounded-full" src="${imageUrl}" alt="${sender || 'User'} image"/>` : ''}
            <div class="ms-3 text-sm font-normal">
              ${sender ? `<span class="mb-1 text-sm font-semibold text-gray-900 dark:text-white">${sender}</span>` : ''}
              <div class="mb-2 text-sm font-normal">${message}</div>
              <a href="#" class="inline-flex px-2.5 py-1.5 text-xs font-medium text-center text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-blue-800">${buttonText}</a>
            </div>
            ${closeButton(id)}
          </div>
        </div>
      `;

    case 'notification':
      return `
        <div id="${id}" class="${baseClasses}" role="alert">
          <div class="flex items-center mb-3">
            <span class="mb-1 text-sm font-semibold text-gray-900 dark:text-white">New notification</span>
            ${closeButton(id)}
          </div>
          <div class="flex items-center">
            <div class="relative inline-block shrink-0">
              ${imageUrl ? `<img class="w-12 h-12 rounded-full" src="${imageUrl}" alt="${sender || 'User'} image"/>` : ''}
              <span class="absolute bottom-0 right-0 inline-flex items-center justify-center w-6 h-6 bg-blue-600 rounded-full">
                <svg class="w-3 h-3 text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 18" fill="currentColor">
                  <path d="M18 4H16V9C16 10.0609 15.5786 11.0783 14.8284 11.8284C14.0783 12.5786 13.0609 13 12 13H9L6.846 14.615C7.17993 14.8628 7.58418 14.9977 8 15H11.667L15.4 17.8C15.5731 17.9298 15.7836 18 16 18C16.2652 18 16.5196 17.8946 16.7071 17.7071C16.8946 17.5196 17 17.2652 17 17V15H18C18.5304 15 19.0391 14.7893 19.4142 14.4142C19.7893 14.0391 20 13.5304 20 13V6C20 5.46957 19.7893 4.96086 19.4142 4.58579C19.0391 4.21071 18.5304 4 18 4Z" fill="currentColor"/>
                  <path d="M12 0H2C1.46957 0 0.960859 0.210714 0.585786 0.585786C0.210714 0.960859 0 1.46957 0 2V9C0 9.53043 0.210714 10.0391 0.585786 10.4142C0.960859 10.7893 1.46957 11 2 11H3V13C3 13.1857 3.05171 13.3678 3.14935 13.5257C3.24698 13.6837 3.38668 13.8114 3.55279 13.8944C3.71889 13.9775 3.90484 14.0126 4.08981 13.996C4.27477 13.9793 4.45143 13.9114 4.6 13.8L8.333 11H12C12.5304 11 13.0391 10.7893 13.4142 10.4142C13.7893 10.0391 14 9.53043 14 9V2C14 1.46957 13.7893 0.960859 13.4142 0.585786C13.0391 0.210714 12.5304 0 12 0Z" fill="currentColor"/>
                </svg>
                <span class="sr-only">Message icon</span>
              </span>
            </div>
            <div class="ms-3 text-sm font-normal">
              ${sender ? `<div class="text-sm font-semibold text-gray-900 dark:text-white">${sender}</div>` : ''}
              <div class="text-sm font-normal">${message}</div>
              ${timestamp ? `<span class="text-xs font-medium text-blue-600 dark:text-blue-500">${timestamp}</span>` : ''}
            </div>
          </div>
        </div>
      `;

    case 'interactive':
      return `
        <div id="${id}" class="${baseClasses}" role="alert">
          <div class="flex">
            <div class="${iconClasses}">
              <svg class="w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 20">
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 1v5h-5M2 19v-5h5m10-4a8 8 0 0 1-14.947 3.97M1 10a8 8 0 0 1 14.947-3.97"/>
              </svg>
              <span class="sr-only">Refresh icon</span>
            </div>
            <div class="ms-3 text-sm font-normal">
              <span class="mb-1 text-sm font-semibold text-gray-900 dark:text-white">${sender || 'Update available'}</span>
              <div class="mb-2 text-sm font-normal">${message}</div>
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <a href="#" class="inline-flex justify-center w-full px-2 py-1.5 text-xs font-medium text-center text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-blue-800">${buttonText}</a>
                </div>
                <div>
                  <a href="#" class="inline-flex justify-center w-full px-2 py-1.5 text-xs font-medium text-center text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-200 dark:bg-gray-600 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-700 dark:focus:ring-gray-700">Not now</a>
                </div>
              </div>
            </div>
            ${closeButton(id)}
          </div>
        </div>
      `;

    default:
      throw new Error(`Unsupported toast type: ${type}`);
  }
}

// Example usage:
/*
console.log(generateToast({
  type: 'success',
  message: 'Item moved successfully.',
  position: 'top-right',
  color: 'green'
}));

console.log(generateToast({
  type: 'notification',
  message: 'commented on your photo',
  sender: 'Bonnie Green',
  timestamp: 'a few seconds ago',
  imageUrl: '/docs/images/people/profile-picture-3.jpg',
  position: 'bottom-right'
}));
*/