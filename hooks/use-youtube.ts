// React Query hooks for YouTube data - stub

import { useQuery } from "@tanstack/react-query";
import { searchVideos, getVideoDetails, getChannelDetails } from "@/lib/youtube";

export function useSearchVideos(query: string) {
  return useQuery({
    queryKey: ["youtube", "search", query],
    queryFn: () => searchVideos(query),
    enabled: !!query,
  });
}

export function useVideoDetails(videoId: string) {
  return useQuery({
    queryKey: ["youtube", "video", videoId],
    queryFn: () => getVideoDetails(videoId),
    enabled: !!videoId,
  });
}

export function useChannelDetails(channelId: string) {
  return useQuery({
    queryKey: ["youtube", "channel", channelId],
    queryFn: () => getChannelDetails(channelId),
    enabled: !!channelId,
  });
}
