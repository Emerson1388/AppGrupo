import { supabase } from "../lib/supabase"
import { cloudErrorMessage } from "../lib/supabaseData"

export type MediaKind = "avatars" | "posts" | "stories"

const MAX_IMAGE = 5 * 1024 * 1024
const MAX_VIDEO = 20 * 1024 * 1024
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"])
const AVATAR_TYPES = new Set(["image/jpeg", "image/png", "image/webp"])
const VIDEO_TYPES = new Set(["video/mp4", "video/webm"])

function extFor(type: string) {
  if (type === "image/png") return "png"
  if (type === "image/webp") return "webp"
  if (type === "image/gif") return "gif"
  if (type === "video/webm") return "webm"
  if (type === "video/mp4") return "mp4"
  return "jpg"
}

export function avatarObjectPath(userId: string) {
  return `${userId}/avatars/profile.jpg`
}

export function asJpegBlob(file: Blob) {
  if (file.type === "image/jpeg") return file
  return new Blob([file], { type: "image/jpeg" })
}

export function assertMediaFile(file: Blob, kind: MediaKind) {
  const type = file.type || "application/octet-stream"
  if (kind === "avatars") {
    if (!AVATAR_TYPES.has(type)) throw new Error("Envie uma imagem JPG, PNG ou WebP.")
    if (file.size > MAX_IMAGE) throw new Error("A imagem deve ter no máximo 5 MB.")
    return
  }
  if (kind === "stories") {
    if (!IMAGE_TYPES.has(type)) throw new Error("Envie uma imagem JPG, PNG ou WebP.")
    if (file.size > MAX_IMAGE) throw new Error("A imagem deve ter no máximo 5 MB.")
    return
  }
  if (IMAGE_TYPES.has(type)) {
    if (file.size > MAX_IMAGE) throw new Error("A imagem deve ter no máximo 5 MB.")
    return
  }
  if (VIDEO_TYPES.has(type)) {
    if (file.size > MAX_VIDEO) throw new Error("O vídeo deve ter no máximo 20 MB.")
    return
  }
  throw new Error("Formato não permitido.")
}

export async function uploadUserMedia(kind: MediaKind, file: Blob): Promise<string> {
  if (!supabase) throw new Error("Armazenamento na nuvem não está configurado.")
  assertMediaFile(file, kind)
  const { data: sessionWrap, error: sessionError } = await supabase.auth.getUser()
  if (sessionError || !sessionWrap.user) throw new Error("Entre de novo para enviar o arquivo.")
  const path = `${sessionWrap.user.id}/${kind}/${crypto.randomUUID()}.${extFor(file.type)}`
  const { error } = await supabase.storage.from("midia").upload(path, file, {
    contentType: file.type || "image/jpeg",
    upsert: false,
  })
  if (error) throw new Error(cloudErrorMessage(error.message))
  const { data } = supabase.storage.from("midia").getPublicUrl(path)
  return data.publicUrl
}

export async function uploadAvatar(file: Blob): Promise<string> {
  if (!supabase) throw new Error("Armazenamento na nuvem não está configurado.")
  const jpeg = asJpegBlob(file)
  assertMediaFile(jpeg, "avatars")
  const { data: sessionWrap, error: sessionError } = await supabase.auth.getUser()
  if (sessionError || !sessionWrap.user) throw new Error("Entre de novo para enviar o arquivo.")
  const path = avatarObjectPath(sessionWrap.user.id)
  const { error } = await supabase.storage.from("midia").upload(path, jpeg, {
    contentType: "image/jpeg",
    upsert: true,
  })
  if (error) throw new Error(cloudErrorMessage(error.message))
  const { data } = supabase.storage.from("midia").getPublicUrl(path)
  return `${data.publicUrl}?v=${Date.now()}`
}

export async function uploadDataUrl(kind: MediaKind, dataUrl: string): Promise<string> {
  if (!dataUrl.startsWith("data:")) return dataUrl
  const res = await fetch(dataUrl)
  const blob = await res.blob()
  return uploadUserMedia(kind, blob)
}
