// ComingSoon: placeholder page for sections not built yet. Props: title (page heading).
// Shows the title as the page h1 with a centred empty-state card beneath it.
import { PageHeader } from '../ui/PageHeader.jsx'
import { EmptyState } from '../ui/EmptyState.jsx'
import { InboxIcon } from '../ui/icons.jsx'

export default function ComingSoon({ title }) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={title} />
      <EmptyState
        icon={<InboxIcon className="h-6 w-6" />}
        title="This page is coming soon"
        description="We're still building this section. Check back in a future update."
      />
    </div>
  )
}
