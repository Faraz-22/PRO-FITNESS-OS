"use client";

import { Bell, Menu, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar } from "./sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "next-auth/react";
import type { Session } from "next-auth";

export const Topbar = ({ branchName = "Main Branch", session }: { branchName?: string, session?: Session | null }) => {
  
  const initials = session?.user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "U";

  return (
    <div className="flex items-center p-4 bg-background border-b border-border h-full text-foreground shadow-sm">
      <div className="md:hidden">
        <Sheet>
          <SheetTrigger render={<Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground md:hidden" />}>
            <Menu className="h-6 w-6" />
          </SheetTrigger>
          <SheetContent side="left" className="p-0 border-none bg-sidebar w-72">
            <Sidebar branchName={branchName} />
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex w-full justify-end">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-primary transition-colors">
            <Bell className="h-5 w-5" />
            {/* Notification badge can go here */}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" className="relative h-9 w-9 rounded-full border border-border bg-secondary/50 p-0 flex items-center gap-2 ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />}>
              <span className="font-semibold text-sm text-muted-foreground">{initials}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 border-border bg-card shadow-xl" align="end">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none text-foreground">
                      {session?.user?.name || 'Staff User'}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {session?.user?.email || 'user@profitness.com'}
                    </p>
                  </div>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem 
                onClick={() => signOut({ callbackUrl: '/auth/login' })}
                className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};
