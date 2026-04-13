import { NextRequest, NextResponse } from 'next/server';
import { FetchClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Extract headers for proper request tracing
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);

    // Initialize SDK client
    const config = new Config();
    const client = new FetchClient(config, customHeaders);

    // Fetch and parse the document
    const response = await client.fetch(url);

    // Check if fetch was successful
    if (response.status_code !== 0 && response.status_code !== undefined) {
      return NextResponse.json(
        {
          error: 'Failed to fetch document',
          statusMessage: response.status_message,
          statusCode: response.status_code,
        },
        { status: 500 }
      );
    }

    // Extract text content
    const textContent = response.content
      .filter(item => item.type === 'text')
      .map(item => item.text)
      .join('\n');

    // Extract images if any
    const images = response.content
      .filter(item => item.type === 'image')
      .map(item => ({
        imageUrl: item.image?.display_url,
        thumbnail: item.image?.thumbnail_display_url,
        width: item.image?.width,
        height: item.image?.height,
      }));

    return NextResponse.json({
      success: true,
      data: {
        title: response.title,
        url: response.url,
        docId: response.doc_id,
        filetype: response.filetype,
        publishTime: response.publish_time,
        textContent,
        images,
        displayInfo: response.display_info,
      },
    });
  } catch (error) {
    console.error('Error fetching document:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
