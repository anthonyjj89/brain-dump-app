import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    // Check if the request is JSON (from screen capture) or FormData (from file upload)
    const contentType = request.headers.get('content-type');
    let buffer: Buffer;
    const timestamp = Date.now();
    const filename = `screenshot-${timestamp}.png`;
    const filepath = join(process.cwd(), 'public', 'screenshots', filename);

    if (contentType?.includes('application/json')) {
      // Handle base64 image data from screen capture
      const data = await request.json();
      const base64Data = data.imageData.replace(/^data:image\/\w+;base64,/, '');
      buffer = Buffer.from(base64Data, 'base64');
    } else {
      // Handle form data from file upload
      const formData = await request.formData();
      const file = formData.get('screenshot') as File;
      
      if (!file) {
        return NextResponse.json({ 
          status: 'error', 
          message: 'No screenshot provided' 
        }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      buffer = Buffer.from(bytes);
    }

    // Save file
    await writeFile(filepath, buffer);

    // Return the public URL path
    const publicPath = `/screenshots/${filename}`;

    return NextResponse.json({
      status: 'success',
      data: {
        path: publicPath,
        timestamp: new Date(timestamp)
      }
    });
  } catch (error) {
    console.error('Error saving screenshot:', error);
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to save screenshot'
    }, { status: 500 });
  }
}
