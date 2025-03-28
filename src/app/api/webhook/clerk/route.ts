import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { createUser, getUserByName } from '@/lib/db/utils';

export async function POST(req: Request) {
  // Get the headers
  const headersList = await headers();
  const svix_id = headersList.get('svix-id');
  const svix_timestamp = headersList.get('svix-timestamp');
  const svix_signature = headersList.get('svix-signature');

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error: Missing svix headers', {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your webhook secret
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || '');

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error verifying webhook', {
      status: 400,
    });
  }

  // Get the event type
  const eventType = evt.type;

  console.log(`Webhook with type ${eventType}`);
  console.log('Webhook body:', evt.data);

  // Handle the event based on its type
  if (eventType === 'user.created' || eventType === 'user.updated') {
    const { id, first_name, last_name, username, email_addresses } = evt.data;
    
    // Get a unique identifier for the user (email or username)
    const userEmail = email_addresses && email_addresses.length > 0
      ? email_addresses[0].email_address
      : null;
      
    // Create a display name from the available data
    const displayName = first_name && last_name 
      ? `${first_name} ${last_name}`
      : username || userEmail?.split('@')[0] || id;
      
    try {
      // Check if user already exists in our database
      const existingUser = await getUserByName(displayName);
      
      if (!existingUser) {
        // Create a new user in our database
        await createUser(displayName, id);
        console.log(`Created user ${displayName} in the database`);
      } else {
        console.log(`User ${displayName} already exists in the database`);
      }
    } catch (error) {
      console.error('Error syncing user to database:', error);
    }
  }

  return new Response('Webhook received', {
    status: 200,
  });
} 