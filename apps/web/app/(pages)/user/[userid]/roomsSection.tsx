"use client"

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
import { IconSearch, IconPinned, IconVolume3 } from "@tabler/icons-react"
import { UserRecord } from "@repo/validation"

const tags = Array.from({ length: 50 }).map(
  (_, i, a) => `v1.2.0-beta.${a.length - i}`
)

const isActiveRoom = true
const isPinned = true
const isMuted = true
const unread = false

export default function RoomsSection({ user }: { user: UserRecord }) {
  return (
    <div className="h-svh w-full p-4">
      <Card className="flex h-full w-full flex-col">
        <CardHeader className="flex flex-col gap-4">
          <CardTitle className="flex items-center justify-between">
            <div className="text-xl font-medium">Collab</div>
          </CardTitle>

          <CardDescription className="w-full">
            <div className="flex h-9 items-center gap-2 rounded-full border border-border/40 bg-muted/60 px-3">
              <IconSearch
                stroke={2}
                height={14}
                width={14}
                className="shrink-0 text-muted-foreground"
              />
              <input
                placeholder="Search rooms"
                className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
              <button className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border/60 bg-background text-base leading-none text-muted-foreground transition-colors hover:bg-muted">
                +
              </button>
            </div>
          </CardDescription>
        </CardHeader>

        <CardContent className="min-h-0 flex-1 p-0">
          <ScrollArea className="h-full">
            <div className="px-4 py-2 sm:px-6">
              {tags.map((tag) => (
                <Fragment key={tag}>
                  <ListItems
                    username="user"
                    avatar="https://github.com/shadcn.png"
                  />
                  <Separator className="my-2" />
                </Fragment>
              ))}
            </div>
          </ScrollArea>
        </CardContent>

        <CardFooter className="flex gap-2">
          <Avatar className="h-7 w-7 border border-border">
            <AvatarImage
              src={user.avatarUrl ? user.avatarUrl : undefined}
              alt={user.username}
            />
            <AvatarFallback>{user.username}</AvatarFallback>
            <AvatarBadge className="right-0.5 bottom-0.5 h-2.5 w-2.5 border-[1.5px] border-background bg-green-500" />
          </Avatar>
          <span>{user.username}</span>
        </CardFooter>
      </Card>
    </div>
  )
}

function ListItems({
  username,
  avatar,
}: {
  username: string
  avatar?: string
}) {
  return (
    <div className="flex items-center justify-between bg-card px-3 py-2">
      <div className="flex items-center gap-2">
        <Avatar className="h-7 w-7 border border-border">
          <AvatarImage src={avatar} alt={username} className="h-8" />
          <AvatarFallback>{username[0]}</AvatarFallback>
          {isActiveRoom && (
            <AvatarBadge className="right-0 bottom-0 h-2 w-2 border-[1.5px] border-background bg-green-500" />
          )}
        </Avatar>
        <span className="text-sm">{username}</span>
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
