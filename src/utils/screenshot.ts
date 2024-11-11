import html2canvas from 'html2canvas';

interface ScreenshotResponse {
  success: boolean;
  path: string;
  error?: string;
}

export async function captureScreenshot(): Promise<string> {
  try {
    // Wait for any animations to complete
    await new Promise(resolve => setTimeout(resolve, 500));

    // Capture the entire viewport
    const canvas = await html2canvas(document.body, {
      // Ensure we capture the full page
      windowWidth: document.documentElement.scrollWidth,
      windowHeight: document.documentElement.scrollHeight,
      // Improve quality
      scale: 2,
      // Capture background colors and images
      backgroundColor: null,
      logging: false,
      // Ensure we capture everything
      ignoreElements: (element: Element) => {
        // Ignore the admin panel during capture
        return element instanceof HTMLElement && element.classList.contains('admin-panel');
      }
    });

    // Convert to base64
    const imageData = canvas.toDataURL('image/png');

    // Send to API
    const response = await fetch('/api/screenshots', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'auto-capture',
        imageData,
        timestamp: Date.now()
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to save screenshot');
    }

    const data = await response.json() as ScreenshotResponse;
    
    if (!data.success || !data.path) {
      throw new Error(data.error || 'Failed to process screenshot');
    }

    return data.path;
  } catch (error) {
    console.error('Error capturing screenshot:', error);
    throw error;
  }
}
