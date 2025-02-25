// timeline.ts

// Common interfaces for timeline items
interface BaseTimelineItem {
    date: string;
    title: string;
    description?: string;
  }
  
  interface DetailedTimelineItem extends BaseTimelineItem {
    link?: {
      url: string;
      text: string;
    };
  }
  
  interface StepperTimelineItem extends BaseTimelineItem {}
  
  interface ActivityLogItem extends BaseTimelineItem {
    imageUrl: string;
    comment?: string;
  }
  
  interface GroupedTimelineItem {
    date: string;
    events: {
      imageUrl: string;
      description: string;
      subDescription?: string;
      isPublic?: boolean;
    }[];
  }
  
  type TimelineType = 
    | 'detailed'
    | 'stepper'
    | 'activity'
    | 'grouped';
  
  // Main timeline generator function
  function generateTimeline(
    type: TimelineType,
    items: (DetailedTimelineItem | StepperTimelineItem | ActivityLogItem | GroupedTimelineItem)[],
    options: {
      borderColor?: string;
      bgColor?: string;
      textColor?: string;
      spacing?: string;
    } = {}
  ): string {
    const {
      borderColor = 'gray-200',
      bgColor = 'white',
      textColor = 'gray-900',
      spacing = 'mb-10'
    } = options;
  
    switch (type) {
      case 'detailed':
        return generateDetailedTimeline(items as DetailedTimelineItem[], borderColor, bgColor, textColor, spacing);
      case 'stepper':
        return generateStepperTimeline(items as StepperTimelineItem[], borderColor, bgColor, textColor, spacing);
      case 'activity':
        return generateActivityTimeline(items as ActivityLogItem[], borderColor, bgColor, textColor, spacing);
      case 'grouped':
        return generateGroupedTimeline(items as GroupedTimelineItem[], borderColor, bgColor, textColor);
      default:
        return '';
    }
  }
  
  // Detailed Timeline Generator
  function generateDetailedTimeline(
    items: DetailedTimelineItem[],
    borderColor: string,
    bgColor: string,
    textColor: string,
    spacing: string
  ): string {
    return `
      <ol class="relative border-s border-${borderColor} dark:border-${borderColor.replace('200', '700')}">
        ${items.map((item, index) => `
          <li class="${spacing} ms-4${index === items.length - 1 ? ' mb-0' : ''}">
            <div class="absolute w-3 h-3 bg-${borderColor} rounded-full mt-1.5 -start-1.5 border border-white dark:border-gray-900 dark:bg-${borderColor.replace('200', '700')}"></div>
            <time class="mb-1 text-sm font-normal leading-none text-gray-400 dark:text-gray-500">${item.date}</time>
            <h3 class="text-lg font-semibold text-${textColor} dark:text-white">${item.title}</h3>
            ${item.description ? `<p class="mb-4 text-base font-normal text-gray-500 dark:text-gray-400">${item.description}</p>` : ''}
            ${item.link ? `
              <a href="${item.link.url}" class="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-900 bg-${bgColor} border border-${borderColor} rounded-lg hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:outline-none focus:ring-gray-100 focus:text-blue-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700 dark:focus:ring-gray-700">
                ${item.link.text}
                <svg class="w-3 h-3 ms-2 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10">
                  <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M1 5h12m0 0L9 1m4 4L9 9"/>
                </svg>
              </a>
            ` : ''}
          </li>
        `).join('')}
      </ol>
    `;
  }
  
  // Stepper Timeline Generator
  function generateStepperTimeline(
    items: StepperTimelineItem[],
    borderColor: string,
    bgColor: string,
    textColor: string,
    spacing: string
  ): string {
    return `
      <ol class="items-center sm:flex">
        ${items.map(item => `
          <li class="relative ${spacing} sm:mb-0">
            <div class="flex items-center">
              <div class="z-10 flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full ring-0 ring-white dark:bg-blue-900 sm:ring-8 dark:ring-gray-900 shrink-0">
                <svg class="w-2.5 h-2.5 text-blue-800 dark:text-blue-300" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M20 4a2 2 0 0 0-2-2h-2V1a1 1 0 0 0-2 0v1h-3V1a1 1 0 0 0-2 0v1H6V1a1 1 0 0 0-2 0v1H2a2 2 0 0 0-2 2v2h20V4ZM0 18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8H0v10Zm5-8h10a1 1 0 0 1 0 2H5a1 1 0 0 1 0-2Z"/>
                </svg>
              </div>
              <div class="hidden sm:flex w-full bg-${borderColor} h-0.5 dark:bg-${borderColor.replace('200', '700')}"></div>
            </div>
            <div class="mt-3 sm:pe-8">
              <h3 class="text-lg font-semibold text-${textColor} dark:text-white">${item.title}</h3>
              <time class="block mb-2 text-sm font-normal leading-none text-gray-400 dark:text-gray-500">${item.date}</time>
              ${item.description ? `<p class="text-base font-normal text-gray-500 dark:text-gray-400">${item.description}</p>` : ''}
            </div>
          </li>
        `).join('')}
      </ol>
    `;
  }
  
  // Activity Log Generator
  function generateActivityTimeline(
    items: ActivityLogItem[],
    borderColor: string,
    bgColor: string,
    textColor: string,
    spacing: string
  ): string {
    return `
      <ol class="relative border-s border-${borderColor} dark:border-${borderColor.replace('200', '700')}">
        ${items.map((item, index) => `
          <li class="${spacing} ms-6${index === items.length - 1 ? ' mb-0' : ''}">
            <span class="absolute flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full -start-3 ring-8 ring-white dark:ring-gray-900 dark:bg-blue-900">
              <img class="rounded-full shadow-lg" src="${item.imageUrl}" alt="${item.title} image"/>
            </span>
            <div class="${item.comment ? 'p-4' : 'items-center justify-between p-4 sm:flex'} bg-${bgColor} border border-${borderColor} rounded-lg shadow-xs dark:bg-gray-700 dark:border-${borderColor.replace('200', '600')}">
              ${item.comment ? `
                <div class="items-center justify-between mb-3 sm:flex">
                  <time class="mb-1 text-xs font-normal text-gray-400 sm:order-last sm:mb-0">${item.date}</time>
                  <div class="text-sm font-normal text-gray-500 dark:text-gray-300">${item.title}</div>
                </div>
                <div class="p-3 text-xs italic font-normal text-gray-500 border border-${borderColor} rounded-lg bg-gray-50 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-300">${item.comment}</div>
              ` : `
                <time class="mb-1 text-xs font-normal text-gray-400 sm:order-last sm:mb-0">${item.date}</time>
                <div class="text-sm font-normal text-gray-500 dark:text-gray-300">${item.title}</div>
              `}
            </div>
          </li>
        `).join('')}
      </ol>
    `;
  }
  
  // Grouped Timeline Generator
  function generateGroupedTimeline(
    items: GroupedTimelineItem[],
    borderColor: string,
    bgColor: string,
    textColor: string
  ): string {
    return items.map(item => `
      <div class="p-5 mb-4 border border-gray-100 rounded-lg bg-${bgColor} dark:bg-gray-800 dark:border-${borderColor.replace('200', '700')}">
        <time class="text-lg font-semibold text-${textColor} dark:text-white">${item.date}</time>
        <ol class="mt-3 divide-y divide-${borderColor} dark:divide-${borderColor.replace('200', '700')}">
          ${item.events.map(event => `
            <li>
              <a href="#" class="items-center block p-3 sm:flex hover:bg-gray-100 dark:hover:bg-gray-700">
                <img class="w-12 h-12 mb-3 me-3 rounded-full sm:mb-0" src="${event.imageUrl}" alt="Event image"/>
                <div class="text-gray-600 dark:text-gray-400">
                  <div class="text-base font-normal">${event.description}</div>
                  ${event.subDescription ? `<div class="text-sm font-normal">"${event.subDescription}"</div>` : ''}
                  <span class="inline-flex items-center text-xs font-normal text-gray-500 dark:text-gray-400">
                    <svg class="w-2.5 h-2.5 me-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                      ${event.isPublic ? `
                        <path d="M10 .5a9.5 9.5 0 1 0 0 19 9.5 9.5 0 0 0 0-19ZM8.374 17.4a7.6 7.6 0 0 1-5.9-7.4c0-.83.137-1.655.406-2.441l.239.019a3.887 3.887 0 0 1 2.082 2.5 4.1 4.1 0 0 0 2.441 2.8c1.148.522 1.389 2.007.732 4.522Zm3.6-8.829a.997.997 0 0 0-.027-.225 5.456 5.456 0 0 0-2.811-3.662c-.832-.527-1.347-.854-1.486-1.89a7.584 7.584 0 0 1 8.364 2.47c-1.387.208-2.14 2.237-2.14 3.307a1.187 1.187 0 0 1-1.9 0Zm1.626 8.053-.671-2.013a1.9 1.9 0 0 1 1.771-1.757l2.032.619a7.553 7.553 0 0 1-3.132 3.151Z"/>
                      ` : `
                        <path d="m2 13.587 3.055-3.055A4.913 4.913 0 0 1 5 10a5.006 5.006 0 0 1 5-5c.178.008.356.026.532.054l1.744-1.744A8.973 8.973 0 0 0 10 3C4.612 3 0 8.336 0 10a6.49 6.49 0 0 0 2 3.587Z"/>
                        <path d="m12.7 8.714 6.007-6.007a1 1 0 1 0-1.414-1.414L11.286 7.3a2.98 2.98 0 0 0-.588-.21l-.035-.01a2.981 2.981 0 0 0-3.584 3.583c0 .012.008.022.01.033.05.204.12.401.211.59l-6.007 6.007a1 1 0 1 0 1.414 1.414L8.714 12.7c.189.091.386.162.59.211.011 0 .021.007.033.01a2.981 2.981 0 0 0 3.584-3.584c0-.012-.008-.023-.011-.035a3.05 3.05 0 0 0-.21-.588Z"/>
                        <path d="M17.821 6.593 14.964 9.45a4.952 4.952 0 0 1-5.514 5.514L7.665 16.75c.767.165 1.55.25 2.335.251 6.453 0 10-5.258 10-7 0-1.166-1.637-2.874-2.179-3.407Z"/>
                      `}
                    </svg>
                    ${event.isPublic ? 'Public' : 'Private'}
                  </span>
                </div>
              </a>
            </li>
          `).join('')}
        </ol>
      </div>
    `).join('');
  }
  
  // Example usage:
  const detailedItems: DetailedTimelineItem[] = [
    {
      date: 'February 2022',
      title: 'Application UI code in Tailwind CSS',
      description: 'Get access to over 20+ pages including a dashboard layout, charts, kanban board, calendar, and pre-order E-commerce & Marketing pages.',
      link: { url: '#', text: 'Learn more' }
    }
  ];
  
  const stepperItems: StepperTimelineItem[] = [
    {
      date: 'Released on December 2, 2021',
      title: 'Flowbite Library v1.0.0',
      description: 'Get started with dozens of web components and interactive elements.'
    }
  ];
  
  const activityItems: ActivityLogItem[] = [
    {
      date: 'just now',
      title: 'Bonnie moved <a href="#" class="font-semibold text-blue-600 dark:text-blue-500 hover:underline">Jese Leos</a> to <span class="bg-gray-100 text-gray-800 text-xs font-normal me-2 px-2.5 py-0.5 rounded-sm dark:bg-gray-600 dark:text-gray-300">Funny Group</span>',
      imageUrl: '/docs/images/people/profile-picture-3.jpg'
    }
  ];
  
  const groupedItems: GroupedTimelineItem[] = [
    {
      date: 'January 13th, 2022',
      events: [
        {
          imageUrl: '/docs/images/people/profile-picture-1.jpg',
          description: '<span class="font-medium text-gray-900 dark:text-white">Jese Leos</span> likes <span class="font-medium text-gray-900 dark:text-white">Bonnie Green\'s</span> post in <span class="font-medium text-gray-900 dark:text-white"> How to start with Flowbite library</span>',
          subDescription: 'I wanted to share a webinar zeroheight.',
          isPublic: true
        }
      ]
    }
  ];
  
  // Export the function
  export { generateTimeline, TimelineType };