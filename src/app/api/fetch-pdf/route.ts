import { NextRequest, NextResponse } from 'next/server';
import { FetchClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Extract forward headers
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);

    // Initialize client
    const config = new Config();
    const client = new FetchClient(config, customHeaders);

    // Fetch URL content
    const response = await client.fetch(url);

    // Check if fetch was successful
    if (response.status_code !== 0) {
      return NextResponse.json(
        { error: response.status_message || 'Failed to fetch URL' },
        { status: 500 }
      );
    }

    // Extract text content
    const textContent = response.content
      .filter(item => item.type === 'text')
      .map(item => item.text)
      .join('\n');

    return NextResponse.json({
      title: response.title,
      url: response.url,
      filetype: response.filetype,
      content: textContent,
      publish_time: response.publish_time,
    });
  } catch (error) {
    console.error('Error fetching PDF:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
