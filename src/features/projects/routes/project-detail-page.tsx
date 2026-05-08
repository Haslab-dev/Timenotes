import { useParams } from 'react-router-dom'
import { ProjectDetail } from '../components/project-detail'

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()

  if (!id) {
    return <div className="text-center py-8 text-destructive">Project not found</div>
  }

  return <ProjectDetail projectId={id} />
}
