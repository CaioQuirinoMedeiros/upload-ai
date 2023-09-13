import 'dotenv/config'
import { fastify } from 'fastify'
import { getAllPromptsRoute } from './routes/get-all-prompts'
import { AppError } from './errors/app-error'
import { uploadVideoRoute } from './routes/upload-video'
import { createTranscriptionRoute } from './routes/create-transcription'
import { generateAiCompletionRoute } from './routes/generate-ai-completion'
import { fastifyCors } from '@fastify/cors'

const app = fastify()

app.register(fastifyCors, { origin: '*' })
app.register(getAllPromptsRoute)
app.register(uploadVideoRoute)
app.register(createTranscriptionRoute)
app.register(generateAiCompletionRoute)

app.setErrorHandler(function (error, request, reply) {
  console.log(error)
  if (error instanceof AppError) {
    reply.status(error.statusCode).send({ message: error.message })
  } else {
    reply.status(500).send({ message: 'Server error' })
  }
})

app.listen({ port: 3333 }).then(() => {
  console.log('HTTP server running')
})
