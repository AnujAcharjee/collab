"use client"

import { useState, type CSSProperties, type FormEvent, useRef } from "react"
import { Fragment } from "react/jsx-runtime"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  AvatarBadge,
} from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import AppForm, { type FieldConfig } from "@/components/AppForm"
import {
  IconSearch,
  IconPinned,
  IconVolume3,
  IconDotsVertical,
  IconLock,
  IconLockOpen2,
  IconSettings,
  IconCamera,
} from "@tabler/icons-react"
import { optimizeImage } from "@/utils/image"
import { uploadToCloudinary } from "@/utils/cloudinary"

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { z } from "zod"
import { useShallow } from "zustand/react/shallow"
import { useTheme } from "next-themes"

import { type CreateRoomInput, createRoomSchema, editUserBodySchema } from "@repo/validation"
import type { RoomRecord } from "@repo/validation"
import useAppStore from "@/stores/app-store"
import axios from "axios"
import { useRooms } from "@/hooks/useRooms"
import { ThemeToggleButton } from "@/components/theme-toggle"
import { AppIcon } from '@/components/AppIcon'
import { usersApiUrl } from "@/constants/apiUrls"

type CreateRoomFormInput = Omit<CreateRoomInput, "creatorId" | "isPrivate"> & {
  isPrivate: "true" | "false"
}

const roomBodySchema = createRoomSchema.shape.body

const createRoomFormSchema = z.object({
  name: roomBodySchema.shape.name,
  description: roomBodySchema.shape.description,
  isPrivate: z.enum(["false", "true"]),
})

const toastOptions = {
  position: "top-center" as const,
  style: {
    "--border-radius": "calc(var(--radius) + 4px)",
  } as CSSProperties,
}

