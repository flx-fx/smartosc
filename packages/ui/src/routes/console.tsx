import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { Log, LogType } from '../../../shared/types.ts'
import { getId } from '../../../shared/utils.ts'
import { ScrollArea } from '@/components/ui/scroll-area.tsx'
import { cn } from '@/lib/utils.ts'
import { socket } from '@/socket.ts'

export const Route = createFileRoute('/console')({
  component: Console,
})

function Console() {
  const [log, setLog] = useState<Log[]>([])
  const logEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    socket.on('log', (message: string, type: LogType) =>
      setLog(prevLog => [
        ...prevLog,
        {
          id: getId(),
          time: Date.now(),
          message,
          type,
        },
      ]),
    )
    return () => {
      socket.off('log')
    }
  })

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [log])

  return (
    <ScrollArea className="h-[calc(100dvh-var(--spacing)*16)] w-full">
      <div className="flex flex-col gap-1 p-8">
        {log.length ? (
          log.map((log: Log) => {
            let style
            switch (log.type) {
              case undefined:
              case 'log':
                style = 'hidden'
                break
              case 'error':
                style = 'bg-red-500'
                break
              case 'warn':
                style = 'bg-yellow-500 text-black'
                break
              case 'TCP':
                style = 'bg-blue-600 text-blue-100'
                break
              case 'MIDI':
                style = 'bg-green-600 text-green-100'
            }
            return (
              <div key={log.id} className="flex h-fit gap-1 font-mono">
                <div className="text-muted-foreground box-border w-fit rounded-sm border border-dashed px-1 py-0.5">
                  {new Date(log.time).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false,
                  })}
                </div>
                <div className="bg-secondary text-secondary-foreground h-fit w-fit rounded-sm">
                  <span className={cn('inline-flex rounded-sm px-1 py-0.5 font-medium', style)}>
                    {log.type && log.type.charAt(0).toUpperCase() + log.type.slice(1)}
                  </span>
                  <span className="inline-flex px-1 py-0.5">{log.message}</span>
                </div>
              </div>
            )
          })
        ) : (
          <div>No log messages received yet.</div>
        )}
        <div ref={logEndRef} />
      </div>
    </ScrollArea>
  )
}
