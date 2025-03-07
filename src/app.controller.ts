import { Body, Controller, Get, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import OpenAI from 'openai';

@Controller()
export class AppController {
  private readonly openai = new OpenAI({
    baseURL: process.env.DEEPSEEK_API_URL || '',
    apiKey: process.env.DEEPSEEK_API_KEY || '',
  });

  @Get('stream')
  async streamText(@Res() res: Response) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      const response = await this.openai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content:
              'Eres un farmacéutico profesional. Responde exclusivamente en español y con información médica detallada.',
          },
        ],
        model: 'deepseek-chat',
        stream: true,
      });

      for await (const chunk of response) {
        const content = chunk.choices?.[0]?.delta?.content || '';
        if (content) {
          res.write(`data: ${content}\n\n`);
        }
      }

      res.write('data: [DONE]\n\n');
      res.end();
    } catch (error) {
      console.error('DeepSeek API Error:', error);
      res.write(
        `data: Error fetching data from DeepSeek (${error?.response?.status || 'Unknown Error'})\n\n`,
      );
      res.end();
    }
  }

  @Post('chat')
  async chat(@Body('message') userMessage: string) {
    console.log('Mensaje recibido:', userMessage);

    try {
      const response = await this.openai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content:
              'Eres un farmacéutico profesional. Todas tus respuestas deben ser en español, detalladas y sin saludos innecesarios. Responde directamente la consulta con información médica confiable.',
          },
          { role: 'user', content: userMessage },
        ],
        model: 'deepseek-chat',
      });

      return {
        response: response.choices[0]?.message?.content || 'No response',
      };
    } catch (error) {
      console.error('DeepSeek API Error:', error);
      return { error: 'Error fetching response from DeepSeek' };
    }
  }
}
