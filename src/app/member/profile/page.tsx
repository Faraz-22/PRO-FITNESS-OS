import { requireRole } from '@/lib/auth/utils';
import { Role } from '@prisma/client';
import prisma from '@/lib/db/prisma';
import { notFound } from 'next/navigation';
import { User, Mail, Phone, HeartPulse, UserSquare, Calendar, Users, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default async function MemberProfilePage() {
  const session = await requireRole(Role.MEMBER);
  
  const member = await prisma.memberProfile.findUnique({
    where: { userId: session.id },
    include: {
      branch: true,
      user: true,
    }
  });

  if (!member) return notFound();

  return (
    <div className="p-4 md:p-8 space-y-8 pb-24 md:pb-8 max-w-4xl mx-auto">
      <header className="border-b border-zinc-800/50 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-100">My Profile</h1>
          <p className="text-sm text-zinc-400 mt-2">Manage your personal information and preferences.</p>
        </div>
        <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:text-amber-500 hover:border-amber-500/50 bg-zinc-900/50 hidden">
          Edit Profile
        </Button>
      </header>

      {/* Main Profile Info */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-1/3">
          <Card className="bg-gradient-to-br from-zinc-900 to-zinc-950 border-zinc-800/80 shadow-lg h-full">
            <CardContent className="p-8 flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full bg-zinc-800 border-2 border-amber-500/50 flex items-center justify-center mb-4 text-4xl font-bold text-amber-500">
                {member.firstName.charAt(0)}{member.lastName?.charAt(0) || ''}
              </div>
              <h2 className="text-2xl font-bold text-zinc-100">{member.firstName} {member.lastName}</h2>
              <div className="flex items-center mt-2 text-sm text-zinc-400 bg-zinc-800/50 px-3 py-1 rounded-full">
                <MapPin className="h-3 w-3 mr-1" />
                {member.branch?.name || 'Main Branch'}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="md:w-2/3 space-y-6">
          <Card className="bg-zinc-900/40 border-zinc-800/50">
            <CardHeader className="pb-3 border-b border-zinc-800/50">
              <CardTitle className="text-lg flex items-center text-zinc-200">
                <UserSquare className="w-5 h-5 mr-2 text-amber-500" /> Contact Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ul className="divide-y divide-zinc-800/50">
                <li className="flex items-center justify-between p-4">
                  <div className="flex items-center text-zinc-400">
                    <Mail className="h-4 w-4 mr-3" /> Email
                  </div>
                  <span className="text-zinc-200 font-medium">{member.user?.email || 'Not provided'}</span>
                </li>
                <li className="flex items-center justify-between p-4">
                  <div className="flex items-center text-zinc-400">
                    <Phone className="h-4 w-4 mr-3" /> Phone
                  </div>
                  <span className="text-zinc-200 font-medium">{member.phone || 'Not provided'}</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/40 border-zinc-800/50">
            <CardHeader className="pb-3 border-b border-zinc-800/50">
              <CardTitle className="text-lg flex items-center text-zinc-200">
                <HeartPulse className="w-5 h-5 mr-2 text-amber-500" /> Personal & Health
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ul className="divide-y divide-zinc-800/50">
                <li className="flex items-center justify-between p-4">
                  <div className="flex items-center text-zinc-400">
                    <Calendar className="h-4 w-4 mr-3" /> Date of Birth
                  </div>
                  <span className="text-zinc-200 font-medium">
                    {member.dob ? new Date(member.dob).toLocaleDateString() : 'Not provided'}
                  </span>
                </li>
                <li className="flex items-center justify-between p-4">
                  <div className="flex items-center text-zinc-400">
                    <User className="h-4 w-4 mr-3" /> Gender
                  </div>
                  <span className="text-zinc-200 font-medium">{member.gender || 'Not provided'}</span>
                </li>

              </ul>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/40 border-zinc-800/50">
            <CardHeader className="pb-3 border-b border-zinc-800/50">
              <CardTitle className="text-lg flex items-center text-zinc-200">
                <Users className="w-5 h-5 mr-2 text-amber-500" /> Emergency Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {member.emergencyContactName ? (
                <ul className="divide-y divide-zinc-800/50">
                  <li className="flex items-center justify-between p-4">
                    <div className="flex items-center text-zinc-400">
                      <UserSquare className="h-4 w-4 mr-3" /> Name
                    </div>
                    <span className="text-zinc-200 font-medium">{member.emergencyContactName}</span>
                  </li>
                  <li className="flex items-center justify-between p-4">
                    <div className="flex items-center text-zinc-400">
                      <Phone className="h-4 w-4 mr-3" /> Phone
                    </div>
                    <span className="text-zinc-200 font-medium">{member.emergencyContactPhone || 'Not provided'}</span>
                  </li>
                </ul>
              ) : (
                <div className="p-6 text-center">
                  <p className="text-zinc-500 text-sm">No emergency contact provided.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="text-center pt-4">
            <p className="text-xs text-zinc-500">Need to update your details? Contact the front desk at your branch.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
