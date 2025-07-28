import { ImapFlow } from "imapflow";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const uid = searchParams.get("uid");

  const client = new ImapFlow({
    host: process.env.IMAP_HOST!,
    port: parseInt(process.env.IMAP_PORT!),
    secure: true,
    auth: {
      user: process.env.IMAP_USER!,
      pass: process.env.IMAP_PASS!,
    },
    logger: false,
  });

  try {
    await client.connect();

    const mailbox = await client.mailboxOpen("INBOX");

    if (uid) {
      const message = await client.fetchOne(uid, {
        envelope: true,
        uid: true,
        flags: true,
        bodyStructure: true,
        headers: true,
        bodyParts: ["text", "html"],
      });

      if (message) {
        const textPart = message.bodyParts?.get("text");
        const htmlPart = message.bodyParts?.get("html");

        let content = "";
        if (textPart) {
          content = textPart.toString();
        } else if (htmlPart) {
          content = htmlPart.toString();
        }

        await client.logout();

        return NextResponse.json({
          email: {
            uid: message.uid,
            subject: message.envelope?.subject || "No Subject",
            from: message.envelope?.from?.[0] || { name: "Unknown", address: "unknown@email.com" },
            to: message.envelope?.to || [],
            cc: message.envelope?.cc || [],
            date: message.envelope?.date || new Date(),
            flags: message.flags,
            content: content,
            hasHtml: !!htmlPart,
          },
        });
      }
    }

    const messages = [];
    for await (const message of client.fetch("1:*", {
      envelope: true,
      uid: true,
      flags: true,
      bodyStructure: true,
      headers: ["date", "subject"],
      bodyParts: ["text"],
    })) {
      const textPart = message.bodyParts?.get("text");
      let textContent = "";

      if (textPart) {
        textContent = textPart.toString();
      }

      messages.push({
        uid: message.uid,
        subject: message.envelope?.subject || "No Subject",
        from: message.envelope?.from?.[0] || { name: "Unknown", address: "unknown@email.com" },
        date: message.envelope?.date || new Date(),
        flags: message.flags,
        preview: textContent,
      });
    }

    await client.logout();

    return NextResponse.json({
      emails: messages.reverse(),
      total: mailbox.exists,
    });
  } catch (error) {
    console.error("IMAP Error:", error);
    return NextResponse.json({ error: "Failed to fetch emails" }, { status: 500 });
  }
}
