import { auth } from '@/lib/auth/auth';
import prisma from '@/lib/db/prisma';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { TrainingQueryService } from '@/lib/services/training-query.service';
import { Badge } from '@/components/ui/badge';
import { Users, ClipboardList } from 'lucide-react';

export default async function TrainingPage() {
  const session = await auth();
  if (!session?.user) redirect('/auth/login');

  const staff = await prisma.staffProfile.findUnique({ where: { userId: session.user.id } });
  
  if (!staff) {
    return <div>Unauthorized</div>;
  }

  const trainer = await TrainingQueryService.getTrainerProfile(staff.id);

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Trainer Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your assigned clients and their workout plans.</p>
        </div>
      </div>

      {!trainer ? (
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm py-12">
          <CardContent className="flex flex-col items-center justify-center text-center">
            <Users className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground text-sm">You are not registered as a trainer.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Assigned Members</CardTitle>
                <div className="p-2 bg-primary/10 rounded-md">
                  <Users className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold text-foreground">{trainer.assignments.length}</div>
              </CardContent>
            </Card>
            
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Workout Plans</CardTitle>
                <div className="p-2 bg-secondary rounded-md border border-border">
                  <ClipboardList className="h-4 w-4 text-secondary-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold text-foreground">--</div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden">
            <CardHeader>
              <CardTitle className="text-lg font-medium text-foreground">My Clients</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-secondary/50">
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground font-medium pl-6">Name</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Start Date</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Status</TableHead>
                    <TableHead className="text-muted-foreground font-medium pr-6 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trainer.assignments.map(assignment => (
                    <TableRow key={assignment.id} className="border-border hover:bg-secondary/30 transition-colors">
                      <TableCell className="font-medium text-foreground pl-6">
                        {assignment.member.firstName} {assignment.member.lastName}
                      </TableCell>
                      <TableCell className="text-muted-foreground font-mono text-sm">{assignment.createdAt.toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-success/10 text-success border-success/20 font-medium">
                          Active
                        </Badge>
                      </TableCell>
                      <TableCell className="pr-6 text-right">
                        <Link href={`/staff/members/${assignment.memberId}`}>
                          <Button variant="ghost" size="sm" className="h-8 text-primary hover:text-primary hover:bg-primary/10">
                            View Profile
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                  {trainer.assignments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-12 text-sm">
                        No members assigned to you.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
