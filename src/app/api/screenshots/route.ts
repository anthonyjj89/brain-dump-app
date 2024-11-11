import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    // Check content type to determine request type
    const contentType = request.headers.get('content-type');
    let buffer: Buffer;
    let filename: string;

    if (contentType?.includes('multipart/form-data')) {
      // Handle file upload
      const formData = await request.formData();
      const file = formData.get('file') as File | null;

      if (!file) {
        return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      buffer = Buffer.from(bytes);
      filename = `screenshot-${Date.now()}.png`;
    } else {
      // Handle automatic screen capture
      const data = await request.json();
      
      if (!data.type || data.type !== 'auto-capture') {
        return NextResponse.json({ error: 'Invalid request type' }, { status: 400 });
      }

      // For auto-capture, we'll receive the base64 image data from html2canvas
      // in the frontend after the AdminPanel is hidden
      const imageData = data.imageData;
      if (!imageData) {
        return NextResponse.json({ error: 'No image data provided' }, { status: 400 });
      }

      // Remove the data URL prefix and convert to buffer
      const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
      buffer = Buffer.from(base64Data, 'base64');
      filename = `screenshot-${data.timestamp || Date.now()}.png`;
    }

    // Ensure screenshots directory exists
    const screenshotsDir = join(process.cwd(), 'public', 'screenshots');
    const path = join(screenshotsDir, filename);

    // Write the file
    await writeFile(path, buffer);

    // Return the path to the saved screenshot
    return NextResponse.json({ 
      success: true, 
      path: `/screenshots/${filename}` 
    });
  } catch (error) {
    console.error('Error handling screenshot:', error);
    return NextResponse.json({ 
      error: 'Failed to process screenshot',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
