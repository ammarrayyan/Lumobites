import { NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function POST(request: Request) {
  const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder')
  try {
    const formData = await request.formData()
    const name = formData.get('name')
    const company = formData.get('company')
    const email = formData.get('email')
    const type = formData.get('type')
    const message = formData.get('message')

    await resend.emails.send({
      from: 'no-reply@lumobites.net',
      to: 'info@lumobitespet.com',
      subject: `New Partnership Inquiry — ${type}`,
      html: `
        <h2>New Partnership Inquiry</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Company:</strong> ${company}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Type:</strong> ${type}</p>
        <p><strong>Message:</strong> ${message}</p>
      `
    })

    return NextResponse.redirect(new URL('/partnerships?success=true', request.url), 303)
  } catch (error) {
    console.error('Error sending partnership inquiry:', error);
    return NextResponse.redirect(new URL('/partnerships?error=true', request.url), 303)
  }
}
