export interface DigitalArtStyle {
  name: string;
  slug: string;
  description: string;
  tip: string;
  /** Actual filename in /public/images/digital-art-styles/ (without .png) */
  imageFile: string;
}

export const DIGITAL_ART_STYLES: DigitalArtStyle[] = [
  {
    name: "Anime Style",
    slug: "anime",
    description: "Inspired by Japanese animation — big expressive eyes, clean lines, vibrant tones.",
    tip: "Works great for avatars and profile pics.",
    imageFile: "anime",
  },
  {
    name: "Studio Ghibli Style",
    slug: "studio-ghibli",
    description: "Soft lighting, dreamy backgrounds, warm nostalgic vibe.",
    tip: "Very viral on social media lately.",
    imageFile: "studio-ghibli",
  },
  {
    name: "Cartoon / Pixar Style",
    slug: "cartoon-pixar",
    description: "3D-like, smooth, colorful, friendly faces.",
    tip: "Gives people a polished \"movie character\" look.",
    imageFile: "cartoon-pixar",
  },
  {
    name: "Realistic Digital Painting",
    slug: "photo-realistic",
    description: "High-detail, painterly, almost like a professional portrait.",
    tip: "Great for premium feel / paid conversions.",
    imageFile: "phot-realistic",
  },
  {
    name: "Pencil Sketch / Line Art",
    slug: "pencil-sketch",
    description: "Minimal, monochrome, hand-drawn aesthetic.",
    tip: "Simple, elegant, and widely appealing.",
    imageFile: "pencil-sketch",
  },
  {
    name: "Watercolor Painting",
    slug: "water-color",
    description: "Soft edges, pastel tones, artistic bleed effects.",
    tip: "Feels personal and gift-worthy.",
    imageFile: "water-color",
  },
  {
    name: "Pixel Art",
    slug: "pixel-art",
    description: "Retro, 8-bit style visuals.",
    tip: "Huge appeal for gamers and nostalgic audiences.",
    imageFile: "pixel-art",
  },
  {
    name: "Comic Book",
    slug: "comic-book",
    description: "Bold lines, dramatic shadows, halftone textures.",
    tip: "Makes users feel like superheroes.",
    imageFile: "comic-book",
  },
  {
    name: "Fantasy & Surreal Art",
    slug: "fantasy-surreal",
    description: "Glowing elements, magical realism, cinematic backgrounds.",
    tip: "Highly shareable, \"wow factor\" content.",
    imageFile: "fantasy",
  },
  {
    name: "Oil / Acrylic Painting",
    slug: "oil-acrylic",
    description: "Classic fine-art look with rich textures and brush strokes.",
    tip: "Feels timeless and premium.",
    imageFile: "oil-acrylic",
  },
  {
    name: "Novel Illustration",
    slug: "novel",
    description: "Detailed, narrative-driven illustrations perfect for storytelling.",
    tip: "Ideal for book covers and character art.",
    imageFile: "novel",
  },
  {
    name: "Book Illustration",
    slug: "book-illustration",
    description: "Charming, storybook-style artwork with warm, inviting tones.",
    tip: "Perfect for children's books and editorial art.",
    imageFile: "book-illustration",
  },
  {
    name: "Minecraft Style",
    slug: "minecraft",
    description: "Blocky, voxel-based pixel art inspired by the iconic game.",
    tip: "Huge with the gaming community.",
    imageFile: "minecraft",
  },
  {
    name: "Retro Style",
    slug: "retro",
    description: "Vintage aesthetics with bold colors and nostalgic design elements.",
    tip: "Timeless appeal with a fun, nostalgic vibe.",
    imageFile: "retro",
  },
  {
    name: "Caricature",
    slug: "caricature",
    description: "Exaggerated, humorous portrait art that emphasizes distinctive features.",
    tip: "Great for gifts and social media content.",
    imageFile: "caricature",
  },
  {
    name: "Video Game Art",
    slug: "video-game",
    description: "Dynamic, action-packed artwork inspired by video game aesthetics.",
    tip: "Perfect for gamers and streaming content.",
    imageFile: "video-game",
  },
];
