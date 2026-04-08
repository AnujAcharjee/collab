"use client"

import { useEffect, useRef, useState } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import useAppStore from "@/stores/app-store"
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  IconBrandTelegram,
  IconPaperclip,
  IconMoodSmile,
  IconMicrophone,
  IconChevronLeft,
  IconDotsVertical,
  IconMessageReply,
  IconPinned,
  IconTrash,
  IconX,
} from "@tabler/icons-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { toast } from "sonner"
import AppForm, { type FieldConfig } from "@/components/AppForm"
import { Button } from "@/components/ui/button"
import { createRoomSchema } from "@repo/validation"
import type {
  CreateMessageInput,
  EditRoomRequest,
  RoomRecord,
} from "@repo/validation"
import axios from "axios"
import type { RoomMessage } from "@/stores/app-store"
import { useMessage, type ChatHistoryMessage } from "@/hooks/useMessage"
import { useRooms } from "@/hooks/useRooms"
import { z } from "zod"

type MessageBubbleParent = {
  id: string
  username: string
  message?: string
  isDeleted?: boolean
}

type EditRoomFormInput = {
  name: string
  description: string
  isPrivate: "true" | "false"
}

const toastOptions = {
  position: "top-center" as const,
}

const EMPTY_ROOM_MESSAGES: RoomMessage[] = []
const roomBodySchema = createRoomSchema.shape.body

const editRoomFormSchema = z.object({
  name: roomBodySchema.shape.name,
  description: roomBodySchema.shape.description,
  isPrivate: z.enum(["false", "true"]),
})

