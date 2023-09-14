import { Github, Wand2 } from 'lucide-react'
import * as React from 'react'
import { Button } from './components/ui/button'
import { Separator } from './components/ui/separator'
import { Textarea } from './components/ui/textarea'
import { Label } from './components/ui/label'
import { useCompletion } from 'ai/react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from './components/ui/select'
import { Slider } from './components/ui/slider'
import { VideoInputForm } from './components/video-input-form'
import { PromptSelect } from './components/prompt-select'

export function App() {
  const [temperature, setTemperature] = React.useState(0.5)
  const [uploadedVideoId, setUploadedVideoId] = React.useState<string>()

  const {
    input,
    setInput,
    handleInputChange,
    handleSubmit,
    completion,
    isLoading
  } = useCompletion({
    api: 'http://localhost:3333/ai/complete',
    body: {
      temperature: temperature,
      videoId: uploadedVideoId
    },
    headers: {
      'Content-Type': 'application/json'
    }
  })

  return (
    <div className='min-h-screen flex flex-col'>
      <header className='px-6 py-3 flex items-center justify-between border-b'>
        <h1 className='text-xl font-bold'>Upload AI</h1>

        <div className='flex items-center gap-3'>
          <span className='text-sm text-muted-foreground'>
            Desenvolvido por Caio Quirino
          </span>

          <Separator orientation='vertical' className='h-6' />

          <Button variant='outline'>
            <Github className='w-4 h-4 mr-2' />
            Github
          </Button>
        </div>
      </header>

      <main className='flex-1 p-6 flex gap-6'>
        <div className='flex flex-col flex-1 gap-4'>
          <div className='grid grid-rows-2 gap-4 flex-1'>
            <Textarea
              value={input}
              onChange={handleInputChange}
              className='resize-none p-5 leading-relaxed'
              placeholder='Inclua o prompt para a IA...'
            />
            <Textarea
              value={completion}
              className='resize-none p-5 leading-relaxed'
              placeholder='Resultado gerado pela IA'
              readOnly
            />
          </div>
          <p className='text-sm text-muted-foreground'>
            Lembre-se: você pode utilizar a variável{' '}
            <code className='text-violet-400'>{'{transcription}'}</code> no seu
            prompt para adicionar o conteúdo da transcrição do vídeo
            selecionado.
          </p>
        </div>
        <aside className='w-80 space-y-6'>
          <VideoInputForm onVideoUploaded={setUploadedVideoId} />

          <Separator />

          <form className='space-y-6' onSubmit={handleSubmit}>
            <div className='space-y-2'>
              <Label>Prompt</Label>
              <PromptSelect onPromptTemplateSelect={setInput} />
            </div>

            <div className='space-y-2'>
              <Label>Modelo</Label>
              <Select defaultValue='gpt3.5' disabled>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='gpt3.5'>GPT 3.5-turbo 16k</SelectItem>
                </SelectContent>
              </Select>
              <span className='block text-sm text-muted-foreground italic'>
                Você poderá customizar essa opção em breve
              </span>
            </div>

            <Separator />

            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <Label>Temperatura</Label>
                <span className='text-sm text-muted-foreground'>
                  {temperature.toFixed(1)}
                </span>
              </div>
              <Slider
                min={0}
                max={1}
                step={0.1}
                defaultValue={[temperature]}
                onValueChange={([value]) => setTemperature(value)}
              />

              <span className='block text-sm text-muted-foreground italic'>
                Valores mais altos tendem a deixar o resultado mais criativo e
                com possíveis erros
              </span>
            </div>

            <Separator />

            <Button type='submit' className='w-full' disabled={isLoading}>
              Executar
              <Wand2 className='h-4 w-4 ml-2' />
            </Button>
          </form>
        </aside>
      </main>
    </div>
  )
}
