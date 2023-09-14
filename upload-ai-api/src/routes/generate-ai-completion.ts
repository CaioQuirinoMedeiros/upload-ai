import { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma'
import { z } from 'zod'
import { createReadStream } from 'node:fs'
import { openai } from '../lib/openai'
import { streamToResponse, OpenAIStream } from 'ai'
import { AppError } from '../errors/app-error'

const generateAiCompletionBodySchema = z.object({
  videoId: z.string(),
  prompt: z.string(),
  temperature: z.coerce.number().min(0).max(1).default(0.5)
})

export async function generateAiCompletionRoute(app: FastifyInstance) {
  app.post('/ai/complete', async (request, reply) => {
    const { temperature, prompt, videoId } =
      generateAiCompletionBodySchema.parse(request.body)

    const video = await prisma.video.findUniqueOrThrow({
      where: {
        id: videoId
      }
    })

    if (!video.transcription) {
      throw new AppError({ message: 'Video does not have a transcription yet' })
    }

    const promptMessage = prompt.replace('{transcription}', video.transcription)

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo-16k',
      temperature: temperature,
      messages: [{ role: 'user', content: promptMessage }],
      stream: true
    })

    const stream = OpenAIStream(response)

    streamToResponse(stream, reply.raw, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, PUT, OPTIONS'
      }
    })
  })
}
