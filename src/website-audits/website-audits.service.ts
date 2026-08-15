/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateWebsiteAuditDto } from './dto/create-website-audit.dto';
import { UpdateWebsiteAuditDto } from './dto/update-website-audit.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import * as cheerio from 'cheerio';
import {
  AIAnalysisResult,
  AuditMetrics,
  ExtractedPageData,
} from './interfaces/audit-analysis.interface';
import { AiService } from 'src/src/ai/ai.service';
import { PaginationQueries } from 'src/common/dto/pagination-query.dto';
import { paginate } from 'src/common/pagination/paginate';
import { Prisma } from 'src/generated/prisma/client';

@Injectable()
export class WebsiteAuditsService {
  constructor(
    private prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

  async create(dto: CreateWebsiteAuditDto, userId: number) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        organization: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.organizationId) {
      throw new BadRequestException('User does not belong to an organization');
    }

    // Check subscription / usage here
    // Example:
    // await this.checkAuditLimit(user.organizationId);

    const audit = await this.prisma.audit.create({
      data: {
        organizationId: user.organizationId,
        createdById: user.id,
        url: dto.url,
        status: 'pending',
      },
    });

    try {
      await this.prisma.audit.update({
        where: {
          id: audit.id,
        },
        data: {
          status: 'processing',
        },
      });

      // 1. Fetch website
      const response = await fetch(dto.url);

      if (!response.ok) {
        throw new BadRequestException(
          `Unable to fetch website. Status: ${response.status}`,
        );
      }

      const html = await response.text();

      // 2. Extract website content
      const pageData = await this.extractPageData(html, dto.url);

      // 3. Calculate basic metrics
      const metrics = this.calculateMetrics(pageData);

      // 4. Send content to AI
      const aiResult = await this.analyzeWithAI({
        url: dto.url,
        pageData,
        metrics,
      });

      // 5. Save audit
      const completedAudit = await this.prisma.audit.update({
        where: {
          id: audit.id,
        },
        data: {
          status: 'completed',

          title: pageData.title,
          description: pageData.description,

          overallScore: aiResult.overallScore,
          seoScore: aiResult.seoScore,
          contentScore: aiResult.contentScore,
          readabilityScore: aiResult.readabilityScore,
          accessibilityScore: aiResult.accessibilityScore,
          performanceScore: aiResult.performanceScore,

          wordCount: metrics.wordCount,
          readingTime: metrics.readingTime,
          imageCount: metrics.imageCount,
          imagesWithoutAlt: metrics.imagesWithoutAlt,
          internalLinks: metrics.internalLinks,
          externalLinks: metrics.externalLinks,
          brokenLinks: metrics.brokenLinks,

          metaTitleLength: metrics.metaTitleLength,
          metaDescriptionLength: metrics.metaDescriptionLength,

          h1Count: metrics.h1Count,
          h2Count: metrics.h2Count,
          h3Count: metrics.h3Count,

          keywordDensity: aiResult.keywordDensity,

          primaryKeyword: aiResult.primaryKeyword,

          headings: pageData.headings,
          metadata: pageData.metadata,
          // technicalData: metrics,

          // aiAnalysis: aiResult,
          aiModel: aiResult.model,
          aiTokensUsed: aiResult.tokensUsed,
        },
      });

      // 6. Store recommendations
      if (aiResult.recommendations?.length) {
        await this.prisma.auditRecommendation.createMany({
          data: aiResult.recommendations.map((recommendation: any) => ({
            auditId: audit.id,
            title: recommendation.title,
            description: recommendation.description,
            category: recommendation.category,
            severity: recommendation.severity,
          })),
        });
      }

      return completedAudit;
    } catch (error) {
      await this.prisma.audit.update({
        where: {
          id: audit.id,
        },
        data: {
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Audit failed',
        },
      });

      throw error;
    }
  }

  async findAll({
    limit,
    page,
    search,
    sortedBy,
    orderBy,
    isAdmin,
  }: PaginationQueries) {
    try {
      const perPage = Number(limit) || 10;
      const pageNumber = Number(page) || 1;
      const parseSearchParams = search?.split(';') || [];
      const whereClause: Prisma.AuditWhereInput = {};
      let orderByClause: Prisma.AuditOrderByWithRelationInput = {};

      if (parseSearchParams?.length > 0) {
        const organizationIdQuery = parseSearchParams.find((param) =>
          param.startsWith('organizationId:'),
        );

        if (organizationIdQuery) {
          const id = organizationIdQuery.split(':')[1];
          whereClause.organizationId = Number(id);
        }
      }

      if (sortedBy && orderBy) {
        orderByClause = { [orderBy]: sortedBy };
      }

      const result = await this.prisma.audit.findMany({
        where: whereClause,
        orderBy: orderByClause,
        take: perPage,
        skip: (pageNumber - 1) * perPage,
        // select: {},
      });

      const totalCount = await this.prisma.audit.count({
        where: whereClause,
      });
      const url = `/website-audits?search=${search}&limit=${limit}`;

      return {
        data: result,
        ...paginate(totalCount, page, limit, result.length, url),
      };
    } catch (error: any) {
      throw new InternalServerErrorException(
        error.message || 'An error occurred while fetching website audits.',
      );
    }
  }

  async findOne(id: number) {
    try {
      const result = await this.prisma.subscriptions.findFirst({
        where: { id },
      });

      if (!result) {
        throw new NotFoundException('Audit not found');
      }

      return result;
    } catch (error: any) {
      throw new InternalServerErrorException(
        error.message || 'An error occurred while fetching subscriptions.',
      );
    }
  }

  update(id: number, updateWebsiteAuditDto: UpdateWebsiteAuditDto) {
    return `This action updates a #${id} ${updateWebsiteAuditDto.url} websiteAudit`;
  }

  remove(id: number) {
    return `This action removes a #${id} websiteAudit`;
  }

  private async extractPageData(
    html: string,
    url: string,
  ): Promise<ExtractedPageData> {
    const $ = cheerio.load(html);

    /*
     * Remove elements that are normally not part
     * of the actual page content.
     */
    $('script, style, noscript, iframe, svg').remove();

    const title = $('title').first().text().trim();

    const description =
      $('meta[name="description"]').attr('content')?.trim() || '';

    const canonical = $('link[rel="canonical"]').attr('href')?.trim() || null;

    /*
     * Headings
     */
    const headings = {
      h1: $('h1')
        .map((_, element) => $(element).text().trim())
        .get()
        .filter(Boolean),

      h2: $('h2')
        .map((_, element) => $(element).text().trim())
        .get()
        .filter(Boolean),

      h3: $('h3')
        .map((_, element) => $(element).text().trim())
        .get()
        .filter(Boolean),
    };

    /*
     * Main page content
     *
     * Prefer <main>, <article>, or <body>.
     */
    let contentElement = $('main');

    if (!contentElement.length) {
      contentElement = $('article');
    }

    if (!contentElement.length) {
      contentElement = $('body');
    }

    const content = contentElement.text().replace(/\s+/g, ' ').trim();

    /*
     * Images
     */
    const images = $('img')
      .map((_, element) => ({
        src: $(element).attr('src') || '',
        alt: $(element).attr('alt') || '',
      }))
      .get();

    /*
     * Links
     */
    const baseUrl = new URL(url);

    const links = $('a')
      .map((_, element) => {
        const href = $(element).attr('href')?.trim() || '';

        if (!href || href.startsWith('#')) {
          return null;
        }

        try {
          const absoluteUrl = new URL(href, baseUrl.origin);

          const type =
            absoluteUrl.hostname === baseUrl.hostname ? 'internal' : 'external';

          return {
            href: absoluteUrl.toString(),
            text: $(element).text().trim(),
            type,
          };
        } catch {
          return null;
        }
      })
      .get()
      .filter(Boolean) as ExtractedPageData['links'];

    /*
     * Metadata
     */
    const metadata = {
      viewport: $('meta[name="viewport"]').attr('content') || null,

      robots: $('meta[name="robots"]').attr('content') || null,

      language: $('html').attr('lang') || null,

      ogTitle: $('meta[property="og:title"]').attr('content') || null,

      ogDescription:
        $('meta[property="og:description"]').attr('content') || null,

      ogImage: $('meta[property="og:image"]').attr('content') || null,
    };

    return {
      url,
      title,
      description,
      canonical,
      headings,
      content,
      images,
      links,
      metadata,
    };
  }

  private calculateMetrics(pageData: ExtractedPageData): AuditMetrics {
    const words = pageData.content.split(/\s+/).filter(Boolean);

    const wordCount = words.length;

    /*
     * Average reading speed:
     * approximately 200 words/minute
     */
    const readingTime = Math.max(1, Math.ceil(wordCount / 200));

    const imageCount = pageData.images.length;

    const imagesWithoutAlt = pageData.images.filter(
      (image) => !image.alt.trim(),
    ).length;

    const internalLinks = pageData.links.filter(
      (link) => link.type === 'internal',
    ).length;

    const externalLinks = pageData.links.filter(
      (link) => link.type === 'external',
    ).length;

    /*
     * We will calculate broken links later.
     *
     * Checking every link can make an audit slow,
     * so initially keep this as 0.
     */
    const brokenLinks = 0;

    const metaTitleLength = pageData.title.length;

    const metaDescriptionLength = pageData.description.length;

    const h1Count = pageData.headings.h1.length;

    const h2Count = pageData.headings.h2.length;

    const h3Count = pageData.headings.h3.length;

    /*
     * Paragraph analysis
     */
    const paragraphs = pageData.content
      .split(/\n+/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean);

    const contentParagraphs = paragraphs.length;

    const averageParagraphLength =
      contentParagraphs > 0
        ? Math.round(
            paragraphs.reduce(
              (total, paragraph) => total + paragraph.split(/\s+/).length,
              0,
            ) / contentParagraphs,
          )
        : 0;

    /*
     * URL analysis
     */
    let urlLength = 0;
    let hasHttps = false;

    try {
      const parsedUrl = new URL(pageData.url);

      urlLength = parsedUrl.pathname.length;
      hasHttps = parsedUrl.protocol === 'https:';
    } catch {
      // URL was already validated.
    }

    return {
      wordCount,
      readingTime,

      imageCount,
      imagesWithoutAlt,

      internalLinks,
      externalLinks,
      brokenLinks,

      metaTitleLength,
      metaDescriptionLength,

      h1Count,
      h2Count,
      h3Count,

      hasCanonical: !!pageData.canonical,
      hasViewport: !!pageData.metadata.viewport,
      hasRobotsMeta: !!pageData.metadata.robots,

      contentParagraphs,
      averageParagraphLength,

      urlLength,
      hasHttps,
    };
  }

  private async analyzeWithAI(data: {
    url: string;
    pageData: ExtractedPageData;
    metrics: AuditMetrics;
  }): Promise<AIAnalysisResult> {
    const MAX_CONTENT_LENGTH = 15000;

    const content =
      data?.pageData.content.length > MAX_CONTENT_LENGTH
        ? data?.pageData.content.slice(0, MAX_CONTENT_LENGTH)
        : data?.pageData.content;

    return this.aiService.analyzeWebsite({
      url: data.url,
      pageData: {
        title: data.pageData.title,
        description: data.pageData.description,
        headings: data.pageData.headings,
        content: content,
        metadata: data.pageData.metadata,
      },
      metrics: data.metrics,
    });
  }
}
