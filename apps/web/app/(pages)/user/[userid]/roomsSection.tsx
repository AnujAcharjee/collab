"use client"

import { useState, type CSSProperties, type FormEvent } from "react"
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
import { IconSearch, IconPinned, IconVolume3 } from "@tabler/icons-react"
import { z } from "zod"
import { useShallow } from "zustand/react/shallow"

import { type CreateRoomInput, createRoomSchema } from "@repo/validation"
import type { RoomRecord } from "@repo/validation"
import useAppStore from "@/stores/app-store"
import axios from "axios"
import { useRooms } from "@/hooks/useRooms"

const isPinned = true
const isMuted = true
const unread = false

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
  const { searchRooms: searchRoomsRequest } = useRooms()
  const [searchName, setSearchName] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [searchResults, setSearchResults] = useState<RoomRecord[]>([])

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
  }

  function resetSearch() {
    setHasSearched(false)
    setSearchResults([])
  }

  return (
    <div className="h-svh w-full p-4">
      <Card className="flex h-full w-full flex-col p-0 border border-primary/50">
        <CardHeader className="shadow-b flex flex-col gap-4 py-4 shadow-white/10">
          <CardTitle className="flex items-center justify-between">
            <div className="text-xl font-medium text-primary">Collab</div>
          </CardTitle>

          <CardDescription className="w-full">
            <form
              onSubmit={handleSearch}
              className="flex h-9 items-center gap-2 rounded-full border border-border/40 bg-muted/60 px-3"
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
            <div className="px-4 py-2 sm:px-6">
              {isSearchMode && (
                <div className="pb-2 text-xs text-muted-foreground">
                  Search results for &quot;{searchName.trim()}&quot;
                </div>
              )}

              {!isSearching && displayedRooms.length === 0 && (
                <div className="rounded-lg border border-dashed border-border/70 px-3 py-6 text-center text-sm text-muted-foreground">
                  {isSearchMode
                    ? "No rooms found with that name."
                    : "No rooms available."}
                </div>
              )}

              {displayedRooms.map((room) => (
                <Fragment key={room.id}>
                  <ListItems
                    room={room}
                    isActive={activeRoom === room.id}
                    onSelect={handleRoomSelect}
                  />
                  <Separator className="my-2" />
                </Fragment>
              ))}
            </div>
          </ScrollArea>
        </CardContent>

        <CardFooter className="flex gap-2 bg-primary/80 text-primary-foreground">
          <Avatar className="h-7 w-7 border border-border">
            <AvatarImage
              src={user.avatarUrl ? user.avatarUrl : undefined}
              alt={user.username}
            />
            <AvatarFallback>{user.username[0]}</AvatarFallback>
            <AvatarBadge className="right-0.5 bottom-0.5 h-2.5 w-2.5 border-[1.5px] border-background bg-green-500" />
          </Avatar>
          <span>{user.username}</span>
        </CardFooter>
      </Card>
    </div>
  )
}

function ListItems({
  room,
  isActive,
  onSelect,
}: {
  room: RoomRecord
  isActive: boolean
  onSelect: (room: RoomRecord) => void
}) {
  return (
    <div
      onClick={() => onSelect(room)}
      className={`flex items-center justify-between rounded-md px-3 py-2 transition-colors bg-card hover:bg-muted/50`}
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
        <span className="text-sm">{room.name}</span>
      </div>
      <div className="flex gap-2">
        {isPinned && <IconPinned />}
        {isMuted && <IconVolume3 />}
        {unread && (
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-xs">
            10
          </div>
        )}
      </div>
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
      <DialogTrigger asChild>
        <Button className="flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border/80 bg-background text-base leading-none text-muted-foreground transition-colors hover:bg-muted">
          +
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
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
