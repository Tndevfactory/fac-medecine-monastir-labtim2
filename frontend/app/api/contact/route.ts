import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { nom, prenom, email, sujet, contenu } = await req.json();

    // Send email using backend API endpoint
    const backendResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_URL}/send-contact-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nom, prenom, email, sujet, contenu }),
    });

    if (!backendResponse.ok) {
      const error = await backendResponse.text();
      return NextResponse.json({ success: false, message: error }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Message envoyé avec succès.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Erreur lors de l\'envoi du message.' }, { status: 500 });
  }
}
