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
  IconUserMinus,
  IconUserPlus,
  IconUsers,
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
  AddRoomMembersRequest,
  CreateMessageInput,
  EditRoomRequest,
  RoomJoinRequestRecord,
  RoomMemberRecord,
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
  const [showMembersPanel, setShowMembersPanel] = useState(false)
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
      setShowMembersPanel(false)
      return
    }

    let isCancelled = false

    const loadMessages = async () => {
      setIsLoading(true)

      try {
        if (!user?.id) {
          return
        }

        const messages = (await fetchMessages(roomId, user.id)).map(toRoomMessage)

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
    setShowMembersPanel(false)
  }, [roomId])

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
      if (!user?.id) {
        return
      }

      const refreshedMessages = (await fetchMessages(roomId, user.id)).map(toRoomMessage)

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

          <button
            type="button"
            onClick={() => setShowMembersPanel((current) => !current)}
            className="rounded-lg transition hover:bg-white/10"
            aria-label="View room members"
          >
            <Avatar className="h-9 w-9 shrink-0 border border-border">
              <AvatarImage src={room?.name} alt={room?.name} />
              <AvatarFallback className="text-xs">
                {room.name[0]}
              </AvatarFallback>
            </Avatar>
          </button>

          <button
            type="button"
            onClick={() => setShowMembersPanel((current) => !current)}
            className="min-w-0 flex-1 rounded-lg px-1 py-0.5 text-left transition hover:bg-white/10"
            aria-label="View room members"
          >
            <div className="text-md truncate tracking-wide text-white/90">
              {room.name}
            </div>
            {room.description?.trim() && (
              <div className="truncate text-xs text-white/45">
                {room.description}
              </div>
            )}
          </button>

          {canManageRoom && <DialogEditRoom room={room} />}
        </CardHeader>

        <CardContent className="min-h-0 flex-1 px-0 py-0 shadow-inner sm:px-2">
          {showMembersPanel ? (
            <RoomMembersPanel
              room={room}
              currentUserId={user?.id ?? null}
              canManageRoom={canManageRoom}
              onShowChat={() => setShowMembersPanel(false)}
            />
          ) : (
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
          )}
        </CardContent>

        {!showMembersPanel && (
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
        )}
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
  const { updateRoom: updateRoomRequest, deleteRoom: deleteRoomRequest } =
    useRooms()
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

      useAppStore.getState().upsertRoom(updatedRoom)
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
      const { clearMessages, removeRoom } = useAppStore.getState()

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

