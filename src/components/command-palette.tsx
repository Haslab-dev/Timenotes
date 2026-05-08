import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useIsMobile } from '@/lib/hooks/use-mobile'
import { Command } from 'cmdk'
import { Search, Folder, FileText, Play, Plus } from 'lucide-react'
import { useProjects } from '@/features/projects/hooks/use-projects'
import { useNotes } from '@/features/notes/hooks/use-notes'
import { useActiveTimer } from '@/features/timesheet/hooks/use-active-timer'

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const [, setSearchParams] = useSearchParams()

  const { data: projects = [] } = useProjects()
  const { data: notes = [] } = useNotes()
  const { startTimer, activeTimer } = useActiveTimer()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const runCommand = (command: () => void) => {
    setOpen(false)
    command()
  }

  // Quick capture regex: matches "projectname 2h description" or "metdesk 2h fixing build #urgent"
  // It's a bit complex, we can just let users type and provide a generic "Quick Capture" action if the search is not empty.

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Global Command Palette"
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] sm:pt-[20vh]"
    >
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
        onClick={() => setOpen(false)}
      />
      <div className="relative z-50 w-full max-w-[600px] overflow-hidden rounded-xl bg-card border shadow-2xl animate-in fade-in zoom-in-95">
        <div className="flex items-center border-b px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
          <Command.Input
            value={search}
            onValueChange={setSearch}
            placeholder="Type a command or search..."
            className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        <Command.List className="max-h-[300px] overflow-y-auto overflow-x-hidden p-2">
          <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
            No results found.
          </Command.Empty>

          <Command.Group
            heading="Actions"
            className="px-2 py-1.5 text-xs font-medium text-muted-foreground"
          >
            {search && (
              <Command.Item
                onSelect={() =>
                  runCommand(() => navigate('/notes', { state: { quickAdd: search } }))
                }
                className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
              >
                <Plus className="mr-2 h-4 w-4" />
                Quick Capture: "{search}"
              </Command.Item>
            )}
            {!activeTimer && (
              <Command.Item
                onSelect={() => runCommand(() => startTimer(undefined, ''))}
                className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground"
              >
                <Play className="mr-2 h-4 w-4" />
                Start Timer
              </Command.Item>
            )}
            <Command.Item
              onSelect={() => runCommand(() => navigate('/notes/new'))}
              className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground"
            >
              <FileText className="mr-2 h-4 w-4" />
              New Note
            </Command.Item>
          </Command.Group>

          {projects.length > 0 && (
            <Command.Group
              heading="Projects"
              className="px-2 py-1.5 text-xs font-medium text-muted-foreground mt-2"
            >
              {projects.map((project) => (
                <Command.Item
                  key={project.id}
                  value={project.name}
                  onSelect={() => runCommand(() => navigate(`/projects/${project.id}`))}
                  className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground"
                >
                  <Folder className="mr-2 h-4 w-4" />
                  {project.name}
                </Command.Item>
              ))}
            </Command.Group>
          )}

          {notes.length > 0 && (
            <Command.Group
              heading="Notes"
              className="px-2 py-1.5 text-xs font-medium text-muted-foreground mt-2"
            >
              {notes.map((note) => (
                <Command.Item
                  key={note.id}
                  value={note.title}
                  onSelect={() =>
                    runCommand(() => {
                      if (isMobile) {
                        navigate(`/notes/${note.id}/edit`)
                      } else {
                        setSearchParams({ noteId: note.id })
                      }
                    })
                  }
                  className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  {note.title}
                </Command.Item>
              ))}
            </Command.Group>
          )}

          <Command.Group
            heading="Navigation"
            className="px-2 py-1.5 text-xs font-medium text-muted-foreground mt-2"
          >
            <Command.Item
              onSelect={() => runCommand(() => navigate('/'))}
              className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground"
            >
              Dashboard
            </Command.Item>
            <Command.Item
              onSelect={() => runCommand(() => navigate('/projects'))}
              className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground"
            >
              Projects
            </Command.Item>
            <Command.Item
              onSelect={() => runCommand(() => navigate('/timesheet'))}
              className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground"
            >
              Timesheet
            </Command.Item>
            <Command.Item
              onSelect={() => runCommand(() => navigate('/notes'))}
              className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground"
            >
              Notes
            </Command.Item>
          </Command.Group>
        </Command.List>
      </div>
    </Command.Dialog>
  )
}
