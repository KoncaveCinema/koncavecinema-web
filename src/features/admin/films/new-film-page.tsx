"use client";

import { useRouter } from "next/navigation";

import { PageHeader } from "@/components/console/page-header";
import { Panel } from "@/components/console/panel";

import { FilmForm } from "./film-form";
import { useCreateFilm } from "./queries";

/** /admin/films/new: start a draft, then add its posters, videos and certificate on its page. */
export function NewFilmPage() {
  const router = useRouter();
  const create = useCreateFilm();
  return (
    <>
      <PageHeader
        title="New film"
        crumbs={[{ href: "/admin/films", label: "Films" }]}
        description="Start with the details. Posters, the master, the trailer and the certificate are added on the film's page next."
      />
      <Panel title="Details" className="max-w-3xl">
        <FilmForm
          submitLabel="Create draft"
          pendingLabel="Creating…"
          onCancel={() => router.push("/admin/films")}
          onSubmit={async (input) => {
            const { id } = await create.mutateAsync(input);
            router.push(`/admin/films/${id}`);
          }}
        />
      </Panel>
    </>
  );
}
