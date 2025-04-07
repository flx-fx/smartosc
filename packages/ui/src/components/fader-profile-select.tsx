import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog.tsx'
import { Button } from '@/components/ui/button.tsx'
import { ChevronRight, Edit2, FilePlus, Save, Trash } from 'lucide-react'
import { Label } from '@/components/ui/label.tsx'
import { Input } from '@/components/ui/input.tsx'
import { Separator } from '@/components/ui/separator.tsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.tsx'
import { FaderProfile } from '../../../shared/types.ts'
import { socket } from '@/socket.ts'
import { useConfig } from '@/lib/useConfig.ts'
import { DialogClose } from '@radix-ui/react-dialog'

function FaderProfileSelect() {
  const config = useConfig()
  const [profiles, setProfiles] = useState<FaderProfile[]>([])

  useEffect(() => {
    const handleFPsUpdate = (faderProfiles: FaderProfile[]) => setProfiles(faderProfiles)

    socket.emit('fps-get')
    socket.on('fps-update', handleFPsUpdate)

    return () => {
      socket.off('fp-update', handleFPsUpdate)
    }
  }, [])

  return (
    <div className="ml-auto flex gap-2">
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline">
            <FilePlus />
            New profile
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-background/40 backdrop-blur-lg">
          <DialogHeader>
            <DialogTitle>Create new profile</DialogTitle>
            <DialogDescription>
              Enter a name, the number of faders, and the number of fader groups for the profile. You can add more
              faders and groups later.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input id="name" defaultValue="New Profile" className="col-span-3" />
            </div>
            <Separator />
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="fader-number" className="text-right">
                Faders
              </Label>
              <Input id="fader-number" type="number" defaultValue="0" className="col-start-4" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="fader-group-number" className="text-right">
                Fader Groups
              </Label>
              <Input id="fader-group-number" type="number" defaultValue="0" className="col-start-4" />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button
                onClick={() => {
                  const nameElement = document.getElementById('name') as HTMLInputElement | null
                  const faderNumberElement = document.getElementById('fader-number') as HTMLInputElement | null
                  const faderGroupNumberElement = document.getElementById(
                    'fader-group-number',
                  ) as HTMLInputElement | null

                  if (nameElement && faderNumberElement && faderGroupNumberElement) {
                    socket.emit(
                      'fp-create',
                      nameElement.value,
                      parseInt(faderGroupNumberElement.value),
                      parseInt(faderNumberElement.value),
                    )
                  } else {
                    console.error('Error reading inputs')
                  }
                }}
              >
                Create new Profile
                <ChevronRight />
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="flex h-fit w-fit rounded-md border *:-m-[1px]">
        <Select
          value={config ? `${config?.app.faderProfileId}` : undefined}
          onValueChange={value => socket.emit('fp-set-id', value)}
          disabled={!profiles.length}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select Profile" />
          </SelectTrigger>
          <SelectContent>
            {profiles.map(profile => (
              <SelectItem key={profile.id} value={`${profile.id}`}>
                {profile.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="icon" variant="ghost" disabled={!config?.app.faderProfileId}>
              <Edit2 />
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-background/40 backdrop-blur-lg">
            <DialogHeader>
              <DialogTitle>Edit Fader Profile</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editName" className="text-right">
                  Name
                </Label>
                <Input
                  id="editName"
                  className="col-span-3"
                  defaultValue={profiles.find(profile => profile.id === config?.app.faderProfileId)?.name}
                />
              </div>
            </div>
            <Separator />
            <DialogFooter>
              <div className="flex w-full justify-between">
                <DialogClose asChild>
                  <Button variant="destructive" size="icon" onClick={() => socket.emit('fp-delete')}>
                    <Trash />
                  </Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button
                    onClick={() => {
                      const editNameElement = document.getElementById('editName') as HTMLInputElement | null

                      if (editNameElement) {
                        socket.emit('fp-update', editNameElement.value)
                      } else {
                        console.error('Error reading inputs')
                      }
                    }}
                  >
                    <Save />
                    Save
                  </Button>
                </DialogClose>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default FaderProfileSelect
