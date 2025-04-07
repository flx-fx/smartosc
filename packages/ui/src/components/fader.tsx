import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider.tsx'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Label } from '@/components/ui/label.tsx'
import { Input } from '@/components/ui/input.tsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { GripHorizontal, Trash, Wrench } from 'lucide-react'
import type { Fader, FaderConfig, FaderMode, Id } from '../../../shared/types.ts'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { memo, useCallback, useState } from 'react'
import { debounce } from 'lodash-es'
import { faderModeLabels } from '@/lib/utils.ts'

interface FaderProps {
  fader: Fader
  updateFaderConfig: (id: Id, faderConfig: FaderConfig) => void
  deleteFader: (id: Id) => void
}

const FaderCard = memo(function Fader({ fader, updateFaderConfig, deleteFader }: FaderProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: fader.id,
    data: {
      type: 'Fader',
      fader,
    },
  })

  const [localConfig, setLocalConfig] = useState<FaderConfig>(fader.config)

  const debouncedUpdateFaderConfig = useCallback(
    debounce((id: Id, config: FaderConfig) => {
      updateFaderConfig(id, config)
    }, 500),
    [updateFaderConfig],
  )

  const handleConfigChange = (newConfig: Partial<FaderConfig>) => {
    const updatedConfig = { ...localConfig, ...newConfig }
    setLocalConfig(updatedConfig)
    debouncedUpdateFaderConfig(fader.id, updatedConfig)
  }

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  if (isDragging)
    return (
      <div className="h-88 w-18 min-w-14 rounded-2xl border border-dashed opacity-50" ref={setNodeRef} style={style} />
    )

  return (
    <div
      className="bg-background/40 h-88 w-18 flex min-w-14 flex-col items-center gap-4 overflow-hidden rounded-2xl border p-4 backdrop-blur-lg"
      ref={setNodeRef}
      style={style}
    >
      {!isDragging && (
        <>
          <div
            className="before:bg-linear-to-t before:to-secondary w-18 group/fader relative -my-4 h-20 cursor-grab content-center items-center rounded-none text-sm before:absolute before:left-0 before:top-0 before:-z-10 before:h-[150%] before:w-full before:from-transparent before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-100"
            {...attributes}
            {...listeners}
          >
            <GripHorizontal className="text-muted-foreground group-hover/fader:text-foreground m-auto size-5 transition-colors" />
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon">
                <Wrench className="text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">Fader Config</h4>
                  <p className="text-muted-foreground text-sm">Map the MIDI fader to a Submaster or Fader on EOS.</p>
                </div>
                <div className="grid gap-2">
                  <div className="-mb-2 flex items-center gap-2">
                    <div className="w-2 border-b" />
                    <h5>MIDI</h5>
                    <div className="flex-grow border-b" />
                  </div>
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label htmlFor="midiController">Controller</Label>
                    <Input
                      id="midiController"
                      type="number"
                      value={localConfig.midiController}
                      onChange={e =>
                        handleConfigChange({
                          midiController: parseInt(e.target.value),
                        })
                      }
                      className="col-span-2 h-8"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <div className="-mb-2 flex items-center gap-2">
                    <div className="w-2 border-b" />
                    <h5>EOS</h5>
                    <div className="flex-grow border-b" />
                  </div>
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label>Mode</Label>
                    <Select
                      value={localConfig.mode}
                      onValueChange={value =>
                        handleConfigChange({
                          mode: value as FaderMode,
                        })
                      }
                    >
                      <SelectTrigger className="col-span-2 h-8 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sub">Submaster</SelectItem>
                        <SelectItem value="fader">Fader</SelectItem>
                        <SelectItem value="chan">Channel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label htmlFor="eosController">{faderModeLabels[localConfig.mode]}</Label>
                    <Input
                      id="eosController"
                      type="number"
                      value={localConfig.eosController}
                      onChange={e =>
                        handleConfigChange({
                          eosController: parseInt(e.target.value),
                        })
                      }
                      className="col-span-2 h-8"
                    />
                  </div>
                </div>
                <Button variant="destructive" onClick={() => deleteFader(fader.id)}>
                  <Trash />
                  Delete
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          <Slider orientation="vertical" max={127} step={0.0001} />
          <Button size="sm">{fader.config.midiController}</Button>
        </>
      )}
    </div>
  )
})

export default FaderCard
