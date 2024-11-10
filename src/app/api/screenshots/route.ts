import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('screenshot') as File;
    
    if (!file) {
      return NextResponse.json({ 
        status: 'error', 
        message: 'No screenshot provided' 
      }, { status: 400 });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `screenshot-${timestamp}.png`;
    const filepath = join(process.cwd(), 'public', 'screenshots', filename);

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

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

// Helper to validate file type
function validateFileType(file: File) {
  const validTypes = ['image/png', 'image/jpeg'];
  return validTypes.includes(file.type);
}
