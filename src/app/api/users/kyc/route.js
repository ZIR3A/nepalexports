import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectToDatabase from '@/backend/config/db';
import User from '@/backend/models/User';

export async function PUT(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();

    const { phoneNumber, address, avatarUrl, firstName, lastName } = body;

    if (!phoneNumber || !address || !address.street || !address.city || !address.country) {
      return NextResponse.json({ error: 'Missing required KYC fields' }, { status: 400 });
    }

    await connectToDatabase();

    const updatePayload = {
      phoneNumber,
      address,
      kycStatus: 'COMPLETED'
    };

    if (avatarUrl) updatePayload.avatarUrl = avatarUrl;
    if (firstName) updatePayload.firstName = firstName;
    if (lastName) updatePayload.lastName = lastName;

    const updatedUser = await User.findByIdAndUpdate(userId, updatePayload, { new: true });

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('[KYC Update Error]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
