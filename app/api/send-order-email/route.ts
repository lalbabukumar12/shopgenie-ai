import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(req: Request) {
  try {
    const { email, orderId, productName, price, address } = await req.json();

    if (!email || !orderId || !productName || !price || !address) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      console.log(`[ShopGenie Mock Email] To: ${email} | Subject: Order Confirmation - ${orderId}`);
      console.log(`[ShopGenie Mock Email] Body: productName="${productName}", price="${price}", address="${address}"`);
      return NextResponse.json({
        success: true,
        mock: true,
        message: 'Mock email logged to console (RESEND_API_KEY is not configured)',
      });
    }

    const resend = new Resend(apiKey);

    const htmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #1a202c;">
        <h2 style="color: #6366f1; margin-bottom: 5px;">Order Placed Successfully!</h2>
        <p style="font-size: 14px; color: #4a5568; margin-top: 0;">Thank you for shopping with ShopGenie AI.</p>
        <hr style="border: 0; border-top: 1px solid #edf2f7; margin: 20px 0;" />
        
        <table style="width: 100%; font-size: 14px;">
          <tr>
            <td style="padding: 5px 0; color: #718096; width: 120px;"><strong>Order ID:</strong></td>
            <td style="padding: 5px 0; color: #2d3748;"><strong>${orderId}</strong></td>
          </tr>
          <tr>
            <td style="padding: 5px 0; color: #718096;"><strong>Product Details:</strong></td>
            <td style="padding: 5px 0; color: #2d3748;">${productName}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0; color: #718096;"><strong>Total Amount:</strong></td>
            <td style="padding: 5px 0; color: #38a169; font-weight: bold;">₹${price.toLocaleString("en-IN")}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0; color: #718096; vertical-align: top;"><strong>Delivery Address:</strong></td>
            <td style="padding: 5px 0; color: #2d3748; line-height: 1.4;">${address}</td>
          </tr>
        </table>
        
        <hr style="border: 0; border-top: 1px solid #edf2f7; margin: 20px 0;" />
        <p style="font-size: 11px; color: #a0aec0; text-align: center; margin: 0;">
          ShopGenie AI Laptop Shopping Assistant
        </p>
      </div>
    `;

    const data = await resend.emails.send({
      from: 'ShopGenie AI <onboarding@resend.dev>',
      to: email,
      subject: `Order Confirmation - ${orderId}`,
      html: htmlContent,
    });

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    console.error('Error sending Resend email:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to send confirmation email';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
