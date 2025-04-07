import { useConnection } from '@/lib/useConnection.ts'
import { AppWindow, Server, SlidersVertical } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip.tsx'

function ConnectionState() {
  const { socketConnection, oscConnection, midiConnection } = useConnection()

  return (
    <div className="-m-1 ml-auto flex gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="text-muted-foreground relative size-fit rounded-full border border-dashed p-2">
              <Server className="size-4" />
              <div
                className={`size-2 rounded-full ${socketConnection ? 'bg-green-500' : 'bg-rose-500'} absolute bottom-0 right-0`}
              />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              SmartOSC Server:{' '}
              <span className={socketConnection ? 'text-green-500' : 'text-rose-500'}>
                {socketConnection ? 'Connected' : 'Disconnected'}
              </span>
            </p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="text-muted-foreground relative size-fit rounded-full border border-dashed p-2">
              <SlidersVertical className="size-4" />
              <div
                className={`size-2 rounded-full ${midiConnection ? 'bg-green-500' : 'bg-rose-500'} absolute bottom-0 right-0`}
              />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              MIDI:{' '}
              <span className={midiConnection ? 'text-green-500' : 'text-rose-500'}>
                {midiConnection ? 'Connected' : 'Disconnected'}
              </span>
            </p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="text-muted-foreground relative size-fit rounded-full border border-dashed p-2">
              <AppWindow className="size-4" />
              <div
                className={`size-2 rounded-full ${oscConnection ? 'bg-green-500' : 'bg-rose-500'} absolute bottom-0 right-0`}
              />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              OSC (TCP):{' '}
              <span className={oscConnection ? 'text-green-500' : 'text-rose-500'}>
                {oscConnection ? 'Connected' : 'Disconnected'}
              </span>
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}

export default ConnectionState
