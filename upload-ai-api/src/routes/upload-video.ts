import { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma'
import { fastifyMultipart } from '@fastify/multipart'
import { AppError } from '../errors/app-error'
import path from 'node:path'
import fs from 'node:fs'
import { pipeline } from 'node:stream'
import { promisify } from 'node:util'
import { randomUUID } from 'node:crypto'

const pump = promisify(pipeline)

export async function uploadVideoRoute(app: FastifyInstance) {
  app.register(fastifyMultipart, {
    limits: {
      fileSize: 1_048_576 * 25 // 25mb
    }
  })

  app.post('/videos', async (request, reply) => {
    const file = await request.file()

    if (!file) {
      throw new AppError({ message: 'Missing file input' })
    }

    const extension = path.extname(file.filename)

    if (extension !== '.mp3') {
      throw new AppError({
        message: 'NInvalid input type, please uploiad a MP3'
      })
    }

    const fileBaseName = path.basename(file.filename, extension)
    const fileUploadName = `${fileBaseName}-${randomUUID()}${extension}`

    const uploadDestinationPath = path.resolve(
      __dirname,
      '../../tmp',
      fileUploadName
    )

    await pump(file.file, fs.createWriteStream(uploadDestinationPath))

    const video = await prisma.video.create({
      data: {
        name: file.filename,
        path: uploadDestinationPath
      }
    })

    return reply.send({ video })
  })
}
