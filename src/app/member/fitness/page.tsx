import { redirect } from 'next/navigation';

export default function MemberFitnessRedirect() {
  redirect('/member/workouts');
}

