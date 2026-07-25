"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { PgAppShell } from "@/components/design-system";
import BrandPositioningSection from "@/components/knowledge/BrandPositioningSection";
import BrainEntityManager, {
  COMPETITOR_FIELDS,
  CONTENT_FIELDS,
  FACT_FIELDS,
  GOAL_FIELDS,
  PROCESS_FIELDS,
  PRODUCT_FIELDS,
  SEGMENT_FIELDS,
  SERVICE_FIELDS,
  SOURCE_FIELDS,
  buildBrainInput,
  buildContentInput,
  buildFactInput,
  buildGoalInput,
  buildSourceInput,
  buildUpdateFromDraft,
} from "@/components/knowledge/BrainEntityManager";
import CompanyDnaSection from "@/components/knowledge/CompanyDnaSection";
import {
  KNOWLEDGE_SECTIONS,
  parseKnowledgeSection,
  type KnowledgeSectionId,
} from "@/lib/knowledge";
import {
  createBrainProduct,
  createCompetitor,
  createCustomerSegment,
  createFact,
  createInternalProcess,
  createKnowledgeSource,
  createBrainService,
  createMarketingContent,
  createMarketingGoal,
  deleteBrainProduct,
  deleteCompetitor,
  deleteCustomerSegment,
  deleteFact,
  deleteInternalProcess,
  deleteKnowledgeSource,
  deleteBrainService,
  deleteMarketingContent,
  deleteMarketingGoal,
  listBrainProducts,
  listCompetitors,
  listCustomerSegments,
  listFacts,
  listInternalProcesses,
  listKnowledgeSources,
  listBrainServices,
  listMarketingContent,
  listMarketingGoals,
  updateBrainProduct,
  updateCompetitor,
  updateCustomerSegment,
  updateFact,
  updateInternalProcess,
  updateKnowledgeSource,
  updateBrainService,
  updateMarketingContent,
  updateMarketingGoal,
} from "@/lib/knowledge/api";
import { cn } from "@/lib/ui/cn";

