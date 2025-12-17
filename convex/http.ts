import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();
export const doSomething = httpAction(async (ctx, request) => {
  const { data, type } = await request.json();
  console.log(data);

  switch (type) {
    case "user.created":
      await ctx.runMutation(internal.users.createUserInDB, {
        clerkId: data.id,
        email: data.email_addresses[0].email_address,
        imageUrl: data.image_url,
      });
      break;
    case "user.updated":
      console.log("user update");
      break;
  }

  return new Response(null, { status: 200 });
});

// https://befitting-bullfrog-206.convex.site/clerk-users-hook

http.route({
  path: "/clerk-users-hook",
  method: "POST",
  handler: doSomething,
});

export default http;
