import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const projects = defineCollection({
  loader: glob({
    pattern: "**/*.md",
    base: "./src/content/projects",
  }),
  schema: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    date: z.string(),
    location: z.string(),
    types: z.array(z.string()),
    cover: z.string(),
    hero: z.string().optional(),
    gallery: z.array(z.string()).optional(),
    role: z.string().optional(),
    collaborator: z.array(z.string()).optional(),
    advisor: z.string().optional(),
    organization: z.string().optional(),
    tags: z.array(z.string()),
    software: z.array(z.string()).optional(),
    overview: z.array(z.string()).optional(),

    blocks: z.array(
      z.object({
        type: z.enum([
          "text",
          "image",
          "gallery",
          "split"
        ]),
        title: z.string().optional(),
        content: z.string().optional(),
        src: z.string().optional(),
        caption: z.string().optional(),
        images: z.array(z.string()).optional(),
        image: z.string().optional(),
      })
    ).optional(),
  })
});

const publications = defineCollection({
  loader: glob({
    pattern: "**/*.md",
    base: "./src/content/publications",
  }),
  schema: z.object({
    title: z.string(),
    authors: z.array(z.string()),
    date: z.string(),
    venue: z.string(),
    type: z.string().optional(),
    paper_doi: z.string().url().optional(),
  })
});

const stories = defineCollection({
  loader: glob({
    pattern: "**/*.md",
    base: "./src/content/stories",
  }),
  schema: z.object({
    title: z.string(),
    date: z.string(),
    category: z.enum([
      "Cover Story",
      "Research",
      "Field Note",
    ]),
    location: z.string().optional(),
    cover: z.string(),
    intro: z.string(),
    tags: z.array(z.string()).optional(),
  }),
});

const news = defineCollection({
  loader: glob({
    pattern: "**/*.md",
    base: "./src/content/news",
  }),
  schema: z.object({
    title: z.string(),
    date: z.string(),
    location: z.string().optional(),
    related_project: z.string().optional(),
    external_link: z.string().url().optional(),
  }),
});

export const collections = {
  projects,
  publications,
  stories,
  news,
};