export default function KnowledgeManagementView() {
  const searchParams = useSearchParams();
  const section = parseKnowledgeSection(searchParams.get("section"));
  const [activeSection, setActiveSection] = useState<KnowledgeSectionId>(section);

  useEffect(() => {
    setActiveSection(parseKnowledgeSection(searchParams.get("section")));
  }, [searchParams]);

  useEffect(() => {
    const el = document.getElementById(`knowledge-${activeSection}`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [activeSection]);

  const sectionContent = useMemo(() => {
    switch (activeSection) {
      case "company-dna":
        return <CompanyDnaSection />;
      case "brand-positioning":
        return <BrandPositioningSection />;
      case "products":
        return (
          <BrainEntityManager
            title="Products"
            description="Products your company offers."
            emptyLabel="No products yet. Add your first product below."
            addLabel="Add product"
            nameField="name"
            fields={PRODUCT_FIELDS}
            loadItems={listBrainProducts}
            createItem={async (d) => createBrainProduct(buildBrainInput(d) as never)}
            updateItem={async (id, d) => updateBrainProduct(id, buildUpdateFromDraft(d))}
            deleteItem={deleteBrainProduct}
            buildCreateInput={buildBrainInput}
            buildUpdateInput={buildUpdateFromDraft}
          />
        );
      case "services":
        return (
          <BrainEntityManager
            title="Services"
            description="Services your company delivers."
            emptyLabel="No services yet."
            addLabel="Add service"
            nameField="name"
            fields={SERVICE_FIELDS}
            loadItems={listBrainServices}
            createItem={async (d) => createBrainService(buildBrainInput(d) as never)}
            updateItem={async (id, d) => updateBrainService(id, buildUpdateFromDraft(d))}
            deleteItem={deleteBrainService}
            buildCreateInput={buildBrainInput}
            buildUpdateInput={buildUpdateFromDraft}
          />
        );
      case "customer-segments":
        return (
          <BrainEntityManager
            title="Customer segments"
            description="Audience segments for marketing and sales."
            emptyLabel="No customer segments yet."
            addLabel="Add segment"
            nameField="name"
            fields={SEGMENT_FIELDS}
            loadItems={listCustomerSegments}
            createItem={async (d) =>
              createCustomerSegment({
                ...buildBrainInput(d),
                segments: [],
                painPoints: [],
                buyingTriggers: [],
              } as never)
            }
            updateItem={async (id, d) => updateCustomerSegment(id, buildUpdateFromDraft(d))}
            deleteItem={deleteCustomerSegment}
            buildCreateInput={buildBrainInput}
            buildUpdateInput={buildUpdateFromDraft}
          />
        );
      case "competitors":
        return (
          <BrainEntityManager
            title="Competitors"
            description="Competitive landscape."
            emptyLabel="No competitors yet."
            addLabel="Add competitor"
            nameField="name"
            fields={COMPETITOR_FIELDS}
            loadItems={listCompetitors}
            createItem={async (d) =>
              createCompetitor({
                name: d.name?.trim() ?? "",
                website: d.website?.trim(),
                strengths: [],
                weaknesses: [],
                differentiators: [],
                metadata: {},
                sortOrder: 0,
              })
            }
            updateItem={async (id, d) => updateCompetitor(id, buildUpdateFromDraft(d))}
            deleteItem={deleteCompetitor}
            buildCreateInput={buildBrainInput}
            buildUpdateInput={buildUpdateFromDraft}
          />
        );
      case "internal-processes":
        return (
          <BrainEntityManager
            title="Internal processes"
            description="Operational processes inside the company."
            emptyLabel="No internal processes yet."
            addLabel="Add process"
            nameField="name"
            fields={PROCESS_FIELDS}
            loadItems={listInternalProcesses}
            createItem={async (d) =>
              createInternalProcess({
                name: d.name?.trim() ?? "",
                description: d.description?.trim(),
                steps: [],
                metadata: {},
                sortOrder: 0,
              })
            }
            updateItem={async (id, d) => updateInternalProcess(id, buildUpdateFromDraft(d))}
            deleteItem={deleteInternalProcess}
            buildCreateInput={buildBrainInput}
            buildUpdateInput={buildUpdateFromDraft}
          />
        );
      case "facts":
        return (
          <BrainEntityManager
            title="Business facts"
            description="Verified subject–predicate–value facts."
            emptyLabel="No facts yet."
            addLabel="Add fact"
            nameField="subject"
            fields={FACT_FIELDS}
            loadItems={listFacts}
            createItem={async (d) => createFact(buildFactInput(d) as never)}
            updateItem={async (id, d) => updateFact(id, buildUpdateFromDraft(d))}
            deleteItem={deleteFact}
            buildCreateInput={buildFactInput}
            buildUpdateInput={buildUpdateFromDraft}
          />
        );
      case "knowledge-sources":
        return (
          <BrainEntityManager
            title="Knowledge sources"
            description="Reference sources for company knowledge."
            emptyLabel="No knowledge sources yet."
            addLabel="Add source"
            nameField="title"
            fields={SOURCE_FIELDS}
            loadItems={listKnowledgeSources}
            createItem={async (d) => createKnowledgeSource(buildSourceInput(d) as never)}
            updateItem={async (id, d) => updateKnowledgeSource(id, buildUpdateFromDraft(d))}
            deleteItem={deleteKnowledgeSource}
            buildCreateInput={buildSourceInput}
            buildUpdateInput={buildUpdateFromDraft}
          />
        );
      case "marketing-goals":
        return (
          <BrainEntityManager
            title="Marketing goals"
            description="Goals tracked by marketing intelligence."
            emptyLabel="No marketing goals yet."
            addLabel="Add goal"
            nameField="title"
            fields={GOAL_FIELDS}
            loadItems={listMarketingGoals}
            createItem={async (d) => createMarketingGoal(buildGoalInput(d) as never)}
            updateItem={async (id, d) => updateMarketingGoal(id, buildUpdateFromDraft(d))}
            deleteItem={deleteMarketingGoal}
            buildCreateInput={buildGoalInput}
            buildUpdateInput={buildUpdateFromDraft}
          />
        );
      case "marketing-content":
        return (
          <BrainEntityManager
            title="Existing content"
            description="Content the Marketing Peer can reference."
            emptyLabel="No content items yet."
            addLabel="Add content"
            nameField="title"
            fields={CONTENT_FIELDS}
            loadItems={listMarketingContent}
            createItem={async (d) => createMarketingContent(buildContentInput(d) as never)}
            updateItem={async (id, d) => updateMarketingContent(id, buildUpdateFromDraft(d))}
            deleteItem={deleteMarketingContent}
            buildCreateInput={buildContentInput}
            buildUpdateInput={buildUpdateFromDraft}
          />
        );
      default:
        return <CompanyDnaSection />;
    }
  }, [activeSection]);

  return (
    <main className="min-h-screen bg-[var(--pg-color-canvas)] text-[var(--pg-color-text-primary)]">
      <PgAppShell>
        <section className="min-w-0 flex-1 p-5 md:p-8 lg:p-10">
          <header className="mb-8">
            <p className="text-sm font-medium text-[var(--pg-color-accent)]">Company</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">Business context</h1>
            <p className="mt-2 max-w-2xl text-sm text-[var(--pg-color-text-secondary)]">
              Company DNA and marketing profile data your AI team uses to work with full context.
            </p>
          </header>

          <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
            <nav className="space-y-1 lg:sticky lg:top-6 lg:self-start">
              {KNOWLEDGE_SECTIONS.map((item) => (
                <a
                  key={item.id}
                  href={`/company?section=${item.id}`}
                  onClick={() => setActiveSection(item.id)}
                  className={cn(
                    "pg-nav-link",
                    activeSection === item.id && "is-active"
                  )}
                >
                  {item.title}
                </a>
              ))}
            </nav>

            <div id={`knowledge-${activeSection}`} className="scroll-mt-6">
              {sectionContent}
            </div>
          </div>
        </section>
      </PgAppShell>
    </main>
  );
}
