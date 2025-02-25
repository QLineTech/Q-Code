
// text.ts

interface BaseOptions {
    text?: string;
    content?: string;
    description?: string;
    linkText?: string;
    linkUrl?: string;
  }
  
  interface HeadingOptions extends BaseOptions {
    highlightText?: string;
    markText?: string;
    gradientText?: string;
    underlineText?: string;
  }
  
  interface ParagraphOptions extends BaseOptions {
    columns?: 1 | 2 | 3;
    leading?: boolean;
    firstLetter?: boolean;
  }
  
  interface BlockquoteOptions extends BaseOptions {
    quoteText?: string;
    withIcon?: boolean;
  }
  
  export class TextGenerator {
    // Heading with Mark
    static headingMark(options: HeadingOptions = {}): string {
      const { text = "Regain control over your days", markText = "control", description = "Here at Flowbite we focus on markets where technology, innovation, and capital can unlock long-term value and drive economic growth." } = options;
      return `
        <h1 class="mb-4 text-4xl font-extrabold leading-none tracking-tight text-gray-900 md:text-5xl lg:text-6xl dark:text-white">${text.replace(markText, `<mark class="px-2 text-white bg-blue-600 rounded-sm dark:bg-blue-500">${markText}</mark>`)}</h1>
        <p class="text-lg font-normal text-gray-500 lg:text-xl dark:text-gray-400">${description}</p>
      `;
    }
  
    // Highlighted Heading
    static highlightedHeading(options: HeadingOptions = {}): string {
      const { text = "Get back to growth with the world's #1 CRM.", highlightText = "the world's #1", description = "Here at Flowbite we focus on markets where technology, innovation, and capital can unlock long-term value and drive economic growth." } = options;
      return `
        <h1 class="mb-4 text-4xl font-extrabold leading-none tracking-tight text-gray-900 md:text-5xl lg:text-6xl dark:text-white">${text.replace(highlightText, `<span class="text-blue-600 dark:text-blue-500">${highlightText}</span>`)}</h1>
        <p class="text-lg font-normal text-gray-500 lg:text-xl dark:text-gray-400">${description}</p>
      `;
    }
  
    // Second Level Heading
    static secondLevelHeading(options: HeadingOptions = {}): string {
      const { text = "Payments tool for companies", description = "Start developing with an open-source library of over 450+ UI components, sections, and pages built with the utility classes from Tailwind CSS and designed in Figma.", content = "Deliver great service experiences fast - without the complexity of traditional ITSM solutions. Accelerate critical development work, eliminate toil, and deploy changes with ease.", linkText = "Read more", linkUrl = "#" } = options;
      return `
        <h2 class="text-4xl font-extrabold dark:text-white">${text}</h2>
        <p class="my-4 text-lg text-gray-500">${description}</p>
        <p class="mb-4 text-lg font-normal text-gray-500 dark:text-gray-400">${content}</p>
        <a href="${linkUrl}" class="inline-flex items-center text-lg text-blue-600 dark:text-blue-500 hover:underline">
          ${linkText}
          <svg class="w-3.5 h-3.5 ms-2 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10">
            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M1 5h12m0 0L9 1m4 4L9 9"/>
          </svg>
        </a>
      `;
    }
  
    // Basic Heading
    static heading(options: HeadingOptions = {}): string {
      const { text = "We invest in the world’s potential", description = "Here at Flowbite we focus on markets where technology, innovation, and capital can unlock long-term value and drive economic growth.", linkText = "Learn more", linkUrl = "#" } = options;
      return `
        <h1 class="mb-4 text-4xl font-extrabold leading-none tracking-tight text-gray-900 md:text-5xl lg:text-6xl dark:text-white">${text}</h1>
        <p class="mb-6 text-lg font-normal text-gray-500 lg:text-xl sm:px-16 xl:px-48 dark:text-gray-400">${description}</p>
        <a href="${linkUrl}" class="inline-flex items-center justify-center px-5 py-3 text-base font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-900">
          ${linkText}
          <svg class="w-3.5 h-3.5 ms-2 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10">
            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M1 5h12m0 0L9 1m4 4L9 9"/>
          </svg>
        </a>
      `;
    }
  
    // Heading with Gradient
    static headingGradient(options: HeadingOptions = {}): string {
      const { text = "Better Data Scalable AI.", gradientText = "Better Data", description = "Here at Flowbite we focus on markets where technology, innovation, and capital can unlock long-term value and drive economic growth." } = options;
      return `
        <h1 class="mb-4 text-3xl font-extrabold text-gray-900 dark:text-white md:text-5xl lg:text-6xl">${text.replace(gradientText, `<span class="text-transparent bg-clip-text bg-gradient-to-r to-emerald-600 from-sky-400">${gradientText}</span>`)}</h1>
        <p class="text-lg font-normal text-gray-500 lg:text-xl dark:text-gray-400">${description}</p>
      `;
    }
  
    // Heading with Underline
    static headingUnderline(options: HeadingOptions = {}): string {
      const { text = "We invest in the world’s potential", underlineText = "world’s potential", description = "Here at Flowbite we focus on markets where technology, innovation, and capital can unlock long-term value and drive economic growth." } = options;
      return `
        <h1 class="mb-4 text-4xl font-extrabold leading-none tracking-tight text-gray-900 md:text-5xl lg:text-6xl dark:text-white">${text.replace(underlineText, `<span class="underline underline-offset-3 decoration-8 decoration-blue-400 dark:decoration-blue-600">${underlineText}</span>`)}</h1>
        <p class="text-lg font-normal text-gray-500 lg:text-xl dark:text-gray-400">${description}</p>
      `;
    }
  
    // Basic Paragraph
    static paragraph(options: ParagraphOptions = {}): string {
      const { text = "Track work across the enterprise through an open, collaborative platform. Link issues across Jira and ingest data from other software development tools, so your IT support and operations teams have richer contextual information to rapidly respond to requests, incidents, and changes.", content = "Deliver great service experiences fast - without the complexity of traditional ITSM solutions.Accelerate critical development work, eliminate toil, and deploy changes with ease, with a complete audit trail for every change." } = options;
      return `
        <p class="mb-3 text-gray-500 dark:text-gray-400">${text}</p>
        <p class="text-gray-500 dark:text-gray-400">${content}</p>
      `;
    }
  
    // Paragraph with Leading Feature
    static paragraphLeading(options: ParagraphOptions = {}): string {
      const { text = "Deliver great service experiences fast - without the complexity of traditional ITSM solutions.Accelerate critical development work and deploy.", content = "Track work across the enterprise through an open, collaborative platform. Link issues across Jira and ingest data from other software development tools, so your IT support and operations teams have richer contextual information to rapidly respond to requests, incidents, and changes." } = options;
      return `
        <p class="mb-3 text-lg text-gray-500 md:text-xl dark:text-gray-400">${text}</p>
        <p class="text-gray-500 dark:text-gray-400">${content}</p>
      `;
    }
  
    // Paragraph with First Letter Feature
    static paragraphFirstLetter(options: ParagraphOptions = {}): string {
      const { text = "Track work across the enterprise through an open, collaborative platform. Link issues across Jira and ingest data from other software development tools, so your IT support and operations teams have richer contextual information to rapidly respond to requests, incidents, and changes.", content = "Deliver great service experiences fast - without the complexity of traditional ITSM solutions.Accelerate critical development work, eliminate toil, and deploy changes with ease, with a complete audit trail for every change." } = options;
      return `
        <p class="mb-3 text-gray-500 dark:text-gray-400 first-line:uppercase first-line:tracking-widest first-letter:text-7xl first-letter:font-bold first-letter:text-gray-900 dark:first-letter:text-gray-100 first-letter:me-3 first-letter:float-start">${text}</p>
        <p class="text-gray-500 dark:text-gray-400">${content}</p>
      `;
    }
  
    // Paragraph with Columns
    static paragraphColumns(options: ParagraphOptions = {}): string {
      const { text = "Track work across the enterprise through an open, collaborative platform. Link issues across Jira and ingest data from other software development tools, so your IT support and operations teams have richer contextual information to rapidly respond to requests, incidents, and changes.", content = "Deliver great service experiences fast - without the complexity of traditional ITSM solutions.Accelerate critical development work, eliminate toil, and deploy changes with ease, with a complete audit trail for every change.", columns = 2 } = options;
      const colClass = columns === 2 ? "sm:grid-cols-2" : columns === 3 ? "sm:grid-cols-3" : "sm:grid-cols-1";
      return `
        <p class="mb-3 text-gray-500 dark:text-gray-400">${text}</p>
        <div class="grid grid-cols-1 gap-6 ${colClass}">
          <p class="mb-3 text-gray-500 dark:text-gray-400">${text}</p>
          <p class="mb-3 text-gray-500 dark:text-gray-400">${content}</p>
          ${columns === 3 ? `<p class="mb-3 text-gray-500 dark:text-gray-400">${content}</p>` : ""}
        </div>
        <p class="mb-3 text-gray-500 dark:text-gray-400">${content}</p>
      `;
    }
  
    // Basic Blockquote
    static blockquote(options: BlockquoteOptions = {}): string {
      const { text = "Does your user know how to exit out of screens? Can they follow your intended user journey and buy something from the site you’ve designed? By running a usability test, you’ll be able to see how users will interact with your design once it’s live.", quoteText = "Flowbite is just awesome. It contains tons of predesigned components and pages starting from login screen to complex dashboard. Perfect choice for your next SaaS application.", content = "First of all you need to understand how Flowbite works. This library is not another framework. Rather, it is a set of components based on Tailwind CSS that you can just copy-paste from the documentation." } = options;
      return `
        <p class="text-gray-500 dark:text-gray-400">${text}</p>
        <blockquote class="p-4 my-4 border-s-4 border-gray-300 bg-gray-50 dark:border-gray-500 dark:bg-gray-800">
          <p class="text-xl italic font-medium leading-relaxed text-gray-900 dark:text-white">"${quoteText}"</p>
        </blockquote>
        <p class="text-gray-500 dark:text-gray-400">${content}</p>
      `;
    }
  
    // Blockquote with Icon
    static blockquoteIcon(options: BlockquoteOptions = {}): string {
      const { quoteText = "Flowbite is just awesome. It contains tons of predesigned components and pages starting from login screen to complex dashboard. Perfect choice for your next SaaS application." } = options;
      return `
        <blockquote class="text-xl italic font-semibold text-gray-900 dark:text-white">
          <svg class="w-8 h-8 text-gray-400 dark:text-gray-600 mb-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 18 14">
            <path d="M6 0H2a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4v1a3 3 0 0 1-3 3H2a1 1 0 0 0 0 2h1a5.006 5.006 0 0 0 5-5V2a2 2 0 0 0-2-2Zm10 0h-4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4v1a3 3 0 0 1-3 3h-1a1 1 0 0 0 0 2h1a5.006 5.006 0 0 0 5-5V2a2 2 0 0 0-2-2Z"/>
          </svg>
          <p>"${quoteText}"</p>
        </blockquote>
      `;
    }
  }
  
//   // Example usage:
//   console.log(TextGenerator.headingMark({ text: "Take control of your future", markText: "control" }));
//   console.log(TextGenerator.paragraphColumns({ columns: 3 }));
//   console.log(TextGenerator.blockquoteIcon({ quoteText: "Amazing tool for developers!" }));