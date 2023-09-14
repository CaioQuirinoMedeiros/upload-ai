import * as React from 'react'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { api } from '@/lib/axios'

type Prompt = {
  id: string
  title: string
  template: string
}

type GetPromptsResponseBody = {
  prompts: Prompt[]
}

interface PromptSelectProps {
  onPromptTemplateSelect(template: string): void
}

export function PromptSelect(props: PromptSelectProps) {
  const { onPromptTemplateSelect } = props

  const [prompts, setPrompts] = React.useState<Prompt[]>()

  React.useEffect(() => {
    api.get<GetPromptsResponseBody>('/prompts').then((response) => {
      setPrompts(response.data.prompts)
    })
  }, [])

  function handleOnSelectValueChange(promptId: string) {
    const prompt = prompts?.find((eachPrompt) => {
      return eachPrompt.id === promptId
    })

    if (!prompt) return

    onPromptTemplateSelect(prompt?.template)
  }

  return (
    <Select onValueChange={handleOnSelectValueChange}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {prompts
          ? prompts.map((prompt) => {
              return (
                <SelectItem value={prompt.id} key={prompt.id}>
                  {prompt.title}
                </SelectItem>
              )
            })
          : []}
      </SelectContent>
    </Select>
  )
}
