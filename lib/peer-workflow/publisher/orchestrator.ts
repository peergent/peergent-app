import { DEFAULT_PUBLICATION_ADAPTERS } from "./channels";
import type {
  PreparePublicationInput,
  PublicationChannelAdapter,
  PublicationPackage,
  ResolvePublicationChannelInput,
} from "./types";

export class PublicationOrchestrator {
  private readonly adapters: PublicationChannelAdapter[];

  constructor(adapters: PublicationChannelAdapter[] = DEFAULT_PUBLICATION_ADAPTERS) {
    this.adapters = adapters;
  }

  listChannels(): PublicationChannelAdapter[] {
    return [...this.adapters];
  }

  resolveChannel(input: ResolvePublicationChannelInput): PublicationChannelAdapter {
    const normalizedType = input.contentType.trim().toLowerCase();

    if (input.channel) {
      const channelHint = input.channel;
      const byHint = this.adapters.find(
        (adapter) =>
          adapter.channelId === channelHint ||
          adapter.displayName.toLowerCase() === channelHint.toLowerCase()
      );
      if (byHint) {
        return byHint;
      }
    }

    const match = this.adapters.find((adapter) => adapter.supportsContentType(normalizedType));
    if (!match) {
      throw new Error(
        `No publication channel registered for content type "${input.contentType}".`
      );
    }
    return match;
  }

  preparePublication(input: PreparePublicationInput): PublicationPackage {
    const adapter = this.resolveChannel({
      contentType: input.contentType,
      channel: input.channel,
    });
    return adapter.preparePublication(input);
  }

  markPublished(pkg: PublicationPackage): PublicationPackage {
    return {
      ...pkg,
      status: "published",
      publishedAt: new Date().toISOString(),
    };
  }
}

export const defaultPublicationOrchestrator = new PublicationOrchestrator();
