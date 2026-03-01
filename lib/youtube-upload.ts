const YOUTUBE_UPLOAD_URL =
  "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status"
const YOUTUBE_THUMBNAIL_URL =
  "https://www.googleapis.com/upload/youtube/v3/thumbnails/set"

export interface VideoMetadata {
  title: string
  description: string
  privacyStatus: "public" | "unlisted" | "private"
  categoryId?: string
}

/**
 * Initiates a resumable YouTube upload and returns the upload URL.
 */
export async function initiateUpload(
  accessToken: string,
  metadata: VideoMetadata,
  fileSizeBytes: number
): Promise<string> {
  const body = {
    snippet: {
      title: metadata.title,
      description: metadata.description,
      categoryId: metadata.categoryId ?? "22",
    },
    status: {
      privacyStatus: metadata.privacyStatus,
    },
  }

  const response = await fetch(YOUTUBE_UPLOAD_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Upload-Content-Type": "video/*",
      "X-Upload-Content-Length": String(fileSizeBytes),
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Failed to initiate upload: ${response.status} ${text}`)
  }

  const uploadUrl = response.headers.get("Location")
  if (!uploadUrl) {
    throw new Error("No upload URL returned from YouTube API")
  }

  return uploadUrl
}

/**
 * Uploads a video file to YouTube using a resumable upload URL.
 * Returns the videoId on success.
 */
export function uploadVideo(
  uploadUrl: string,
  file: File,
  onProgress: (pct: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100))
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText)
          if (data.id) {
            resolve(data.id)
          } else {
            reject(new Error("No video ID in response"))
          }
        } catch {
          reject(new Error("Failed to parse upload response"))
        }
      } else {
        reject(new Error(`Upload failed: ${xhr.status} ${xhr.responseText}`))
      }
    }

    xhr.onerror = () => reject(new Error("Upload network error"))
    xhr.onabort = () => reject(new Error("Upload aborted"))

    xhr.open("PUT", uploadUrl)
    xhr.setRequestHeader("Content-Type", file.type || "video/*")
    xhr.send(file)
  })
}

/**
 * Sets the thumbnail for a YouTube video.
 * thumbnailBase64 should be a data URL like "data:image/jpeg;base64,..."
 */
export async function setThumbnail(
  accessToken: string,
  videoId: string,
  thumbnailBase64: string
): Promise<void> {
  const [header, base64Data] = thumbnailBase64.split(",")
  const mimeMatch = header.match(/data:([^;]+)/)
  const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg"

  const binary = atob(base64Data)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  const blob = new Blob([bytes], { type: mimeType })

  const response = await fetch(
    `${YOUTUBE_THUMBNAIL_URL}?videoId=${encodeURIComponent(videoId)}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": mimeType,
      },
      body: blob,
    }
  )

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Failed to set thumbnail: ${response.status} ${text}`)
  }
}
