import type { Fader, FaderConfig, FaderGroup, Id } from '../../../shared/types.ts'
import { Button } from '@/components/ui/button.tsx'
import { PlusIcon, TrashIcon } from 'lucide-react'
import { rectSortingStrategy, SortableContext, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useCallback, useMemo, useState } from 'react'
import FaderCard from '@/components/fader.tsx'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area.tsx'
import { debounce } from 'lodash-es'

interface FaderGroupProps {
  faderGroup: FaderGroup
  deleteFaderGroup: (id: Id) => void
  updateFaderGroup: (id: Id, name: string) => void
  faders: Fader[]
  createFader: (groupId: Id) => void
  updateFaderConfig: (id: Id, config: FaderConfig) => void
  deleteFader: (id: Id) => void
}

function FaderGroupContainer({
  faderGroup,
  deleteFaderGroup,
  updateFaderGroup,
  faders,
  createFader,
  updateFaderConfig,
  deleteFader,
}: FaderGroupProps) {
  const [editName, setEditName] = useState(false)
  const [localName, setLocalName] = useState(faderGroup.name)

  const faderIds = useMemo(() => faders.map(fader => fader.id), [faders])

  const debouncedUpdateFaderGroup = useCallback(
    debounce((id: Id, name: string) => {
      updateFaderGroup(id, name)
    }, 500),
    [updateFaderGroup],
  )

  function handleNameChange(value: string) {
    setLocalName(value)
    debouncedUpdateFaderGroup(faderGroup.id, value)
  }

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: faderGroup.id,
    data: {
      type: 'FaderGroup',
      faderGroup,
    },
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    width: `${faders.length * 4.5 + Math.max(faders.length - 1, 0) * 0.5 + 2}rem`,
  }

  if (isDragging)
    return (
      <div
        className={'min-w-26 min-h-110 rounded-2xl border border-dashed opacity-50'}
        ref={setNodeRef}
        style={style}
      />
    )

  return (
    <div
      className="bg-background/40 min-w-26 fit min-h-110 group relative max-w-full overflow-hidden rounded-2xl border border-dashed backdrop-blur-lg"
      ref={setNodeRef}
      style={style}
    >
      <div
        className="group/topbar duration-600 before:bg-radial-[at_50%_0%] before:from-secondary relative flex h-14 w-full max-w-full cursor-grab items-center gap-1 border-b p-2 transition-colors before:absolute before:left-0 before:top-0 before:-z-10 before:h-14 before:w-full before:to-transparent before:opacity-0 before:transition-opacity before:duration-300 group-hover:before:opacity-100"
        {...attributes}
        {...listeners}
      >
        <div
          className="group-hover/topbar:border-border group-has-focus/topbar:border-border group-hover/topbar:bg-background group-has-focus:bg-background text-md h-9 cursor-text content-center truncate rounded-sm border border-transparent px-2 font-medium transition-colors duration-300"
          onClick={() => setEditName(true)}
        >
          {editName ? (
            <input
              className="h-full w-full border-none outline-none"
              autoFocus
              value={localName}
              onChange={e => {
                handleNameChange(e.target.value)
              }}
              onBlur={() => setEditName(false)}
              onKeyDown={e => {
                if (e.key === 'Enter') setEditName(false)
              }}
            />
          ) : (
            localName
          )}
        </div>
        <Button
          variant="destructive"
          size="icon"
          className="group-has-focus/topbar:opacity-100 group-has-focus/topbar:flex transition-discrete ml-auto hidden opacity-0 transition-all duration-300 group-hover/topbar:flex group-hover/topbar:opacity-100"
          onClick={() => deleteFaderGroup(faderGroup.id)}
        >
          <TrashIcon />
        </Button>
      </div>
      <ScrollArea type="scroll">
        <div className="flex gap-2 p-4">
          <SortableContext items={faderIds} strategy={rectSortingStrategy}>
            {faders.length ? (
              faders.map(fader => (
                <FaderCard
                  fader={fader}
                  updateFaderConfig={updateFaderConfig}
                  deleteFader={deleteFader}
                  key={fader.id}
                />
              ))
            ) : (
              <Button
                variant="ghost"
                onClick={() => createFader(faderGroup.id)}
                className="h-88 w-18 min-w-18 text-border hover:text-muted-foreground hover:border-muted-foreground flex cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border border-dashed p-4 transition-colors duration-300"
              >
                <PlusIcon />
              </Button>
            )}
          </SortableContext>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  )
}

export default FaderGroupContainer
