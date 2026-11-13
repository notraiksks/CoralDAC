import type { Metadata } from "next"
import { Boxes, ChevronRight, Filter, HeartPulse, Map, Scan, Upload, UserPlus, Pencil } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ClassDot } from "@/components/class-ui"
import { PageHeader } from "@/components/page-header"
import { MODEL_VERSIONS } from "@/lib/stations"
import { CLASS_META, HEALTH_CLASSES } from "@/lib/classes"

export const metadata: Metadata = { title: "How it works" }

const STEPS = [
  { icon: Boxes, title: "Find colonies", model: "YOLOv8", text: "Draws a box around every hard coral colony in the quadrat photo." },
  { icon: Filter, title: "Keep real coral", model: "ResNet50", text: "Removes boxes that are not coral, such as sand, rubble, tape or other organisms." },
  { icon: Scan, title: "Outline the colony", model: "SAM 2.1", text: "Traces the colony's edge inside its box so the background can be set aside." },
  { icon: HeartPulse, title: "Rate health", model: "ResNet50", text: "Labels each colony as live, partially bleached, dead, or dead with algae." },
  { icon: Map, title: "Map the counts", model: "Per station", text: "Adds up the colonies per class for each monitoring station and shows them on the map." },
]

const CONTRIBUTE = [
  { icon: UserPlus, title: "Create an account", text: "Sign up with a username and a password. An e-mail address is not required." },
  { icon: Upload, title: "Upload photos", text: "Add quadrat photos from a survey and choose their station, or let the photo's GPS place it." },
  { icon: Pencil, title: "Review your results", text: "Each photo is analyzed and then counts on the map. You can correct a class, change the station or delete your own photos." },
]

export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 p-4 md:p-6">
      <PageHeader
        title="How it works"
        description="CoralDAC turns photo-quadrat surveys into a map of coral health. Trained models find each coral colony in a photo and rate its health, and the counts are added up for each monitoring station."
      />

      <section aria-labelledby="pipeline" className="space-y-3">
        <h2 id="pipeline" className="text-lg font-semibold">
          From photo to map
        </h2>
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
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
                <ChevronRight aria-hidden="true" className="absolute top-1/2 -right-3 z-10 hidden size-4 -translate-y-1/2 text-muted-foreground lg:block" />
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
          {HEALTH_CLASSES.map((k) => (
            <div key={k} className="flex items-start gap-3 rounded-lg border bg-card p-3">
              <ClassDot cls={k} className="mt-1 size-3" />
              <div>
                <div className="font-medium">
                  {k} · {CLASS_META[k].label}
                </div>
                <div className="text-sm text-muted-foreground">{CLASS_META[k].hint}</div>
              </div>
            </div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          Boxes that the coral filter rejects are not counted and are not shown on the photo pages.
        </p>
      </section>

      <section aria-labelledby="contribute" className="space-y-3">
        <h2 id="contribute" className="text-lg font-semibold">
          Contributing photos
        </h2>
        <ol className="grid gap-3 md:grid-cols-3">
          {CONTRIBUTE.map((s) => (
            <li key={s.title}>
              <Card size="sm" className="h-full">
                <CardHeader className="flex flex-row items-center gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                    <s.icon className="size-4" />
                  </span>
                  <CardTitle>{s.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">{s.text}</CardContent>
              </Card>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="reading" className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle id="reading">Reading the map</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              Each photo is one quadrat. Its colonies are counted per class and added to its station as soon as it is analyzed. A photo without a
              station joins the map once its uploader chooses one, and a photo that its uploader deletes is taken out.
            </p>
            <p>
              <span className="text-foreground">Per quadrat</span> divides a station&apos;s total by its number of photos, so stations surveyed more
              often do not look hotter. <span className="text-foreground">Station total</span> shows the plain sum.
            </p>
            <p>
              The heat layer shows one measure at a time. The default, <span className="text-foreground">Affected coral (%)</span>, is the share of
              colonies that are partially bleached, dead, or dead with algae, on a fixed scale from 0 to 100%. Counts scale to the highest station
              shown.
            </p>
            <p>
              Each station glows over a footprint of about 300 m. Where glows overlap, the higher value shows, never a sum. The optional motion is
              decoration only and never changes a value.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Limits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Classes are model output and are not checked by an expert on this site. Uploaders can correct their own photos.</p>
            <p>GPS is recorded per station, not per photo, so the map shows patterns between stations, not within a transect.</p>
            <p>Markers that would overlap are moved apart on screen and linked to their GPS point with a dashed line, for legibility only.</p>
            <p>Colony outlines are used for display and by the health classifier. The app does not measure colony area or percent cover.</p>
          </CardContent>
        </Card>
      </section>

      <section aria-labelledby="data" className="space-y-3">
        <h2 id="data" className="text-lg font-semibold">
          Data and models
        </h2>
        <Card size="sm">
          <CardContent>
            <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[10rem_1fr]">
              <dt className="text-muted-foreground">Survey photos</dt>
              <dd>The 2024 CoralNet photo-quadrat survey in Puerto Galera: Coral Garden, Giant Clam, Harka Piloto and Sapangan.</dd>
              <dt className="text-muted-foreground">Contributed photos</dt>
              <dd>Uploaded by signed-in contributors and analyzed by the same models as the survey.</dd>
              <dt className="text-muted-foreground">Detector</dt>
              <dd>{MODEL_VERSIONS.detector}</dd>
              <dt className="text-muted-foreground">Coral filter</dt>
              <dd>{MODEL_VERSIONS.filter}</dd>
              <dt className="text-muted-foreground">Health classifier</dt>
              <dd>{MODEL_VERSIONS.classifier}</dd>
            </dl>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