export default function ChatSection({ room }: { room: RoomRecord | null }) {
  const roomId = room?.id ?? null
  const setActiveRoom = useAppStore((state) => state.setActiveRoom)
  const user = useAppStore((state) => state.user)
  const addMessage = useAppStore((state) => state.addMessage)
  const setMessages = useAppStore((state) => state.setMessages)
  const {
    createMessage: createMessageRequest,
    deleteMessage: deleteMessageRequest,
    fetchMessages,
  } = useMessage()
  const roomMessages = useAppStore((state) =>
    roomId
      ? (state.messages[roomId] ?? EMPTY_ROOM_MESSAGES)
      : EMPTY_ROOM_MESSAGES
  )
  const updateRoomLastMessage = useAppStore(
    (state) => state.updateRoomLastMessage
  )
  const currentRoomMember = room?.members.find(
    (member) => member.userId === user?.id
  )
  const canManageRoom = Boolean(
    user?.id &&
    (currentRoomMember?.role === "ADMIN" ||
      currentRoomMember?.role === "OWNER" ||
      room?.creatorId === user.id)
  )

  const [draft, setDraft] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [replyingTo, setReplyingTo] = useState<RoomMessage | null>(null)
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(
    null
  )
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const roomMessagesById = new Map(
    roomMessages.map((message) => [message.id, message])
  )

  function getMessageAuthorName(message: RoomMessage) {
    return message.sender === user?.id
      ? (user?.username ?? "You")
      : (message.senderUsername ?? room?.creator?.username ?? "Room member")
  }

  function getMessageAuthorAvatar(message: RoomMessage) {
    return message.sender === user?.id
      ? (user?.avatarUrl ?? undefined)
      : (message.senderAvatarUrl ?? room?.creator?.avatarUrl ?? undefined)
  }

  function getMessageBody(
    message?: Pick<RoomMessage, "text" | "isDeleted"> | null
  ) {
    if (!message) {
      return "Original message unavailable"
    }

    if (message.isDeleted) {
      return "Message deleted"
    }

    return message.text?.trim() ? message.text : "Attachment"
  }

  useEffect(() => {
    if (!roomId) {
      setDraft("")
      setReplyingTo(null)
      return
    }

    let isCancelled = false

    const loadMessages = async () => {
      setIsLoading(true)

      try {
        const messages = (await fetchMessages(roomId)).map(toRoomMessage)

        if (isCancelled) {
          return
        }

        setMessages(roomId, messages)
      } catch (error) {
        if (!isCancelled) {
          const message = axios.isAxiosError(error)
            ? (error.response?.data?.error ??
              error.response?.data?.message ??
              "Unable to load messages")
            : "Unable to load messages"

          toast.error(message, toastOptions)
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadMessages()

    return () => {
      isCancelled = true
    }
  }, [fetchMessages, roomId, setMessages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [roomId, roomMessages])

  useEffect(() => {
    if (
      replyingTo &&
      !roomMessages.some((message) => message.id === replyingTo.id)
    ) {
      setReplyingTo(null)
    }
  }, [replyingTo, roomMessages])

  if (!room) {
    return (
      <div className="h-svh w-full px-0 py-4 lg:p-4">
        <Card className="flex h-full w-full items-center justify-center border-dashed">
          <div className="px-6 text-center text-sm text-muted-foreground">
            Select a room to start chatting.
          </div>
        </Card>
      </div>
    )
  }

  const activeRoom = room

  async function sendMessage() {
    const text = draft.trim()

    if (!user?.id || !text || isSending) {
      return
    }

    setIsSending(true)

    try {
      const payload: CreateMessageInput["body"] = {
        sender: user.id,
        roomId: activeRoom.id,
        text,
        parentId: replyingTo?.id,
      }

      const message = await createMessageRequest(payload)

      addMessage(activeRoom.id, toRoomMessage(message))
      setDraft("")
      setReplyingTo(null)
      updateRoomLastMessage(activeRoom.id, toRoomPreviewMessage(message))
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? (error.response?.data?.error ??
          error.response?.data?.message ??
          "Unable to send message")
        : "Unable to send message"

      toast.error(message, toastOptions)
    } finally {
      setIsSending(false)
    }
  }

  async function handleDeleteMessage(messageId: string) {
    if (!roomId || deletingMessageId) {
      return
    }

    setDeletingMessageId(messageId)

    try {
      await deleteMessageRequest(messageId)
      const refreshedMessages = (await fetchMessages(roomId)).map(toRoomMessage)

      setMessages(roomId, refreshedMessages)

      const lastMessage = refreshedMessages[refreshedMessages.length - 1]

      if (lastMessage) {
        updateRoomLastMessage(roomId, lastMessage)
      }

      if (replyingTo?.id === messageId) {
        setReplyingTo(null)
      }

      toast.success("Message deleted", toastOptions)
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? (error.response?.data?.error ??
          error.response?.data?.message ??
          "Unable to delete message")
        : "Unable to delete message"

      toast.error(message, toastOptions)
    } finally {
      setDeletingMessageId(null)
    }
  }

  return (
    <div className="h-svh w-full p-2 lg:p-4">
      <Card className="flex h-full w-full flex-col gap-0 border border-primary/50 p-0">
        <CardHeader className="flex items-center gap-2 border-b border-white/10 bg-white/5 px-2 pt-4 backdrop-blur-sm">
          <button
            type="button"
            onClick={() => setActiveRoom(null)}
            className="group flex items-center justify-center rounded-lg p-1.5 text-white/50 transition-all duration-150 hover:bg-white/10 hover:text-white active:scale-95"
            aria-label="Go back"
          >
            <IconChevronLeft
              stroke={2}
              height={18}
              width={18}
              className="transition-transform duration-150 group-hover:-translate-x-0.5"
            />
          </button>

          <Avatar className="h-9 w-9 shrink-0 border border-border">
            <AvatarImage src={room?.name} alt={room?.name} />
            <AvatarFallback className="text-xs">{room.name[0]}</AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <div className="text-md truncate tracking-wide text-white/90">
              {room.name}
            </div>
            {room.description?.trim() && (
              <div className="truncate text-xs text-white/45">
                {room.description}
              </div>
            )}
          </div>

          {canManageRoom && <DialogEditRoom room={room} />}
        </CardHeader>

        <CardContent className="min-h-0 flex-1 px-0 py-0 shadow-inner sm:px-2">
          <ScrollArea className="h-full p-0">
            <div className="space-y-3 px-4 py-3 sm:px-6">
              {isLoading && (
                <div className="text-center text-sm text-muted-foreground">
                  Loading messages...
                </div>
              )}

              {!isLoading && roomMessages.length === 0 && (
                <div className="text-center text-sm text-muted-foreground">
                  No messages yet. Start the conversation.
                </div>
              )}

              {roomMessages.map((message) => {
                const isOwn = message.sender === user?.id
                const username = getMessageAuthorName(message)
                const avatar = getMessageAuthorAvatar(message)
                const parentMessage = message.parentId
                  ? roomMessagesById.get(message.parentId)
                  : undefined
                const parentUsername = parentMessage
                  ? getMessageAuthorName(parentMessage)
                  : undefined

                return (
                  <MessageBubble
                    key={message.id}
                    username={username}
                    avatar={avatar}
                    parentId={message.parentId}
                    parentMessage={
                      message.parentId
                        ? {
                            id: parentMessage?.id ?? message.parentId,
                            username: parentUsername ?? "Original message",
                            message: parentMessage?.text,
                            isDeleted: parentMessage?.isDeleted,
                          }
                        : undefined
                    }
                    message={
                      message.isDeleted ? "Message deleted" : message.text
                    }
                    timestamp={formatMessageTime(message.createdAt)}
                    isOwn={isOwn}
                    canDelete={
                      isOwn &&
                      !message.isDeleted &&
                      deletingMessageId !== message.id
                    }
                    onReply={() => setReplyingTo(message)}
                    onDelete={() => void handleDeleteMessage(message.id)}
                  />
                )
              })}

              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </CardContent>

        <CardFooter className="flex gap-2 pt-2 pb-5">
          <form
            className="flex w-full items-end gap-2"
            onSubmit={(event) => {
              event.preventDefault()
              void sendMessage()
            }}
          >
            <div className="flex flex-1 flex-col gap-2">
              {replyingTo && (
                <div className="flex items-start justify-between rounded-xl border border-primary/40 bg-white/8 px-3 py-2">
                  <div className="min-w-0 border-l-2 border-primary/70 pl-3">
                    <div className="text-xs font-medium text-primary">
                      Replying to {getMessageAuthorName(replyingTo)}
                    </div>
                    <div className="line-clamp-2 text-xs text-muted-foreground">
                      {getMessageBody(replyingTo)}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReplyingTo(null)}
                    className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
                    aria-label="Cancel reply"
                  >
                    <IconX size={16} />
                  </button>
                </div>
              )}

              <InputGroup className="h-10 w-full border border-primary/50">
                <InputGroupInput
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder={`Message ${activeRoom.name}`}
                  disabled={!user || isSending}
                />

                <InputGroupAddon>
                  <IconPaperclip
                    stroke={2}
                    height={20}
                    width={20}
                    className="cursor-not-allowed text-white/30"
                  />
                  <IconMoodSmile
                    stroke={2}
                    height={20}
                    width={20}
                    className="cursor-not-allowed text-white/30"
                  />
                </InputGroupAddon>

                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    type="submit"
                    variant="ghost"
                    size="icon-sm"
                    disabled={!user || !draft.trim() || isSending}
                    className="text-white/50 hover:text-white"
                  >
                    <IconBrandTelegram stroke={2} height={18} width={18} />
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
            </div>

            <div className="rounded-full border border-border/50 bg-white/10 p-1.5">
              <IconMicrophone
                stroke={2}
                height={20}
                width={20}
                className="cursor-not-allowed text-white/30"
              />
            </div>
          </form>
        </CardFooter>
      </Card>
    </div>
  )
}

function MessageBubble({
  username,
  avatar,
  parentId,
  parentMessage,
  message,
  timestamp,
  isOwn = false,
  canDelete = false,
  onReply,
  onDelete,
}: {
  username: string
  avatar?: string
  parentId?: string
  parentMessage?: MessageBubbleParent
  message?: string
  timestamp: string
  isOwn?: boolean
  canDelete?: boolean
  onReply: () => void
  onDelete: () => void
}) {
  const fallbackMessage = message?.trim() ? message : "Attachment"
  const fallbackParentMessage = parentMessage?.isDeleted
    ? "Message deleted"
    : parentMessage?.message?.trim()
      ? parentMessage.message
      : parentId
        ? "Original message unavailable"
        : ""

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          className={`flex items-end gap-2 ${isOwn ? "flex-row-reverse" : ""}`}
        >
          <Avatar className="h-7 w-7 shrink-0 border border-border">
            <AvatarImage src={avatar} alt={username} />
            <AvatarFallback className="text-xs">{username[0]}</AvatarFallback>
          </Avatar>

          <div
            className={`flex max-w-[70%] flex-col gap-1 ${isOwn ? "items-end" : "items-start"}`}
          >
            <div
              className={`rounded-[18px] px-3.5 py-2 text-xs leading-relaxed text-white sm:text-sm ${
                isOwn
                  ? "rounded-br-4 bg-primary/60"
                  : "rounded-bl-4 bg-muted text-foreground"
              }`}
            >
              {parentId && parentMessage && (
                <div
                  className={`mb-2.5 rounded-2xl border px-3 py-2.5 text-[11px] shadow-sm sm:text-xs ${
                    isOwn
                      ? "border-white/15 bg-black/10 text-white/90 ring-1 ring-white/10"
                      : "border-border/60 bg-background/80 text-muted-foreground"
                  }`}
                >
                  <div
                    className={`mb-1 flex items-center gap-1.5 ${
                      isOwn ? "text-white/85" : "text-primary"
                    }`}
                  >
                    <IconMessageReply size={12} />
                    <span className="font-semibold">
                      Replying to {parentMessage.username}
                    </span>
                  </div>
                  <div className="line-clamp-2 leading-relaxed break-words">
                    {fallbackParentMessage}
                  </div>
                </div>
              )}
              <div className="break-words whitespace-pre-wrap">
                {fallbackMessage}
              </div>
            </div>
            <div>
              {!isOwn && (
                <span className="px-1 text-[11px] text-muted-foreground">
                  {username}
                </span>
              )}
              <span className="px-1 text-[10px] text-muted-foreground">
                {timestamp}
              </span>
            </div>
          </div>
        </div>
      </ContextMenuTrigger>

      <ContextMenuContent className="w-44">
        <ContextMenuItem onSelect={onReply}>
          <IconMessageReply />
          Reply
        </ContextMenuItem>
        <ContextMenuItem
          onSelect={onDelete}
          disabled={!canDelete}
          className="text-destructive focus:text-destructive"
        >
          <IconTrash />
          Delete
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem disabled={true}>
          <IconPinned />
          Pin
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}

function DialogEditRoom({ room }: { room: RoomRecord }) {
  const { upsertRoom, removeRoom, clearMessages } = useAppStore((state) => ({
    upsertRoom: state.upsertRoom,
    removeRoom: state.removeRoom,
    clearMessages: state.clearMessages,
  }))
  const {
    updateRoom: updateRoomRequest,
    deleteRoom: deleteRoomRequest,
  } = useRooms()
  const [open, setOpen] = useState(false)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const defaultValues: EditRoomFormInput = {
    name: room.name,
    description: room.description ?? "",
    isPrivate: room.isPrivate ? "true" : "false",
  }

  const roomFields: FieldConfig<EditRoomFormInput>[] = [
    {
      name: "name",
      label: "Room Name",
      placeholder: "my room",
      autoComplete: "off",
    },
    {
      name: "description",
      label: "Description",
      placeholder: "What this room is for",
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

  async function handleUpdateRoom(data: EditRoomFormInput) {
    try {
      const payload: EditRoomRequest["body"] = {
        name: data.name,
        description: data.description,
        isPrivate: data.isPrivate === "true",
      }
      const updatedRoom = await updateRoomRequest(room.id, payload)

      upsertRoom(updatedRoom)
      setOpen(false)
      toast.success("Room updated", toastOptions)
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? (error.response?.data?.error ??
          error.response?.data?.message ??
          "Unable to update room")
        : "Unable to update room"

      toast.error(message, toastOptions)
    }
  }

  function handleOpenDeleteConfirmation() {
    setOpen(false)
    window.requestAnimationFrame(() => {
      setConfirmDeleteOpen(true)
    })
  }

  async function handleDeleteRoom() {
    if (isDeleting) {
      return
    }

    setIsDeleting(true)

    try {
      await deleteRoomRequest(room.id)
      clearMessages(room.id)
      removeRoom(room.id)
      setConfirmDeleteOpen(false)
      toast.success("Room deleted", toastOptions)
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? (error.response?.data?.error ??
          error.response?.data?.message ??
          "Unable to delete room")
        : "Unable to delete room"

      toast.error(message, toastOptions)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <button
            type="button"
            className="flex items-center justify-center rounded-lg p-1.5 text-white/50 transition-all duration-150 hover:bg-white/10 hover:text-white active:scale-95"
            aria-label="Edit room"
          >
            <IconDotsVertical size={18} stroke={2} />
          </button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Room</DialogTitle>
            <DialogDescription>
              Update the room name, description, or visibility.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <AppForm
              key={`${room.id}-${room.updatedAt}`}
              formId={`edit-room-form-${room.id}`}
              schema={editRoomFormSchema}
              defaultValues={defaultValues}
              fields={roomFields}
              onSubmit={async (data) => {
                await handleUpdateRoom(data)
              }}
              submitLabel="Save changes"
              pendingLabel="Saving changes..."
            />

            <Button
              type="button"
              variant="destructive"
              className="w-full"
              onClick={handleOpenDeleteConfirmation}
            >
              Delete group
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Room?</DialogTitle>
            <DialogDescription>
              This will permanently delete {room.name} and its messages. This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setConfirmDeleteOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="flex-1"
              onClick={() => void handleDeleteRoom()}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Confirm delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

function toRoomMessage(message: ChatHistoryMessage): RoomMessage {
  return {
    id: message.id,
    sender: message.userId,
    roomId: message.roomId,
    text: message.text,
    attachments: message.attachments,
    parentId: message.parentId,
    createdAt: message.createdAt,
    senderUsername: message.senderUsername,
    senderAvatarUrl: message.senderAvatarUrl,
    isDeleted: message.isDeleted,
  }
}

function toRoomPreviewMessage(message: ChatHistoryMessage): RoomMessage {
  return {
    id: message.id,
    sender: message.userId,
    roomId: message.roomId,
    text: message.text,
    attachments: message.attachments,
    parentId: message.parentId,
    createdAt: message.createdAt,
  }
}

function formatMessageTime(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ""
  }

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date)
}