function RoomMembersPanel({
  room,
  currentUserId,
  canManageRoom,
  onShowChat,
}: {
  room: RoomRecord
  currentUserId: string | null
  canManageRoom: boolean
  onShowChat: () => void
}) {
  const {
    addMembers: addMembersRequest,
    removeMember: removeMemberRequest,
    getPendingJoinRequests: getPendingJoinRequestsRequest,
    respondJoinRequest: respondJoinRequestRequest,
  } = useRooms()
  const [addMembersOpen, setAddMembersOpen] = useState(false)
  const [removeTarget, setRemoveTarget] = useState<RoomMemberRecord | null>(
    null
  )
  const [pendingRequests, setPendingRequests] = useState<RoomJoinRequestRecord[]>(
    []
  )
  const [isLoadingPending, setIsLoadingPending] = useState(false)
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(
    null
  )
  const [usernamesInput, setUsernamesInput] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)

  useEffect(() => {
    if (!canManageRoom || !currentUserId) {
      setPendingRequests([])
      return
    }

    let isCancelled = false

    const fetchPendingRequests = async () => {
      setIsLoadingPending(true)

      try {
        const requests = await getPendingJoinRequestsRequest(
          room.id,
          currentUserId
        )

        if (!isCancelled) {
          setPendingRequests(requests)
        }
      } catch (error) {
        if (!isCancelled) {
          const message = axios.isAxiosError(error)
            ? (error.response?.data?.error ??
              error.response?.data?.message ??
              "Unable to load join requests")
            : "Unable to load join requests"

          toast.error(message, toastOptions)
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingPending(false)
        }
      }
    }

    void fetchPendingRequests()

    return () => {
      isCancelled = true
    }
  }, [canManageRoom, currentUserId, getPendingJoinRequestsRequest, room.id])

  async function handleAddMembers() {
    const usernames = usernamesInput
      .split(/[,\n\s]+/)
      .map((username) => username.trim().replace(/^@+/, ""))
      .filter(Boolean)
    const uniqueUsernames = [...new Set(usernames)]

    if (!uniqueUsernames.length || isAdding) {
      return
    }

    setIsAdding(true)

    try {
      const payload: AddRoomMembersRequest["body"]["usernames"] =
        uniqueUsernames
      const { room: updatedRoom, addedCount } = await addMembersRequest(
        room.id,
        payload
      )

      useAppStore.getState().upsertRoom(updatedRoom)
      setUsernamesInput("")
      setAddMembersOpen(false)
      toast.success(
        addedCount > 0
          ? `${addedCount} member(s) added`
          : "Members already exist",
        toastOptions
      )
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? (error.response?.data?.error ??
          error.response?.data?.message ??
          "Unable to add members")
        : "Unable to add members"

      toast.error(message, toastOptions)
    } finally {
      setIsAdding(false)
    }
  }

  async function handleRemoveMember() {
    if (!removeTarget || isRemoving) {
      return
    }

    setIsRemoving(true)

    try {
      const { room: updatedRoom } = await removeMemberRequest(
        room.id,
        removeTarget.id
      )
      useAppStore.getState().upsertRoom(updatedRoom)
      setRemoveTarget(null)
      toast.success("Member removed", toastOptions)
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? (error.response?.data?.error ??
          error.response?.data?.message ??
          "Unable to remove member")
        : "Unable to remove member"

      toast.error(message, toastOptions)
    } finally {
      setIsRemoving(false)
    }
  }

  async function handleRespondJoinRequest(requestId: string, approve: boolean) {
    if (!currentUserId || processingRequestId) {
      return
    }

    setProcessingRequestId(requestId)

    try {
      const result = await respondJoinRequestRequest(room.id, requestId, {
        actorUserId: currentUserId,
        approve,
      })

      if (result.room) {
        useAppStore.getState().upsertRoom(result.room)
      }

      setPendingRequests((current) =>
        current.filter((request) => request.id !== requestId)
      )
      toast.success(
        approve ? "Join request approved" : "Join request rejected",
        toastOptions
      )
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? (error.response?.data?.error ??
          error.response?.data?.message ??
          "Unable to process join request")
        : "Unable to process join request"

      toast.error(message, toastOptions)
    } finally {
      setProcessingRequestId(null)
    }
  }

  return (
    <>
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-white/90">
            <IconUsers size={16} />
            Members ({room.members.length})
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onShowChat}
            >
              Show chat
            </Button>
            {canManageRoom && (
              <Button
                type="button"
                size="sm"
                className="h-8"
                onClick={() => setAddMembersOpen(true)}
              >
                <IconUserPlus size={14} />
                Add member
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="h-full">
          <div className="space-y-2 px-4 py-3 sm:px-6">
            {canManageRoom && (
              <div className="rounded-lg border border-border/40 bg-card/40 p-3">
                <div className="mb-2 text-xs font-medium text-muted-foreground">
                  Pending join requests
                </div>

                {isLoadingPending && (
                  <div className="text-xs text-muted-foreground">
                    Loading requests...
                  </div>
                )}

                {!isLoadingPending && pendingRequests.length === 0 && (
                  <div className="text-xs text-muted-foreground">
                    No pending requests
                  </div>
                )}

                {!isLoadingPending &&
                  pendingRequests.map((request) => (
                    <div
                      key={request.id}
                      className="mb-2 flex items-center justify-between rounded-md border border-border/40 px-2 py-2 last:mb-0"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <Avatar className="h-7 w-7 border border-border">
                          <AvatarImage
                            src={request.user?.avatarUrl ?? undefined}
                            alt={request.user?.username ?? "User"}
                          />
                          <AvatarFallback className="text-xs">
                            {request.user?.username?.[0] ?? "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="truncate text-sm">
                          {request.user?.username ?? "Unknown user"}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs"
                          disabled={processingRequestId === request.id}
                          onClick={() =>
                            void handleRespondJoinRequest(request.id, false)
                          }
                        >
                          Reject
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          disabled={processingRequestId === request.id}
                          onClick={() =>
                            void handleRespondJoinRequest(request.id, true)
                          }
                        >
                          Approve
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {room.members.map((member) => {
              const displayName = member.user?.username ?? "Unknown user"
              const canRemove =
                canManageRoom &&
                member.role !== "OWNER" &&
                member.userId !== currentUserId

              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-lg border border-border/40 bg-card/60 px-3 py-2"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <Avatar className="h-8 w-8 border border-border">
                      <AvatarImage
                        src={member.user?.avatarUrl ?? undefined}
                        alt={displayName}
                      />
                      <AvatarFallback className="text-xs">
                        {displayName[0] ?? "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="truncate text-sm">{displayName}</div>
                      <div className="text-xs text-muted-foreground">
                        {member.role}
                      </div>
                    </div>
                  </div>

                  {canRemove && (
                    <Button
                      type="button"
                      size="icon-xs"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setRemoveTarget(member)}
                    >
                      <IconUserMinus size={14} />
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </div>

      <Dialog open={addMembersOpen} onOpenChange={setAddMembersOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add members</DialogTitle>
            <DialogDescription>
              Add one or more usernames. Use @username and separate multiple
              users with comma or space.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <input
              value={usernamesInput}
              onChange={(event) => setUsernamesInput(event.target.value)}
              placeholder="@alice, @bob"
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none"
            />
            <Button
              type="button"
              className="w-full"
              onClick={() => void handleAddMembers()}
              disabled={isAdding || !usernamesInput.trim()}
            >
              {isAdding ? "Adding..." : "Add member"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(removeTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setRemoveTarget(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remove member?</DialogTitle>
            <DialogDescription>
              Remove {removeTarget?.user?.username ?? "this member"} from this
              room?
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setRemoveTarget(null)}
              disabled={isRemoving}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="flex-1"
              onClick={() => void handleRemoveMember()}
              disabled={isRemoving}
            >
              {isRemoving ? "Removing..." : "Confirm remove"}
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
