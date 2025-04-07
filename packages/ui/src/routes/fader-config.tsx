import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  pointerWithin,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { arrayMove, SortableContext } from '@dnd-kit/sortable'
import { Button } from '@/components/ui/button.tsx'
import FaderGroupContainer from '@/components/fader-group.tsx'
import FaderCard from '@/components/fader.tsx'
import { Plus, SquarePlus, TriangleAlert } from 'lucide-react'
import { socket } from '@/socket.ts'
import { ScrollArea } from '@/components/ui/scroll-area.tsx'
import FaderProfileSelect from '@/components/fader-profile-select.tsx'
import { useConfig } from '@/lib/useConfig.ts'

import type { Fader, FaderConfig, FaderGroup, Id } from '../../../shared/types.ts'

export const Route = createFileRoute('/fader-config')({
  component: FaderConfig,
})

function FaderConfig() {
  const [faderGroups, setFaderGroups] = useState<FaderGroup[]>([])
  const [faders, setFaders] = useState<Fader[]>([])

  const [activeGroup, setActiveGroup] = useState<FaderGroup | null>(null)
  const [activeFader, setActiveFader] = useState<Fader | null>(null)

  const faderGroupIds = useMemo(() => faderGroups.map(group => group.id), [faderGroups])
  const focussedGroupId = useRef<Id | null>(null)

  const config = useConfig()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
  )

  useEffect(() => {
    const handleFaderGroupsUpdate = (fgs: FaderGroup[]) => setFaderGroups(fgs)
    const handleFadersUpdate = (fs: Fader[]) => setFaders(fs)

    socket.on('fgs-update', handleFaderGroupsUpdate)
    socket.on('fs-update', handleFadersUpdate)
    socket.emit('fgs-fs-init')

    return () => {
      socket.off('fgs-update', handleFaderGroupsUpdate)
      socket.off('fs-update', handleFadersUpdate)
    }
  }, [])

  useEffect(() => {
    if (activeGroup) {
      focussedGroupId.current = activeGroup.id
    }
  }, [activeGroup])

  useEffect(() => {
    if (!faderGroupIds.find(id => id === focussedGroupId.current)) focussedGroupId.current = null
  }, [faderGroupIds])

  const createFaderGroup = useCallback(() => {
    socket.emit('fg-create', (response: FaderGroup) => {
      focussedGroupId.current = response.id
    })
  }, [])

  const deleteFaderGroup = useCallback((id: Id) => {
    socket.emit('fg-delete', id)
  }, [])

  const updateFaderGroup = useCallback((id: Id, name: string) => {
    socket.emit('fg-update', id, name)
  }, [])

  const createFader = useCallback((groupId?: Id) => {
    socket.emit('f-create', groupId ? groupId : focussedGroupId.current)
  }, [])

  const updateFaderConfig = useCallback((id: Id, faderConfig: FaderConfig) => {
    socket.emit('f-update-config', id, faderConfig)
  }, [])

  const deleteFader = useCallback((id: Id) => {
    socket.emit('f-delete', id)
  }, [])

  const onDragStart = useCallback((e: DragStartEvent) => {
    if (e.active.data.current?.type === 'FaderGroup') {
      setActiveGroup(e.active.data.current.faderGroup)
      return
    }

    if (e.active.data.current?.type === 'Fader') {
      setActiveFader(e.active.data.current.fader)
      return
    }
  }, [])

  const dragIntentRef = useRef<{ active: any; over: any } | null>(null)

  const onDragOver = useCallback(({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return

    const activeType = active.data.current?.type
    const overType = over.data.current?.type

    if (activeType === 'Fader' && overType === 'Fader') {
      dragIntentRef.current = { active, over }
    }

    if (activeType === 'Fader' && overType === 'FaderGroup') {
      setFaders(faders => {
        faders[faders.findIndex(fader => fader.id === active.id)].groupId = over.id
        const updatedFaders = [...faders]
        socket.emit('fs-update', updatedFaders)
        return updatedFaders
      })
    }

    if (active.data.current?.type === 'FaderGroup') {
      setFaderGroups(groups => {
        const updatedGroups = arrayMove(
          groups,
          groups.findIndex(group => group.id === active.id),
          groups.findIndex(group => group.id === over.id),
        )
        socket.emit('fgs-update', updatedGroups)
        return updatedGroups
      })
    }
  }, [])

  const onDragEnd = useCallback((e: DragEndEvent) => {
    const { active, over } = e

    setActiveGroup(null)
    setActiveFader(null)

    if (!over || active.id === over.id) return

    if (active.data.current?.type === 'Fader' && dragIntentRef.current) {
      const { active, over } = dragIntentRef.current
      const activeType = active.data.current?.type
      const overType = over.data.current?.type

      setFaders(faders => {
        const activeIndex = faders.findIndex(fader => fader.id === active.id)

        if (activeType === 'Fader' && overType === 'Fader') {
          const overIndex = faders.findIndex(fader => fader.id === over.id)
          faders[activeIndex].groupId = faders[overIndex].groupId
          const updatedFaders = arrayMove(faders, activeIndex, overIndex)
          socket.emit('fs-update', updatedFaders)
          return updatedFaders
        }

        return faders
      })

      dragIntentRef.current = null
      return
    }
  }, [])

  return (
    <DndContext
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      collisionDetection={pointerWithin}
      sensors={sensors}
    >
      <div className="relative h-[calc(100dvh-var(--spacing)*15)] w-full">
        <div className="h-13 bg-background/40 absolute z-30 flex w-full space-x-2 border-b border-dashed p-2 backdrop-blur-lg">
          <Button onClick={() => createFader()} disabled={!config?.app.faderProfileId}>
            <Plus />
            Add fader
          </Button>
          <Button variant="secondary" onClick={() => createFaderGroup()} disabled={!config?.app.faderProfileId}>
            <SquarePlus />
            Add group
          </Button>
          <FaderProfileSelect />
        </div>
        {config?.app.faderProfileId ? (
          <ScrollArea className="h-[calc(100dvh-var(--spacing)*15)] w-full">
            <div className="h-13" />
            <div className="flex flex-wrap gap-4 p-8">
              <SortableContext items={faderGroupIds} strategy={() => null}>
                {faderGroups.map(group => (
                  <FaderGroupContainer
                    faderGroup={group}
                    deleteFaderGroup={deleteFaderGroup}
                    updateFaderGroup={updateFaderGroup}
                    key={group.id}
                    faders={faders.filter(fader => fader.groupId === group.id)}
                    createFader={createFader}
                    updateFaderConfig={updateFaderConfig}
                    deleteFader={deleteFader}
                  />
                ))}
              </SortableContext>
            </div>
          </ScrollArea>
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <div className="space-y-2 rounded-lg border border-dashed p-8">
              <div className="flex gap-2 rounded-lg border border-yellow-500 bg-yellow-500/20 p-4 text-yellow-500">
                <TriangleAlert /> No profile selected.
              </div>
              <FaderProfileSelect />
            </div>
          </div>
        )}
      </div>
      {createPortal(
        <DragOverlay>
          {activeGroup && (
            <FaderGroupContainer
              faderGroup={activeGroup}
              deleteFaderGroup={deleteFaderGroup}
              updateFaderGroup={updateFaderGroup}
              faders={faders.filter(fader => fader.groupId === activeGroup.id)}
              createFader={createFader}
              updateFaderConfig={updateFaderConfig}
              deleteFader={deleteFader}
            />
          )}
          {activeFader && (
            <FaderCard fader={activeFader} updateFaderConfig={updateFaderConfig} deleteFader={deleteFader} />
          )}
        </DragOverlay>,
        document.body,
      )}
    </DndContext>
  )
}
