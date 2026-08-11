import { NextResponse } from 'next/server';
import { registerUser } from '@/lib/services/auth.service';
import { z } from 'zod';

const registerApiSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = registerApiSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: 'Invalid input data' }, { status: 400 });
    }

    const user = await registerUser({
      name: result.data.name,
      email: result.data.email,
      password: result.data.password,
    });

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    }, { status: 201 });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'User with this email already exists.') {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
