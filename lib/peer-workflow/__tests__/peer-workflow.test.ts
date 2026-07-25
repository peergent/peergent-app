import { describe, expect, it } from "vitest";
import {
  deriveActivityLifecycle,
  findNextScheduledActivity,
  PublicationOrchestrator,
} from "@/lib/peer-workflow";

describe("deriveActivityLifecycle", () => {
  it("returns not_started without an artifact", () => {
    expect(
      deriveActivityLifecycle({
        activity: { id: "a", title: "Blog post" },
      })
    ).toBe("not_started");
  });

  it("returns drafting when isDrafting is true", () => {
    expect(
      deriveActivityLifecycle({
        activity: { id: "a", title: "Blog post" },
        isDrafting: true,
      })
    ).toBe("drafting");
  });

  it("maps draft statuses to waiting_for_review", () => {
    expect(
      deriveActivityLifecycle({
        activity: { id: "a", title: "Blog post" },
        artifact: {
          id: "d1",
          activityReference: "Blog post",
          status: "draft",
          title: "Blog post",
        },
      })
    ).toBe("waiting_for_review");
  });

  it("maps approved to ready_to_publish when publication package is ready", () => {
    expect(
      deriveActivityLifecycle({
        activity: { id: "a", title: "Blog post" },
        artifact: {
          id: "d1",
          activityReference: "Blog post",
          status: "ready_to_publish",
          title: "Blog post",
        },
        publication: {
          activityReference: "Blog post",
          status: "ready",
        },
      })
    ).toBe("ready_to_publish");
  });

  it("maps published artifact to published lifecycle", () => {
    expect(
      deriveActivityLifecycle({
        activity: { id: "a", title: "Blog post" },
        artifact: {
          id: "d1",
          activityReference: "Blog post",
          status: "published",
          title: "Blog post",
        },
        publication: {
          activityReference: "Blog post",
          status: "published",
        },
      })
    ).toBe("published");
  });
});

describe("findNextScheduledActivity", () => {
  it("returns the earliest activity that is not published", () => {
    const activities = [
      { id: "1", title: "Week 1 post", scheduledOrder: 1 },
      { id: "2", title: "Week 2 post", scheduledOrder: 2 },
    ];
    const lifecycle = new Map([
      ["week 1 post", "published" as const],
      ["week 2 post", "not_started" as const],
    ]);
    expect(findNextScheduledActivity(activities, lifecycle)?.title).toBe("Week 2 post");
  });
});

describe("PublicationOrchestrator", () => {
  const orchestrator = new PublicationOrchestrator();

  it("resolves linkedin channel for linkedin_post content type", () => {
    const pkg = orchestrator.preparePublication({
      draftId: "d1",
      activityReference: "Launch post",
      contentType: "linkedin_post",
      title: "Launch",
      body: "Hello world",
    });
    expect(pkg.channel).toBe("linkedin");
    expect(pkg.status).toBe("ready");
    expect(pkg.channelPayload.format).toBe("linkedin_post");
  });

  it("resolves website_cms for blog_article", () => {
    const pkg = orchestrator.preparePublication({
      draftId: "d2",
      activityReference: "Blog slot",
      contentType: "blog_article",
      title: "Blog headline",
      body: "Article body",
      keywords: ["ai", "marketing"],
    });
    expect(pkg.channel).toBe("website_cms");
  });

  it("marks a package as published without external calls", () => {
    const ready = orchestrator.preparePublication({
      draftId: "d3",
      activityReference: "Newsletter",
      contentType: "newsletter",
      title: "Subject",
      body: "Body",
    });
    const published = orchestrator.markPublished(ready);
    expect(published.status).toBe("published");
    expect(published.publishedAt).toBeTruthy();
  });

  it("throws for unsupported content types", () => {
    expect(() =>
      orchestrator.preparePublication({
        draftId: "d4",
        activityReference: "Webinar",
        contentType: "webinar",
        title: "Webinar",
        body: "Body",
      })
    ).toThrow(/No publication channel/);
  });
});
