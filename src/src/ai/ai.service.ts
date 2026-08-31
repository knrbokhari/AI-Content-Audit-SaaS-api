/* eslint-disable @typescript-eslint/no-base-to-string */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class AiService {
  private readonly openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      baseURL: 'https://router.bynara.id/v1',
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async analyzeWebsite(data: { url: string; pageData: any; metrics: any }) {
    const prompt = `
You are an expert website SEO, content, accessibility, readability, and performance auditor.

Your task is to analyze a webpage using ONLY the information provided below.

WEBSITE URL:
${data.url}

PAGE DATA:
${JSON.stringify(data.pageData)}

METRICS:
${JSON.stringify(data.metrics)}

IMPORTANT RULES:
1. Do NOT invent, assume, or guess information that is not present in PAGE DATA or METRICS.
2. Base every score and recommendation only on the provided data.
3. Scores must be integers between 0 and 100.
4. A higher score means better quality.
5. Recommendations must be specific, practical, and actionable.
6. Only include recommendations when there is evidence of an issue or improvement opportunity in the provided data.
7. Do not include markdown, explanations, code fences, or any text outside the JSON object.
8. Return ONLY valid JSON.
9. The response MUST exactly follow the JSON structure provided below.
10. Do not add extra fields.
11. "primaryKeyword" must be a string if a clear primary keyword can be identified from the provided data; otherwise return null.
12. "keywordDensity" must be a number if keyword density is available or can be reliably calculated from the provided data; otherwise return null.
13. "model" must contain the AI model name being used.
14. "tokensUsed" must contain the number of tokens used for this analysis if available. If the token count is not available, return 0.
15. "severity" must be exactly one of:
    "critical", "high", "medium", "low", "info"
16. "category" must be exactly one of:
    "seo", "content", "readability", "accessibility", "performance", "technical"
17. Do not create duplicate recommendations.
18. Prioritize the most important issues first.

EVALUATION CRITERIA:

Overall Score:
Evaluate the overall quality of the webpage based on all available evidence.

SEO Score:
Consider available SEO-related data such as:
- title
- meta description
- headings
- keywords
- keyword usage
- canonical URL
- robots directives
- links
- structured data
- other SEO metrics present in the provided data

Content Score:
Consider:
- content completeness
- relevance
- content length
- content structure
- uniqueness indicators
- heading/content relationship
- search intent signals
Only evaluate metrics that are actually available.

Readability Score:
Consider:
- sentence length
- paragraph length
- word complexity
- readability metrics
- heading structure
- content organization
Only use metrics available in the provided data.

Accessibility Score:
Consider:
- image alt text
- heading structure
- links
- form labels
- semantic HTML
- ARIA information
- color/contrast information if available
Only evaluate information available in the provided data.

Performance Score:
Consider:
- page load metrics
- resource sizes
- image sizes
- JavaScript/CSS information
- Core Web Vitals
- other performance metrics available in the provided data

RECOMMENDATIONS:

Each recommendation must explain a real problem or improvement opportunity found in the provided data.

Use this exact structure:

{
  "title": "Short descriptive title",
  "description": "Explain what should be improved and how to improve it.",
  "category": "seo",
  "severity": "high"
}

Do not create recommendations based on assumptions.

SUMMARY:

Write a concise summary of the webpage's overall quality. Mention the strongest areas and the most important areas that need improvement.

OUTPUT FORMAT:

{
  "overallScore": 0,
  "seoScore": 0,
  "contentScore": 0,
  "readabilityScore": 0,
  "accessibilityScore": 0,
  "performanceScore": 0,
  "primaryKeyword": null,
  "keywordDensity": null,
  "summary": "",
  "recommendations": [
    {
      "title": "",
      "description": "",
      "category": "seo",
      "severity": "high"
    }
  ],
}

FINAL REQUIREMENT:
Return ONLY the JSON object. Do not wrap it in markdown or \`\`\`json.
`;

    const response = await this.openai.chat.completions.create({
      model: 'mistral-large',

      messages: [
        {
          role: 'system',
          content:
            'You are an expert website SEO auditor. Return only valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],

      response_format: {
        type: 'json_object',
      },

      temperature: 0.2,
    });

    const result = response.choices[0]?.message?.content;

    if (!result) {
      throw new Error('AI did not return an analysis');
    }

    const parsed = JSON.parse(result);

    return {
      ...parsed,
      model: response.model,
      tokensUsed: response.usage?.total_tokens || 0,
    };
  }

  async aiHubMax() {
    const res = await fetch('https://aihubmix.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.AIHUBMIX_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gemini-3.7-flash-free',
        messages: [
          {
            role: 'user',
            content: 'What is the meaning of life?',
          },
        ],
      }),
    });

    return res.body;
  }
}
