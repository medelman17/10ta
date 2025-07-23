import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border p-4">
          <h3 className="font-semibold">Active Issues</h3>
          <p className="text-2xl font-bold">0</p>
          <p className="text-xs text-muted-foreground">No issues reported yet</p>
        </div>
        
        <div className="rounded-lg border p-4">
          <h3 className="font-semibold">Pending Communications</h3>
          <p className="text-2xl font-bold">0</p>
          <p className="text-xs text-muted-foreground">All caught up</p>
        </div>
        
        <div className="rounded-lg border p-4">
          <h3 className="font-semibold">Active Petitions</h3>
          <p className="text-2xl font-bold">0</p>
          <p className="text-xs text-muted-foreground">No active petitions</p>
        </div>
        
        <div className="rounded-lg border p-4">
          <h3 className="font-semibold">Upcoming Meetings</h3>
          <p className="text-2xl font-bold">0</p>
          <p className="text-xs text-muted-foreground">No scheduled meetings</p>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="col-span-2 rounded-lg border p-4">
          <h3 className="mb-4 font-semibold">Recent Activity</h3>
          <p className="text-sm text-muted-foreground">No recent activity to display</p>
        </div>
        
        <div className="rounded-lg border p-4">
          <h3 className="mb-4 font-semibold">Quick Actions</h3>
          <div className="flex flex-col gap-2">
            <Link href="/dashboard/issues/new" className="text-sm text-blue-600 hover:underline">
              Report an Issue
            </Link>
            <Link href="/dashboard/communications/new" className="text-sm text-blue-600 hover:underline">
              Log Communication
            </Link>
            <Link href="/dashboard/association/petitions/new" className="text-sm text-blue-600 hover:underline">
              Create Petition
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}