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
You are an expert website SEO and content auditor.

Analyze the following webpage information.

Website URL:
${data.url}

PAGE DATA:
${JSON.stringify(data.pageData)}

METRICS:
${JSON.stringify(data.metrics)}

Evaluate:

1. Overall website/content quality
2. SEO
3. Content quality
4. Readability
5. Accessibility
6. Performance

Return scores from 0 to 100.

Also identify the most important issues and provide actionable recommendations.

Do NOT invent information that is not available in the provided data.

Return valid JSON matching the requested schema.
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
