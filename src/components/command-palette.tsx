import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { useIsMobile } from '@/lib/hooks/use-mobile'
import { Command } from 'cmdk'
import {
  IconSearch,
  IconFolder,
  IconNotes,
  IconPlayerPlay,
  IconPlus,
  IconLayoutDashboard,
  IconChecklist,
  IconClock,
  IconBook,
} from '@tabler/icons-react'
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

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Global Command Palette"
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] sm:pt-[18vh] px-4"
    >
      <div
        className="fixed inset-0 bg-foreground/20 backdrop-blur-xs transition-opacity"
        onClick={() => setOpen(false)}
      />
      <div className="relative z-50 w-full max-w-lg overflow-hidden rounded-xl bg-card border border-border shadow-xl animate-in fade-in zoom-in-95">
        <div className="flex items-center border-b border-border px-3.5">
          <IconSearch className="mr-2.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <Command.Input
            value={search}
            onValueChange={setSearch}
            placeholder="Type a command or search..."
            className="flex h-11 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        <Command.List className="max-h-[320px] overflow-y-auto overflow-x-hidden p-2">
          <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
            No results found.
          </Command.Empty>

          <Command.Group
            heading="Actions"
            className="px-2 py-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider"
          >
            {search && (
              <Command.Item
                onSelect={() =>
                  runCommand(() => navigate('/notes', { state: { quickAdd: search } }))
                }
                className="relative flex cursor-pointer select-none items-center rounded-md px-2.5 py-2 text-sm outline-none aria-selected:bg-secondary aria-selected:text-secondary-foreground"
              >
                <IconPlus className="mr-2.5 h-4 w-4 text-primary" />
                Quick Capture: "{search}"
              </Command.Item>
            )}
            {!activeTimer && (
              <Command.Item
                onSelect={() => runCommand(() => startTimer(undefined, ''))}
                className="relative flex cursor-pointer select-none items-center rounded-md px-2.5 py-2 text-sm outline-none aria-selected:bg-secondary aria-selected:text-secondary-foreground"
              >
                <IconPlayerPlay className="mr-2.5 h-4 w-4 text-tertiary-foreground" />
                Start Focus Timer
              </Command.Item>
            )}
            <Command.Item
              onSelect={() => runCommand(() => navigate('/notes/new'))}
              className="relative flex cursor-pointer select-none items-center rounded-md px-2.5 py-2 text-sm outline-none aria-selected:bg-secondary aria-selected:text-secondary-foreground"
            >
              <IconNotes className="mr-2.5 h-4 w-4 text-muted-foreground" />
              New Note
            </Command.Item>
          </Command.Group>

          {projects.length > 0 && (
            <Command.Group
              heading="Projects"
              className="px-2 py-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider mt-1"
            >
              {projects.map((project) => (
                <Command.Item
                  key={project.id}
                  value={project.name}
                  onSelect={() => runCommand(() => navigate(`/projects/${project.id}`))}
                  className="relative flex cursor-pointer select-none items-center rounded-md px-2.5 py-2 text-sm outline-none aria-selected:bg-secondary aria-selected:text-secondary-foreground"
                >
                  <IconFolder className="mr-2.5 h-4 w-4 text-muted-foreground" />
                  {project.name}
                </Command.Item>
              ))}
            </Command.Group>
          )}

          {notes.length > 0 && (
            <Command.Group
              heading="Notes"
              className="px-2 py-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider mt-1"
            >
              {notes.slice(0, 8).map((note) => (
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
                  className="relative flex cursor-pointer select-none items-center rounded-md px-2.5 py-2 text-sm outline-none aria-selected:bg-secondary aria-selected:text-secondary-foreground"
                >
                  <IconNotes className="mr-2.5 h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{note.title}</span>
                </Command.Item>
              ))}
            </Command.Group>
          )}

          <Command.Group
            heading="Navigation"
            className="px-2 py-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider mt-1"
          >
            <Command.Item
              onSelect={() => runCommand(() => navigate('/'))}
              className="relative flex cursor-pointer select-none items-center rounded-md px-2.5 py-2 text-sm outline-none aria-selected:bg-secondary aria-selected:text-secondary-foreground"
            >
              <IconLayoutDashboard className="mr-2.5 h-4 w-4 text-muted-foreground" />
              Dashboard
            </Command.Item>
            <Command.Item
              onSelect={() => runCommand(() => navigate('/tasks'))}
              className="relative flex cursor-pointer select-none items-center rounded-md px-2.5 py-2 text-sm outline-none aria-selected:bg-secondary aria-selected:text-secondary-foreground"
            >
              <IconChecklist className="mr-2.5 h-4 w-4 text-muted-foreground" />
              Tasks
            </Command.Item>
            <Command.Item
              onSelect={() => runCommand(() => navigate('/projects'))}
              className="relative flex cursor-pointer select-none items-center rounded-md px-2.5 py-2 text-sm outline-none aria-selected:bg-secondary aria-selected:text-secondary-foreground"
            >
              <IconFolder className="mr-2.5 h-4 w-4 text-muted-foreground" />
              Projects
            </Command.Item>
            <Command.Item
              onSelect={() => runCommand(() => navigate('/timesheet'))}
              className="relative flex cursor-pointer select-none items-center rounded-md px-2.5 py-2 text-sm outline-none aria-selected:bg-secondary aria-selected:text-secondary-foreground"
            >
              <IconClock className="mr-2.5 h-4 w-4 text-muted-foreground" />
              Timesheet
            </Command.Item>
            <Command.Item
              onSelect={() => runCommand(() => navigate('/notes'))}
              className="relative flex cursor-pointer select-none items-center rounded-md px-2.5 py-2 text-sm outline-none aria-selected:bg-secondary aria-selected:text-secondary-foreground"
            >
              <IconNotes className="mr-2.5 h-4 w-4 text-muted-foreground" />
              Notes
            </Command.Item>
            <Command.Item
              onSelect={() => runCommand(() => navigate('/books'))}
              className="relative flex cursor-pointer select-none items-center rounded-md px-2.5 py-2 text-sm outline-none aria-selected:bg-secondary aria-selected:text-secondary-foreground"
            >
              <IconBook className="mr-2.5 h-4 w-4 text-muted-foreground" />
              Books
            </Command.Item>
          </Command.Group>
        </Command.List>
      </div>
    </Command.Dialog>
  )
}
