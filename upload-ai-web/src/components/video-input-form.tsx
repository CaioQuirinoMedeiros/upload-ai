import { FileVideo, Upload, Loader, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import * as React from 'react'
import { getFFmpeg } from '@/lib/ffmpeg'
import { fetchFile } from '@ffmpeg/util'
import { api } from '@/lib/axios'

type UploadVideoResponseBody = {
  video: {
    id: string
  }
}

type Status =
  | 'WAITING'
  | 'CONVERTING_VIDEO'
  | 'UPLOADING_VIDEO'
  | 'GENERATING_TRANSCRIPTION'
  | 'SUCCESS'

interface VideInputFormProps {
  onVideoUploaded(videoId: string): void
}

const ButtonTextStatusMap: { [status in Status]: string } = {
  CONVERTING_VIDEO: 'Convertendo',
  GENERATING_TRANSCRIPTION: 'Transcrevendo',
  UPLOADING_VIDEO: 'Carregando',
  SUCCESS: 'Sucesso',
  WAITING: 'Carregar vídeo'
}

const ButtonIconStatusMap: { [status in Status]: React.ElementType } = {
  UPLOADING_VIDEO: Loader,
  CONVERTING_VIDEO: Loader,
  GENERATING_TRANSCRIPTION: Loader,
  SUCCESS: Check,
  WAITING: Upload
}

export function VideoInputForm(props: VideInputFormProps) {
  const { onVideoUploaded } = props

  const [videoFile, setVideoFile] = React.useState<File>()
  const [status, setStatus] = React.useState<Status>('WAITING')

  const promptInput = React.useRef<HTMLTextAreaElement>(null)

  const ButtonIcon = ButtonIconStatusMap[status]

  const videoPreviewURL = React.useMemo(() => {
    if (!videoFile) return undefined

    return URL.createObjectURL(videoFile)
  }, [videoFile])

  async function convertVideoToAudio(video: File) {
    const ffmpeg = await getFFmpeg()

    await ffmpeg.writeFile('input.mp4', await fetchFile(video))

    ffmpeg.on('progress', ({ progress }) => {
      console.log(`Convert progress: ${Math.round(progress * 100)}%`)
    })

    await ffmpeg.exec([
      '-i',
      'input.mp4',
      '-map',
      '0:a',
      '-b:a',
      '20k',
      '-acodec',
      'libmp3lame',
      'output.mp3'
    ])

    const data = await ffmpeg.readFile('output.mp3')

    const audioFileBlob = new Blob([data], { type: 'audio/mpeg' })
    const audioFile = new File([audioFileBlob], 'audio.mp3', {
      type: 'audio/mpeg'
    })

    console.log('Convert finished')

    return audioFile
  }

  async function handleUploadVideo(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!videoFile) return

    const prompt = promptInput.current?.value

    setStatus('CONVERTING_VIDEO')
    const audioFile = await convertVideoToAudio(videoFile)

    const formData = new FormData()
    formData.append('file', audioFile)

    setStatus('UPLOADING_VIDEO')
    const response = await api.post<UploadVideoResponseBody>(
      '/videos',
      formData
    )

    const videoId = response.data.video?.id

    setStatus('GENERATING_TRANSCRIPTION')
    await api.post(`/videos/${videoId}/transcription`, {
      prompt: prompt
    })

    setStatus('SUCCESS')

    onVideoUploaded(videoId)
  }

  function handleFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.currentTarget.files
      ? event.currentTarget.files[0]
      : undefined

    if (!selectedFile) return

    setVideoFile(selectedFile)
  }

  return (
    <form className='space-y-6' onSubmit={handleUploadVideo}>
      <label
        htmlFor='video'
        className='border w-full flex rounded-md aspect-video cursor-pointer border-dashed text-small flex-col gap-2 items-center justify-center text-muted-foreground hover:bg-primary/5 transition-all overflow-hidden'
      >
        {videoFile ? (
          <video
            src={videoPreviewURL}
            controls={false}
            className='pointer-events-none w-full h-full object-contain'
          />
        ) : (
          <>
            <FileVideo className='w-4 h-4' />
            Selecione um vídeo
          </>
        )}
      </label>
      <input
        type='file'
        id='video'
        accept='video/mp4'
        disabled={status !== 'WAITING'}
        className='sr-only'
        onChange={handleFileSelected}
      />

      <Separator />

      <div className='space-y-2'>
        <Label htmlFor='transcription-prompt'>Prompt de transcrição</Label>
        <Textarea
          ref={promptInput}
          disabled={status !== 'WAITING'}
          id='transcription-prompt'
          className='h-20 leading-relaxed resize-none'
          placeholder='Inclua palavras-chave mencionadas no vídeo separadas por vírgula'
        />
      </div>

      <Button
        type='submit'
        className='w-full data-[success=true]:bg-emerald-400'
        disabled={status !== 'WAITING'}
        data-success={status === 'SUCCESS'}
      >
        {ButtonTextStatusMap[status]} <ButtonIcon className='h-4 w-4 ml-2' />
      </Button>
    </form>
  )
}
