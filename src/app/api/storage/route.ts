import { NextResponse } from 'next/server';
import { createServerClient } from '@/utils/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const bucket = searchParams.get('bucket');
  const path = searchParams.get('path') || '';
  
  // Create a server-side client with admin privileges
  const supabase = createServerClient();
  
  try {
    // Get a signed URL for a file
    if (action === 'getSignedUrl' && bucket && path) {
      console.log(`API - Getting signed URL for: ${bucket}/${path}`);
      
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, 60 * 60); // 1 hour expiration
        
      if (error) {
        console.error('API - getSignedUrl error:', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      
      return NextResponse.json({ signedUrl: data.signedUrl });
    }
    
    // Download a file directly
    if (action === 'download' && bucket && path) {
      console.log(`API - Downloading: ${bucket}/${path}`);
      
      const { data, error } = await supabase.storage
        .from(bucket)
        .download(path);
        
      if (error) {
        console.error('API - download error:', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      
      // Convert the blob to an array buffer
      const buffer = await data.arrayBuffer();
      
      // Get the filename from the path
      const filename = path.split('/').pop() || 'download';
      
      // Return the file with appropriate headers
      const headers = new Headers();
      headers.set('Content-Type', data.type);
      headers.set('Content-Disposition', `attachment; filename=${filename}`);
      
      return new Response(buffer, { headers });
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    
  } catch (error: any) {
    console.error('Storage API error:', error);
    return NextResponse.json({ error: error.message || 'An unexpected error occurred' }, { status: 500 });
  }
}