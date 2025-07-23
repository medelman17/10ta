import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { grantSuperuserAccess } from "@/lib/superuser";

export async function POST(req: Request) {
  // Get the headers
  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Error occured -- no svix headers", {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your webhook secret
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || "");

  let evt: WebhookEvent;

  // Verify the webhook
  try {
    evt = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error occured", {
      status: 400,
    });
  }

  // Handle the webhook
  const eventType = evt.type;

  if (eventType === "user.created" || eventType === "user.updated") {
    const { id, email_addresses, first_name, last_name, phone_numbers } = evt.data;
    
    const email = email_addresses[0]?.email_address;
    if (!email) {
      return new Response("No email found", { status: 400 });
    }

    try {
      const user = await prisma.user.upsert({
        where: { clerkId: id },
        update: {
          email,
          firstName: first_name || null,
          lastName: last_name || null,
          phone: phone_numbers[0]?.phone_number || null,
        },
        create: {
          clerkId: id,
          email,
          firstName: first_name || null,
          lastName: last_name || null,
          phone: phone_numbers[0]?.phone_number || null,
        },
      });
      
      // Grant superuser access if applicable
      await grantSuperuserAccess(user.id, email);
    } catch (error) {
      console.error("Error syncing user:", error);
      return new Response("Error syncing user", { status: 500 });
    }
  }

  if (eventType === "user.deleted") {
    const { id } = evt.data;
    
    try {
      // For now, we'll keep the user record but you might want to handle this differently
      // e.g., soft delete, anonymize, or transfer ownership of their data
      console.log("User deleted:", id);
    } catch (error) {
      console.error("Error handling user deletion:", error);
      return new Response("Error handling deletion", { status: 500 });
    }
  }

  return new Response("Webhook processed", { status: 200 });
}