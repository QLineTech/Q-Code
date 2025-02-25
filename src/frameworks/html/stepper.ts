// /src/frameworks/html/stepper.ts

type StepperType =
  | "vertical-listed"
  | "linear"
  | "detailed-linear"
  | "linear-breadcrumb"
  | "vertical-timeline";

interface Step {
  title: string;
  description?: string;
  isActive?: boolean;
  isCompleted?: boolean;
}

interface StepperOptions {
  steps: Step[];
  type: StepperType;
  maxWidth?: string; // e.g., "max-w-md"
  textColor?: string; // e.g., "text-gray-500"
  activeColor?: string; // e.g., "text-blue-600"
  completedColor?: string; // e.g., "text-green-500"
  spacing?: string; // e.g., "space-y-2"
  darkMode?: boolean;
}

function generateStepper(options: StepperOptions): string {
  const {
    steps,
    type,
    maxWidth = "max-w-md",
    textColor = "text-gray-500",
    activeColor = "text-blue-600",
    completedColor = "text-green-500",
    spacing = "space-y-2",
    darkMode = false,
  } = options;

  const darkTextColor = darkMode ? "dark:" + textColor.replace("text-", "") : "";
  const darkActiveColor = darkMode ? "dark:" + activeColor.replace("text-", "") : "";
  const darkCompletedColor = darkMode ? "dark:" + completedColor.replace("text-", "") : "";

  switch (type) {
    case "vertical-listed":
      return `
<h2 class="mb-2 text-lg font-semibold text-gray-900 ${darkMode ? "dark:text-white" : ""}">${steps[0]?.title || "Steps"}</h2>
<ul class="${maxWidth} ${spacing} ${textColor} list-inside ${darkTextColor}">
  ${steps
    .map(
      (step, index) => `
    <li class="flex items-center">
      ${
        step.isCompleted
          ? `<svg class="w-4 h-4 me-2 ${completedColor} ${darkCompletedColor} shrink-0" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z"/>
            </svg>`
          : `<div role="status">
              <svg aria-hidden="true" class="w-4 h-4 me-2 text-gray-200 animate-spin ${darkMode ? "dark:text-gray-600" : ""} fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/><path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/></svg>
              <span class="sr-only">Loading...</span>
            </div>`
      }
      ${step.description || step.title}
    </li>`
    )
    .join("")}
</ul>`;

    case "linear":
      return `
<ol class="flex items-center w-full text-sm font-medium text-center ${textColor} ${darkTextColor} sm:text-base">
  ${steps
    .map(
      (step, index) => `
    <li class="flex md:w-full items-center ${
      step.isActive ? `${activeColor} ${darkActiveColor}` : ""
    } sm:after:content-[''] after:w-full after:h-1 after:border-b after:border-gray-200 after:border-1 after:hidden sm:after:inline-block after:mx-6 xl:after:mx-10 ${darkMode ? "dark:after:border-gray-700" : ""}">
      <span class="flex items-center after:content-['/'] sm:after:hidden after:mx-2 after:text-gray-200 ${darkMode ? "dark:after:text-gray-500" : ""}">
        ${
          step.isCompleted
            ? `<svg class="w-3.5 h-3.5 sm:w-4 sm:h-4 me-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z"/>
              </svg>`
            : `<span class="me-2">${index + 1}</span>`
        }
        ${step.title} <span class="hidden sm:inline-flex sm:ms-2">${step.description || "Details"}</span>
      </span>
    </li>`
    )
    .join("")}
</ol>`;

    case "detailed-linear":
      return `
<ol class="items-center w-full ${spacing} sm:flex sm:space-x-8 sm:${spacing.replace("space-y", "space-x")} rtl:space-x-reverse">
  ${steps
    .map(
      (step, index) => `
    <li class="flex items-center ${
      step.isActive ? `${activeColor} ${darkActiveColor}` : `${textColor} ${darkTextColor}`
    } space-x-2.5 rtl:space-x-reverse">
      <span class="flex items-center justify-center w-8 h-8 border ${
        step.isActive
          ? `border-${activeColor.split("-")[1]}-600 ${darkMode ? "dark:border-" + activeColor.split("-")[1] + "-500" : ""}`
          : "border-gray-500 dark:border-gray-400"
      } rounded-full shrink-0">
        ${index + 1}
      </span>
      <span>
        <h3 class="font-medium leading-tight">${step.title}</h3>
        <p class="text-sm">${step.description || "Step details here"}</p>
      </span>
    </li>`
    )
    .join("")}
</ol>`;

    case "linear-breadcrumb":
      return `
<ol class="flex items-center w-full p-3 space-x-2 text-sm font-medium text-center ${textColor} bg-white border border-gray-200 rounded-lg shadow-xs ${darkTextColor} sm:text-base ${darkMode ? "dark:bg-gray-800 dark:border-gray-700" : ""} sm:p-4 sm:space-x-4 rtl:space-x-reverse">
  ${steps
    .map(
      (step, index) => `
    <li class="flex items-center ${step.isActive ? `${activeColor} ${darkActiveColor}` : ""}">
      <span class="flex items-center justify-center w-5 h-5 me-2 text-xs border ${
        step.isActive
          ? `border-${activeColor.split("-")[1]}-600 ${darkMode ? "dark:border-" + activeColor.split("-")[1] + "-500" : ""}`
          : "border-gray-500 dark:border-gray-400"
      } rounded-full shrink-0">
        ${index + 1}
      </span>
      ${step.title} <span class="hidden sm:inline-flex sm:ms-2">${step.description || "Info"}</span>
      ${
        index < steps.length - 1
          ? `<svg class="w-3 h-3 ms-2 sm:ms-4 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 12 10">
              <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m7 9 4-4-4-4M1 9l4-4-4-4"/>
            </svg>`
          : ""
      }
    </li>`
    )
    .join("")}
</ol>`;

    case "vertical-timeline":
      return `
<ol class="relative ${textColor} border-s border-gray-200 ${darkTextColor} ${darkMode ? "dark:border-gray-700" : ""}">
  ${steps
    .map(
      (step, index) => `
    <li class="${index < steps.length - 1 ? "mb-10" : ""} ms-6">
      <span class="absolute flex items-center justify-center w-8 h-8 ${
        step.isCompleted
          ? `bg-${completedColor.split("-")[1]}-200 rounded-full -start-4 ring-4 ring-white ${darkMode ? "dark:ring-gray-900 dark:bg-" + completedColor.split("-")[1] + "-900" : ""}`
          : `bg-gray-100 rounded-full -start-4 ring-4 ring-white ${darkMode ? "dark:ring-gray-900 dark:bg-gray-700" : ""}`
      }">
        ${
          step.isCompleted
            ? `<svg class="w-3.5 h-3.5 ${completedColor} ${darkCompletedColor}" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 12">
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M1 5.917 5.724 10.5 15 1.5"/>
              </svg>`
            : `<svg class="w-3.5 h-3.5 ${textColor} ${darkTextColor}" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 16">
                <path d="M18 0H2a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2ZM6.5 3a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3.014 13.021l.157-.625A3.427 3.427 0 0 1 6.5 9.571a3.426 3.426 0 0 1 3.322 2.805l.159.622-6.967.023ZM16 12h-3a1 1 0 0 1 0-2h3a1 1 0 0 1 0 2Zm0-3h-3a1 1 0 1 1 0-2h3a1 1 0 1 1 0 2Zm0-3h-3a1 1 0 1 1 0-2h3a1 1 0 1 1 0 2Z"/>
              </svg>`
        }
      </span>
      <h3 class="font-medium leading-tight">${step.title}</h3>
      <p class="text-sm">${step.description || "Step details here"}</p>
    </li>`
    )
    .join("")}
</ol>`;
    default:
      return "";
  }
}

// Example usage:
const exampleSteps: Step[] = [
  { title: "Step 1", description: "First step details", isCompleted: true },
  { title: "Step 2", description: "Second step details", isActive: true },
  { title: "Step 3", description: "Third step details" },
];

const html = generateStepper({
  steps: exampleSteps,
  type: "vertical-listed",
  maxWidth: "max-w-md",
  textColor: "text-gray-500",
  activeColor: "text-blue-600",
  completedColor: "text-green-500",
  spacing: "space-y-2",
  darkMode: true,
});

console.log(html);

export { generateStepper, StepperOptions, StepperType, Step };