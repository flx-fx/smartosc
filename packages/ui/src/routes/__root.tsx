import { createRootRoute, Link, Outlet, useLocation } from '@tanstack/react-router'
import { ThemeToggle } from '@/components/theme-toggle.tsx'
import { CircleX, Home, Settings, SlidersVertical, Terminal } from 'lucide-react'
import { Button } from '@/components/ui/button.tsx'
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb.tsx'
import { ThemeProvider, useTheme } from '@/components/theme-provider.tsx'
import React, { useEffect } from 'react'
import { getId } from '@/lib/utils.ts'
import { socket } from '@/socket.ts'
import ConnectionState from '@/components/connection-state.tsx'
import ErrorToast, { Toaster } from '@/components/ui/sonner.tsx'
import { toast } from 'sonner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert.tsx'
import { useConnection } from '@/lib/useConnection.ts'
import { useConfig } from '@/lib/useConfig.ts'

export const Route = createRootRoute({
  component: Root,
})

function Root() {
  const location = useLocation()
  const { socketConnection } = useConnection()
  const config = useConfig()
  const { setTheme } = useTheme()

  useEffect(() => {
    function onErrorToast(error: Error) {
      toast.custom(t => (
        <ErrorToast t={t}>
          {error.name}: {error.message}
        </ErrorToast>
      ))
    }

    socket.on('t-error', onErrorToast)
    socket.on('exit', () => window.open('', '_self', '')?.close())

    return () => {
      socket.off('t-error', onErrorToast)
    }
  }, [])

  useEffect(() => {
    setTheme(config?.app.theme ? config.app.theme : 'system')
  }, [config])

  return (
    <ThemeProvider>
      <Toaster />
      <div className="flex h-dvh flex-col">
        <header className="h-15 relative flex gap-2 border-b p-4">
          <Breadcrumb>
            <BreadcrumbList>
              <Link to="/">
                <BreadcrumbItem>
                  <h1 className="font-display text-foreground text-lg font-black">SmartOSC</h1>
                  <p className="text-muted-foreground text-sm font-medium">v0.1</p>
                </BreadcrumbItem>
              </Link>
              {location.pathname
                .split('/')
                .slice(1)
                .map(segment =>
                  segment ? (
                    <React.Fragment key={getId()}>
                      <BreadcrumbSeparator />
                      <BreadcrumbItem key={segment}>{segment}</BreadcrumbItem>
                    </React.Fragment>
                  ) : (
                    ''
                  ),
                )}
            </BreadcrumbList>
          </Breadcrumb>
          <ConnectionState />
        </header>
        <div className="flex h-full">
          <nav className="w-13 flex grow-0 flex-col border-r p-2">
            <ul className="space-y-2">
              <li>
                <Link to="/">
                  {({ isActive }) => (
                    <Button size="icon" variant={isActive ? 'secondary' : 'outline'}>
                      <Home />
                    </Button>
                  )}
                </Link>
              </li>
              <li>
                <Link to="/fader-config">
                  {({ isActive }) => (
                    <Button size="icon" variant={isActive ? 'secondary' : 'outline'}>
                      <SlidersVertical />
                    </Button>
                  )}
                </Link>
              </li>
              <li>
                <Link to="/settings">
                  {({ isActive }) => (
                    <Button size="icon" variant={isActive ? 'secondary' : 'outline'}>
                      <Settings />
                    </Button>
                  )}
                </Link>
              </li>
              <li>
                <Link to="/console">
                  {({ isActive }) => (
                    <Button size="icon" variant={isActive ? 'secondary' : 'outline'}>
                      <Terminal />
                    </Button>
                  )}
                </Link>
              </li>
            </ul>

            <div className="mt-auto">
              <ThemeToggle />
            </div>
          </nav>
          <main className="h-[calc(100dvh-var(--spacing)*15)] grow">
            {!socketConnection ? (
              <div className="bg-background/70 absolute left-0 top-0 z-40 flex h-full w-full items-center justify-center p-8 backdrop-blur-lg">
                <Alert
                  variant="destructive"
                  className="w-192 min-w-fit max-w-full border-rose-500 bg-rose-500/20 text-rose-500"
                >
                  <CircleX className="h-4 w-4" />
                  <AlertTitle>SmartOSC server not connected</AlertTitle>
                  <AlertDescription>Please ensure SmartOSC Server is running.</AlertDescription>
                </Alert>
              </div>
            ) : (
              !config && (
                <div className="bg-background/70 absolute left-0 top-0 z-40 flex h-full w-full items-center justify-center p-8 backdrop-blur-lg">
                  <Alert
                    variant="destructive"
                    className="w-192 min-w-fit max-w-full border-rose-500 bg-rose-500/20 text-rose-500"
                  >
                    <CircleX className="h-4 w-4" />
                    <AlertTitle>Config error:</AlertTitle>
                    <AlertDescription>{config ? config : 'Config not defined.'}</AlertDescription>
                  </Alert>
                </div>
              )
            )}
            <Outlet />
          </main>
        </div>
      </div>
    </ThemeProvider>
  )
}
