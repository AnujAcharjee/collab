"use client"

import { useEffect, useRef, useState } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import useAppStore from "@/stores/app-store"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  IconBrandTelegram,
  IconPaperclip,
  IconMoodSmile,
  IconMicrophone,
  IconChevronLeft,
  IconDotsVertical,
} from "@tabler/icons-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import type { CreateMessageInput, RoomRecord } from "@repo/validation"
import { chatApiUrl } from "@/constants/apiUrls"
import axios from "axios"
import type { RoomMessage } from "@/stores/app-store"

type ChatHistoryMessage = {
  id: string
  type: string
  userId: string
  roomId: string
  text?: string
  attachments?: string
  parentId?: string
  isDeleted: boolean
  modifiedAt?: string
  createdAt: string
  updatedAt: string
  senderUsername: string
  senderAvatarUrl?: string
}

type ChatHistoryResponse = {
  data?: {
    roomId?: string
    messages?: ChatHistoryMessage[]
  }
}

type CreateMessageResponse = {
  data?: {
    message?: ChatHistoryMessage
  }
  error?: string
  message?: string
}

const toastOptions = {
  position: "top-center" as const,
}

const EMPTY_ROOM_MESSAGES: RoomMessage[] = []

export default function ChatSection({ room }: { room: RoomRecord | null }) {
  const roomId = room?.id ?? null
  const setActiveRoom = useAppStore((state) => state.setActiveRoom)
  const user = useAppStore((state) => state.user)
  const addMessage = useAppStore((state) => state.addMessage)
  const setMessages = useAppStore((state) => state.setMessages)
  const roomMessages = useAppStore((state) =>
    roomId ? (state.messages[roomId] ?? EMPTY_ROOM_MESSAGES) : EMPTY_ROOM_MESSAGES
  )
  const updateRoomLastMessage = useAppStore(
    (state) => state.updateRoomLastMessage
  )

  const [draft, setDraft] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!roomId) {
      setDraft("")
      return
    }

    let isCancelled = false

    const loadMessages = async () => {
      setIsLoading(true)

      try {
        const res = await axios.get<ChatHistoryResponse>(
          `${chatApiUrl}/rooms/${roomId}/messages`
        )

        if (isCancelled) {
          return
        }

        setMessages(
          roomId,
          (res.data.data?.messages ?? []).map(toRoomMessage)
        )
      } catch (error) {
        if (!isCancelled) {
          const message = axios.isAxiosError<CreateMessageResponse>(error)
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
  }, [roomId, setMessages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [roomId, roomMessages])

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
      }

      const res = await axios.post<CreateMessageResponse>(
        `${chatApiUrl}/messages`,
        payload
      )
      const message = res.data.data?.message

      if (!message) {
        throw new Error("Message was not returned")
      }

      addMessage(activeRoom.id, toRoomMessage(message))
      setDraft("")
      updateRoomLastMessage(activeRoom.id, toRoomPreviewMessage(message))
    } catch (error) {
      const message = axios.isAxiosError<CreateMessageResponse>(error)
        ? (error.response?.data?.error ??
          error.response?.data?.message ??
          "Unable to send message")
        : "Unable to send message"

      toast.error(message, toastOptions)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="h-svh w-full p-2 lg:p-4">
      <Card className="flex h-full w-full flex-col p-0 border border-primary/50">
        <CardHeader className="shrink-0 p-3 bg-white/5">
          <CardTitle className="flex items-center justify-between gap-2 text-xs sm:text-sm lg:gap-5">
            <button
              type="button"
              onClick={() => setActiveRoom(null)}
              className="rounded-md bg-white/8 p-1 hover:cursor-pointer hover:bg-white/15"
            >
              <IconChevronLeft stroke={2} height={20} width={20} />
            </button>
            <div className="w-full rounded-md border bg-white/8 px-4 py-1 text-center hover:cursor-pointer hover:bg-white/15">
              {room.name}
            </div>
            <div className="rounded-md bg-white/8 p-1 hover:cursor-pointer hover:bg-white/15">
              <IconDotsVertical stroke={2} height={20} width={20} />
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="min-h-0 flex-1 p-0 shadow-inner">
          <ScrollArea className="h-full">
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
                const username = isOwn
                  ? (user?.username ?? "You")
                  : (message.senderUsername ??
                    room.creator?.username ??
                    "Room member")
                const avatar = isOwn
                  ? (user?.avatarUrl ?? undefined)
                  : (message.senderAvatarUrl ??
                    room.creator?.avatarUrl ??
                    undefined)

                return (
                  <MessageBubble
                    key={message.id}
                    username={username}
                    avatar={avatar}
                    message={
                      message.isDeleted ? "Message deleted" : message.text
                    }
                    timestamp={formatMessageTime(message.createdAt)}
                    isOwn={isOwn}
                  />
                )
              })}

              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </CardContent>

        <CardFooter className="flex gap-2 pb-5">
          <form
            className="flex w-full gap-2"
            onSubmit={(event) => {
              event.preventDefault()
              void sendMessage()
            }}
          >
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
  message,
  timestamp,
  isOwn = false,
}: {
  username: string
  avatar?: string
  message?: string
  timestamp: string
  isOwn?: boolean
}) {
  const fallbackMessage = message?.trim() ? message : "Attachment"

  return (
    <div className={`flex items-end gap-2 ${isOwn ? "flex-row-reverse" : ""}`}>
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
              ? "rounded-br-4 bg-[#1d9bf0]"
              : "rounded-bl-4 bg-muted text-foreground"
          }`}
        >
          {fallbackMessage}
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
