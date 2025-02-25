// media.ts

interface BaseMediaOptions {
    src: string;
    alt?: string;
    className?: string;
    width?: string | number;
    height?: string | number;
  }
  
  interface VideoOptions extends BaseMediaOptions {
    autoplay?: boolean;
    muted?: boolean;
    controls?: boolean;
    type?: string;
  }
  
  interface ImageOptions extends BaseMediaOptions {
    caption?: string;
    rounded?: boolean | 'full' | 'lg';
    grayscale?: boolean;
    blur?: boolean;
    link?: string;
  }
  
  export class MediaGenerator {
    /**
     * Generates HTML string for video elements
     */
    static video(options: VideoOptions): string {
      const {
        src,
        className = 'w-full',
        autoplay = false,
        muted = false,
        controls = true,
        type = 'video/mp4',
        width,
        height
      } = options;
  
      const attributes = [
        className && `class="${className}"`,
        width && `width="${width}"`,
        height && `height="${height}"`,
        controls && 'controls',
        autoplay && 'autoplay',
        muted && 'muted'
      ].filter(Boolean).join(' ');
  
      return `
        <video ${attributes}>
          <source src="${src}" type="${type}">
          Your browser does not support the video tag.
        </video>
      `.trim();
    }
  
    /**
     * Generates HTML string for image elements
     */
    static image(options: ImageOptions): string {
      const {
        src,
        alt = 'image description',
        className = 'h-auto max-w-full',
        caption,
        rounded,
        grayscale,
        blur,
        link,
        width,
        height
      } = options;
  
      // Build class names
      const classes = [className];
      if (rounded === true) classes.push('rounded-lg');
      if (rounded === 'full') classes.push('rounded-full');
      if (rounded === 'lg') classes.push('rounded-lg');
      if (grayscale) classes.push('filter grayscale hover:grayscale-0');
      if (blur) classes.push('blur-xs hover:blur-none');
      if (grayscale || blur) classes.push('transition-all duration-300 cursor-pointer');
  
      const attributes = [
        `class="${classes.join(' ')}"`,
        `src="${src}"`,
        `alt="${alt}"`,
        width && `width="${width}"`,
        height && `height="${height}"`
      ].join(' ');
  
      // Base image element
      const imgElement = `<img ${attributes}>`;
  
      // Handle different image types
      if (caption) {
        return `
          <figure class="max-w-lg">
            ${imgElement}
            <figcaption class="mt-2 text-sm text-center text-gray-500 dark:text-gray-400">${caption}</figcaption>
          </figure>
        `.trim();
      }
  
      if (link) {
        return `
          <figure class="relative max-w-sm transition-all duration-300 cursor-pointer filter grayscale hover:grayscale-0">
            <a href="${link}">
              ${imgElement}
            </a>
            <figcaption class="absolute px-4 text-lg text-white bottom-6">
              <p>${caption || 'Do you want to get notified when a new component is added to Flowbite?'}</p>
            </figcaption>
          </figure>
        `.trim();
      }
  
      return imgElement;
    }
  }
  
  // Usage examples:
  function generateMediaExamples() {
    // Video examples
    const basicVideo = MediaGenerator.video({
      src: '/docs/videos/flowbite.mp4'
    });
  
    const autoPlayVideo = MediaGenerator.video({
      src: '/docs/videos/flowbite.mp4',
      autoplay: true
    });
  
    const mutedVideo = MediaGenerator.video({
      src: '/docs/videos/flowbite.mp4',
      autoplay: true,
      muted: true
    });
  
    const responsiveVideo = MediaGenerator.video({
      src: '/docs/videos/flowbite.mp4',
      className: 'w-full h-auto max-w-full'
    });
  
    // Image examples
    const basicImage = MediaGenerator.image({
      src: '/docs/images/examples/image-1@2x.jpg'
    });
  
    const captionedImage = MediaGenerator.image({
      src: '/docs/images/examples/image-3@2x.jpg',
      caption: 'Image caption',
      rounded: true
    });
  
    const roundedImage = MediaGenerator.image({
      src: '/docs/images/examples/image-1@2x.jpg',
      rounded: 'lg'
    });
  
    const circleImage = MediaGenerator.image({
      src: '/docs/images/examples/image-4@2x.jpg',
      rounded: 'full',
      width: 96,
      height: 96
    });
  
    const imageCard = MediaGenerator.image({
      src: 'https://flowbite.s3.amazonaws.com/blocks/marketing-ui/content/content-gallery-3.png',
      link: '#',
      rounded: true
    });
  
    const grayscaleImage = MediaGenerator.image({
      src: 'https://flowbite.s3.amazonaws.com/blocks/marketing-ui/content/content-gallery-3.png',
      grayscale: true,
      rounded: true
    });
  
    const blurImage = MediaGenerator.image({
      src: 'https://flowbite.s3.amazonaws.com/blocks/marketing-ui/content/content-gallery-3.png',
      blur: true,
      rounded: true
    });
  
    return {
      basicVideo,
      autoPlayVideo,
      mutedVideo,
      responsiveVideo,
      basicImage,
      captionedImage,
      roundedImage,
      circleImage,
      imageCard,
      grayscaleImage,
      blurImage
    };
  }