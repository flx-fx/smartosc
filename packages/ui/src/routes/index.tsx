import { createFileRoute, Link } from '@tanstack/react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.tsx'
import { Button } from '@/components/ui/button.tsx'
import { Settings, SlidersVertical, Terminal } from 'lucide-react'

export const Route = createFileRoute('/')({
  component: Index,
})

function Index() {
  return (
    <div className="flex h-full items-center justify-center p-2">
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-2xl font-black">Welcome to SmartOSC!</CardTitle>
          <CardDescription>Use your ETC SmartFade Series console as a fader wing for ETC EOS.</CardDescription>
        </CardHeader>
        <CardContent className="mx-4 overflow-hidden rounded-lg border p-0">
          <Link to={'/fader-config'}>
            <Button className="w-full justify-start rounded-none border-b" variant="ghost" size="lg">
              <SlidersVertical />
              Fader Configuration
            </Button>
          </Link>
          <Link to={'/settings'}>
            <Button className="w-full justify-start rounded-none border-b" variant="ghost" size="lg">
              <Settings />
              Settings
            </Button>
          </Link>
          <Link to={'/console'}>
            <Button className="w-full justify-start rounded-none" variant="ghost" size="lg">
              <Terminal />
              Console
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
