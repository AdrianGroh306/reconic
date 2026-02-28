import { notFound } from "next/navigation"
import { Users, Video, Calendar } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { getChannelDetails, getChannelVideos } from "@/lib/youtube"
import { ChannelVideoGrid } from "./_components/video-grid"
import { FavoriteButton } from "../_components/favorite-button"

function formatSubscriberCount(count: string): string {
  const n = parseInt(count)
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`
  return count
}

function computeUploadCadence(videos: { publishedAt: string }[]): string {
  if (videos.length < 2) return "Unknown cadence"
  const dates = videos
    .map((v) => new Date(v.publishedAt).getTime())
    .sort((a, b) => b - a)
  const gaps: number[] = []
  for (let i = 0; i < Math.min(dates.length - 1, 5); i++) {
    gaps.push((dates[i] - dates[i + 1]) / (1000 * 60 * 60 * 24))
  }
  const avgDays = gaps.reduce((a, b) => a + b, 0) / gaps.length
  if (avgDays <= 2) return "~Daily"
  if (avgDays <= 5) return "~2–3x/week"
  if (avgDays <= 9) return "~1–2x/week"
  if (avgDays <= 16) return "~Weekly"
  if (avgDays <= 35) return "~Bi-weekly"
  return "~Monthly"
}

export default async function ChannelProfilePage({
  params,
}: {
  params: Promise<{ channelId: string }>
}) {
  const { channelId } = await params

  const [channel, videos] = await Promise.all([
    getChannelDetails(channelId).catch(() => null),
    getChannelVideos(channelId, 12).catch(() => []),
  ])

  if (!channel) notFound()

  const snippet = channel.snippet as Record<string, unknown>
  const statistics = channel.statistics as Record<string, unknown>
  const thumbnails = snippet.thumbnails as Record<string, { url: string }>

  const name = snippet.title as string
  const description = snippet.description as string | undefined
  const avatar =
    thumbnails?.high?.url ??
    thumbnails?.medium?.url ??
    thumbnails?.default?.url ??
    ""
  const subscriberCount = statistics?.subscriberCount as string | undefined
  const videoCount = statistics?.videoCount as string | undefined
  const cadence = computeUploadCadence(videos)

  return (
    <div className="space-y-8">
      <div className="flex gap-5 items-start">
        {avatar && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatar}
            alt={name}
            width={80}
            height={80}
            className="rounded-full shrink-0 object-cover"
            referrerPolicy="no-referrer"
          />
        )}
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-2xl font-bold">{name}</h1>
            <FavoriteButton
              channelId={channelId}
              channelTitle={name}
              channelThumbnail={avatar}
              subscriberCount={subscriberCount}
            />
          </div>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{description}</p>
          )}
          <div className="mt-3 flex flex-wrap gap-3">
            {subscriberCount && (
              <Badge variant="secondary" className="gap-1.5">
                <Users className="h-3 w-3" />
                {formatSubscriberCount(subscriberCount)} subscribers
              </Badge>
            )}
            {videoCount && (
              <Badge variant="secondary" className="gap-1.5">
                <Video className="h-3 w-3" />
                {parseInt(videoCount).toLocaleString()} videos
              </Badge>
            )}
            <Badge variant="outline" className="gap-1.5">
              <Calendar className="h-3 w-3" />
              {cadence}
            </Badge>
          </div>
        </div>
      </div>

      <ChannelVideoGrid videos={videos} />
    </div>
  )
}
