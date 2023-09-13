import { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma'
import { z } from 'zod'
import { createReadStream } from 'node:fs'
import { openai } from '../lib/openai'

const createTranscriptionParamsSchema = z.object({
  videoId: z.string().uuid()
})

const createTranscriptionBodySchema = z.object({
  prompt: z.string()
})

export async function createTranscriptionRoute(app: FastifyInstance) {
  app.post('/videos/:videoId/transcription', async (request, reply) => {
    const { videoId } = createTranscriptionParamsSchema.parse(request.params)
    const { prompt } = createTranscriptionBodySchema.parse(request.body)

    const video = await prisma.video.findUniqueOrThrow({
      where: {
        id: videoId
      }
    })

    const videoPath = video.path

    const audioReadStream = createReadStream(videoPath)

    const response = await openai.audio.transcriptions.create({
      file: audioReadStream,
      model: 'whisper-1',
      language: 'pt',
      response_format: 'json',
      temperature: 0,
      prompt: prompt
    })

    const transcription = response.text

    await prisma.video.update({
      where: { id: video.id },
      data: { transcription: transcription }
    })

    return reply.send({ transcription })
  })
}
