import { ChannelSection } from "./_components/channel-section"
import { ProjectsSection } from "./_components/projects-section"

export default function OverviewPage() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold">Overview</h1>
      </div>
      <ChannelSection />
      <ProjectsSection />
    </div>
  )
}
