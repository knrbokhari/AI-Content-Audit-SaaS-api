export interface ExtractedPageData {
  url: string;
  title: string;
  description: string;
  canonical: string | null;

  headings: {
    h1: string[];
    h2: string[];
    h3: string[];
  };

  content: string;

  images: {
    src: string;
    alt: string;
  }[];

  links: {
    href: string;
    text: string;
    type: 'internal' | 'external';
  }[];

  metadata: {
    viewport: string | null;
    robots: string | null;
    language: string | null;
    ogTitle: string | null;
    ogDescription: string | null;
    ogImage: string | null;
  };
}

export interface AuditMetrics {
  wordCount: number;
  readingTime: number;

  imageCount: number;
  imagesWithoutAlt: number;

  internalLinks: number;
  externalLinks: number;
  brokenLinks: number;

  metaTitleLength: number;
  metaDescriptionLength: number;

  h1Count: number;
  h2Count: number;
  h3Count: number;

  hasCanonical: boolean;
  hasViewport: boolean;
  hasRobotsMeta: boolean;

  contentParagraphs: number;
  averageParagraphLength: number;

  urlLength: number;
  hasHttps: boolean;
}

export interface AIRecommendation {
  title: string;
  description: string;
  category:
    | 'seo'
    | 'content'
    | 'readability'
    | 'accessibility'
    | 'performance'
    | 'technical';

  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
}

export interface AIAnalysisResult {
  overallScore: number;
  seoScore: number;
  contentScore: number;
  readabilityScore: number;
  accessibilityScore: number;
  performanceScore: number;

  primaryKeyword: string | null;
  keywordDensity: number | null;

  summary: string;

  recommendations: AIRecommendation[];

  model: string;
  tokensUsed: number;
}
