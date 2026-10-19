import type { Metadata } from "next"
import { ArrowRight, Boxes, Filter, HeartPulse, Map } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ClassDot } from "@/components/class-ui"
import { PageHeader } from "@/components/page-header"
import { MODEL_VERSIONS } from "@/lib/archive"
import { CLASS_META, HEALTH_CLASSES } from "@/lib/classes"

export const metadata: Metadata = { title: "How it works" }

const STEPS = [
  { icon: Boxes, title: "Find colonies", model: "YOLOv8", text: "Draws a box around every hard-coral colony in the quadrat photo." },
  { icon: Filter, title: "Keep real coral", model: "ResNet50", text: "Drops boxes that are not coral (sand, rubble, tape, other organisms)." },
  { icon: HeartPulse, title: "Rate health", model: "ResNet50", text: "Labels each coral box LC, PB, DC or DCA." },
  { icon: Map, title: "Map the counts", model: "Per station", text: "Counts colonies per class and shows them on the reef map." },
]

export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 p-4 md:p-6">
      <PageHeader
        title="How it works"
        description="CoralDAC turns photo-quadrat surveys into a map of coral health: two models read each photo, a reviewer checks it, and approved counts are added up per monitoring station."
      />

      <section aria-labelledby="pipeline" className="space-y-3">
        <h2 id="pipeline" className="text-lg font-semibold">
          The pipeline
        </h2>
        <ol className="grid gap-3 md:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.title} className="relative">
              <Card size="sm" className="h-full">
                <CardHeader>
                  <span className="mb-1 flex size-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                    <s.icon className="size-5" />
                  </span>
                  <CardTitle>
                    {i + 1}. {s.title}
                  </CardTitle>
                  <CardDescription>{s.model}</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">{s.text}</CardContent>
              </Card>
              {i < STEPS.length - 1 && (
                <ArrowRight aria-hidden="true" className="absolute top-1/2 -right-3 z-10 hidden size-4 -translate-y-1/2 text-muted-foreground md:block" />
              )}
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="classes" className="space-y-3">
        <h2 id="classes" className="text-lg font-semibold">
          Health classes
        </h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {[...HEALTH_CLASSES, "OTHERS" as const].map((k) => (
            <div key={k} className="flex items-start gap-3 rounded-lg border bg-card p-3">
              <ClassDot cls={k} className="mt-1 size-3" />
              <div>
                <div className="font-medium">
                  {k === "OTHERS" ? "Other" : k} · {CLASS_META[k].label}
                </div>
                <div className="text-sm text-muted-foreground">{CLASS_META[k].hint}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="reading" className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle id="reading">Reading the map</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              Each photo is one quadrat. Its colonies are counted per class, and only <span className="text-foreground">approved</span> photos are added to
              their station.
            </p>
            <p>
              For counts, <span className="text-foreground">Per quadrat</span> (default) divides a station&apos;s total by its number of photos, so stations surveyed
              more often do not look hotter. <span className="text-foreground">Station total</span> shows the plain sum.
            </p>
            <p>
              The heat shows one quantity at a time on a thermal scale. The default, <span className="text-foreground">% not live</span>, is the
              share of colonies that are bleached or dead, on a fixed 0–100 % scale. Counts scale to the highest station shown.
            </p>
            <p>
              Each station glows over a ~300 m footprint only, and overlapping glows show the higher value, never a sum. Motion (on by default, switch it off under Layers) is
              decoration and never raises a value.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Limits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>GPS is recorded per station, not per photo, so the map shows station-level patterns, not patchiness within a transect.</p>
            <p>Markers that would overlap are moved apart on screen and linked to their GPS point with a dashed line. This is for legibility only.</p>
            <p>Boxes, not outlines: the models do not measure colony area or percent cover.</p>
          </CardContent>
        </Card>
      </section>

      <section aria-labelledby="status" className="space-y-3">
        <h2 id="status" className="text-lg font-semibold">
          What this demo shows
        </h2>
        <Card size="sm">
          <CardContent>
            <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[10rem_1fr]">
              <dt className="text-muted-foreground">Photos and stations</dt>
              <dd>Real: 2024 CoralNet photo-quadrat survey, Puerto Galera (Coral Garden, Giant Clam, Harka Piloto, Sapangan).</dd>
              <dt className="text-muted-foreground">Coral boxes</dt>
              <dd>Real output of the frozen detector ({MODEL_VERSIONS.detector}).</dd>
              <dt className="text-muted-foreground">Filter and health classes</dt>
              <dd>Simulated until the Stage 2 models are trained on the biologists&apos; labels.</dd>
              <dt className="text-muted-foreground">Uploads and reviews</dt>
              <dd>Kept in this browser only. Use the role menu at the bottom of the sidebar to reset.</dd>
            </dl>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
