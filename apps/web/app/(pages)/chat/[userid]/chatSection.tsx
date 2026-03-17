"use client"

import { Fragment } from "react/jsx-runtime"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
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
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  AvatarBadge,
} from "@/components/ui/avatar"

const tags = Array.from({ length: 50 }).map((_, i, a) => Number(a.length - i))

export default function ChatSection() {
  return (
    <div className="h-svh w-full p-4">
      <Card className="flex h-full w-full flex-col">
        {/* Header */}
        <CardHeader className="shrink-0">
          <CardTitle className="flex items-center justify-between">
            <div className="rounded-md bg-white/8 p-1 hover:cursor-pointer hover:bg-white/15 lg:hidden">
              <IconChevronLeft stroke={2} height={20} width={20} />
            </div>
            <div className="rounded-md bg-white/8 px-4 py-1 text-sm hover:cursor-pointer hover:bg-white/15">
              Group Name
            </div>
            <div className="rounded-md bg-white/8 p-1 text-sm hover:cursor-pointer hover:bg-white/15">
              <IconDotsVertical stroke={2} height={20} width={20} />
            </div>
          </CardTitle>
        </CardHeader>

        {/* Chat Messages */}
        <CardContent className="min-h-0 flex-1 p-0">
          <ScrollArea className="h-full">
            <div className="px-4 py-2 sm:px-6">
              {tags.map((tag) => (
                <Fragment key={tag}>
                  <MessageBubble
                    username="username"
                    avatar='avatar="https://github.com/shadcn.png"'
                    message={`some random text ${String(tag)}`}
                    timestamp="time"
                    isOwn={tag % 2 === 0}
                  />
                </Fragment>
              ))}
            </div>
          </ScrollArea>
        </CardContent>

        {/* Message input */}
        <CardFooter className="flex gap-2">
          <InputGroup className="h-10 w-full">
            <InputGroupInput placeholder="" />
            <InputGroupAddon>
              <IconPaperclip
                stroke={2}
                height={20}
                width={20}
                className="cursor-pointer text-white/50 hover:text-white"
              />
              <IconMoodSmile
                stroke={2}
                height={20}
                width={20}
                className="cursor-pointer text-white/50 hover:text-white"
              />
            </InputGroupAddon>
            <InputGroupAddon align="inline-end">
              <IconBrandTelegram
                stroke={2}
                height={20}
                width={40}
                className="cursor-pointer text-white/50 hover:text-white"
              />
            </InputGroupAddon>
          </InputGroup>

          <div className="rounded-full border border-white/20 bg-white/10 p-1.5">
            <IconMicrophone
              stroke={2}
              height={20}
              width={20}
              className="cursor-pointer text-white/50 hover:text-white"
            />
          </div>
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
  message: string
  timestamp: string
  isOwn?: boolean
}) {
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
          className={`rounded-[18px] px-3.5 py-2 text-[13px] leading-relaxed text-white ${
            isOwn
              ? "rounded-br-4 bg-[#1d9bf0]"
              : "rounded-bl-4 bg-muted text-foreground"
          }`}
        >
          {message}
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
