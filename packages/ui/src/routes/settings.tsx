import { Button } from '@/components/ui/button'
import { createFileRoute } from '@tanstack/react-router'
import { LucideCheck, RefreshCcw, TriangleAlert } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { socket } from '@/socket.ts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.tsx'
import { Switch } from '@/components/ui/switch.tsx'
import { Input } from '@/components/ui/input.tsx'
import { ScrollArea } from '@/components/ui/scroll-area.tsx'
import { useConfig } from '@/lib/useConfig.ts'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.tsx'

export const Route = createFileRoute('/settings')({
  component: Settings,
})

function Settings() {
  const config = useConfig()
  const [midiDevices, setMidiDevices] = useState<string[]>([])

  const appRef = useRef<HTMLDivElement>(null)
  const midiRef = useRef<HTMLDivElement>(null)
  const oscRef = useRef<HTMLDivElement>(null)

  function updateMidiDevices() {
    socket.emit('midi-ds-get', (mDs: string[]) => {
      setMidiDevices(mDs)
    })
  }

  useEffect(() => {
    updateMidiDevices()
  }, [])

  return (
    <div className="relative flex h-[calc(100dvh-var(--spacing)*15)]">
      <ScrollArea className="h-full w-full">
        <div className="flex w-full items-center justify-center">
          <div className="*:max-w-192 min-w-144 w-1/2 space-y-8 p-16 *:w-full">
            <div ref={appRef}>
              <h2 className="text-2xl font-bold">App</h2>
              <div className="space-y-2 p-4">
                <div className="flex items-center justify-between rounded-2xl border p-6 font-semibold">
                  Start SmartOSC on system boot
                  <Switch checked={config?.app.autostart} onClick={() => socket.emit('app-autostart')} />
                </div>
                <div className="flex items-center justify-between rounded-2xl border p-6 font-semibold">
                  Open SmartOSC UI on application start
                  <Switch checked={config?.app.autostartUI} onClick={() => socket.emit('app-autostart-ui')} />
                </div>
                <div className="flex items-center justify-between rounded-2xl border p-6 font-semibold">
                  Default Fader Mode
                  <Select
                    value={config?.app.defaultFaderMode}
                    onValueChange={value => socket.emit('app-default-fader-mode', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sub">Submaster</SelectItem>
                      <SelectItem value="fader">Fader</SelectItem>
                      <SelectItem value="chan">Channel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div ref={midiRef}>
              <h2 className="text-2xl font-bold">MIDI</h2>
              <div className="space-y-2 p-4">
                <div className="flex items-center justify-between rounded-2xl border p-6 font-semibold">
                  MIDI input
                  <Switch
                    disabled={midiDevices.length <= 0}
                    checked={config?.midi.input}
                    onClick={() => socket.emit('midi-in')}
                  />
                </div>
                <div className="flex items-center justify-between rounded-2xl border p-6 font-semibold">
                  MIDI channel
                  <Input
                    className="w-1/6 min-w-16"
                    type="number"
                    value={config?.midi.channel}
                    onChange={e => socket.emit('midi-chan', parseInt(e.target.value))}
                  />
                </div>
                <Card>
                  <CardHeader>
                    <CardTitle>MIDI device</CardTitle>
                    <CardDescription>Select the MIDI device to use as input for SmartOSC.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-lg border border-dashed">
                      <div className="rounded-(--ds-radius) p-(--ds-padding) -m-[1px] w-[calc(100%+2px)] space-y-1 overflow-hidden border [--ds-padding:--spacing(1)] [--ds-radius:var(--radius-lg)]">
                        {midiDevices.length ? (
                          midiDevices.map(midiDevice => (
                            <Button
                              className={`flex w-full justify-start gap-2 rounded-[calc(var(--ds-radius)-var(--ds-padding))] p-2 transition-colors ${midiDevice === config?.midi.device ? 'border border-green-500 bg-green-500/10 text-green-500 hover:bg-green-500/20' : ''}`}
                              variant="outline"
                              size="lg"
                              key={midiDevice}
                              onClick={() => socket.emit('midi-d', midiDevice)}
                            >
                              <div className={midiDevice !== config?.midi.device ? 'invisible' : ''}>
                                <LucideCheck />
                              </div>
                              <div className="">{midiDevice}</div>
                            </Button>
                          ))
                        ) : (
                          <div className="flex items-center gap-2 rounded-[calc(var(--ds-radius)-var(--ds-padding))] border border-yellow-500 bg-yellow-500/20 p-2 text-yellow-500">
                            <TriangleAlert /> No MIDI devices found.
                            <Button
                              size="sm"
                              className="focus-visible:ring-bg-yellow-500/20 dark:focus-visible:ring-bg-yellow-500/40 ml-auto bg-yellow-500 hover:bg-yellow-500/90"
                              onClick={() => updateMidiDevices()}
                            >
                              <RefreshCcw /> Refresh
                            </Button>
                          </div>
                        )}
                      </div>
                      {midiDevices.length ? (
                        <div className="flex items-center justify-between p-1">
                          <p className="text-muted-foreground ml-2 text-sm">
                            Your device doesn't show up? Try refreshing.
                          </p>
                          <Button variant="outline" size="icon" onClick={() => updateMidiDevices()}>
                            <RefreshCcw />
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
            <div ref={oscRef}>
              <h2 className="text-2xl font-bold">ETC EOS connection (TCP)</h2>
              <div className="space-y-2 p-4">
                <div className="rounded-2xl border font-semibold">
                  <div className="flex items-center justify-between border-b border-dashed p-6">
                    OSC input
                    <Switch checked={config?.tcp.input} onClick={() => socket.emit('osc-in')} />
                  </div>
                  <div className="flex items-center justify-between p-6">
                    OSC output
                    <Switch checked={config?.tcp.output} onClick={() => socket.emit('osc-out')} />
                  </div>
                </div>
                <div className="space-y-2 rounded-2xl border p-6 font-semibold">
                  <div className="flex items-center justify-between">
                    TCP Address
                    <div className="flex items-center gap-1">
                      <Input
                        className="w-3/4 min-w-48"
                        type="text"
                        placeholder="Address"
                        value={config?.tcp.localAddress}
                        onChange={e => socket.emit('tcp-address', e.target.value)}
                      />
                      <p>:</p>
                      <Input
                        className="w-1/4"
                        type="number"
                        placeholder="Port"
                        value={config?.tcp.localPort}
                        onChange={e => socket.emit('tcp-port', parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
