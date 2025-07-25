import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/sign-in");
  }

  // Get user's current building context
  const currentTenancy = user.tenancies.find(t => t.isCurrent);
  const buildingId = currentTenancy?.unit.buildingId || user.buildingRoles[0]?.buildingId;

  if (!buildingId) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No building association found. Please contact support.</p>
      </div>
    );
  }

  // Fetch actual counts from database
  const [
    activeIssuesCount,
    pendingCommunicationsCount,
    activePetitionsCount,
    upcomingMeetingsCount,
    recentIssues
  ] = await Promise.all([
    // Active issues (OPEN or IN_PROGRESS) for the user
    prisma.issue.count({
      where: {
        reporterId: user.id,
        buildingId,
        status: {
          in: ['OPEN', 'IN_PROGRESS', 'AWAITING_LANDLORD']
        }
      }
    }),
    
    // Pending communications (requiring follow-up)
    prisma.communication.count({
      where: {
        userId: user.id,
        followUpRequired: true,
        followUpCompleted: false
      }
    }),
    
    // Active petitions in the building
    prisma.petition.count({
      where: {
        buildingId,
        status: 'OPEN'
      }
    }),
    
    // Upcoming meetings in the next 30 days
    prisma.meeting.count({
      where: {
        buildingId,
        scheduledFor: {
          gte: new Date(),
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      }
    }),
    
    // Recent issues for activity feed
    prisma.issue.findMany({
      where: {
        buildingId,
        OR: [
          { reporterId: user.id },
          { isPublic: true }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        reporter: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        unit: {
          select: {
            unitNumber: true
          }
        }
      }
    })
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border p-4">
          <h3 className="font-semibold">Active Issues</h3>
          <p className="text-2xl font-bold">{activeIssuesCount}</p>
          <p className="text-xs text-muted-foreground">
            {activeIssuesCount === 0 ? 'No issues reported yet' : `${activeIssuesCount} issue${activeIssuesCount === 1 ? '' : 's'} in progress`}
          </p>
        </div>
        
        <div className="rounded-lg border p-4">
          <h3 className="font-semibold">Pending Communications</h3>
          <p className="text-2xl font-bold">{pendingCommunicationsCount}</p>
          <p className="text-xs text-muted-foreground">
            {pendingCommunicationsCount === 0 ? 'All caught up' : `${pendingCommunicationsCount} need${pendingCommunicationsCount === 1 ? 's' : ''} follow-up`}
          </p>
        </div>
        
        <div className="rounded-lg border p-4">
          <h3 className="font-semibold">Active Petitions</h3>
          <p className="text-2xl font-bold">{activePetitionsCount}</p>
          <p className="text-xs text-muted-foreground">
            {activePetitionsCount === 0 ? 'No active petitions' : `${activePetitionsCount} petition${activePetitionsCount === 1 ? '' : 's'} open`}
          </p>
        </div>
        
        <div className="rounded-lg border p-4">
          <h3 className="font-semibold">Upcoming Meetings</h3>
          <p className="text-2xl font-bold">{upcomingMeetingsCount}</p>
          <p className="text-xs text-muted-foreground">
            {upcomingMeetingsCount === 0 ? 'No scheduled meetings' : `Next ${upcomingMeetingsCount === 1 ? 'meeting' : upcomingMeetingsCount + ' meetings'} in 30 days`}
          </p>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="col-span-2 rounded-lg border p-4">
          <h3 className="mb-4 font-semibold">Recent Activity</h3>
          {recentIssues.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent activity to display</p>
          ) : (
            <div className="space-y-2">
              {recentIssues.map((issue) => (
                <div key={issue.id} className="flex items-center justify-between text-sm">
                  <div>
                    <Link 
                      href={`/dashboard/issues/${issue.id}`}
                      className="font-medium hover:underline"
                    >
                      {issue.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      Unit {issue.unit.unitNumber} • {new Date(issue.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    issue.status === 'OPEN' ? 'bg-blue-100 text-blue-800' :
                    issue.status === 'IN_PROGRESS' ? 'bg-purple-100 text-purple-800' :
                    issue.status === 'AWAITING_LANDLORD' ? 'bg-yellow-100 text-yellow-800' :
                    issue.status === 'RESOLVED' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {issue.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          )}
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