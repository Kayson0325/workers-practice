/**
 * Hello world Worker.
 *
 * Answers JSON on /api/hello. Everything else falls through to a 404 so the
 * difference between "a route I handled" and "nothing matched" is visible
 * while learning.
 */
export interface Env {
  GREETING?: string;
  BUILD_LABEL?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/hello") {
      if (request.method !== "GET") {
        return Response.json(
          { error: { code: "method_not_allowed", message: "Use GET" } },
          { status: 405, headers: { allow: "GET" } }
        );
      }

      return Response.json({
        message: env.GREETING ?? "hello from a Worker",
        label: env.BUILD_LABEL ?? "local",
        method: request.method,
        path: url.pathname,
        colo: request.headers.get("cf-ray")?.split("-").pop() ?? null,
        time: new Date().toISOString(),
      });
    }

    if (url.pathname === "/") {
      return Response.json({
        endpoints: ["/api/hello"],
        note: "This Worker only serves JSON. The static site is a separate Worker.",
      });
    }

    return Response.json(
      { error: { code: "not_found", message: `No route for ${request.method} ${url.pathname}` } },
      { status: 404 }
    );
  },
};