export default function RoomsSection() {
  const { activeRoom, rooms, user, setActiveRoom, upsertRoom } = useAppStore(
    useShallow((state) => ({
      activeRoom: state.activeRoom,
      rooms: state.rooms,
      user: state.user,
      setActiveRoom: state.setActiveRoom,
      upsertRoom: state.upsertRoom,
    }))
  )
  const {
    searchRooms: searchRoomsRequest,
    requestJoinRoom: requestJoinRoomRequest,
  } = useRooms()
  const [searchName, setSearchName] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [searchResults, setSearchResults] = useState<RoomRecord[]>([])
  const [joiningRoomId, setJoiningRoomId] = useState<string | null>(null)
  const [pendingJoinRoomIds, setPendingJoinRoomIds] = useState<
    Record<string, true>
  >({})

  if (!user) {
    return null
  }

  const isSearchMode = hasSearched
  const displayedRooms = isSearchMode ? searchResults : rooms

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const name = searchName.trim()

    if (!name || isSearching) {
      return
    }

    setIsSearching(true)
    setHasSearched(true)

    try {
      const results = await searchRoomsRequest(name)
      setSearchResults(results)
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? (error.response?.data?.error ??
          error.response?.data?.message ??
          "Unable to search rooms")
        : "Unable to search rooms"

      toast.error(message, toastOptions)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  function handleRoomSelect(room: RoomRecord) {
    upsertRoom(room)
    setActiveRoom(room.id)
    useAppStore.getState().clearRoomUnread(room.id)
  }

  function resetSearch() {
    setHasSearched(false)
    setSearchResults([])
  }

  async function handleJoinRoom(room: RoomRecord) {
    if (!user || joiningRoomId) {
      return
    }

    setJoiningRoomId(room.id)

    try {
      const result = await requestJoinRoomRequest(room.id, user.id)

      if (result.joined && result.room) {
        upsertRoom(result.room)
      }

      if (result.joined && result.room) {
        setActiveRoom(result.room.id)
        useAppStore.getState().clearRoomUnread(result.room.id)
        toast.success(`Joined ${room.name}`, toastOptions)
      } else if (result.pending) {
        setPendingJoinRoomIds((current) => ({
          ...current,
          [room.id]: true,
        }))
        toast.success("Join request sent", toastOptions)
      }
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? (error.response?.data?.error ??
          error.response?.data?.message ??
          "Unable to join room")
        : "Unable to join room"

      toast.error(message, toastOptions)
    } finally {
      setJoiningRoomId(null)
    }
  }

  return (
    <div className="h-full w-full p-1.5">
      <Card className="flex h-full w-full flex-col border border-border/40 bg-card/50 shadow-[0_8px_30px_rgb(0,0,0,0.03)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] backdrop-blur-md rounded-2xl p-0 overflow-hidden">
        <CardHeader className="shadow-b flex flex-col gap-3 px-4 py-3 shadow-black/5 dark:shadow-white/10">
          <CardTitle className="flex items-center justify-between">
            <AppIcon />
            <DialogSettings />
          </CardTitle>

          <CardDescription className="w-full">
            <form
              onSubmit={handleSearch}
              className="flex h-8 items-center gap-2 rounded-full border border-border/40 bg-muted/60 px-2.5"
            >
              <IconSearch
                stroke={2}
                height={14}
                width={14}
                className="shrink-0 text-muted-foreground"
              />
              <input
                value={searchName}
                onChange={(event) => setSearchName(event.target.value)}
                placeholder="Search rooms by name"
                className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
              {isSearchMode && (
                <button
                  type="button"
                  onClick={resetSearch}
                  className="rounded-md px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  My rooms
                </button>
              )}
              <button
                type="submit"
                disabled={isSearching || !searchName.trim()}
                className="rounded-md bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground disabled:opacity-50"
              >
                {isSearching ? "..." : "Go"}
              </button>
              <Separator orientation="vertical" decorative />
              <DialogCreateRoom creatorId={user.id} />
            </form>
          </CardDescription>
        </CardHeader>

        <CardContent className="min-h-0 flex-1 p-0">
          <ScrollArea className="h-full">
            <div className="px-3 py-2 sm:px-4">
              {isSearchMode && (
                <div className="pb-2 text-xs text-muted-foreground">
                  Search results for &quot;{searchName.trim()}&quot;
                </div>
              )}

              {isSearching && (
                <div className="space-y-2 rounded-lg border border-border/50 bg-card/40 p-3">
                  <div className="h-3 w-32 animate-pulse rounded bg-muted" />
                  <div className="h-10 animate-pulse rounded bg-muted/80" />
                  <div className="h-10 animate-pulse rounded bg-muted/70" />
                </div>
              )}

              {!isSearching && displayedRooms.length === 0 && (
                <div className="rounded-lg border border-dashed border-border/70 px-3 py-6 text-center text-sm text-muted-foreground">
                  {isSearchMode
                    ? "No rooms found with that name."
                    : "No rooms available."}
                </div>
              )}

              {!isSearching &&
                displayedRooms.map((room) => (
                  <Fragment key={room.id}>
                    <ListItems
                      room={room}
                      isActive={activeRoom === room.id}
                      onSelect={handleRoomSelect}
                      currentUserId={user.id}
                      isSearchMode={isSearchMode}
                      onJoinRoom={handleJoinRoom}
                      isJoining={joiningRoomId === room.id}
                      hasPendingRequest={Boolean(pendingJoinRoomIds[room.id])}
                    />
                    <Separator className="my-1.5" />
                  </Fragment>
                ))}
            </div>
          </ScrollArea>
        </CardContent>

        {/* <CardFooter className="flex items-center justify-between gap-2 bg-primary/80 px-4 py-2 text-primary-foreground">
          <div className="flex min-w-0 items-center gap-2">
            <Avatar className="h-7 w-7 border border-border">
              <AvatarImage
                src={user.avatarUrl ? user.avatarUrl : undefined}
                alt={user.username}
              />
              <AvatarFallback>{user.username[0]}</AvatarFallback>
              <AvatarBadge className="right-0.5 bottom-0.5 h-2.5 w-2.5 border-[1.5px] border-background bg-green-500" />
            </Avatar>
            <span className="truncate text-sm">{user.username}</span>
          </div>
          <ThemeToggleButton className="text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground" />
        </CardFooter> */}
      </Card>
    </div>
  )
}

function ListItems({
  room,
  isActive,
  onSelect,
  currentUserId,
  isSearchMode,
  onJoinRoom,
  isJoining,
  hasPendingRequest,
}: {
  room: RoomRecord
  isActive: boolean
  onSelect: (room: RoomRecord) => void
  currentUserId: string
  isSearchMode: boolean
  onJoinRoom: (room: RoomRecord) => Promise<void>
  isJoining: boolean
  hasPendingRequest: boolean
}) {
  const isMember = room.members.some(
    (member) => member.userId === currentUserId
  )
  const isPinned = useAppStore(
    (state) => state.roomUiOptions[room.id]?.pinned ?? false
  )
  const isMuted = useAppStore(
    (state) => state.roomUiOptions[room.id]?.muted ?? false
  )
  const unread = useAppStore(
    (state) => state.roomUiOptions[room.id]?.unread ?? false
  )
  const toggleRoomPinned = useAppStore((state) => state.toggleRoomPinned)
  const toggleRoomMuted = useAppStore((state) => state.toggleRoomMuted)
  const toggleRoomUnread = useAppStore((state) => state.toggleRoomUnread)
  const [showOptions, setShowOptions] = useState(false)

  return (
    <div
      onClick={() => {
        if (!isSearchMode || isMember) {
          onSelect(room)
        }
      }}
      className={`relative flex items-center justify-between rounded-md bg-card px-2.5 py-1.5 transition-colors hover:bg-muted/50`}
    >
      <div className="flex items-center gap-2">
        <Avatar className="h-7 w-7 border border-border">
          <AvatarImage
            src={room.creator?.avatarUrl ?? undefined}
            alt={room.name}
          />
          <AvatarFallback>{room.name[0]}</AvatarFallback>
          {isActive && (
            <AvatarBadge className="right-0 bottom-0 h-2 w-2 border-[1.5px] border-background bg-green-500" />
          )}
        </Avatar>
        <span className="text-[13px]">{room.name}</span>
      </div>

      <div className="flex items-center gap-2">
        {isSearchMode &&
          (room.isPrivate ? (
            <IconLock size={14} className="text-muted-foreground" />
          ) : (
            <IconLockOpen2 size={14} className="text-muted-foreground" />
          ))}
        {isPinned && <IconPinned />}
        {isMuted && <IconVolume3 />}
        {unread && (
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-xs">
            1
          </div>
        )}

        {isSearchMode && !isMember ? (
          <Button
            type="button"
            size="sm"
            className="h-7 px-2 text-xs"
            disabled={isJoining || hasPendingRequest}
            onClick={(event) => {
              event.stopPropagation()
              void onJoinRoom(room)
            }}
          >
            {isJoining
              ? "Please wait..."
              : hasPendingRequest
                ? "Requested"
                : room.isPrivate
                  ? "Request join"
                  : "Join"}
          </Button>
        ) : (
          <button
            type="button"
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Room options"
            onClick={(event) => {
              event.stopPropagation()
              setShowOptions((current) => !current)
            }}
          >
            <IconDotsVertical size={16} />
          </button>
        )}
      </div>

      {showOptions && !isSearchMode && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-10 cursor-default bg-transparent"
            aria-label="Close room options"
            onClick={(event) => {
              event.stopPropagation()
              setShowOptions(false)
            }}
          />

          <div
            className="absolute top-10 right-2 z-20 w-40 rounded-md border border-border bg-popover p-1 shadow-md"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="w-full rounded-sm px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted"
              onClick={() => {
                toggleRoomPinned(room.id)
                setShowOptions(false)
              }}
            >
              {isPinned ? "Unpin room" : "Pin room"}
            </button>
            <button
              type="button"
              className="w-full rounded-sm px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted"
              onClick={() => {
                toggleRoomMuted(room.id)
                setShowOptions(false)
              }}
            >
              {isMuted ? "Unmute room" : "Mute room"}
            </button>
            <button
              type="button"
              className="w-full rounded-sm px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted"
              onClick={() => {
                toggleRoomUnread(room.id)
                setShowOptions(false)
              }}
            >
              {unread ? "Mark as read" : "Mark as unread"}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function DialogCreateRoom({ creatorId }: { creatorId: string }) {
  const { setActiveRoom, upsertRoom } = useAppStore(
    useShallow((state) => ({
      setActiveRoom: state.setActiveRoom,
      upsertRoom: state.upsertRoom,
    }))
  )
  const { createRoom: createRoomRequest } = useRooms()
  const [open, setOpen] = useState(false)
  const [formKey, setFormKey] = useState(0)

  const defaultCreateRoomValues: CreateRoomFormInput = {
    name: "",
    description: "",
    isPrivate: "false",
  }

  const roomFields: FieldConfig<CreateRoomFormInput>[] = [
    {
      name: "name",
      label: "Room Name",
      placeholder: "my room",
      autoComplete: "off",
    },
    {
      name: "description",
      label: "Description",
      placeholder: "We all are a big family here",
      autoComplete: "off",
    },
    {
      name: "isPrivate",
      label: "Room Visibility",
      fieldType: "radio",
      options: [
        { label: "Public", value: "false" },
        { label: "Private", value: "true" },
      ],
    },
  ]

  async function createRoom(data: CreateRoomFormInput) {
    try {
      const payload: CreateRoomInput = {
        ...data,
        creatorId,
        isPrivate: data.isPrivate === "true",
      }
      const room = await createRoomRequest(payload)

      upsertRoom(room)
      setActiveRoom(room.id)
      setFormKey((currentKey) => currentKey + 1)
      setOpen(false)
      toast.success("Room created", toastOptions)
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? (error.response?.data?.message ?? "Something went wrong")
        : "Something went wrong"

      toast.error(message, toastOptions)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button className="flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border/80 bg-background text-base leading-none text-muted-foreground transition-colors hover:bg-muted">
              +
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>Create Room</p>
        </TooltipContent>
      </Tooltip>

      <DialogContent className="sm:max-w-md" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="text-2xl">Create New Room</DialogTitle>
        </DialogHeader>

        <AppForm
          key={formKey}
          formId="create-room-form"
          schema={createRoomFormSchema}
          defaultValues={defaultCreateRoomValues}
          fields={roomFields}
          onSubmit={async (data) => {
            await createRoom(data)
          }}
          submitLabel="Create room"
          pendingLabel="Creating room..."
        />
      </DialogContent>
    </Dialog>
  )
}

function DialogSettings() {
  const { user, setUser } = useAppStore(
    useShallow((state) => ({
      user: state.user,
      setUser: state.setUser,
    }))
  )
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"profile" | "appearance">("profile")
  const { theme, setTheme } = useTheme()

  // State to manage avatar file selection, preview, and Cloudinary upload status
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [removePhoto, setRemovePhoto] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!user) return null

  const userId = user.id

  const defaultProfileValues = {
    name: user.name || "",
    username: user.username || "",
    bio: user.bio || "",
  }

  const profileFields: FieldConfig<any>[] = [
    {
      name: "name",
      label: "Full Name",
      placeholder: "e.g. John Doe",
      autoComplete: "name",
    },
    {
      name: "username",
      label: "Username",
      placeholder: "e.g. johndoe",
      autoComplete: "username",
    },
    {
      name: "bio",
      label: "Bio",
      placeholder: "Tell us a bit about yourself",
      autoComplete: "off",
    },
  ]

  async function handleEditProfile(data: any) {
    try {
      setIsUploading(true)
      let finalAvatarUrl: string | null = user?.avatarUrl || null

      if (removePhoto) {
        finalAvatarUrl = null
      } else if (selectedFile) {
        toast.info("Optimizing profile photo...", toastOptions)
        const optimizedBlob = await optimizeImage(selectedFile)

        toast.info("Uploading photo to Cloudinary...", toastOptions)
        finalAvatarUrl = await uploadToCloudinary(optimizedBlob)
      }

      const payload = {
        name: data.name?.trim() || null,
        username: data.username.trim(),
        bio: data.bio?.trim() || null,
        avatarUrl: finalAvatarUrl,
      }

      const res = await axios.patch(`${usersApiUrl}/${userId}`, payload, {
        withCredentials: true,
      })

      setUser(res.data.data.user)
      toast.success("Profile updated successfully", toastOptions)
      setOpen(false)
      
      // Reset state on successful edit
      setSelectedFile(null)
      setPreviewUrl(null)
      setRemovePhoto(false)
    } catch (error: any) {
      console.error(error)
      const message = axios.isAxiosError(error)
        ? (error.response?.data?.error ?? error.response?.data?.message ?? "Failed to update profile")
        : (error.message || "Failed to update profile")
      toast.error(message, toastOptions)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Settings"
              className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
            >
              <IconSettings size={18} />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>Settings</p>
        </TooltipContent>
      </Tooltip>

      <DialogContent className="sm:max-w-lg" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Settings</DialogTitle>
        </DialogHeader>

        <div className="flex gap-4 border-b border-border/40 pb-2">
          <Button
            type="button"
            variant="ghost"
            className={`px-3 py-1 text-sm font-semibold rounded-lg ${
              activeTab === "profile" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/40"
            }`}
            onClick={() => setActiveTab("profile")}
          >
            Edit Profile
          </Button>
          <Button
            type="button"
            variant="ghost"
            className={`px-3 py-1 text-sm font-semibold rounded-lg ${
              activeTab === "appearance" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/40"
            }`}
            onClick={() => setActiveTab("appearance")}
          >
            Appearance
          </Button>
        </div>

        <div className="mt-4 min-h-[300px]">
          {activeTab === "profile" && (
            <div className="space-y-6">
              {/* Instagram/Twitter-style Avatar Upload */}
              <div className="flex flex-col items-center gap-3">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="group relative size-24 cursor-pointer overflow-hidden rounded-full border-2 border-border/40 bg-muted shadow-md transition-all hover:border-primary hover:shadow-lg animate-fade-in"
                >
                  {/* Image Display */}
                  <img
                    src={
                      removePhoto
                        ? `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name || user.username)}`
                        : previewUrl || user.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name || user.username)}`
                    }
                    alt="Profile preview"
                    className="h-full w-full object-cover"
                  />
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    <IconCamera className="size-6 text-white" />
                    <span className="mt-1 text-[10px] font-semibold text-white">Upload</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs font-semibold rounded-lg cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Change photo
                  </Button>
                  
                  {(!removePhoto && (previewUrl || user.avatarUrl)) && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-xs font-semibold rounded-lg text-destructive hover:bg-destructive/10 cursor-pointer"
                      onClick={() => {
                        setSelectedFile(null)
                        setPreviewUrl(null)
                        setRemovePhoto(true)
                      }}
                    >
                      Remove photo
                    </Button>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      setSelectedFile(file)
                      const objectUrl = URL.createObjectURL(file)
                      setPreviewUrl(objectUrl)
                      setRemovePhoto(false)
                    }
                  }}
                />
              </div>

              {/* Edit Profile Text Form */}
              <AppForm
                formId="edit-profile-form"
                schema={editUserBodySchema}
                defaultValues={defaultProfileValues}
                fields={profileFields}
                onSubmit={handleEditProfile}
                submitLabel={isUploading ? "Uploading & saving..." : "Save changes"}
                pendingLabel="Saving changes..."
              />
            </div>
          )}

          {activeTab === "appearance" && (
            <div className="space-y-6">
              <div className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-foreground">Select Theme</span>
                <span className="text-xs text-muted-foreground">
                  Customize Collab's aesthetic to your taste.
                </span>
                <div className="flex gap-2 mt-2">
                  {(["light", "dark", "system"] as const).map((t) => (
                    <Button
                      key={t}
                      type="button"
                      variant={theme === t ? "default" : "outline"}
                      className="px-4 py-2 capitalize font-semibold rounded-xl"
                      onClick={() => setTheme(t)}
                    >
                      {t}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
